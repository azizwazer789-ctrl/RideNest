"""Notification routes."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user
from dependencies.database import get_db
from models.user import User
from schemas.notification import NotificationListResponse, NotificationResponse
from services.notification import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/my", response_model=NotificationListResponse)
def list_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the authenticated user's notifications with an unread count."""
    return NotificationService(db).to_list_response(current_user.id)


@router.patch("/read-all", response_model=NotificationListResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all of the authenticated user's notifications as read."""
    service = NotificationService(db)
    service.mark_all_read(current_user.id)
    return service.to_list_response(current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read (owner only)."""
    notification = NotificationService(db).mark_read(notification_id, current_user)
    return NotificationService.to_response(notification)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification (owner only)."""
    NotificationService(db).delete(notification_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
