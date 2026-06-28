from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator  # type: ignore[import]

from core.enums import AvailabilityStatus
from schemas.common import TimestampSchema


class VehicleAvailabilityCreate(BaseModel):
    """Payload for creating a vehicle availability range (owner vendor only).

    status cannot be "booked" — that status is derived from confirmed/
    completed bookings and is rejected if requested here.
    """

    start_date: date
    end_date: date
    status: AvailabilityStatus
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class VehicleAvailabilityUpdate(BaseModel):
    """Payload for editing an availability range. Fields left out are unchanged."""

    start_date: date | None = None
    end_date: date | None = None
    status: AvailabilityStatus | None = None
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class VehicleAvailabilityResponse(TimestampSchema):
    """Vendor-managed availability range returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    start_date: date
    end_date: date
    status: AvailabilityStatus
    reason: str | None


class BookedDateRange(BaseModel):
    """A read-only booked range derived from a confirmed/completed booking."""

    booking_id: int
    start_date: date
    end_date: date
    status: AvailabilityStatus = AvailabilityStatus.booked


class VehicleAvailabilityCalendarResponse(BaseModel):
    """A vehicle's full calendar: vendor-managed ranges plus derived booked ranges."""

    vehicle_id: int
    availability: list[VehicleAvailabilityResponse]
    booked: list[BookedDateRange]
