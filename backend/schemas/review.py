from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from schemas.common import TimestampSchema


class ReviewCreate(BaseModel):
    """Payload for creating a review on a completed booking."""

    booking_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewUpdate(BaseModel):
    """Payload for editing an existing review (owner customer only).

    Fields left out of the request body are unchanged (partial update).
    """

    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewResponse(TimestampSchema):
    """Review data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    vendor_id: int
    vehicle_id: int
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None


class ReviewListResponse(BaseModel):
    """Paginated-free review listing with aggregate rating stats."""

    items: list[ReviewResponse]
    average_rating: float
    total_reviews: int
