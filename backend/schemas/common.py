"""Shared Pydantic schemas."""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    """Standard message response."""

    message: str


class TimestampSchema(BaseModel):
    """Reusable timestamp fields for API responses."""

    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime


ItemT = TypeVar("ItemT")


class PaginatedResponse(BaseModel, Generic[ItemT]):
    """Reusable page-based pagination envelope for list endpoints."""

    items: list[ItemT]
    total: int
    page: int
    limit: int
    pages: int
