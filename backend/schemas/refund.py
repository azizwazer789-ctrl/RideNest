from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from core.enums import RefundStatus


class RefundCreate(BaseModel):
    """Payload for requesting a refund on a paid payment."""

    payment_id: int = Field(gt=0)
    refund_amount: float = Field(gt=0)
    refund_reason: str | None = Field(default=None, max_length=500)


class RefundResponse(BaseModel):
    """Refund data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_id: int
    refund_amount: float
    refund_reason: str | None
    refund_status: RefundStatus
    refunded_at: datetime | None
