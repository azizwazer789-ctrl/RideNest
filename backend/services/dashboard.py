"""Dashboard statistics aggregation for admin, vendor, and customer roles."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.enums import BookingStatus, UserRole
from models.booking import Booking
from models.user import User
from models.vehicle import Vehicle
from schemas.dashboard import (
    AdminDashboardStats,
    CustomerDashboardStats,
    VendorDashboardStats,
)


class DashboardService:
    """Encapsulates dashboard statistics queries.

    "Revenue" / "total spent" counts only completed bookings, since those are
    the only bookings that represent a finished, paid rental.
    """

    def __init__(self, db: Session):
        self.db = db

    def admin_stats(self) -> AdminDashboardStats:
        """Platform-wide counts and revenue across all users, vehicles, and bookings."""
        total_users = self.db.query(User).count()
        total_customers = (
            self.db.query(User).filter(User.role == UserRole.customer.value).count()
        )
        total_vendors = (
            self.db.query(User).filter(User.role == UserRole.vendor.value).count()
        )
        total_vehicles = self.db.query(Vehicle).count()
        approved_vehicles = (
            self.db.query(Vehicle).filter(Vehicle.is_approved.is_(True)).count()
        )
        pending_vehicles = (
            self.db.query(Vehicle).filter(Vehicle.is_approved.is_(False)).count()
        )
        total_bookings = self.db.query(Booking).count()
        total_revenue = (
            self.db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
            .filter(Booking.booking_status == BookingStatus.completed.value)
            .scalar()
        )

        return AdminDashboardStats(
            total_users=total_users,
            total_customers=total_customers,
            total_vendors=total_vendors,
            total_vehicles=total_vehicles,
            approved_vehicles=approved_vehicles,
            pending_vehicles=pending_vehicles,
            total_bookings=total_bookings,
            total_revenue=float(total_revenue),
        )

    def vendor_stats(self, vendor_id: int) -> VendorDashboardStats:
        """Counts and revenue scoped to vehicles/bookings owned by a vendor."""
        total_vehicles = (
            self.db.query(Vehicle).filter(Vehicle.vendor_id == vendor_id).count()
        )
        approved_vehicles = (
            self.db.query(Vehicle)
            .filter(Vehicle.vendor_id == vendor_id, Vehicle.is_approved.is_(True))
            .count()
        )
        pending_vehicles = (
            self.db.query(Vehicle)
            .filter(Vehicle.vendor_id == vendor_id, Vehicle.is_approved.is_(False))
            .count()
        )

        total_bookings = (
            self.db.query(Booking)
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(Vehicle.vendor_id == vendor_id)
            .count()
        )
        pending_bookings = (
            self.db.query(Booking)
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(
                Vehicle.vendor_id == vendor_id,
                Booking.booking_status == BookingStatus.pending.value,
            )
            .count()
        )
        confirmed_bookings = (
            self.db.query(Booking)
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(
                Vehicle.vendor_id == vendor_id,
                Booking.booking_status == BookingStatus.confirmed.value,
            )
            .count()
        )
        completed_bookings = (
            self.db.query(Booking)
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(
                Vehicle.vendor_id == vendor_id,
                Booking.booking_status == BookingStatus.completed.value,
            )
            .count()
        )
        total_revenue = (
            self.db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
            .join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(
                Vehicle.vendor_id == vendor_id,
                Booking.booking_status == BookingStatus.completed.value,
            )
            .scalar()
        )

        return VendorDashboardStats(
            total_vehicles=total_vehicles,
            approved_vehicles=approved_vehicles,
            pending_vehicles=pending_vehicles,
            total_bookings=total_bookings,
            pending_bookings=pending_bookings,
            confirmed_bookings=confirmed_bookings,
            completed_bookings=completed_bookings,
            total_revenue=float(total_revenue),
        )

    def customer_stats(self, customer_id: int) -> CustomerDashboardStats:
        """Counts and total spend scoped to bookings made by a customer."""
        total_bookings = (
            self.db.query(Booking).filter(Booking.customer_id == customer_id).count()
        )
        pending_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.customer_id == customer_id,
                Booking.booking_status == BookingStatus.pending.value,
            )
            .count()
        )
        confirmed_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.customer_id == customer_id,
                Booking.booking_status == BookingStatus.confirmed.value,
            )
            .count()
        )
        completed_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.customer_id == customer_id,
                Booking.booking_status == BookingStatus.completed.value,
            )
            .count()
        )
        cancelled_bookings = (
            self.db.query(Booking)
            .filter(
                Booking.customer_id == customer_id,
                Booking.booking_status == BookingStatus.cancelled.value,
            )
            .count()
        )
        total_spent = (
            self.db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
            .filter(
                Booking.customer_id == customer_id,
                Booking.booking_status == BookingStatus.completed.value,
            )
            .scalar()
        )

        return CustomerDashboardStats(
            total_bookings=total_bookings,
            pending_bookings=pending_bookings,
            confirmed_bookings=confirmed_bookings,
            completed_bookings=completed_bookings,
            cancelled_bookings=cancelled_bookings,
            total_spent=float(total_spent),
        )
