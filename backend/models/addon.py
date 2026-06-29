from sqlalchemy import Boolean, Column, Float, Index, Integer, String, Text  # type: ignore[import]

from core.enums import AddOnPricingType
from database.connection import Base
from utils.models import TimestampMixin


class AddOn(TimestampMixin, Base):
    """A bookable add-on service (driver, insurance, GPS, etc.)."""

    __tablename__ = "addons"
    __table_args__ = (Index("ix_addons_is_active", "is_active"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    pricing_type = Column(String, default=AddOnPricingType.fixed.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
