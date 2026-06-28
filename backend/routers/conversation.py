"""Conversation routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user, require_customer
from dependencies.database import get_db
from models.user import User
from schemas.conversation import ConversationCreate, ConversationResponse
from services.conversation import ConversationService

router = APIRouter(prefix="/conversations", tags=["Messaging"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Start a conversation with a vendor (customer only)."""
    service = ConversationService(db)
    conversation = service.create(payload, current_user)
    return service.to_response(conversation, current_user.id)


@router.get("/my", response_model=list[ConversationResponse])
def list_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List conversations the authenticated user participates in (all, for admin)."""
    service = ConversationService(db)
    conversations = service.list_for_user(current_user)
    return service.to_response_list(conversations, current_user.id)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single conversation (participants or admin only)."""
    service = ConversationService(db)
    conversation = service.get_accessible(conversation_id, current_user)
    return service.to_response(conversation, current_user.id)
