"""Vehicle availability calendar business logic."""

from datetime import date

from sqlalchemy.orm import Session

from core.enums import AvailabilityStatus, BookingStatus
from core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from models.booking import Booking
from models.user import User
from models.vehicle_availability import VehicleAvailability
from schemas.vehicle_availability import (
    BookedDateRange,
    VehicleAvailabilityCalendarResponse,
    VehicleAvailabilityCreate,
    VehicleAvailabilityResponse,
    VehicleAvailabilityUpdate,
)
from services.vehicle import VehicleService

BLOCKING_STATUSES = (
    AvailabilityStatus.unavailable.value,
    AvailabilityStatus.maintenance.value,
)
BOOKED_BOOKING_STATUSES = (BookingStatus.confirmed.value, BookingStatus.completed.value)


def ranges_overlap(
    db: Session,
    vehicle_id: int,
    start_date: date,
    end_date: date,
    statuses: tuple[str, ...] | None = None,
    exclude_id: int | None = None,
) -> bool:
    """Return True if the vehicle has an availability range overlapping the dates.

    Mirrors the same overlap condition used for booking date-range checks in
    services.booking.has_overlapping_booking: two ranges overlap whenever
    each one starts on or before the other's end.
    """
    query = db.query(VehicleAvailability).filter(
        VehicleAvailability.vehicle_id == vehicle_id,
        VehicleAvailability.start_date <= end_date,
        VehicleAvailability.end_date >= start_date,
    )

    if statuses is not None:
        query = query.filter(VehicleAvailability.status.in_(statuses))

    if exclude_id is not None:
        query = query.filter(VehicleAvailability.id != exclude_id)

    return query.first() is not None


def has_blocking_overlap(db: Session, vehicle_id: int, start_date: date, end_date: date) -> bool:
    """Return True if the dates overlap an unavailable/maintenance range.

    Used by BookingService.create() so a customer booking fails when it
    collides with vendor-blocked dates.
    """
    return ranges_overlap(db, vehicle_id, start_date, end_date, statuses=BLOCKING_STATUSES)


class VehicleAvailabilityService:
    """Encapsulates vehicle availability calendar operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self, vehicle_id: int, payload: VehicleAvailabilityCreate, vendor: User
    ) -> VehicleAvailability:
        """Create an availability range for a vehicle owned by the vendor."""
        VehicleService(self.db).get_vendor_vehicle(vehicle_id, vendor)

        if payload.status == AvailabilityStatus.booked:
            raise BadRequestError(
                "'booked' status is derived from bookings and cannot be set directly"
            )

        if ranges_overlap(self.db, vehicle_id, payload.start_date, payload.end_date):
            raise BadRequestError(
                "An availability range already exists for the selected dates"
            )

        availability = VehicleAvailability(
            vehicle_id=vehicle_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            status=payload.status.value,
            reason=payload.reason,
        )

        self.db.add(availability)
        self.db.commit()
        self.db.refresh(availability)

        return availability

    def list_for_vehicle(self, vehicle_id: int) -> list[VehicleAvailability]:
        """Return a vehicle's vendor-managed availability ranges, soonest first."""
        return (
            self.db.query(VehicleAvailability)
            .filter(VehicleAvailability.vehicle_id == vehicle_id)
            .order_by(VehicleAvailability.start_date.asc())
            .all()
        )

    def list_booked_ranges(self, vehicle_id: int) -> list[Booking]:
        """Return confirmed/completed bookings for a vehicle (read-only booked ranges)."""
        return (
            self.db.query(Booking)
            .filter(
                Booking.vehicle_id == vehicle_id,
                Booking.booking_status.in_(BOOKED_BOOKING_STATUSES),
            )
            .order_by(Booking.start_date.asc())
            .all()
        )

    def get_calendar(self, vehicle_id: int) -> VehicleAvailabilityCalendarResponse:
        """Build the combined calendar: vendor ranges + derived booked ranges."""
        availability = self.list_for_vehicle(vehicle_id)
        bookings = self.list_booked_ranges(vehicle_id)

        return VehicleAvailabilityCalendarResponse(
            vehicle_id=vehicle_id,
            availability=[
                VehicleAvailabilityResponse.model_validate(a) for a in availability
            ],
            booked=[
                BookedDateRange(booking_id=b.id, start_date=b.start_date, end_date=b.end_date)
                for b in bookings
            ],
        )

    def get_by_id(self, availability_id: int) -> VehicleAvailability:
        """Return an availability row by id or raise not found."""
        availability = (
            self.db.query(VehicleAvailability)
            .filter(VehicleAvailability.id == availability_id)
            .first()
        )

        if not availability:
            raise NotFoundError("Availability range not found")

        return availability

    def _get_owned(self, availability_id: int, vendor: User) -> VehicleAvailability:
        """Return an availability row, scoped to its owning vendor."""
        availability = self.get_by_id(availability_id)
        vehicle = VehicleService(self.db).get_by_id(availability.vehicle_id)

        if vehicle.vendor_id != vendor.id:
            raise ForbiddenError("Not allowed to manage this vehicle's availability")

        return availability

    def update(
        self, availability_id: int, payload: VehicleAvailabilityUpdate, vendor: User
    ) -> VehicleAvailability:
        """Update an availability range (owner vendor only)."""
        availability = self._get_owned(availability_id, vendor)

        if payload.status is not None and payload.status == AvailabilityStatus.booked:
            raise BadRequestError(
                "'booked' status is derived from bookings and cannot be set directly"
            )

        update_data = payload.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"] is not None:
            update_data["status"] = update_data["status"].value

        for field, value in update_data.items():
            setattr(availability, field, value)

        if availability.end_date < availability.start_date:
            raise BadRequestError("end_date must be on or after start_date")

        if ranges_overlap(
            self.db,
            availability.vehicle_id,
            availability.start_date,
            availability.end_date,
            exclude_id=availability.id,
        ):
            raise BadRequestError(
                "An availability range already exists for the selected dates"
            )

        self.db.commit()
        self.db.refresh(availability)

        return availability

    def delete(self, availability_id: int, vendor: User) -> None:
        """Delete an availability range (owner vendor only)."""
        availability = self._get_owned(availability_id, vendor)

        self.db.delete(availability)
        self.db.commit()

    @staticmethod
    def to_response(availability: VehicleAvailability) -> VehicleAvailabilityResponse:
        """Map a VehicleAvailability ORM instance to an API response."""
        return VehicleAvailabilityResponse.model_validate(availability)
