from pydantic import BaseModel, ConfigDict  # type: ignore[import]

from core.enums import NotificationType
from schemas.common import TimestampSchema


class NotificationResponse(TimestampSchema):
    """Notification data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool


class NotificationListResponse(BaseModel):
    """A user's notifications plus how many are unread."""

    notifications: list[NotificationResponse]
    unread_count: int
