"""Tests for the Advanced Analytics module."""

from datetime import datetime, timedelta, timezone

from tests.conftest import (
    complete_booking,
    create_approved_vehicle,
    create_confirmed_booking,
    pay_booking,
)


def _utc_today():
    """Server timestamps (paid_at, created_at) are stored in UTC; filter using that date."""
    return datetime.now(timezone.utc).date()

ADMIN_ENDPOINTS = [
    "/analytics/admin/overview",
    "/analytics/admin/revenue",
    "/analytics/admin/bookings",
    "/analytics/admin/top-vehicles",
    "/analytics/admin/top-vendors",
]

VENDOR_ENDPOINTS = [
    "/analytics/vendor/overview",
    "/analytics/vendor/revenue",
    "/analytics/vendor/bookings",
    "/analytics/vendor/top-vehicles",
]


def _earn(client, customer, vendor, admin, price_per_day=10000.0, complete=True):
    """Create an approved vehicle, a confirmed+paid booking, and optionally complete it."""
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)
    pay_booking(client, customer, booking_id)
    if complete:
        complete_booking(client, vendor, booking_id)
    return vehicle_id, booking_id


# ---- authorization ----------------------------------------------------------


def test_admin_endpoints_require_admin_role(client, vendor, customer):
    for path in ADMIN_ENDPOINTS:
        assert client.get(path, headers=vendor["headers"]).status_code == 403
        assert client.get(path, headers=customer["headers"]).status_code == 403


def test_admin_endpoints_accessible_by_admin(client, admin):
    for path in ADMIN_ENDPOINTS:
        resp = client.get(path, headers=admin["headers"])
        assert resp.status_code == 200, f"{path}: {resp.text}"


def test_vendor_endpoints_require_vendor_role(client, admin, customer):
    for path in VENDOR_ENDPOINTS:
        assert client.get(path, headers=admin["headers"]).status_code == 403
        assert client.get(path, headers=customer["headers"]).status_code == 403


def test_vendor_endpoints_accessible_by_vendor(client, vendor):
    for path in VENDOR_ENDPOINTS:
        resp = client.get(path, headers=vendor["headers"])
        assert resp.status_code == 200, f"{path}: {resp.text}"


def test_customer_cannot_access_any_analytics_endpoint(client, customer):
    for path in ADMIN_ENDPOINTS + VENDOR_ENDPOINTS:
        assert client.get(path, headers=customer["headers"]).status_code == 403


# ---- vendor data isolation ---------------------------------------------------


def test_vendor_cannot_see_another_vendors_data(client, customer, vendor, admin):
    """Vendor A's analytics must reflect only vendor A's vehicles/bookings/revenue."""
    other_vendor = signup_other_vendor(client)

    _earn(client, customer, vendor, admin, price_per_day=10000.0)
    _earn(client, customer, other_vendor, admin, price_per_day=99999.0)

    overview = client.get("/analytics/vendor/overview", headers=vendor["headers"]).json()
    assert overview["total_vehicles"] == 1
    assert overview["total_bookings"] == 1
    assert overview["total_revenue"] == 10000.0

    revenue = client.get("/analytics/vendor/revenue", headers=vendor["headers"]).json()
    assert revenue["total_revenue"] == 10000.0

    top_vehicles = client.get(
        "/analytics/vendor/top-vehicles", headers=vendor["headers"]
    ).json()
    assert len(top_vehicles) == 1
    assert top_vehicles[0]["total_revenue"] == 10000.0


def signup_other_vendor(client):
    from tests.conftest import signup_and_login

    return signup_and_login(client, "vendor")


# ---- empty database -----------------------------------------------------------


