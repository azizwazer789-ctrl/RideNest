from sqlalchemy import Column, ForeignKey, Index, Integer, Text  # type: ignore[import]
from sqlalchemy.orm import backref, relationship  # type: ignore[import]

from database.connection import Base
from utils.models import TimestampMixin


class Review(TimestampMixin, Base):
    """Customer review and rating for a completed booking."""

    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_vehicle_id", "vehicle_id"),
        Index("ix_reviews_customer_id", "customer_id"),
        Index("ix_reviews_vendor_id", "vendor_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    # Two FKs point at users.id (customer_id, vendor_id), so each relationship
    # must pin its own foreign_keys to avoid SQLAlchemy join ambiguity.
    customer = relationship(
        "User", foreign_keys=[customer_id], backref="reviews"
    )
    vendor = relationship(
        "User", foreign_keys=[vendor_id], backref="vendor_reviews"
    )
    vehicle = relationship("Vehicle", backref="reviews")
    # Plain string backref="review" would make Booking.review a list by
    # default; backref(..., uselist=False) keeps it scalar on both sides.
    booking = relationship(
        "Booking", backref=backref("review", uselist=False), uselist=False
    )
