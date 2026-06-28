"""Shared validation helpers for schemas and services."""

from datetime import date

from core.constants import MIN_VEHICLE_YEAR, max_vehicle_year


def validate_vehicle_year(year: int) -> int:
    """Ensure vehicle year is within an acceptable range."""
    upper = max_vehicle_year()
    if year < MIN_VEHICLE_YEAR or year > upper:
        raise ValueError(f"year must be between {MIN_VEHICLE_YEAR} and {upper}")
    return year


def validate_booking_date_range(start_date: date, end_date: date) -> None:
    """Ensure booking dates are valid and not in the past."""
    today = date.today()
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date")
    if start_date < today:
        raise ValueError("start_date cannot be in the past")
