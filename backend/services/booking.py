"""Booking creation, listing, and cancellation business logic."""

from datetime import date

from sqlalchemy.orm import Session

from core.enums import AddOnPricingType, BookingStatus, NotificationType
from core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from models.addon import AddOn
from models.booking import Booking
from models.booking_addon import BookingAddOn
from models.user import User
from models.vehicle import Vehicle
from schemas.booking import (
    BookingAddOnResponse,
    BookingCreate,
    BookingReschedule,
    BookingResponse,
)
from services.notification import NotificationService
from services.vehicle_availability import has_blocking_overlap
from services.vendor_wallet import VendorWalletService
from utils.pagination import paginate


def calculate_rental_days(start_date: date, end_date: date) -> int:
    """Inclusive rental day count."""
    return (end_date - start_date).days + 1


def calculate_total_price(vehicle: Vehicle, start_date: date, end_date: date) -> float:
    """Compute booking total from daily rate and duration."""
    days = calculate_rental_days(start_date, end_date)
    return round(days * vehicle.price_per_day, 2)


def calculate_addon_cost(addon: AddOn, rental_days: int) -> float:
    """Compute a single add-on's cost for a booking's rental duration.

    `per_day` add-ons scale with the booking's day count; `fixed` add-ons
    cost the same regardless of duration.
    """
    if addon.pricing_type == AddOnPricingType.per_day.value:
        return round(addon.price * rental_days, 2)
    return round(addon.price, 2)


def has_overlapping_booking(
    db: Session,
    vehicle_id: int,
    start_date: date,
    end_date: date,
    exclude_booking_id: int | None = None,
) -> bool:
    """Return True if the vehicle has an active overlapping booking.

    `exclude_booking_id` lets a reschedule check for overlaps against every
    *other* booking without the booking always colliding with itself.
    """
    inactive_statuses = (
        BookingStatus.cancelled.value,
        BookingStatus.rejected.value,
    )

    query = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.booking_status.notin_(inactive_statuses),
        Booking.start_date <= end_date,
        Booking.end_date >= start_date,
    )

    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)

    return query.first() is not None


