"""Central enums shared across models, schemas, and services."""

import enum


class UserRole(str, enum.Enum):
    """Application user roles."""

    customer = "customer"
    vendor = "vendor"
    driver = "driver"
    admin = "admin"


class BookingStatus(str, enum.Enum):
    """Lifecycle states for a booking."""

    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"


class VehicleApprovalStatus(str, enum.Enum):
    """Admin review states for a vehicle listing."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AvailabilityStatus(str, enum.Enum):
    """Vehicle calendar status for a date range."""

    available = "available"
    unavailable = "unavailable"
    maintenance = "maintenance"
    booked = "booked"


class PaymentStatus(str, enum.Enum):
    """Lifecycle states for a payment."""

    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class RefundStatus(str, enum.Enum):
    """Lifecycle states for a refund request."""

    pending = "pending"
    approved = "approved"
    completed = "completed"
    rejected = "rejected"


class LedgerStatus(str, enum.Enum):
    """Lifecycle states for an earnings ledger entry."""

    pending = "pending"
    available = "available"
    paid = "paid"


class PayoutStatus(str, enum.Enum):
    """Lifecycle states for a vendor payout request."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class AddOnPricingType(str, enum.Enum):
    """How an add-on's price is applied to a booking."""

    fixed = "fixed"
    per_day = "per_day"


class NotificationType(str, enum.Enum):
    """Categories of in-app notifications."""

    booking_created = "booking_created"
    booking_confirmed = "booking_confirmed"
    booking_rejected = "booking_rejected"
    booking_cancelled = "booking_cancelled"
    booking_completed = "booking_completed"
    booking_rescheduled = "booking_rescheduled"
    vehicle_approved = "vehicle_approved"
    vehicle_rejected = "vehicle_rejected"
    review_received = "review_received"
    system = "system"