def test_admin_overview_empty_database_returns_zero_values(client, admin):
    resp = client.get("/analytics/admin/overview", headers=admin["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_vehicles"] == 0
    assert body["total_bookings"] == 0
    assert body["total_revenue"] == 0.0
    assert body["bookings_by_status"] == {
        "pending": 0,
        "confirmed": 0,
        "completed": 0,
        "cancelled": 0,
    }
    assert body["average_rating"] is None
    assert body["earnings_summary"] == {
        "total_platform_commission": 0.0,
        "total_vendor_earnings": 0.0,
        "total_paid_out": 0.0,
        "pending_payout_amount": 0.0,
    }


def test_vendor_overview_empty_database_returns_zero_values(client, vendor):
    resp = client.get("/analytics/vendor/overview", headers=vendor["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_vehicles"] == 0
    assert body["total_bookings"] == 0
    assert body["total_revenue"] == 0.0
    assert body["average_rating"] is None
    assert body["earnings_summary"] == {
        "available_balance": 0.0,
        "pending_balance": 0.0,
        "total_earned": 0.0,
        "total_withdrawn": 0.0,
    }


def test_admin_top_vehicles_and_top_vendors_empty(client, admin):
    assert client.get("/analytics/admin/top-vehicles", headers=admin["headers"]).json() == []
    assert client.get("/analytics/admin/top-vendors", headers=admin["headers"]).json() == []


# ---- date filters --------------------------------------------------------------


def test_date_filter_excludes_data_outside_range(client, customer, vendor, admin):
    _earn(client, customer, vendor, admin, price_per_day=10000.0)

    tomorrow = (_utc_today() + timedelta(days=1)).isoformat()
    future_resp = client.get(
        "/analytics/admin/revenue",
        headers=admin["headers"],
        params={"start_date": tomorrow},
    )
    assert future_resp.status_code == 200
    assert future_resp.json()["total_revenue"] == 0.0

    bookings_resp = client.get(
        "/analytics/admin/bookings",
        headers=admin["headers"],
        params={"start_date": tomorrow},
    )
    assert bookings_resp.json()["total_bookings"] == 0


def test_date_filter_includes_data_inside_range(client, customer, vendor, admin):
    _earn(client, customer, vendor, admin, price_per_day=10000.0)

    today = _utc_today().isoformat()
    resp = client.get(
        "/analytics/admin/revenue",
        headers=admin["headers"],
        params={"start_date": today, "end_date": today},
    )
    assert resp.status_code == 200
    assert resp.json()["total_revenue"] == 10000.0


# ---- top vehicles response ------------------------------------------------------


def test_top_vehicles_response_ranked_by_revenue(client, customer, vendor, admin):
    vehicle_a = create_approved_vehicle(client, vendor, admin, price_per_day=5000.0)
    booking_a = create_confirmed_booking(client, customer, vendor, vehicle_a)
    pay_booking(client, customer, booking_a)

    vehicle_b = create_approved_vehicle(client, vendor, admin, price_per_day=20000.0)
    booking_b = create_confirmed_booking(client, customer, vendor, vehicle_b)
    pay_booking(client, customer, booking_b)

    resp = client.get("/analytics/admin/top-vehicles", headers=admin["headers"])
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) == 2
    assert entries[0]["vehicle_id"] == vehicle_b
    assert entries[0]["total_revenue"] == 20000.0
    assert entries[0]["total_bookings"] == 1
    assert entries[1]["vehicle_id"] == vehicle_a
    assert entries[1]["total_revenue"] == 5000.0


def test_vendor_top_vehicles_respects_limit(client, customer, vendor, admin):
    for price in (1000.0, 2000.0, 3000.0):
        vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=price)
        booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)
        pay_booking(client, customer, booking_id)

    resp = client.get(
        "/analytics/vendor/top-vehicles",
        headers=vendor["headers"],
        params={"limit": 2},
    )
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) == 2
    assert entries[0]["total_revenue"] == 3000.0
    assert entries[1]["total_revenue"] == 2000.0


# ---- revenue calculations --------------------------------------------------------


def test_admin_revenue_sums_all_paid_payments(client, customer, vendor, admin):
    _earn(client, customer, vendor, admin, price_per_day=10000.0, complete=False)

    other_vendor = signup_other_vendor(client)
    _earn(client, customer, other_vendor, admin, price_per_day=5000.0, complete=False)

    resp = client.get("/analytics/admin/revenue", headers=admin["headers"])
    assert resp.status_code == 200
    assert resp.json()["total_revenue"] == 15000.0


def test_admin_overview_revenue_matches_completed_and_pending_earnings(
    client, customer, vendor, admin
):
    """Revenue counts every paid payment regardless of booking completion state."""
    _earn(client, customer, vendor, admin, price_per_day=10000.0, complete=True)

    overview = client.get("/analytics/admin/overview", headers=admin["headers"]).json()
    assert overview["total_revenue"] == 10000.0
    assert overview["bookings_by_status"]["completed"] == 1
    assert overview["earnings_summary"]["total_vendor_earnings"] == 9000.0
    assert overview["earnings_summary"]["total_platform_commission"] == 1000.0


def test_vendor_revenue_matches_own_payments_only(client, customer, vendor, admin):
    _earn(client, customer, vendor, admin, price_per_day=7000.0, complete=False)

    resp = client.get("/analytics/vendor/revenue", headers=vendor["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_revenue"] == 7000.0
    assert len(body["monthly_revenue"]) == 1
    assert body["monthly_revenue"][0]["revenue"] == 7000.0
