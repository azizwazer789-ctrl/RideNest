"""Message sending, listing, and read-state business logic."""

from sqlalchemy.orm import Session

from core.enums import UserRole
from core.exceptions import ForbiddenError, NotFoundError
from models.message import Message
from models.user import User
from schemas.message import MessageCreate, MessageResponse
from services.conversation import ConversationService
from utils.datetime import utc_now


class MessageService:
    """Encapsulates message sending, listing, and read-state operations."""

    def __init__(self, db: Session):
        self.db = db

    def send(self, conversation_id: int, payload: MessageCreate, sender: User) -> Message:
        """Send a message in a conversation (participants only; admins cannot send)."""
        if sender.role == UserRole.admin.value:
            raise ForbiddenError("Admins cannot send messages")

        conversation = ConversationService(self.db).get_accessible(conversation_id, sender)

        message = Message(
            conversation_id=conversation.id,
            sender_id=sender.id,
            message=payload.message,
        )

        self.db.add(message)
        conversation.updated_at = utc_now()
        self.db.commit()
        self.db.refresh(message)

        return message

    def list_for_conversation(self, conversation_id: int, viewer: User) -> list[Message]:
        """Return a conversation's messages, oldest first.

        Marks the viewer's unread incoming messages as read, unless the
        viewer is an admin (an admin's view should not consume the real
        recipient's unread state).
        """
        conversation = ConversationService(self.db).get_accessible(conversation_id, viewer)

        is_participant = viewer.id in (conversation.customer_id, conversation.vendor_id)
        if is_participant:
            self.db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != viewer.id,
                Message.is_read.is_(False),
            ).update({"is_read": True})
            self.db.commit()

        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

    def get_by_id(self, message_id: int) -> Message:
        """Return a message by id or raise not found."""
        message = self.db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise NotFoundError("Message not found")
        return message

    def mark_read(self, message_id: int, viewer: User) -> Message:
        """Mark a single incoming message as read (recipient participant only)."""
        if viewer.role == UserRole.admin.value:
            raise ForbiddenError("Admins cannot modify message read state")

        message = self.get_by_id(message_id)
        ConversationService(self.db).get_accessible(message.conversation_id, viewer)

        if message.sender_id == viewer.id:
            raise ForbiddenError("Cannot mark your own message as read")

        message.is_read = True
        self.db.commit()
        self.db.refresh(message)

        return message

    @staticmethod
    def to_response(message: Message) -> MessageResponse:
        """Map a Message ORM instance to an API response."""
        return MessageResponse.model_validate(message)

    @staticmethod
    def to_response_list(messages: list[Message]) -> list[MessageResponse]:
        """Map a list of messages to API responses."""
        return [MessageResponse.model_validate(m) for m in messages]
