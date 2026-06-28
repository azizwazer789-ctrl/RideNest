from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from schemas.common import TimestampSchema


class MessageCreate(BaseModel):
    """Payload for sending a message in a conversation."""

    message: str = Field(min_length=1, max_length=5000)


class MessageResponse(TimestampSchema):
    """Message data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    message: str
    is_read: bool
