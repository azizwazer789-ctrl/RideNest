"""Application-wide constants for validation and business rules."""

from datetime import date

MIN_VEHICLE_YEAR = 1900
MIN_PRICE = 0.01
MAX_SEATING_CAPACITY = 50
MIN_PASSWORD_LENGTH = 8
PHONE_MIN_LENGTH = 7
PHONE_MAX_LENGTH = 20
PLATFORM_COMMISSION_RATE = 0.10


def max_vehicle_year() -> int:
    """Allow current year plus one for upcoming model-year listings."""
    return date.today().year + 1
