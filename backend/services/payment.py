"""Payment, invoice, and refund business logic.

Architecture only — no payment gateway (Stripe/JazzCash) is integrated yet.
Payments are recorded as immediately successful so the rest of the
architecture (invoice generation, refunds) can be exercised end-to-end.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from core.enums import BookingStatus, PaymentStatus, RefundStatus
from core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from models.booking import Booking
from models.invoice import Invoice
from models.payment import Payment
from models.refund import Refund
from models.user import User
from schemas.invoice import InvoiceResponse
from schemas.payment import PaymentCreate, PaymentResponse
from schemas.refund import RefundCreate, RefundResponse
from services.vendor_wallet import VendorWalletService
from utils.invoice_pdf import GENERATED_INVOICES_DIR, render_invoice_pdf

# A payment may be created once a booking has been confirmed; "completed"
# is included too since a completed booking was necessarily confirmed first.
PAYABLE_BOOKING_STATUSES = (BookingStatus.confirmed.value, BookingStatus.completed.value)
ACTIVE_REFUND_STATUSES = (RefundStatus.pending.value, RefundStatus.approved.value)


def _generate_invoice_number(payment_id: int) -> str:
    """Build a human-readable, unique invoice number from the payment id."""
    year = datetime.now(timezone.utc).year
    return f"INV-{year}-{payment_id:06d}"


class PaymentService:
    """Encapsulates payment creation and retrieval."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: PaymentCreate, customer: User) -> Payment:
        """Pay for a confirmed booking and auto-generate its invoice.

        The payment is recorded as immediately "paid" since no real
        gateway exists yet to make it asynchronous.
        """
        booking = self.db.query(Booking).filter(Booking.id == payload.booking_id).first()

        if not booking:
            raise NotFoundError("Booking not found")

        if booking.customer_id != customer.id:
            raise ForbiddenError("Not allowed to pay for this booking")

        if booking.booking_status not in PAYABLE_BOOKING_STATUSES:
            raise BadRequestError("Payment can only be created for a confirmed booking")

        existing = self.db.query(Payment).filter(Payment.booking_id == booking.id).first()
        if existing:
            raise ConflictError("A payment already exists for this booking")

        now = datetime.now(timezone.utc)

        payment = Payment(
            booking_id=booking.id,
            customer_id=customer.id,
            amount=booking.total_price,
            payment_method=payload.payment_method,
            payment_status=PaymentStatus.paid.value,
            transaction_reference=f"TXN-{booking.id}-{int(now.timestamp())}",
            paid_at=now,
        )

        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)

        self._generate_invoice(payment)
        VendorWalletService(self.db).record_earning(booking, payment)
        self.db.refresh(payment)

        return payment

    def _generate_invoice(self, payment: Payment) -> Invoice:
        """Create the invoice for a successfully paid payment."""
        invoice = Invoice(
            payment_id=payment.id,
            invoice_number=_generate_invoice_number(payment.id),
            subtotal=payment.amount,
            tax=0.0,
            discount=0.0,
            total=payment.amount,
        )

        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)

        return invoice

    def list_for_customer(self, customer_id: int) -> list[Payment]:
        """Return a customer's payments, newest first."""
        return (
            self.db.query(Payment)
            .filter(Payment.customer_id == customer_id)
            .order_by(Payment.created_at.desc())
            .all()
        )

    def get_by_id(self, payment_id: int) -> Payment:
        """Return a payment by id or raise not found."""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()

        if not payment:
            raise NotFoundError("Payment not found")

        return payment

    def get_owned(self, payment_id: int, customer: User) -> Payment:
        """Return a payment, scoped to the paying customer."""
        payment = self.get_by_id(payment_id)

        if payment.customer_id != customer.id:
            raise ForbiddenError("Not allowed to view this payment")

        return payment

    @staticmethod
    def to_response(payment: Payment) -> PaymentResponse:
        """Map a Payment ORM instance (with its invoice, if any) to an API response."""
        return PaymentResponse.model_validate(payment)

    @staticmethod
    def to_response_list(payments: list[Payment]) -> list[PaymentResponse]:
        """Map a list of payments to API responses."""
        return [PaymentResponse.model_validate(p) for p in payments]


