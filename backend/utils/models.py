"""Reusable SQLAlchemy model mixins."""

from sqlalchemy import Column, DateTime

from utils.datetime import utc_now


class TimestampMixin:
    """Adds created_at and updated_at columns to a model."""

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )
