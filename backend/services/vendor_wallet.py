"""Vendor wallet and earnings-ledger business logic.

A vendor's earning is created automatically by PaymentService.create()
(after a successful payment) and moved from pending to available balance
automatically by BookingService.complete() (once the rental finishes).
Neither the wallet nor the ledger is ever created/edited via a direct
client payload.
"""

from sqlalchemy.orm import Session

from core.constants import PLATFORM_COMMISSION_RATE
from core.enums import BookingStatus, LedgerStatus
from models.booking import Booking
from models.earnings_ledger import EarningsLedger
from models.payment import Payment
from models.vendor_wallet import VendorWallet
from schemas.earnings_ledger import EarningsLedgerResponse
from schemas.vendor_wallet import VendorWalletResponse


class VendorWalletService:
    """Encapsulates vendor wallet balance and earnings-ledger operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, vendor_id: int) -> VendorWallet:
        """Return a vendor's wallet, creating a zero-balance one if missing."""
        wallet = (
            self.db.query(VendorWallet).filter(VendorWallet.vendor_id == vendor_id).first()
        )
        if wallet:
            return wallet

        wallet = VendorWallet(vendor_id=vendor_id)
        self.db.add(wallet)
        self.db.commit()
        self.db.refresh(wallet)

        return wallet

    def record_earning(self, booking: Booking, payment: Payment) -> EarningsLedger:
        """Create the earnings ledger entry for a successful payment.

        Platform commission is deducted automatically; the remainder
        (vendor_amount) is credited to pending_balance — unless the
        booking is already completed at payment time, in which case the
        earning is immediately credited to available_balance instead,
        since there is no later "complete" transition left to trigger it.
        """
        vendor_id = booking.vehicle.vendor_id
        gross_amount = payment.amount
        platform_commission = round(gross_amount * PLATFORM_COMMISSION_RATE, 2)
        vendor_amount = round(gross_amount - platform_commission, 2)

        already_completed = booking.booking_status == BookingStatus.completed.value
        status = (
            LedgerStatus.available.value if already_completed else LedgerStatus.pending.value
        )

        entry = EarningsLedger(
            vendor_id=vendor_id,
            booking_id=booking.id,
            payment_id=payment.id,
            gross_amount=gross_amount,
            platform_commission=platform_commission,
            vendor_amount=vendor_amount,
            status=status,
        )

        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        wallet = self.get_or_create(vendor_id)
        wallet.total_earned += vendor_amount
        if already_completed:
            wallet.available_balance += vendor_amount
        else:
            wallet.pending_balance += vendor_amount
        self.db.commit()

        return entry

    def mark_booking_earnings_available(self, booking_id: int) -> None:
        """Move a just-completed booking's pending earning into available balance.

        A no-op if no ledger entry exists yet for this booking (the
        customer hasn't paid yet) or if it was already moved.
        """
        entry = (
            self.db.query(EarningsLedger)
            .filter(
                EarningsLedger.booking_id == booking_id,
                EarningsLedger.status == LedgerStatus.pending.value,
            )
            .first()
        )
        if not entry:
            return

        entry.status = LedgerStatus.available.value
        self.db.commit()

        wallet = self.get_or_create(entry.vendor_id)
        wallet.pending_balance -= entry.vendor_amount
        wallet.available_balance += entry.vendor_amount
        self.db.commit()

    def list_ledger_for_vendor(self, vendor_id: int) -> list[EarningsLedger]:
        """Return a vendor's earnings ledger entries, newest first."""
        return (
            self.db.query(EarningsLedger)
            .filter(EarningsLedger.vendor_id == vendor_id)
            .order_by(EarningsLedger.created_at.desc())
            .all()
        )

    @staticmethod
    def to_wallet_response(wallet: VendorWallet) -> VendorWalletResponse:
        """Map a VendorWallet ORM instance to an API response."""
        return VendorWalletResponse.model_validate(wallet)

    @staticmethod
    def to_ledger_response(entry: EarningsLedger) -> EarningsLedgerResponse:
        """Map an EarningsLedger ORM instance to an API response."""
        return EarningsLedgerResponse.model_validate(entry)

    @staticmethod
    def to_ledger_response_list(entries: list[EarningsLedger]) -> list[EarningsLedgerResponse]:
        """Map a list of earnings ledger entries to API responses."""
        return [EarningsLedgerResponse.model_validate(e) for e in entries]
