from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]


class VehicleImageCreate(BaseModel):
    """Payload for adding an image to a vehicle.

    is_primary is a request, not a guarantee: the first image added to a
    vehicle always becomes primary regardless of this flag, and setting it
    True on a later image demotes whichever image was previously primary.
    """

    image_url: str = Field(min_length=1, max_length=500)
    is_primary: bool = False


class VehicleImageResponse(BaseModel):
    """Vehicle image data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    image_url: str
    is_primary: bool
    created_at: datetime