class BookingService:
    """Encapsulates booking-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def _resolve_active_addons(self, addon_ids: list[int]) -> list[AddOn]:
        """Validate requested add-on ids and return their AddOn rows.

        Every id must reference an existing, currently-active add-on, or
        the whole request is rejected (no partial selection).
        """
        if not addon_ids:
            return []

        unique_ids = list(dict.fromkeys(addon_ids))
        addons = (
            self.db.query(AddOn)
            .filter(AddOn.id.in_(unique_ids), AddOn.is_active.is_(True))
            .all()
        )

        found_ids = {addon.id for addon in addons}
        missing = [addon_id for addon_id in unique_ids if addon_id not in found_ids]
        if missing:
            raise BadRequestError(f"Add-on(s) not found or inactive: {missing}")

        return addons

    def create(self, payload: BookingCreate, customer: User) -> Booking:
        """Create a booking for an approved, available vehicle."""
        vehicle = (
            self.db.query(Vehicle)
            .filter(
                Vehicle.id == payload.vehicle_id,
                Vehicle.is_approved.is_(True),
                Vehicle.is_available.is_(True),
            )
            .first()
        )

        if not vehicle:
            raise NotFoundError("Vehicle not found or not available for booking")

        if has_overlapping_booking(
            self.db,
            payload.vehicle_id,
            payload.start_date,
            payload.end_date,
        ):
            raise BadRequestError("Vehicle is already booked for the selected dates")

        if has_blocking_overlap(
            self.db,
            payload.vehicle_id,
            payload.start_date,
            payload.end_date,
        ):
            raise BadRequestError(
                "Vehicle is unavailable for the selected dates"
            )

        addons = self._resolve_active_addons(payload.addon_ids)
        rental_days = calculate_rental_days(payload.start_date, payload.end_date)
        vehicle_total = calculate_total_price(
            vehicle, payload.start_date, payload.end_date
        )

        booking = Booking(
            customer_id=customer.id,
            vehicle_id=payload.vehicle_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            pickup_location=payload.pickup_location,
            dropoff_location=payload.dropoff_location,
            total_price=vehicle_total,
            booking_status=BookingStatus.pending.value,
        )

        addons_total = 0.0
        for addon in addons:
            cost = calculate_addon_cost(addon, rental_days)
            addons_total += cost
            booking.addons.append(
                BookingAddOn(
                    addon_id=addon.id,
                    name=addon.name,
                    pricing_type=addon.pricing_type,
                    unit_price=addon.price,
                    total_price=cost,
                )
            )

        booking.total_price = round(vehicle_total + addons_total, 2)

        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)

        NotificationService(self.db).create(
            user_id=vehicle.vendor_id,
            title="New Booking Request",
            message=f"You have a new booking request for {vehicle.title}.",
            notif_type=NotificationType.booking_created.value,
        )

        return booking

    def list_for_customer(
        self, customer_id: int, page: int = 1, limit: int = 10
    ) -> tuple[list[Booking], int, int]:
        """Return bookings owned by a customer. Returns (items, total, pages)."""
        query = (
            self.db.query(Booking)
            .filter(Booking.customer_id == customer_id)
            .order_by(Booking.created_at.desc())
        )
        return paginate(query, page, limit)

    def list_for_vendor(
        self, vendor_id: int, page: int = 1, limit: int = 10
    ) -> tuple[list[Booking], int, int]:
        """Return bookings for vehicles owned by a vendor. Returns (items, total, pages)."""
        query = (
            self.db.query(Booking)
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(Vehicle.vendor_id == vendor_id)
            .order_by(Booking.created_at.desc())
        )
        return paginate(query, page, limit)

    def list_all(self, page: int = 1, limit: int = 10) -> tuple[list[Booking], int, int]:
        """Return all bookings, newest first (admin only). Returns (items, total, pages)."""
        query = self.db.query(Booking).order_by(Booking.created_at.desc())
        return paginate(query, page, limit)

    def get_by_id(self, booking_id: int) -> Booking:
        """Return a booking by id or raise not found."""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()

        if not booking:
            raise NotFoundError("Booking not found")

        return booking

    def cancel(self, booking_id: int, customer: User) -> Booking:
        """Cancel a booking owned by the customer."""
        booking = self.get_by_id(booking_id)

        if booking.customer_id != customer.id:
            raise ForbiddenError("Not allowed to cancel this booking")

        if booking.booking_status == BookingStatus.cancelled.value:
            raise BadRequestError("Booking is already cancelled")

        if booking.booking_status == BookingStatus.rejected.value:
            raise BadRequestError("Rejected bookings cannot be cancelled")

        if booking.booking_status == BookingStatus.completed.value:
            raise BadRequestError("Completed bookings cannot be cancelled")

        booking.booking_status = BookingStatus.cancelled.value

        self.db.commit()
        self.db.refresh(booking)

        vehicle = self.db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if vehicle:
            NotificationService(self.db).create(
                user_id=vehicle.vendor_id,
                title="Booking Cancelled",
                message=f"The customer cancelled their booking for {vehicle.title}.",
                notif_type=NotificationType.booking_cancelled.value,
            )

        return booking

    def reschedule(
        self, booking_id: int, payload: BookingReschedule, customer: User
    ) -> Booking:
        """Reschedule a booking's dates (owner customer only).

        Only pending or confirmed bookings are eligible. The booking row is
        updated in place (never deleted/recreated) so its id, created_at,
        and prior notification trail remain intact as the historical
        record; only the dates, total_price, and updated_at change.
        """
        booking = self.get_by_id(booking_id)

        if booking.customer_id != customer.id:
            raise ForbiddenError("Not allowed to reschedule this booking")

        if booking.booking_status not in (
            BookingStatus.pending.value,
            BookingStatus.confirmed.value,
        ):
            raise BadRequestError(
                f"Only pending or confirmed bookings can be rescheduled "
                f"(current: {booking.booking_status})"
            )

        vehicle = self.db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if not vehicle:
            raise NotFoundError("Vehicle not found")

        if has_overlapping_booking(
            self.db,
            booking.vehicle_id,
            payload.start_date,
            payload.end_date,
            exclude_booking_id=booking.id,
        ):
            raise BadRequestError("Vehicle is already booked for the selected dates")

        if has_blocking_overlap(
            self.db, booking.vehicle_id, payload.start_date, payload.end_date
        ):
            raise BadRequestError("Vehicle is unavailable for the selected dates")

        booking.start_date = payload.start_date
        booking.end_date = payload.end_date

        new_rental_days = calculate_rental_days(payload.start_date, payload.end_date)
        vehicle_total = calculate_total_price(
            vehicle, payload.start_date, payload.end_date
        )

        # per_day add-ons must rescale to the new duration; fixed ones don't.
        addons_total = 0.0
        for booking_addon in booking.addons:
            if booking_addon.pricing_type == AddOnPricingType.per_day.value:
                booking_addon.total_price = round(
                    booking_addon.unit_price * new_rental_days, 2
                )
            addons_total += booking_addon.total_price

        booking.total_price = round(vehicle_total + addons_total, 2)

        self.db.commit()
        self.db.refresh(booking)

        NotificationService(self.db).create(
            user_id=vehicle.vendor_id,
            title="Booking Rescheduled",
            message=f"The customer rescheduled their booking for {vehicle.title}.",
            notif_type=NotificationType.booking_rescheduled.value,
        )

        return booking

    def _get_booking_for_vendor(self, booking_id: int, vendor: User) -> tuple[Booking, Vehicle]:
        """Return a booking and its vehicle, scoped to the managing vendor."""
        booking = self.get_by_id(booking_id)

        vehicle = self.db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()

        if not vehicle or vehicle.vendor_id != vendor.id:
            raise ForbiddenError("Not allowed to manage this booking")

        return booking, vehicle

    @staticmethod
    def _ensure_vendor_can_update(booking: Booking) -> None:
        """Only pending bookings can be confirmed or rejected by a vendor."""
        if booking.booking_status != BookingStatus.pending.value:
            raise BadRequestError(
                f"Only pending bookings can be updated "
                f"(current: {booking.booking_status})"
            )

    def confirm(self, booking_id: int, vendor: User) -> Booking:
        """Confirm a pending booking for a vendor-owned vehicle."""
        booking, vehicle = self._get_booking_for_vendor(booking_id, vendor)
        self._ensure_vendor_can_update(booking)

        booking.booking_status = BookingStatus.confirmed.value

        self.db.commit()
        self.db.refresh(booking)

        NotificationService(self.db).create(
            user_id=booking.customer_id,
            title="Booking Confirmed",
            message=f"Your booking for {vehicle.title} has been confirmed.",
            notif_type=NotificationType.booking_confirmed.value,
        )

        return booking

    def reject(self, booking_id: int, vendor: User) -> Booking:
        """Reject a pending booking for a vendor-owned vehicle."""
        booking, vehicle = self._get_booking_for_vendor(booking_id, vendor)
        self._ensure_vendor_can_update(booking)

        booking.booking_status = BookingStatus.rejected.value

        self.db.commit()
        self.db.refresh(booking)

        NotificationService(self.db).create(
            user_id=booking.customer_id,
            title="Booking Rejected",
            message=f"Your booking for {vehicle.title} has been rejected.",
            notif_type=NotificationType.booking_rejected.value,
        )

        return booking

    def complete(self, booking_id: int, vendor: User) -> Booking:
        """Mark a confirmed booking as completed for a vendor-owned vehicle."""
        booking, vehicle = self._get_booking_for_vendor(booking_id, vendor)

        if booking.booking_status != BookingStatus.confirmed.value:
            raise BadRequestError(
                f"Only confirmed bookings can be completed "
                f"(current: {booking.booking_status})"
            )

        booking.booking_status = BookingStatus.completed.value

        self.db.commit()
        self.db.refresh(booking)

        VendorWalletService(self.db).mark_booking_earnings_available(booking.id)

        NotificationService(self.db).create(
            user_id=booking.customer_id,
            title="Booking Completed",
            message=f"Your booking for {vehicle.title} has been marked as completed.",
            notif_type=NotificationType.booking_completed.value,
        )

        return booking

    @staticmethod
    def to_response(booking: Booking) -> BookingResponse:
        """Map a Booking ORM instance to an API response.

        vehicle_total is derived (total_price minus the sum of add-on
        costs) rather than stored, so it can never drift out of sync.
        """
        addons_total = sum(addon.total_price for addon in booking.addons)
        return BookingResponse(
            id=booking.id,
            customer_id=booking.customer_id,
            vehicle_id=booking.vehicle_id,
            start_date=booking.start_date,
            end_date=booking.end_date,
            pickup_location=booking.pickup_location,
            dropoff_location=booking.dropoff_location,
            vehicle_total=round(booking.total_price - addons_total, 2),
            addons=[
                BookingAddOnResponse.model_validate(addon) for addon in booking.addons
            ],
            total_price=booking.total_price,
            booking_status=booking.booking_status,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )

    @staticmethod
    def to_response_list(bookings: list[Booking]) -> list[BookingResponse]:
        """Map a list of bookings to API responses."""
        return [BookingService.to_response(booking) for booking in bookings]