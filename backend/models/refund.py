from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import RefundStatus
from database.connection import Base


class Refund(Base):
    """A refund request/record against a payment."""

    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    refund_amount = Column(Float, nullable=False)
    refund_reason = Column(Text, nullable=True)
    refund_status = Column(String, default=RefundStatus.pending.value, nullable=False)
    refunded_at = Column(DateTime, nullable=True)

    payment = relationship("Payment", backref="refunds")
