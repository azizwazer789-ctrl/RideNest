from datetime import datetime

from pydantic import BaseModel, ConfigDict  # type: ignore[import]


class VendorWalletResponse(BaseModel):
    """A vendor's wallet balances, returned by the API.

    There is no creation/update payload — wallets are entirely
    system-managed as a side effect of payments and payouts.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    available_balance: float
    pending_balance: float
    total_earned: float
    total_withdrawn: float
    updated_at: datetime
