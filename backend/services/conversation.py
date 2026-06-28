"""Conversation creation, listing, and access-control business logic."""

from sqlalchemy.orm import Session

from core.enums import UserRole
from core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from models.booking import Booking
from models.conversation import Conversation
from models.message import Message
from models.user import User
from schemas.conversation import ConversationCreate, ConversationResponse


class ConversationService:
    """Encapsulates conversation creation, retrieval, and access control."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: ConversationCreate, customer: User) -> Conversation:
        """Start a conversation with a vendor, optionally tied to a booking.

        If a booking is given, it must belong to the requesting customer and
        to the named vendor, and may not already have a conversation.
        """
        vendor = (
            self.db.query(User)
            .filter(User.id == payload.vendor_id, User.role == UserRole.vendor.value)
            .first()
        )
        if not vendor:
            raise NotFoundError("Vendor not found")

        if payload.booking_id is not None:
            booking = (
                self.db.query(Booking).filter(Booking.id == payload.booking_id).first()
            )
            if not booking:
                raise NotFoundError("Booking not found")

            if booking.customer_id != customer.id:
                raise ForbiddenError(
                    "Not allowed to start a conversation for this booking"
                )

            if booking.vehicle.vendor_id != payload.vendor_id:
                raise BadRequestError("vendor_id does not match this booking's vendor")

            existing = (
                self.db.query(Conversation)
                .filter(Conversation.booking_id == payload.booking_id)
                .first()
            )
            if existing:
                raise ConflictError("A conversation already exists for this booking")

        conversation = Conversation(
            booking_id=payload.booking_id,
            customer_id=customer.id,
            vendor_id=payload.vendor_id,
        )

        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)

        return conversation

    def list_for_user(self, user: User) -> list[Conversation]:
        """Return conversations the user participates in (all, for admin), newest first."""
        query = self.db.query(Conversation)
        if user.role == UserRole.vendor.value:
            query = query.filter(Conversation.vendor_id == user.id)
        elif user.role != UserRole.admin.value:
            query = query.filter(Conversation.customer_id == user.id)
        return query.order_by(Conversation.updated_at.desc()).all()

    def get_by_id(self, conversation_id: int) -> Conversation:
        """Return a conversation by id or raise not found."""
        conversation = (
            self.db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
        if not conversation:
            raise NotFoundError("Conversation not found")
        return conversation

    @staticmethod
    def ensure_participant(conversation: Conversation, user: User) -> None:
        """Only the customer, the vendor, or an admin may access a conversation."""
        is_participant = user.id in (conversation.customer_id, conversation.vendor_id)
        is_admin = user.role == UserRole.admin.value
        if not is_participant and not is_admin:
            raise ForbiddenError("Not allowed to access this conversation")

    def get_accessible(self, conversation_id: int, user: User) -> Conversation:
        """Return a conversation, enforcing participant/admin access."""
        conversation = self.get_by_id(conversation_id)
        self.ensure_participant(conversation, user)
        return conversation

    def unread_count_for_viewer(self, conversation_id: int, viewer_id: int) -> int:
        """Count unread messages in a conversation not sent by the viewer."""
        return (
            self.db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != viewer_id,
                Message.is_read.is_(False),
            )
            .count()
        )

    def to_response(self, conversation: Conversation, viewer_id: int) -> ConversationResponse:
        """Map a Conversation ORM instance to an API response with the viewer's unread count."""
        return ConversationResponse(
            id=conversation.id,
            booking_id=conversation.booking_id,
            customer_id=conversation.customer_id,
            vendor_id=conversation.vendor_id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            unread_count=self.unread_count_for_viewer(conversation.id, viewer_id),
        )

    def to_response_list(
        self, conversations: list[Conversation], viewer_id: int
    ) -> list[ConversationResponse]:
        """Map a list of conversations to API responses."""
        return [self.to_response(c, viewer_id) for c in conversations]
