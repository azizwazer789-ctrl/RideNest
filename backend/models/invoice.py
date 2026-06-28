from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String  # type: ignore[import]
from sqlalchemy.orm import backref, relationship  # type: ignore[import]

from database.connection import Base
from utils.datetime import utc_now


class Invoice(Base):
    """An immutable invoice document, auto-generated after a successful payment."""

    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False, unique=True)
    invoice_number = Column(String, nullable=False, unique=True, index=True)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    # Relative path (from the backend root) of the last generated PDF for
    # this invoice; null until /invoices/{id}/pdf is requested for the
    # first time.
    pdf_path = Column(String, nullable=True)

    # Plain string backref="invoice" would make Payment.invoice a list by
    # default; backref(..., uselist=False) keeps it scalar on both sides.
    payment = relationship(
        "Payment", backref=backref("invoice", uselist=False), uselist=False
    )
