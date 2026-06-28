"""Dashboard statistics response schemas."""

from pydantic import BaseModel


class AdminDashboardStats(BaseModel):
    """Platform-wide statistics for admins."""

    total_users: int
    total_customers: int
    total_vendors: int
    total_vehicles: int
    approved_vehicles: int
    pending_vehicles: int
    total_bookings: int
    total_revenue: float


class VendorDashboardStats(BaseModel):
    """Statistics scoped to a single vendor."""

    total_vehicles: int
    approved_vehicles: int
    pending_vehicles: int
    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    total_revenue: float


class CustomerDashboardStats(BaseModel):
    """Statistics scoped to a single customer."""

    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    total_spent: float
