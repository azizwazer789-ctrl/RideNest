"""Admin and vendor analytics aggregation logic.

Monthly trends are bucketed in Python after fetching the relevant
date/value pairs, rather than with database-specific date-truncation
functions, so the same code runs unmodified against both the SQLite test
database and the production Postgres database.

Booking-based figures (totals, status breakdown, booking trend) are dated
by Booking.created_at; revenue figures are dated by Payment.paid_at, since
that is when the money was actually collected.
"""

from collections import defaultdict
from datetime import date

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from core.enums import BookingStatus, PaymentStatus, PayoutStatus, UserRole
from models.booking import Booking
from models.earnings_ledger import EarningsLedger
from models.payment import Payment
from models.review import Review
from models.user import User
from models.vehicle import Vehicle
from models.vendor_payout import VendorPayout
from schemas.analytics import (
    AdminBookingsResponse,
    AdminOverviewResponse,
    AdminRevenueResponse,
    BookingStatusCounts,
    MonthlyBookingPoint,
    MonthlyRevenuePoint,
    PlatformEarningsSummary,
    TopVehicleEntry,
    TopVendorEntry,
    VendorBookingsResponse,
    VendorEarningsSummary,
    VendorOverviewResponse,
    VendorRevenueResponse,
)
from services.vendor_wallet import VendorWalletService

DEFAULT_TOP_LIMIT = 5
TRACKED_BOOKING_STATUSES = (
    BookingStatus.pending,
    BookingStatus.confirmed,
    BookingStatus.completed,
    BookingStatus.cancelled,
)


def _date_filtered(query, column, start_date: date | None, end_date: date | None):
    """Apply optional inclusive start/end date filters to a date/datetime column."""
    if start_date is not None:
        query = query.filter(func.date(column) >= start_date.isoformat())
    if end_date is not None:
        query = query.filter(func.date(column) <= end_date.isoformat())
    return query


def _monthly_buckets(rows) -> dict[str, float]:
    """Group (datetime, value) rows by "YYYY-MM" and sum the values."""
    buckets: dict[str, float] = defaultdict(float)
    for when, value in rows:
        if when is None:
            continue
        buckets[when.strftime("%Y-%m")] += value
    return dict(sorted(buckets.items()))


