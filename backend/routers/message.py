"""Message routes (nested under /conversations, plus a top-level read-state route)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user
from dependencies.database import get_db
from models.user import User
from schemas.message import MessageCreate, MessageResponse
from services.message import MessageService

router = APIRouter(tags=["Messaging"])


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message in a conversation (participants only; admins cannot send)."""
    message = MessageService(db).send(conversation_id, payload, current_user)
    return MessageService.to_response(message)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List a conversation's messages, oldest first; marks the viewer's unread ones read."""
    messages = MessageService(db).list_for_conversation(conversation_id, current_user)
    return MessageService.to_response_list(messages)


@router.patch("/messages/{message_id}/read", response_model=MessageResponse)
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single incoming message as read (recipient participant only)."""
    message = MessageService(db).mark_read(message_id, current_user)
    return MessageService.to_response(message)
