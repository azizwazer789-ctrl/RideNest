from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import LedgerStatus
from database.connection import Base
from utils.datetime import utc_now


class EarningsLedger(Base):
    """An immutable record of a vendor's earning from one paid booking.

    One entry per payment (payment_id is unique) and per booking
    (booking_id is unique) — created automatically by VendorWalletService,
    never via a direct payload.
    """

    __tablename__ = "earnings_ledger"
    __table_args__ = (Index("ix_earnings_ledger_vendor_id", "vendor_id"),)

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False, unique=True)
    gross_amount = Column(Float, nullable=False)
    platform_commission = Column(Float, nullable=False)
    vendor_amount = Column(Float, nullable=False)
    status = Column(String, default=LedgerStatus.pending.value, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    vendor = relationship("User")
    booking = relationship("Booking")
    payment = relationship("Payment")
