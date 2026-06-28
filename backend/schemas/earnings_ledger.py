from datetime import datetime

from pydantic import BaseModel, ConfigDict  # type: ignore[import]

from core.enums import LedgerStatus


class EarningsLedgerResponse(BaseModel):
    """A single earnings ledger entry, returned by the API.

    There is no creation payload — entries are only ever created
    automatically by VendorWalletService as a side effect of a payment.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    booking_id: int
    payment_id: int
    gross_amount: float
    platform_commission: float
    vendor_amount: float
    status: LedgerStatus
    created_at: datetime
