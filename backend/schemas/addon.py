from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from core.constants import MIN_PRICE
from core.enums import AddOnPricingType
from schemas.common import TimestampSchema


class AddOnCreate(BaseModel):
    """Payload for creating an add-on (admin only)."""

    name: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    price: float = Field(gt=MIN_PRICE)
    pricing_type: AddOnPricingType
    is_active: bool = True


class AddOnUpdate(BaseModel):
    """Payload for updating an add-on (admin only)."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, gt=MIN_PRICE)
    pricing_type: AddOnPricingType | None = None
    is_active: bool | None = None


class AddOnResponse(TimestampSchema):
    """Add-on data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    price: float
    pricing_type: AddOnPricingType
    is_active: bool