class AnalyticsService:
    """Encapsulates admin/vendor analytics aggregation queries."""

    def __init__(self, db: Session):
        self.db = db

    # ---- shared scoped base queries ---------------------------------------

    def _bookings_query(self, vendor_id: int | None, start_date, end_date):
        query = self.db.query(Booking)
        if vendor_id is not None:
            query = query.join(Vehicle, Booking.vehicle_id == Vehicle.id).filter(
                Vehicle.vendor_id == vendor_id
            )
        return _date_filtered(query, Booking.created_at, start_date, end_date)

    def _paid_payments_query(self, vendor_id: int | None, start_date, end_date):
        query = (
            self.db.query(Payment)
            .join(Booking, Payment.booking_id == Booking.id)
            .filter(Payment.payment_status == PaymentStatus.paid.value)
        )
        if vendor_id is not None:
            query = query.join(Vehicle, Booking.vehicle_id == Vehicle.id).filter(
                Vehicle.vendor_id == vendor_id
            )
        return _date_filtered(query, Payment.paid_at, start_date, end_date)

    def _reviews_query(self, vendor_id: int | None, start_date, end_date):
        query = self.db.query(Review)
        if vendor_id is not None:
            query = query.filter(Review.vendor_id == vendor_id)
        return _date_filtered(query, Review.created_at, start_date, end_date)

    # ---- shared aggregate computations -------------------------------------

    def _booking_status_counts(self, vendor_id, start_date, end_date) -> BookingStatusCounts:
        counts = {status.value: 0 for status in TRACKED_BOOKING_STATUSES}
        rows = (
            self._bookings_query(vendor_id, start_date, end_date)
            .with_entities(Booking.booking_status, func.count(Booking.id))
            .group_by(Booking.booking_status)
            .all()
        )
        for status_value, count in rows:
            if status_value in counts:
                counts[status_value] = count
        return BookingStatusCounts(**counts)

    def _total_revenue(self, vendor_id, start_date, end_date) -> float:
        total = (
            self._paid_payments_query(vendor_id, start_date, end_date)
            .with_entities(func.coalesce(func.sum(Payment.amount), 0.0))
            .scalar()
        )
        return float(total)

    def _average_rating(self, vendor_id, start_date, end_date) -> float | None:
        avg = (
            self._reviews_query(vendor_id, start_date, end_date)
            .with_entities(func.avg(Review.rating))
            .scalar()
        )
        return round(float(avg), 2) if avg is not None else None

    def _monthly_revenue(self, vendor_id, start_date, end_date) -> list[MonthlyRevenuePoint]:
        rows = (
            self._paid_payments_query(vendor_id, start_date, end_date)
            .with_entities(Payment.paid_at, Payment.amount)
            .all()
        )
        return [
            MonthlyRevenuePoint(month=month, revenue=round(revenue, 2))
            for month, revenue in _monthly_buckets(rows).items()
        ]

    def _monthly_bookings(self, vendor_id, start_date, end_date) -> list[MonthlyBookingPoint]:
        timestamps = (
            self._bookings_query(vendor_id, start_date, end_date)
            .with_entities(Booking.created_at)
            .all()
        )
        rows = [(created_at, 1) for (created_at,) in timestamps]
        return [
            MonthlyBookingPoint(month=month, bookings=int(count))
            for month, count in _monthly_buckets(rows).items()
        ]

    def _top_vehicles(self, vendor_id, start_date, end_date, limit) -> list[TopVehicleEntry]:
        query = (
            self.db.query(
                Vehicle.id,
                Vehicle.title,
                func.count(Booking.id),
                func.coalesce(func.sum(Payment.amount), 0.0),
            )
            .join(Booking, Booking.vehicle_id == Vehicle.id)
            .outerjoin(
                Payment,
                and_(
                    Payment.booking_id == Booking.id,
                    Payment.payment_status == PaymentStatus.paid.value,
                ),
            )
        )
        if vendor_id is not None:
            query = query.filter(Vehicle.vendor_id == vendor_id)
        query = _date_filtered(query, Booking.created_at, start_date, end_date)
        query = (
            query.group_by(Vehicle.id, Vehicle.title)
            .order_by(func.coalesce(func.sum(Payment.amount), 0.0).desc())
            .limit(limit)
        )

        return [
            TopVehicleEntry(
                vehicle_id=vehicle_id,
                title=title,
                total_bookings=int(total_bookings),
                total_revenue=float(total_revenue),
            )
            for vehicle_id, title, total_bookings, total_revenue in query.all()
        ]

    def _top_vendors(self, start_date, end_date, limit) -> list[TopVendorEntry]:
        query = (
            self.db.query(
                User.id,
                User.full_name,
                func.count(Booking.id),
                func.coalesce(func.sum(Payment.amount), 0.0),
            )
            .join(Vehicle, Vehicle.vendor_id == User.id)
            .join(Booking, Booking.vehicle_id == Vehicle.id)
            .outerjoin(
                Payment,
                and_(
                    Payment.booking_id == Booking.id,
                    Payment.payment_status == PaymentStatus.paid.value,
                ),
            )
        )
        query = _date_filtered(query, Booking.created_at, start_date, end_date)
        query = (
            query.group_by(User.id, User.full_name)
            .order_by(func.coalesce(func.sum(Payment.amount), 0.0).desc())
            .limit(limit)
        )

        return [
            TopVendorEntry(
                vendor_id=vendor_id,
                vendor_name=full_name,
                total_bookings=int(total_bookings),
                total_revenue=float(total_revenue),
            )
            for vendor_id, full_name, total_bookings, total_revenue in query.all()
        ]

    def _platform_earnings_summary(self, start_date, end_date) -> PlatformEarningsSummary:
        ledger_query = _date_filtered(
            self.db.query(EarningsLedger), EarningsLedger.created_at, start_date, end_date
        )
        total_commission = float(
            ledger_query.with_entities(
                func.coalesce(func.sum(EarningsLedger.platform_commission), 0.0)
            ).scalar()
        )
        total_vendor_earnings = float(
            ledger_query.with_entities(
                func.coalesce(func.sum(EarningsLedger.vendor_amount), 0.0)
            ).scalar()
        )

        paid_out_query = _date_filtered(
            self.db.query(VendorPayout).filter(
                VendorPayout.payout_status == PayoutStatus.completed.value
            ),
            VendorPayout.processed_at,
            start_date,
            end_date,
        )
        total_paid_out = float(
            paid_out_query.with_entities(
                func.coalesce(func.sum(VendorPayout.amount), 0.0)
            ).scalar()
        )

        pending_query = _date_filtered(
            self.db.query(VendorPayout).filter(
                VendorPayout.payout_status.in_(
                    (PayoutStatus.pending.value, PayoutStatus.approved.value)
                )
            ),
            VendorPayout.requested_at,
            start_date,
            end_date,
        )
        pending_amount = float(
            pending_query.with_entities(
                func.coalesce(func.sum(VendorPayout.amount), 0.0)
            ).scalar()
        )

        return PlatformEarningsSummary(
            total_platform_commission=round(total_commission, 2),
            total_vendor_earnings=round(total_vendor_earnings, 2),
            total_paid_out=round(total_paid_out, 2),
            pending_payout_amount=round(pending_amount, 2),
        )

    def _vendor_earnings_summary(self, vendor_id: int) -> VendorEarningsSummary:
        wallet = VendorWalletService(self.db).get_or_create(vendor_id)
        return VendorEarningsSummary(
            available_balance=wallet.available_balance,
            pending_balance=wallet.pending_balance,
            total_earned=wallet.total_earned,
            total_withdrawn=wallet.total_withdrawn,
        )

    # ---- admin endpoints ----------------------------------------------------

    def admin_overview(
        self, start_date: date | None = None, end_date: date | None = None
    ) -> AdminOverviewResponse:
        """Platform-wide analytics snapshot."""
        return AdminOverviewResponse(
            total_users=self.db.query(User).count(),
            total_vendors=self.db.query(User)
            .filter(User.role == UserRole.vendor.value)
            .count(),
            total_customers=self.db.query(User)
            .filter(User.role == UserRole.customer.value)
            .count(),
            total_vehicles=self.db.query(Vehicle).count(),
            total_bookings=self._bookings_query(None, start_date, end_date).count(),
            total_revenue=self._total_revenue(None, start_date, end_date),
            bookings_by_status=self._booking_status_counts(None, start_date, end_date),
            average_rating=self._average_rating(None, start_date, end_date),
            earnings_summary=self._platform_earnings_summary(start_date, end_date),
        )

    def admin_revenue(
        self, start_date: date | None = None, end_date: date | None = None
    ) -> AdminRevenueResponse:
        """Platform-wide revenue total and monthly trend."""
        return AdminRevenueResponse(
            total_revenue=self._total_revenue(None, start_date, end_date),
            monthly_revenue=self._monthly_revenue(None, start_date, end_date),
        )

    def admin_bookings(
        self, start_date: date | None = None, end_date: date | None = None
    ) -> AdminBookingsResponse:
        """Platform-wide booking totals, status breakdown, and monthly trend."""
        return AdminBookingsResponse(
            total_bookings=self._bookings_query(None, start_date, end_date).count(),
            bookings_by_status=self._booking_status_counts(None, start_date, end_date),
            monthly_bookings=self._monthly_bookings(None, start_date, end_date),
        )

    def admin_top_vehicles(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = DEFAULT_TOP_LIMIT,
    ) -> list[TopVehicleEntry]:
        """Top vehicles platform-wide, ranked by revenue."""
        return self._top_vehicles(None, start_date, end_date, limit)

    def admin_top_vendors(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = DEFAULT_TOP_LIMIT,
    ) -> list[TopVendorEntry]:
        """Top vendors platform-wide, ranked by revenue."""
        return self._top_vendors(start_date, end_date, limit)

    # ---- vendor endpoints (scoped to the authenticated vendor) -------------

    def vendor_overview(
        self,
        vendor_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> VendorOverviewResponse:
        """Analytics snapshot scoped to a single vendor's own data."""
        return VendorOverviewResponse(
            total_vehicles=self.db.query(Vehicle)
            .filter(Vehicle.vendor_id == vendor_id)
            .count(),
            total_bookings=self._bookings_query(vendor_id, start_date, end_date).count(),
            total_revenue=self._total_revenue(vendor_id, start_date, end_date),
            bookings_by_status=self._booking_status_counts(vendor_id, start_date, end_date),
            average_rating=self._average_rating(vendor_id, start_date, end_date),
            earnings_summary=self._vendor_earnings_summary(vendor_id),
        )

    def vendor_revenue(
        self,
        vendor_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> VendorRevenueResponse:
        """Revenue total and monthly trend scoped to a single vendor."""
        return VendorRevenueResponse(
            total_revenue=self._total_revenue(vendor_id, start_date, end_date),
            monthly_revenue=self._monthly_revenue(vendor_id, start_date, end_date),
        )

    def vendor_bookings(
        self,
        vendor_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> VendorBookingsResponse:
        """Booking totals, status breakdown, and monthly trend scoped to a single vendor."""
        return VendorBookingsResponse(
            total_bookings=self._bookings_query(vendor_id, start_date, end_date).count(),
            bookings_by_status=self._booking_status_counts(vendor_id, start_date, end_date),
            monthly_bookings=self._monthly_bookings(vendor_id, start_date, end_date),
        )

    def vendor_top_vehicles(
        self,
        vendor_id: int,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = DEFAULT_TOP_LIMIT,
    ) -> list[TopVehicleEntry]:
        """Top vehicles owned by a single vendor, ranked by revenue."""
        return self._top_vehicles(vendor_id, start_date, end_date, limit)
