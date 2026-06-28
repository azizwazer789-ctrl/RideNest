"""Booking routes."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from dependencies.auth import require_admin, require_customer, require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.booking import BookingCreate, BookingResponse
from schemas.common import PaginatedResponse
from services.booking import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Create a booking for an approved vehicle (customer only)."""
    created = BookingService(db).create(booking, current_user)
    return BookingService.to_response(created)


@router.get("/my", response_model=PaginatedResponse[BookingResponse])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    """List bookings for the authenticated customer."""
    bookings, total, pages = BookingService(db).list_for_customer(
        current_user.id, page=page, limit=limit
    )
    return PaginatedResponse[BookingResponse](
        items=BookingService.to_response_list(bookings),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/vendor", response_model=PaginatedResponse[BookingResponse])
def list_vendor_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    """List bookings for vehicles owned by the authenticated vendor."""
    bookings, total, pages = BookingService(db).list_for_vendor(
        current_user.id, page=page, limit=limit
    )
    return PaginatedResponse[BookingResponse](
        items=BookingService.to_response_list(bookings),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/admin/all", response_model=PaginatedResponse[BookingResponse])
def list_all_bookings_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    """List all bookings, newest first (admin only)."""
    bookings, total, pages = BookingService(db).list_all(page=page, limit=limit)
    return PaginatedResponse[BookingResponse](
        items=BookingService.to_response_list(bookings),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Cancel a booking owned by the authenticated customer."""
    cancelled = BookingService(db).cancel(booking_id, current_user)
    return BookingService.to_response(cancelled)


@router.patch("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Confirm a pending booking (vehicle owner vendor only)."""
    confirmed = BookingService(db).confirm(booking_id, current_user)
    return BookingService.to_response(confirmed)


@router.patch("/{booking_id}/reject", response_model=BookingResponse)
def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Reject a pending booking (vehicle owner vendor only)."""
    rejected = BookingService(db).reject(booking_id, current_user)
    return BookingService.to_response(rejected)


@router.patch("/{booking_id}/complete", response_model=BookingResponse)
def complete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Mark a confirmed booking as completed (vehicle owner vendor only)."""
    completed = BookingService(db).complete(booking_id, current_user)
    return BookingService.to_response(completed)