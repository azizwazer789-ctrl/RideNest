"""Analytics response schemas for admin and vendor reporting endpoints."""

from pydantic import BaseModel


class BookingStatusCounts(BaseModel):
    """Booking counts broken down by lifecycle status."""

    pending: int
    confirmed: int
    completed: int
    cancelled: int


class MonthlyRevenuePoint(BaseModel):
    """A single month's revenue figure in a trend series."""

    month: str
    revenue: float


class MonthlyBookingPoint(BaseModel):
    """A single month's booking count in a trend series."""

    month: str
    bookings: int


class TopVehicleEntry(BaseModel):
    """A vehicle ranked by booking count and revenue."""

    vehicle_id: int
    title: str
    total_bookings: int
    total_revenue: float


class TopVendorEntry(BaseModel):
    """A vendor ranked by booking count and revenue."""

    vendor_id: int
    vendor_name: str
    total_bookings: int
    total_revenue: float


class PlatformEarningsSummary(BaseModel):
    """Platform-wide commission, vendor earnings, and payout totals."""

    total_platform_commission: float
    total_vendor_earnings: float
    total_paid_out: float
    pending_payout_amount: float


class VendorEarningsSummary(BaseModel):
    """A vendor's own wallet summary."""

    available_balance: float
    pending_balance: float
    total_earned: float
    total_withdrawn: float


class AdminOverviewResponse(BaseModel):
    """Platform-wide snapshot for the admin analytics dashboard."""

    total_users: int
    total_vendors: int
    total_customers: int
    total_vehicles: int
    total_bookings: int
    total_revenue: float
    bookings_by_status: BookingStatusCounts
    average_rating: float | None
    earnings_summary: PlatformEarningsSummary


class AdminRevenueResponse(BaseModel):
    """Platform-wide revenue total and monthly trend."""

    total_revenue: float
    monthly_revenue: list[MonthlyRevenuePoint]


class AdminBookingsResponse(BaseModel):
    """Platform-wide booking totals, status breakdown, and monthly trend."""

    total_bookings: int
    bookings_by_status: BookingStatusCounts
    monthly_bookings: list[MonthlyBookingPoint]


class VendorOverviewResponse(BaseModel):
    """Snapshot scoped to the authenticated vendor's own data."""

    total_vehicles: int
    total_bookings: int
    total_revenue: float
    bookings_by_status: BookingStatusCounts
    average_rating: float | None
    earnings_summary: VendorEarningsSummary


class VendorRevenueResponse(BaseModel):
    """Revenue total and monthly trend scoped to the authenticated vendor."""

    total_revenue: float
    monthly_revenue: list[MonthlyRevenuePoint]


class VendorBookingsResponse(BaseModel):
    """Booking totals, status breakdown, and monthly trend for the authenticated vendor."""

    total_bookings: int
    bookings_by_status: BookingStatusCounts
    monthly_bookings: list[MonthlyBookingPoint]
