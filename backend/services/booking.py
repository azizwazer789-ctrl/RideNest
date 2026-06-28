"""Booking creation, listing, and cancellation business logic."""

from datetime import date

from sqlalchemy.orm import Session

from core.enums import BookingStatus, NotificationType
from core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from models.booking import Booking
from models.user import User
from models.vehicle import Vehicle
from schemas.booking import BookingCreate, BookingResponse
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


def has_overlapping_booking(
    db: Session,
    vehicle_id: int,
    start_date: date,
    end_date: date,
) -> bool:
    """Return True if the vehicle has an active overlapping booking."""
    inactive_statuses = (
        BookingStatus.cancelled.value,
        BookingStatus.rejected.value,
    )

    overlap = (
        db.query(Booking)
        .filter(
            Booking.vehicle_id == vehicle_id,
            Booking.booking_status.notin_(inactive_statuses),
            Booking.start_date <= end_date,
            Booking.end_date >= start_date,
        )
        .first()
    )

    return overlap is not None


class BookingService:
    """Encapsulates booking-related operations."""

    def __init__(self, db: Session):
        self.db = db

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

        booking = Booking(
            customer_id=customer.id,
            vehicle_id=payload.vehicle_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            pickup_location=payload.pickup_location,
            dropoff_location=payload.dropoff_location,
            total_price=calculate_total_price(
                vehicle,
                payload.start_date,
                payload.end_date,
            ),
            booking_status=BookingStatus.pending.value,
        )

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
        """Map a Booking ORM instance to an API response."""
        return BookingResponse.model_validate(booking)

    @staticmethod
    def to_response_list(bookings: list[Booking]) -> list[BookingResponse]:
        """Map a list of bookings to API responses."""
        return [BookingResponse.model_validate(booking) for booking in bookings]