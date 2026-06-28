"""Payment, invoice, and refund routes (architecture only — no payment gateway)."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from dependencies.auth import require_customer
from dependencies.database import get_db
from models.user import User
from schemas.invoice import InvoiceResponse
from schemas.payment import PaymentCreate, PaymentResponse
from schemas.refund import RefundCreate, RefundResponse
from services.payment import InvoiceService, PaymentService, RefundService

router = APIRouter(tags=["Payments"])


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Pay for a confirmed booking (customer only); auto-generates the invoice."""
    payment = PaymentService(db).create(payload, current_user)
    return PaymentService.to_response(payment)


@router.get("/payments/my", response_model=list[PaymentResponse])
def list_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """List the authenticated customer's payments, newest first."""
    payments = PaymentService(db).list_for_customer(current_user.id)
    return PaymentService.to_response_list(payments)


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Get a single payment owned by the authenticated customer."""
    payment = PaymentService(db).get_owned(payment_id, current_user)
    return PaymentService.to_response(payment)


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Get an invoice for a payment owned by the authenticated customer."""
    invoice = InvoiceService(db).get_owned(invoice_id, current_user)
    return InvoiceService.to_response(invoice)


@router.get("/invoices/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Download a PDF of an invoice owned by the authenticated customer."""
    pdf_bytes, filename = InvoiceService(db).get_or_render_pdf(invoice_id, current_user)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/refunds", response_model=RefundResponse, status_code=status.HTTP_201_CREATED)
def create_refund(
    payload: RefundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Request a refund for a paid payment (customer only)."""
    refund = RefundService(db).create(payload, current_user)
    return RefundService.to_response(refund)


@router.get("/refunds/my", response_model=list[RefundResponse])
def list_my_refunds(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """List refunds for the authenticated customer's payments, newest first."""
    refunds = RefundService(db).list_for_customer(current_user.id)
    return RefundService.to_response_list(refunds)
