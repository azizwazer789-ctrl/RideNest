"""Review creation, listing, editing, and deletion business logic."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.enums import BookingStatus, NotificationType, UserRole
from core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from models.booking import Booking
from models.review import Review
from models.user import User
from schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from services.notification import NotificationService


class ReviewService:
    """Encapsulates review-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: ReviewCreate, customer: User) -> Review:
        """Create a review for a completed booking owned by the customer."""
        booking = self.db.query(Booking).filter(Booking.id == payload.booking_id).first()

        if not booking:
            raise NotFoundError("Booking not found")

        if booking.customer_id != customer.id:
            raise ForbiddenError("Not allowed to review this booking")

        if booking.booking_status != BookingStatus.completed.value:
            raise BadRequestError("Only completed bookings can be reviewed")

        existing = (
            self.db.query(Review).filter(Review.booking_id == payload.booking_id).first()
        )
        if existing:
            raise ConflictError("This booking has already been reviewed")

        review = Review(
            customer_id=customer.id,
            vendor_id=booking.vehicle.vendor_id,
            vehicle_id=booking.vehicle_id,
            booking_id=booking.id,
            rating=payload.rating,
            comment=payload.comment,
        )

        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)

        NotificationService(self.db).create(
            user_id=review.vendor_id,
            title="New Review Received",
            message=(
                f"Your vehicle '{booking.vehicle.title}' received a "
                f"{review.rating}-star review."
            ),
            notif_type=NotificationType.review_received.value,
        )

        return review

    def list_for_vehicle(self, vehicle_id: int) -> list[Review]:
        """Return reviews for a vehicle, newest first."""
        return (
            self.db.query(Review)
            .filter(Review.vehicle_id == vehicle_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    def list_for_vendor(self, vendor_id: int) -> list[Review]:
        """Return reviews across all of a vendor's vehicles, newest first."""
        return (
            self.db.query(Review)
            .filter(Review.vendor_id == vendor_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    def list_for_customer(self, customer_id: int) -> list[Review]:
        """Return reviews written by a customer, newest first."""
        return (
            self.db.query(Review)
            .filter(Review.customer_id == customer_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    def get_vehicle_rating_stats(self, vehicle_id: int) -> tuple[float, int]:
        """Return (average_rating, total_reviews) for a vehicle."""
        average, total = (
            self.db.query(
                func.coalesce(func.avg(Review.rating), 0.0),
                func.count(Review.id),
            )
            .filter(Review.vehicle_id == vehicle_id)
            .first()
        )
        return float(average), total

    def get_vendor_rating_stats(self, vendor_id: int) -> tuple[float, int]:
        """Return (average_rating, total_reviews) for a vendor."""
        average, total = (
            self.db.query(
                func.coalesce(func.avg(Review.rating), 0.0),
                func.count(Review.id),
            )
            .filter(Review.vendor_id == vendor_id)
            .first()
        )
        return float(average), total

    def get_by_id(self, review_id: int) -> Review:
        """Return a review by id or raise not found."""
        review = self.db.query(Review).filter(Review.id == review_id).first()

        if not review:
            raise NotFoundError("Review not found")

        return review

    def update(self, review_id: int, payload: ReviewUpdate, customer: User) -> Review:
        """Edit a review (owner customer only; admins cannot edit, only delete)."""
        review = self.get_by_id(review_id)

        if review.customer_id != customer.id:
            raise ForbiddenError("Not allowed to edit this review")

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)

        self.db.commit()
        self.db.refresh(review)

        return review

    def delete(self, review_id: int, current_user: User) -> None:
        """Delete a review (owner customer or admin only)."""
        review = self.get_by_id(review_id)

        is_owner = review.customer_id == current_user.id
        is_admin = current_user.role == UserRole.admin.value

        if not is_owner and not is_admin:
            raise ForbiddenError("Not allowed to delete this review")

        self.db.delete(review)
        self.db.commit()

    @staticmethod
    def to_response(review: Review) -> ReviewResponse:
        """Map a Review ORM instance to an API response."""
        return ReviewResponse.model_validate(review)

    @staticmethod
    def to_response_list(reviews: list[Review]) -> list[ReviewResponse]:
        """Map a list of reviews to API responses."""
        return [ReviewResponse.model_validate(review) for review in reviews]
