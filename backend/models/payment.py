from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import backref, relationship  # type: ignore[import]

from core.enums import PaymentStatus
from database.connection import Base
from utils.models import TimestampMixin


class Payment(TimestampMixin, Base):
    """A customer's payment for a single booking.

    No payment gateway is integrated yet — this models the architecture
    only. A booking may have at most one payment (booking_id is unique).
    """

    __tablename__ = "payments"
    __table_args__ = (Index("ix_payments_customer_id", "customer_id"),)

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    payment_status = Column(String, default=PaymentStatus.pending.value, nullable=False)
    transaction_reference = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    # Plain string backref="payment" would make Booking.payment a list by
    # default; backref(..., uselist=False) keeps it scalar on both sides.
    booking = relationship(
        "Booking", backref=backref("payment", uselist=False), uselist=False
    )
    customer = relationship("User", backref="payments")
