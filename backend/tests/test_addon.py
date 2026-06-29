"""Tests for the Booking Add-ons module: admin CRUD and booking cost calculation."""

from datetime import date, timedelta

from tests.conftest import create_approved_vehicle


def _create_addon(client, admin, **overrides):
    payload = {
        "name": "GPS Device",
        "description": "In-car GPS navigation unit.",
        "price": 500.0,
        "pricing_type": "fixed",
        "is_active": True,
    }
    payload.update(overrides)
    resp = client.post("/addons", headers=admin["headers"], json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _book(client, customer, vehicle_id, days=1, addon_ids=None, **overrides):
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=days - 1)
    payload = {
        "vehicle_id": vehicle_id,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "pickup_location": "Airport",
        "dropoff_location": "Airport",
        "addon_ids": addon_ids or [],
    }
    payload.update(overrides)
    return client.post("/bookings/", headers=customer["headers"], json=payload)


# --- Admin CRUD -------------------------------------------------------------


def test_admin_can_create_addon(client, admin):
    addon = _create_addon(client, admin, name="Driver Service", price=2000.0, pricing_type="per_day")
    assert addon["name"] == "Driver Service"
    assert addon["pricing_type"] == "per_day"
    assert addon["is_active"] is True


def test_non_admin_cannot_create_addon(client, customer, vendor):
    payload = {
        "name": "Insurance",
        "description": "Basic coverage.",
        "price": 1000.0,
        "pricing_type": "fixed",
    }
    assert client.post("/addons", headers=customer["headers"], json=payload).status_code == 403
    assert client.post("/addons", headers=vendor["headers"], json=payload).status_code == 403


def test_public_list_only_returns_active_addons(client, admin):
    active = _create_addon(client, admin, name="Child Seat", price=300.0)
    inactive = _create_addon(client, admin, name="Extra Mileage Package", price=10.0, is_active=False)

    public_list = client.get("/addons")
    assert public_list.status_code == 200
    ids = [a["id"] for a in public_list.json()]
    assert active["id"] in ids
    assert inactive["id"] not in ids


def test_admin_list_includes_inactive_addons(client, admin):
    inactive = _create_addon(client, admin, name="Inactive Addon", price=10.0, is_active=False)

    admin_list = client.get("/addons/admin/all", headers=admin["headers"])
    assert admin_list.status_code == 200
    ids = [a["id"] for a in admin_list.json()]
    assert inactive["id"] in ids

    forbidden = client.get("/addons/admin/all", headers={})
    assert forbidden.status_code == 401


def test_admin_can_update_addon(client, admin):
    addon = _create_addon(client, admin, price=500.0)

    resp = client.put(
        f"/addons/{addon['id']}", headers=admin["headers"], json={"price": 750.0}
    )
    assert resp.status_code == 200
    assert resp.json()["price"] == 750.0
    assert resp.json()["name"] == addon["name"]


def test_admin_can_toggle_addon_active_state(client, admin):
    addon = _create_addon(client, admin, is_active=True)

    toggled = client.patch(f"/addons/{addon['id']}/toggle", headers=admin["headers"])
    assert toggled.status_code == 200
    assert toggled.json()["is_active"] is False

    toggled_again = client.patch(f"/addons/{addon['id']}/toggle", headers=admin["headers"])
    assert toggled_again.json()["is_active"] is True


def test_admin_can_delete_unused_addon(client, admin):
    addon = _create_addon(client, admin)

    resp = client.delete(f"/addons/{addon['id']}", headers=admin["headers"])
    assert resp.status_code == 204

    assert client.get(f"/addons/{addon['id']}").status_code == 404


def test_cannot_delete_addon_used_in_booking(client, customer, vendor, admin):
    addon = _create_addon(client, admin)
    vehicle_id = create_approved_vehicle(client, vendor, admin)
    booking_resp = _book(client, customer, vehicle_id, addon_ids=[addon["id"]])
    assert booking_resp.status_code == 201, booking_resp.text

    resp = client.delete(f"/addons/{addon['id']}", headers=admin["headers"])
    assert resp.status_code == 409
    assert "disable" in resp.json()["detail"].lower()


# --- Booking cost calculation ----------------------------------------------


def test_booking_without_addons_has_no_addons_and_vehicle_total_equals_total(
    client, customer, vendor, admin
):
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=10000.0)

    resp = _book(client, customer, vehicle_id, days=2)
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert body["addons"] == []
    assert body["total_price"] == 20000.0
    assert body["vehicle_total"] == 20000.0


def test_booking_with_fixed_addon_adds_flat_cost_once(client, customer, vendor, admin):
    addon = _create_addon(client, admin, name="GPS Device", price=500.0, pricing_type="fixed")
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=10000.0)

    resp = _book(client, customer, vehicle_id, days=3, addon_ids=[addon["id"]])
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert body["vehicle_total"] == 30000.0
    assert len(body["addons"]) == 1
    assert body["addons"][0]["total_price"] == 500.0
    assert body["total_price"] == 30500.0


def test_booking_with_per_day_addon_scales_with_duration(client, customer, vendor, admin):
    addon = _create_addon(
        client, admin, name="Driver Service", price=2000.0, pricing_type="per_day"
    )
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=10000.0)

    resp = _book(client, customer, vehicle_id, days=3, addon_ids=[addon["id"]])
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert body["vehicle_total"] == 30000.0
    assert body["addons"][0]["total_price"] == 6000.0
    assert body["total_price"] == 36000.0


def test_booking_with_multiple_addons_sums_all_costs(client, customer, vendor, admin):
    fixed_addon = _create_addon(
        client, admin, name="Insurance", price=1500.0, pricing_type="fixed"
    )
    per_day_addon = _create_addon(
        client, admin, name="Child Seat", price=200.0, pricing_type="per_day"
    )
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=5000.0)

    resp = _book(
        client, customer, vehicle_id, days=4, addon_ids=[fixed_addon["id"], per_day_addon["id"]]
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert body["vehicle_total"] == 20000.0
    assert len(body["addons"]) == 2
    assert body["total_price"] == 20000.0 + 1500.0 + 800.0


def test_booking_rejects_inactive_addon_id(client, customer, vendor, admin):
    addon = _create_addon(client, admin, is_active=False)
    vehicle_id = create_approved_vehicle(client, vendor, admin)

    resp = _book(client, customer, vehicle_id, addon_ids=[addon["id"]])
    assert resp.status_code == 400
    assert "not found or inactive" in resp.json()["detail"]


def test_booking_rejects_unknown_addon_id(client, customer, vendor, admin):
    vehicle_id = create_approved_vehicle(client, vendor, admin)

    resp = _book(client, customer, vehicle_id, addon_ids=[999999])
    assert resp.status_code == 400
    assert "not found or inactive" in resp.json()["detail"]


def test_reschedule_rescales_per_day_addon_cost_to_new_duration(
    client, customer, vendor, admin
):
    addon = _create_addon(
        client, admin, name="Driver Service", price=1000.0, pricing_type="per_day"
    )
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=5000.0)

    created = _book(client, customer, vehicle_id, days=2, addon_ids=[addon["id"]]).json()
    assert created["total_price"] == 10000.0 + 2000.0

    new_start = date.today() + timedelta(days=10)
    new_end = new_start + timedelta(days=3)  # 4-day range
    resp = client.patch(
        f"/bookings/{created['id']}/reschedule",
        headers=customer["headers"],
        json={"start_date": new_start.isoformat(), "end_date": new_end.isoformat()},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["vehicle_total"] == 20000.0
    assert body["addons"][0]["total_price"] == 4000.0
    assert body["total_price"] == 24000.0
