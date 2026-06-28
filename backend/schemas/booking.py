from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator  # type: ignore[import]

from core.enums import BookingStatus
from schemas.common import TimestampSchema
from utils.validators import validate_booking_date_range


class BookingCreate(BaseModel):
    """Payload for creating a booking."""

    vehicle_id: int = Field(gt=0)
    start_date: date
    end_date: date
    pickup_location: str = Field(min_length=1, max_length=255)
    dropoff_location: str = Field(min_length=1, max_length=255)

    @model_validator(mode="after")
    def validate_dates(self):
        validate_booking_date_range(self.start_date, self.end_date)
        return self


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
    total_price: float = Field(gt=0)
    booking_status: BookingStatus
