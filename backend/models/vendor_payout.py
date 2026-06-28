from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import PayoutStatus
from database.connection import Base
from utils.datetime import utc_now


class VendorPayout(Base):
    """A vendor's withdrawal request against their wallet's available balance."""

    __tablename__ = "vendor_payouts"
    __table_args__ = (Index("ix_vendor_payouts_vendor_id", "vendor_id"),)

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payout_status = Column(String, default=PayoutStatus.pending.value, nullable=False)
    payout_method = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    requested_at = Column(DateTime, default=utc_now, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    vendor = relationship("User", backref="payout_requests")
