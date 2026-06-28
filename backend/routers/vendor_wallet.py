"""Vendor wallet and earnings ledger routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dependencies.auth import require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.earnings_ledger import EarningsLedgerResponse
from schemas.vendor_wallet import VendorWalletResponse
from services.vendor_wallet import VendorWalletService

router = APIRouter(tags=["Vendor Wallet"])


@router.get("/wallet", response_model=VendorWalletResponse)
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Return the authenticated vendor's wallet balances."""
    wallet = VendorWalletService(db).get_or_create(current_user.id)
    return VendorWalletService.to_wallet_response(wallet)


@router.get("/wallet/ledger", response_model=list[EarningsLedgerResponse])
def get_my_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """List the authenticated vendor's earnings ledger entries, newest first."""
    entries = VendorWalletService(db).list_ledger_for_vendor(current_user.id)
    return VendorWalletService.to_ledger_response_list(entries)
