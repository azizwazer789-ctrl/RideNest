"""Review and rating routes."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user, require_customer
from dependencies.database import get_db
from models.user import User
from schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
    ReviewUpdate,
)
from services.review import ReviewService
from services.user import UserService
from services.vehicle import VehicleService

router = APIRouter(tags=["Reviews"])


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Create a review for a completed booking (customer only)."""
    created = ReviewService(db).create(review, current_user)
    return ReviewService.to_response(created)


@router.get("/vehicles/{vehicle_id}/reviews", response_model=ReviewListResponse)
def list_vehicle_reviews(vehicle_id: int, db: Session = Depends(get_db)):
    """List reviews for a vehicle, newest first, with rating stats (public)."""
    VehicleService(db).get_by_id(vehicle_id)
    service = ReviewService(db)
    reviews = service.list_for_vehicle(vehicle_id)
    average_rating, total_reviews = service.get_vehicle_rating_stats(vehicle_id)
    return ReviewListResponse(
        items=service.to_response_list(reviews),
        average_rating=average_rating,
        total_reviews=total_reviews,
    )


@router.get("/vendors/{vendor_id}/reviews", response_model=ReviewListResponse)
def list_vendor_reviews(vendor_id: int, db: Session = Depends(get_db)):
    """List reviews across a vendor's vehicles, newest first, with rating stats (public)."""
    UserService(db).get_vendor(vendor_id)
    service = ReviewService(db)
    reviews = service.list_for_vendor(vendor_id)
    average_rating, total_reviews = service.get_vendor_rating_stats(vendor_id)
    return ReviewListResponse(
        items=service.to_response_list(reviews),
        average_rating=average_rating,
        total_reviews=total_reviews,
    )


@router.get("/reviews/my", response_model=list[ReviewResponse])
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """List reviews written by the authenticated customer."""
    reviews = ReviewService(db).list_for_customer(current_user.id)
    return ReviewService.to_response_list(reviews)


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Edit a review (owner customer only)."""
    updated = ReviewService(db).update(review_id, payload, current_user)
    return ReviewService.to_response(updated)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a review (owner customer or admin only)."""
    ReviewService(db).delete(review_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
