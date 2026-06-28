"""Vendor payout request and admin approval-lifecycle routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from dependencies.auth import require_admin, require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.vendor_payout import VendorPayoutCreate, VendorPayoutResponse
from services.vendor_payout import VendorPayoutService

router = APIRouter(tags=["Vendor Payouts"])


@router.post(
    "/wallet/payout-request",
    response_model=VendorPayoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def request_payout(
    payload: VendorPayoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Request a payout from the authenticated vendor's available balance."""
    payout = VendorPayoutService(db).request(payload, current_user)
    return VendorPayoutService.to_response(payout)


@router.get("/wallet/payouts", response_model=list[VendorPayoutResponse])
def list_my_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """List the authenticated vendor's own payout requests, newest first."""
    payouts = VendorPayoutService(db).list_for_vendor(current_user.id)
    return VendorPayoutService.to_response_list(payouts)


@router.get("/admin/payouts", response_model=list[VendorPayoutResponse])
def list_all_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all vendor payout requests, newest first (admin only)."""
    payouts = VendorPayoutService(db).list_all()
    return VendorPayoutService.to_response_list(payouts)


@router.patch("/admin/payouts/{payout_id}/approve", response_model=VendorPayoutResponse)
def approve_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Approve a pending payout request (admin only)."""
    payout = VendorPayoutService(db).approve(payout_id)
    return VendorPayoutService.to_response(payout)


@router.patch("/admin/payouts/{payout_id}/reject", response_model=VendorPayoutResponse)
def reject_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Reject a pending payout request (admin only)."""
    payout = VendorPayoutService(db).reject(payout_id)
    return VendorPayoutService.to_response(payout)


@router.patch("/admin/payouts/{payout_id}/complete", response_model=VendorPayoutResponse)
def complete_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Complete an approved payout (admin only): deducts available balance."""
    payout = VendorPayoutService(db).complete(payout_id)
    return VendorPayoutService.to_response(payout)