class InvoiceService:
    """Encapsulates invoice retrieval. Invoices are read-only and never created directly."""

    def __init__(self, db: Session):
        self.db = db

    def get_owned(self, invoice_id: int, customer: User) -> Invoice:
        """Return an invoice, scoped to the customer who made the underlying payment."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()

        if not invoice:
            raise NotFoundError("Invoice not found")

        if invoice.payment.customer_id != customer.id:
            raise ForbiddenError("Not allowed to view this invoice")

        return invoice

    @staticmethod
    def _build_pdf_context(invoice: Invoice) -> dict:
        """Gather customer/vendor/vehicle/booking/payment data for PDF rendering."""
        payment = invoice.payment
        booking = payment.booking
        vehicle = booking.vehicle
        customer = payment.customer
        vendor = vehicle.vendor

        return {
            "invoice_number": invoice.invoice_number,
            "created_at": invoice.created_at,
            "subtotal": invoice.subtotal,
            "tax": invoice.tax,
            "discount": invoice.discount,
            "total": invoice.total,
            "customer_name": customer.full_name,
            "customer_email": customer.email,
            "vendor_name": vendor.full_name,
            "vendor_email": vendor.email,
            "vehicle_title": vehicle.title,
            "vehicle_brand": vehicle.brand,
            "vehicle_model": vehicle.model,
            "vehicle_year": vehicle.year,
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "pickup_location": booking.pickup_location,
            "dropoff_location": booking.dropoff_location,
            "payment_method": payment.payment_method,
            "payment_status": payment.payment_status,
            "transaction_reference": payment.transaction_reference,
            "paid_at": payment.paid_at,
        }

    def get_or_render_pdf(self, invoice_id: int, customer: User) -> tuple[bytes, str]:
        """Return (pdf_bytes, filename) for an invoice, scoped to the paying customer.

        Invoices are immutable once created, so a previously generated PDF
        on disk is reused; otherwise one is rendered and cached for next
        time, with its on-disk path saved on the invoice row.
        """
        invoice = self.get_owned(invoice_id, customer)
        filename = f"{invoice.invoice_number}.pdf"
        file_path = GENERATED_INVOICES_DIR / filename

        if invoice.pdf_path and file_path.is_file():
            return file_path.read_bytes(), filename

        pdf_bytes = render_invoice_pdf(self._build_pdf_context(invoice))

        GENERATED_INVOICES_DIR.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(pdf_bytes)

        invoice.pdf_path = f"generated_invoices/{filename}"
        self.db.commit()

        return pdf_bytes, filename

    @staticmethod
    def to_response(invoice: Invoice) -> InvoiceResponse:
        """Map an Invoice ORM instance to an API response."""
        return InvoiceResponse.model_validate(invoice)


class RefundService:
    """Encapsulates refund request creation and listing."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: RefundCreate, customer: User) -> Refund:
        """Request a refund for a paid payment owned by the customer."""
        payment = self.db.query(Payment).filter(Payment.id == payload.payment_id).first()

        if not payment:
            raise NotFoundError("Payment not found")

        if payment.customer_id != customer.id:
            raise ForbiddenError("Not allowed to request a refund for this payment")

        if payment.payment_status != PaymentStatus.paid.value:
            raise BadRequestError("Refunds can only be requested for paid payments")

        if payload.refund_amount > payment.amount:
            raise BadRequestError("Refund amount cannot exceed the original payment amount")

        existing_active = (
            self.db.query(Refund)
            .filter(
                Refund.payment_id == payment.id,
                Refund.refund_status.in_(ACTIVE_REFUND_STATUSES),
            )
            .first()
        )
        if existing_active:
            raise ConflictError(
                "A refund request is already pending or approved for this payment"
            )

        refund = Refund(
            payment_id=payment.id,
            refund_amount=payload.refund_amount,
            refund_reason=payload.refund_reason,
            refund_status=RefundStatus.pending.value,
        )

        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)

        return refund

    def list_for_customer(self, customer_id: int) -> list[Refund]:
        """Return refunds for payments owned by a customer, newest first."""
        return (
            self.db.query(Refund)
            .join(Payment, Refund.payment_id == Payment.id)
            .filter(Payment.customer_id == customer_id)
            .order_by(Refund.id.desc())
            .all()
        )

    @staticmethod
    def to_response(refund: Refund) -> RefundResponse:
        """Map a Refund ORM instance to an API response."""
        return RefundResponse.model_validate(refund)

    @staticmethod
    def to_response_list(refunds: list[Refund]) -> list[RefundResponse]:
        """Map a list of refunds to API responses."""
        return [RefundResponse.model_validate(r) for r in refunds]
