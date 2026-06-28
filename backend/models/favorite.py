from sqlalchemy import Column, ForeignKey, Index, Integer, UniqueConstraint  # type: ignore[import]
from sqlalchemy.orm import relationship  # type: ignore[import]

from database.connection import Base
from utils.models import TimestampMixin


class Favorite(TimestampMixin, Base):
    """A customer's saved/wishlisted vehicle."""

    __tablename__ = "favorites"
    __table_args__ = (
        Index("ix_favorites_customer_id", "customer_id"),
        Index("ix_favorites_vehicle_id", "vehicle_id"),
        UniqueConstraint("customer_id", "vehicle_id", name="uq_favorites_customer_vehicle"),
    )

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    customer = relationship("User", backref="favorites")
    vehicle = relationship("Vehicle", backref="favorited_by")
