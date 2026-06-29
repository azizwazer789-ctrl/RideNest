from sqlalchemy import Column, Float, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from database.connection import Base
from utils.models import TimestampMixin


class BookingAddOn(TimestampMixin, Base):
    """An add-on selected for a specific booking.

    Name, pricing_type, and unit_price are snapshotted from the AddOn at
    selection time, so a later admin price/name change or deactivation
    never alters the historical cost of a booking that already used it.
    """

    __tablename__ = "booking_addons"
    __table_args__ = (
        Index("ix_booking_addons_booking_id", "booking_id"),
        Index("ix_booking_addons_addon_id", "addon_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    addon_id = Column(Integer, ForeignKey("addons.id"), nullable=False)
    name = Column(String, nullable=False)
    pricing_type = Column(String, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    booking = relationship("Booking", backref="addons")
    addon = relationship("AddOn")
