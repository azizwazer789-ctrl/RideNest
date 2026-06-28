from sqlalchemy import Column, Date, Float, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import BookingStatus
from database.connection import Base
from utils.models import TimestampMixin


class Booking(TimestampMixin, Base):
    """Booking record linking customers to vehicles for rental periods."""

    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_customer_id", "customer_id"),
        Index("ix_bookings_vehicle_id", "vehicle_id"),
        Index("ix_bookings_date_range", "start_date", "end_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    pickup_location = Column(String, nullable=False)
    dropoff_location = Column(String, nullable=False)
    total_price = Column(Float, nullable=False)
    booking_status = Column(
        String,
        default=BookingStatus.pending.value,
        nullable=False,
    )

    customer = relationship("User", backref="bookings")
    vehicle = relationship("Vehicle", backref="bookings")
