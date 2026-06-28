from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from database.connection import Base
from utils.datetime import utc_now


class VehicleImage(Base):
    """A single image in a vehicle listing's photo gallery."""

    __tablename__ = "vehicle_images"
    __table_args__ = (Index("ix_vehicle_images_vehicle_id", "vehicle_id"),)

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    vehicle = relationship("Vehicle", backref="images")
