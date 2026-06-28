"""Admin and vendor analytics reporting routes."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependencies.auth import require_admin, require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.analytics import (
    AdminBookingsResponse,
    AdminOverviewResponse,
    AdminRevenueResponse,
    TopVehicleEntry,
    TopVendorEntry,
    VendorBookingsResponse,
    VendorOverviewResponse,
    VendorRevenueResponse,
)
from services.analytics import DEFAULT_TOP_LIMIT, AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/admin/overview", response_model=AdminOverviewResponse)
def admin_overview(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Platform-wide analytics snapshot (admin only)."""
    return AnalyticsService(db).admin_overview(start_date, end_date)


@router.get("/admin/revenue", response_model=AdminRevenueResponse)
def admin_revenue(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Platform-wide revenue total and monthly trend (admin only)."""
    return AnalyticsService(db).admin_revenue(start_date, end_date)


@router.get("/admin/bookings", response_model=AdminBookingsResponse)
def admin_bookings(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Platform-wide booking totals, status breakdown, and monthly trend (admin only)."""
    return AnalyticsService(db).admin_bookings(start_date, end_date)


@router.get("/admin/top-vehicles", response_model=list[TopVehicleEntry])
def admin_top_vehicles(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=DEFAULT_TOP_LIMIT, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Top vehicles platform-wide, ranked by revenue (admin only)."""
    return AnalyticsService(db).admin_top_vehicles(start_date, end_date, limit)


@router.get("/admin/top-vendors", response_model=list[TopVendorEntry])
def admin_top_vendors(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=DEFAULT_TOP_LIMIT, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Top vendors platform-wide, ranked by revenue (admin only)."""
    return AnalyticsService(db).admin_top_vendors(start_date, end_date, limit)


@router.get("/vendor/overview", response_model=VendorOverviewResponse)
def vendor_overview(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Analytics snapshot scoped to the authenticated vendor's own data."""
    return AnalyticsService(db).vendor_overview(current_user.id, start_date, end_date)


@router.get("/vendor/revenue", response_model=VendorRevenueResponse)
def vendor_revenue(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Revenue total and monthly trend scoped to the authenticated vendor."""
    return AnalyticsService(db).vendor_revenue(current_user.id, start_date, end_date)


@router.get("/vendor/bookings", response_model=VendorBookingsResponse)
def vendor_bookings(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Booking totals, status breakdown, and monthly trend for the authenticated vendor."""
    return AnalyticsService(db).vendor_bookings(current_user.id, start_date, end_date)


@router.get("/vendor/top-vehicles", response_model=list[TopVehicleEntry])
def vendor_top_vehicles(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=DEFAULT_TOP_LIMIT, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Top vehicles owned by the authenticated vendor, ranked by revenue."""
    return AnalyticsService(db).vendor_top_vehicles(
        current_user.id, start_date, end_date, limit
    )
