from sqlalchemy import Column, Index, Integer, String, Text

from core.enums import UserRole
from database.connection import Base
from utils.models import TimestampMixin


class User(TimestampMixin, Base):
    """Registered platform user."""

    __tablename__ = "users"
    __table_args__ = (Index("ix_users_role", "role"),)

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.customer.value, nullable=False)
    phone = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
