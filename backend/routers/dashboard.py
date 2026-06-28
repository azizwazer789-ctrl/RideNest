"""Dashboard statistics routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dependencies.auth import require_admin, require_customer, require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.dashboard import (
    AdminDashboardStats,
    CustomerDashboardStats,
    VendorDashboardStats,
)
from services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/admin/stats", response_model=AdminDashboardStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Platform-wide statistics for admins."""
    return DashboardService(db).admin_stats()


@router.get("/vendor/stats", response_model=VendorDashboardStats)
def get_vendor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Statistics scoped to the authenticated vendor."""
    return DashboardService(db).vendor_stats(current_user.id)


@router.get("/customer/stats", response_model=CustomerDashboardStats)
def get_customer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Statistics scoped to the authenticated customer."""
    return DashboardService(db).customer_stats(current_user.id)
