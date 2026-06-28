from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, String, Text  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import NotificationType
from database.connection import Base
from utils.models import TimestampMixin


class Notification(TimestampMixin, Base):
    """In-app notification delivered to a single user."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_user_unread", "user_id", "is_read"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default=NotificationType.system.value, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    user = relationship("User", backref="notifications")
