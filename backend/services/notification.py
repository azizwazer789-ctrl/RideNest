"""Notification creation, listing, and management business logic."""

from sqlalchemy.orm import Session

from core.exceptions import ForbiddenError, NotFoundError
from models.notification import Notification
from models.user import User
from schemas.notification import NotificationListResponse, NotificationResponse


class NotificationService:
    """Encapsulates in-app notification operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self, user_id: int, title: str, message: str, notif_type: str
    ) -> Notification:
        """Create a notification for a user.

        Called by other services as a side effect of booking/vehicle/review
        actions (e.g. a vendor confirming a booking notifies the customer).
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
        )

        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        return notification

    def list_for_user(self, user_id: int) -> list[Notification]:
        """Return a user's notifications, newest first."""
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    def get_by_id(self, notification_id: int) -> Notification:
        """Return a notification by id or raise not found."""
        notification = (
            self.db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

        if not notification:
            raise NotFoundError("Notification not found")

        return notification

    @staticmethod
    def _ensure_owner(notification: Notification, user: User) -> None:
        if notification.user_id != user.id:
            raise ForbiddenError("Not allowed to access this notification")

    def mark_read(self, notification_id: int, user: User) -> Notification:
        """Mark a single notification as read (owner only)."""
        notification = self.get_by_id(notification_id)
        self._ensure_owner(notification, user)

        notification.is_read = True

        self.db.commit()
        self.db.refresh(notification)

        return notification

    def mark_all_read(self, user_id: int) -> None:
        """Mark all of a user's notifications as read."""
        self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        ).update({"is_read": True})

        self.db.commit()

    def delete(self, notification_id: int, user: User) -> None:
        """Delete a notification (owner only)."""
        notification = self.get_by_id(notification_id)
        self._ensure_owner(notification, user)

        self.db.delete(notification)
        self.db.commit()

    @staticmethod
    def to_response(notification: Notification) -> NotificationResponse:
        """Map a Notification ORM instance to an API response."""
        return NotificationResponse.model_validate(notification)

    @staticmethod
    def to_response_list(notifications: list[Notification]) -> list[NotificationResponse]:
        """Map a list of notifications to API responses."""
        return [NotificationResponse.model_validate(n) for n in notifications]

    def to_list_response(self, user_id: int) -> NotificationListResponse:
        """Build the notifications-with-unread-count response for a user."""
        notifications = self.list_for_user(user_id)
        unread_count = sum(1 for n in notifications if not n.is_read)

        return NotificationListResponse(
            notifications=self.to_response_list(notifications),
            unread_count=unread_count,
        )
