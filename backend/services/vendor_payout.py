"""Vendor payout request and admin approval-lifecycle business logic."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from core.enums import PayoutStatus
from core.exceptions import BadRequestError, ConflictError, NotFoundError
from models.user import User
from models.vendor_payout import VendorPayout
from schemas.vendor_payout import VendorPayoutCreate, VendorPayoutResponse
from services.vendor_wallet import VendorWalletService

# Only one payout can be "in flight" per vendor at a time: this both
# prevents duplicate requests and guarantees the available-balance check
# at request time stays accurate (no second request can be created while
# the first hasn't been resolved).
ACTIVE_PAYOUT_STATUSES = (PayoutStatus.pending.value, PayoutStatus.approved.value)


class VendorPayoutService:
    """Encapsulates payout request creation and the admin approval lifecycle."""

    def __init__(self, db: Session):
        self.db = db

    def request(self, payload: VendorPayoutCreate, vendor: User) -> VendorPayout:
        """Request a payout from the vendor's available balance."""
        existing_active = (
            self.db.query(VendorPayout)
            .filter(
                VendorPayout.vendor_id == vendor.id,
                VendorPayout.payout_status.in_(ACTIVE_PAYOUT_STATUSES),
            )
            .first()
        )
        if existing_active:
            raise ConflictError("You already have a pending or approved payout request")

        wallet = VendorWalletService(self.db).get_or_create(vendor.id)
        if payload.amount > wallet.available_balance:
            raise BadRequestError("Payout amount exceeds available balance")

        payout = VendorPayout(
            vendor_id=vendor.id,
            amount=payload.amount,
            payout_status=PayoutStatus.pending.value,
            payout_method=payload.payout_method,
        )

        self.db.add(payout)
        self.db.commit()
        self.db.refresh(payout)

        return payout

    def list_for_vendor(self, vendor_id: int) -> list[VendorPayout]:
        """Return a vendor's own payout requests, newest first."""
        return (
            self.db.query(VendorPayout)
            .filter(VendorPayout.vendor_id == vendor_id)
            .order_by(VendorPayout.requested_at.desc())
            .all()
        )

    def list_all(self) -> list[VendorPayout]:
        """Return all payout requests, newest first (admin only)."""
        return (
            self.db.query(VendorPayout).order_by(VendorPayout.requested_at.desc()).all()
        )

    def get_by_id(self, payout_id: int) -> VendorPayout:
        """Return a payout request by id or raise not found."""
        payout = self.db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()

        if not payout:
            raise NotFoundError("Payout request not found")

        return payout

    def approve(self, payout_id: int) -> VendorPayout:
        """Approve a pending payout request (admin only)."""
        payout = self.get_by_id(payout_id)

        if payout.payout_status != PayoutStatus.pending.value:
            raise BadRequestError(
                f"Only pending payouts can be approved (current: {payout.payout_status})"
            )

        payout.payout_status = PayoutStatus.approved.value
        payout.processed_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(payout)

        return payout

    def reject(self, payout_id: int) -> VendorPayout:
        """Reject a pending payout request (admin only); balance is untouched."""
        payout = self.get_by_id(payout_id)

        if payout.payout_status != PayoutStatus.pending.value:
            raise BadRequestError(
                f"Only pending payouts can be rejected (current: {payout.payout_status})"
            )

        payout.payout_status = PayoutStatus.rejected.value
        payout.processed_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(payout)

        return payout

    def complete(self, payout_id: int) -> VendorPayout:
        """Complete an approved payout: deducts available balance, records withdrawal."""
        payout = self.get_by_id(payout_id)

        if payout.payout_status != PayoutStatus.approved.value:
            raise BadRequestError(
                f"Only approved payouts can be completed (current: {payout.payout_status})"
            )

        wallet = VendorWalletService(self.db).get_or_create(payout.vendor_id)
        if payout.amount > wallet.available_balance:
            raise BadRequestError(
                "Vendor's available balance is insufficient to complete this payout"
            )

        wallet.available_balance -= payout.amount
        wallet.total_withdrawn += payout.amount

        payout.payout_status = PayoutStatus.completed.value
        payout.processed_at = datetime.now(timezone.utc)
        payout.reference = f"PAYOUT-{payout.id}-{int(payout.processed_at.timestamp())}"

        self.db.commit()
        self.db.refresh(payout)

        return payout

    @staticmethod
    def to_response(payout: VendorPayout) -> VendorPayoutResponse:
        """Map a VendorPayout ORM instance to an API response."""
        return VendorPayoutResponse.model_validate(payout)

    @staticmethod
    def to_response_list(payouts: list[VendorPayout]) -> list[VendorPayoutResponse]:
        """Map a list of payout requests to API responses."""
        return [VendorPayoutResponse.model_validate(p) for p in payouts]
