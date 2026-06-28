from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from schemas.common import TimestampSchema


class ConversationCreate(BaseModel):
    """Payload for a customer starting a conversation with a vendor."""

    vendor_id: int = Field(gt=0)
    booking_id: int | None = Field(default=None, gt=0)


class ConversationResponse(TimestampSchema):
    """Conversation data returned by the API, including the viewer's unread count."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int | None
    customer_id: int
    vendor_id: int
    unread_count: int
