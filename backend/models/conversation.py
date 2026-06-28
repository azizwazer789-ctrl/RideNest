from sqlalchemy import Column, ForeignKey, Index, Integer  # type: ignore[import]
from sqlalchemy.orm import backref, relationship  # type: ignore[import]

from database.connection import Base
from utils.models import TimestampMixin


class Conversation(TimestampMixin, Base):
    """A messaging thread between one customer and one vendor.

    Optionally tied to a booking (booking_id is unique so there is at most
    one conversation per booking; multiple NULLs are allowed by both
    SQLite and Postgres, so general, booking-less conversations are
    unrestricted).
    """

    __tablename__ = "conversations"
    __table_args__ = (
        Index("ix_conversations_customer_id", "customer_id"),
        Index("ix_conversations_vendor_id", "vendor_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Plain string backref="conversation" would make Booking.conversation a
    # list by default; backref(..., uselist=False) keeps it scalar on both
    # sides.
    booking = relationship(
        "Booking", backref=backref("conversation", uselist=False)
    )
    # Two FKs point at users.id (customer_id, vendor_id), so each
    # relationship must pin its own foreign_keys to avoid SQLAlchemy join
    # ambiguity.
    customer = relationship(
        "User", foreign_keys=[customer_id], backref="conversations_as_customer"
    )
    vendor = relationship(
        "User", foreign_keys=[vendor_id], backref="conversations_as_vendor"
    )
