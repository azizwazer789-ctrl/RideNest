"""Reusable offset/limit pagination helper for list queries."""

import math

from sqlalchemy.orm import Query


def paginate(query: Query, page: int, limit: int) -> tuple[list, int, int]:
    """Apply page/limit pagination to an already-ordered query.

    Returns (items, total, pages).
    """
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    pages = math.ceil(total / limit) if total else 0
    return items, total, pages
