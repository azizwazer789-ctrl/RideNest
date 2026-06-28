from datetime import datetime

from pydantic import BaseModel, ConfigDict  # type: ignore[import]


class InvoiceResponse(BaseModel):
    """Invoice data returned by the API.

    There is no creation payload — invoices are only ever generated
    automatically by PaymentService after a successful payment.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_id: int
    invoice_number: str
    subtotal: float
    tax: float
    discount: float
    total: float
    created_at: datetime
    pdf_path: str | None
