from pydantic import ConfigDict  # type: ignore[import]

from schemas.common import TimestampSchema


class FavoriteResponse(TimestampSchema):
    """Favorite record returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    vehicle_id: int
