from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer  # type: ignore[import]
from sqlalchemy.orm import backref, relationship  # type: ignore[import]

from database.connection import Base
from utils.datetime import utc_now


class VendorWallet(Base):
    """A vendor's running balance of earnings and withdrawals.

    One wallet per vendor (vendor_id is unique), created lazily on first
    earning or first access — never created directly via a payload.
    """

    __tablename__ = "vendor_wallets"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    available_balance = Column(Float, default=0.0, nullable=False)
    pending_balance = Column(Float, default=0.0, nullable=False)
    total_earned = Column(Float, default=0.0, nullable=False)
    total_withdrawn = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    vendor = relationship("User", backref=backref("wallet", uselist=False))
