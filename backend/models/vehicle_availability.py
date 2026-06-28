from sqlalchemy import Column, Date, ForeignKey, Index, Integer, String, Text  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from core.enums import AvailabilityStatus
from database.connection import Base
from utils.models import TimestampMixin


class VehicleAvailability(TimestampMixin, Base):
    """A vendor-managed date range describing a vehicle's calendar status.

    Rows here only ever hold vendor-set statuses (available/unavailable/
    maintenance) — "booked" ranges are derived from confirmed/completed
    Booking rows at read time, never stored here.
    """

    __tablename__ = "vehicle_availabilities"
    __table_args__ = (
        Index("ix_vehicle_availabilities_vehicle_id", "vehicle_id"),
        Index("ix_vehicle_availabilities_date_range", "start_date", "end_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default=AvailabilityStatus.unavailable.value, nullable=False)
    reason = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", backref="availability_ranges")
