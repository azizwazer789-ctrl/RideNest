from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator  # type: ignore[import]

from core.enums import AddOnPricingType, BookingStatus
from schemas.common import TimestampSchema
from utils.validators import validate_booking_date_range


class BookingCreate(BaseModel):
    """Payload for creating a booking."""

    vehicle_id: int = Field(gt=0)
    start_date: date
    end_date: date
    pickup_location: str = Field(min_length=1, max_length=255)
    dropoff_location: str = Field(min_length=1, max_length=255)
    addon_ids: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dates(self):
        validate_booking_date_range(self.start_date, self.end_date)
        return self


class BookingReschedule(BaseModel):
    """Payload for rescheduling an existing booking's dates."""

    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        validate_booking_date_range(self.start_date, self.end_date)
        return self


class BookingAddOnResponse(BaseModel):
    """A selected add-on as it appears within a booking response.

    Snapshot fields (name/pricing_type/unit_price), so this stays accurate
    even if the underlying AddOn catalog entry later changes or is removed.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    addon_id: int
    name: str
    pricing_type: AddOnPricingType
    unit_price: float
    total_price: float


class BookingResponse(TimestampSchema):
    """Booking data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    vehicle_id: int
    start_date: date
    end_date: date
    pickup_location: str
    dropoff_location: str
    vehicle_total: float = Field(default=0, ge=0)
    addons: list[BookingAddOnResponse] = Field(default_factory=list)
    total_price: float = Field(gt=0)
    booking_status: BookingStatus
