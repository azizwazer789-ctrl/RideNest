from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # type: ignore[import]

from core.enums import PaymentStatus
from schemas.common import TimestampSchema
from schemas.invoice import InvoiceResponse


class PaymentCreate(BaseModel):
    """Payload for paying a confirmed booking."""

    booking_id: int = Field(gt=0)
    payment_method: str = Field(min_length=1, max_length=50)


class PaymentResponse(TimestampSchema):
    """Payment data returned by the API, including its invoice once generated."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    customer_id: int
    amount: float
    payment_method: str
    payment_status: PaymentStatus
    transaction_reference: str | None
    paid_at: datetime | None
    invoice: InvoiceResponse | None = None
