from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, Text  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from database.connection import Base
from utils.models import TimestampMixin


class Message(TimestampMixin, Base):
    """A single message sent within a conversation."""

    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_conversation_id", "conversation_id"),
        Index("ix_messages_conversation_unread", "conversation_id", "is_read"),
    )

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    conversation = relationship("Conversation", backref="messages")
    sender = relationship("User", backref="sent_messages")
