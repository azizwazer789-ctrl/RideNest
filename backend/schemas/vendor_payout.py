from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from core.enums import PayoutStatus


class VendorPayoutCreate(BaseModel):
    """Payload for requesting a payout from the vendor's available balance."""

    amount: float = Field(gt=0)
    payout_method: str = Field(min_length=1, max_length=50)


class VendorPayoutResponse(BaseModel):
    """A payout request/record, returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    amount: float
    payout_status: PayoutStatus
    payout_method: str
    reference: str | None
    requested_at: datetime
    processed_at: datetime | None
