from sqlalchemy import Boolean, Column, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from core.enums import VehicleApprovalStatus
from database.connection import Base
from utils.models import TimestampMixin


class Vehicle(TimestampMixin, Base):
    """Vehicle listing owned by a vendor."""

    __tablename__ = "vehicles"
    __table_args__ = (
        Index("ix_vehicles_vendor_id", "vendor_id"),
        Index("ix_vehicles_listing", "is_approved", "is_available"),
        Index("ix_vehicles_city", "city"),
    )

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    car_type = Column(String, nullable=False)
    transmission = Column(String, nullable=False)
    fuel_type = Column(String, nullable=False)
    seating_capacity = Column(Integer, nullable=False)
    city = Column(String, nullable=False)
    location = Column(String, nullable=False)
    price_per_day = Column(Float, nullable=False)
    price_per_hour = Column(Float, nullable=False)
    with_driver_available = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    approval_status = Column(
        String,
        default=VehicleApprovalStatus.pending.value,
        nullable=False,
    )
    # Kept in sync with approval_status (True only when approved) for
    # backward compatibility with clients still reading this boolean.
    is_approved = Column(Boolean, default=False, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    vendor = relationship("User", backref="vehicles")
