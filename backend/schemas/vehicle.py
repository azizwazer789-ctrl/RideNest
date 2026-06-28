from pydantic import BaseModel, Field, field_validator  # type: ignore[import]

from core.constants import (
    MAX_SEATING_CAPACITY,
    MIN_PRICE,
    MIN_VEHICLE_YEAR,
    max_vehicle_year,
)
from core.enums import VehicleApprovalStatus
from schemas.common import TimestampSchema
from utils.validators import validate_vehicle_year


class VehicleCreate(BaseModel):
    """Payload for creating a vehicle listing."""

    title: str = Field(min_length=1, max_length=200)
    brand: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    year: int
    car_type: str = Field(min_length=1, max_length=50)
    transmission: str = Field(min_length=1, max_length=50)
    fuel_type: str = Field(min_length=1, max_length=50)
    seating_capacity: int = Field(ge=1, le=MAX_SEATING_CAPACITY)
    city: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=255)
    price_per_day: float = Field(gt=MIN_PRICE)
    price_per_hour: float = Field(gt=MIN_PRICE)
    with_driver_available: bool = False
    description: str = Field(min_length=1)
    image_url: str | None = None
    is_available: bool = True

    @field_validator("year")
    @classmethod
    def validate_year(cls, value: int) -> int:
        return validate_vehicle_year(value)


class VehicleUpdate(BaseModel):
    """Payload for updating a vehicle listing."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    brand: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    year: int | None = None
    car_type: str | None = Field(default=None, min_length=1, max_length=50)
    transmission: str | None = Field(default=None, min_length=1, max_length=50)
    fuel_type: str | None = Field(default=None, min_length=1, max_length=50)
    seating_capacity: int | None = Field(
        default=None,
        ge=1,
        le=MAX_SEATING_CAPACITY,
    )
    city: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=255)
    price_per_day: float | None = Field(default=None, gt=MIN_PRICE)
    price_per_hour: float | None = Field(default=None, gt=MIN_PRICE)
    with_driver_available: bool | None = None
    description: str | None = Field(default=None, min_length=1)
    image_url: str | None = None
    is_available: bool | None = None

    @field_validator("year")
    @classmethod
    def validate_year(cls, value: int | None) -> int | None:
        if value is None:
            return value
        return validate_vehicle_year(value)


class VehicleResponse(TimestampSchema):
    """Vehicle data returned by the API."""

    id: int
    vendor_id: int
    title: str
    brand: str
    model: str
    year: int = Field(
        ge=MIN_VEHICLE_YEAR,
        le=max_vehicle_year(),
    )
    car_type: str
    transmission: str
    fuel_type: str
    seating_capacity: int
    city: str
    location: str
    price_per_day: float = Field(gt=MIN_PRICE)
    price_per_hour: float = Field(gt=MIN_PRICE)
    with_driver_available: bool
    description: str
    image_url: str | None
    approval_status: VehicleApprovalStatus
    is_approved: bool
    is_available: bool