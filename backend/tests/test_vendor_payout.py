"""Tests for the Vendor Wallet & Payout module."""

from tests.conftest import (
    complete_booking,
    create_approved_vehicle,
    create_confirmed_booking,
    pay_booking,
)


def _earn_via_completed_booking(client, customer, vendor, admin, price_per_day=10000.0):
    """Full happy-path flow: book -> pay -> complete. Returns (booking_id, payment)."""
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)
    payment = pay_booking(client, customer, booking_id)
    complete_booking(client, vendor, booking_id)
    return booking_id, payment


def test_ledger_entry_created_with_correct_amounts_and_pending_balance(
    client, customer, vendor, admin
):
    """Paying a confirmed (not yet completed) booking credits pending_balance."""
    vehicle_id = create_approved_vehicle(client, vendor, admin, price_per_day=10000.0)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)
    pay_booking(client, customer, booking_id)

    wallet_resp = client.get("/wallet", headers=vendor["headers"])
    assert wallet_resp.status_code == 200
    wallet = wallet_resp.json()
    assert wallet["pending_balance"] == 9000.0
    assert wallet["available_balance"] == 0.0
    assert wallet["total_earned"] == 9000.0

    ledger_resp = client.get("/wallet/ledger", headers=vendor["headers"])
    assert ledger_resp.status_code == 200
    ledger = ledger_resp.json()
    assert len(ledger) == 1
    entry = ledger[0]
    assert entry["booking_id"] == booking_id
    assert entry["gross_amount"] == 10000.0
    assert entry["platform_commission"] == 1000.0
    assert entry["vendor_amount"] == 9000.0
    assert entry["status"] == "pending"


def test_completing_booking_moves_pending_balance_to_available(client, customer, vendor, admin):
    """Automatic balance update: completion promotes pending -> available."""
    booking_id, _ = _earn_via_completed_booking(client, customer, vendor, admin)

    wallet = client.get("/wallet", headers=vendor["headers"]).json()
    assert wallet["pending_balance"] == 0.0
    assert wallet["available_balance"] == 9000.0
    assert wallet["total_earned"] == 9000.0

    ledger = client.get("/wallet/ledger", headers=vendor["headers"]).json()
    entry = next(e for e in ledger if e["booking_id"] == booking_id)
    assert entry["status"] == "available"


def test_successful_payout_request(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)

    resp = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 5000.0, "payout_method": "bank_transfer"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["amount"] == 5000.0
    assert body["payout_status"] == "pending"
    assert body["payout_method"] == "bank_transfer"


def test_payout_request_with_insufficient_balance_is_rejected(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)

    resp = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 50000.0, "payout_method": "bank_transfer"},
    )
    assert resp.status_code == 400
    assert "exceeds available balance" in resp.json()["detail"]


def test_duplicate_active_payout_request_is_prevented(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)

    first = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    )
    assert first.status_code == 201

    second = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    )
    assert second.status_code == 409


def test_new_payout_request_allowed_after_prior_one_rejected(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)

    first = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    ).json()

    reject_resp = client.patch(
        f"/admin/payouts/{first['id']}/reject", headers=admin["headers"]
    )
    assert reject_resp.status_code == 200

    second = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    )
    assert second.status_code == 201


def test_vendor_wallet_endpoints_require_vendor_role(client, customer):
    """Authorization: a customer cannot access vendor-only wallet endpoints."""
    resp = client.get("/wallet", headers=customer["headers"])
    assert resp.status_code == 403

    resp = client.post(
        "/wallet/payout-request",
        headers=customer["headers"],
        json={"amount": 100.0, "payout_method": "bank_transfer"},
    )
    assert resp.status_code == 403


def test_admin_payout_endpoints_require_admin_role(client, customer, vendor, admin):
    """Authorization: a vendor cannot access admin-only payout endpoints."""
    _earn_via_completed_booking(client, customer, vendor, admin)
    payout = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    ).json()

    list_resp = client.get("/admin/payouts", headers=vendor["headers"])
    assert list_resp.status_code == 403

    approve_resp = client.patch(
        f"/admin/payouts/{payout['id']}/approve", headers=vendor["headers"]
    )
    assert approve_resp.status_code == 403


def test_admin_approval_workflow(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)
    payout = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 5000.0, "payout_method": "bank_transfer"},
    ).json()

    approve_resp = client.patch(
        f"/admin/payouts/{payout['id']}/approve", headers=admin["headers"]
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["payout_status"] == "approved"
    assert approve_resp.json()["processed_at"] is not None

    double_approve = client.patch(
        f"/admin/payouts/{payout['id']}/approve", headers=admin["headers"]
    )
    assert double_approve.status_code == 400


def test_admin_rejection_leaves_balance_untouched(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)
    payout = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 5000.0, "payout_method": "bank_transfer"},
    ).json()

    reject_resp = client.patch(
        f"/admin/payouts/{payout['id']}/reject", headers=admin["headers"]
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["payout_status"] == "rejected"

    wallet = client.get("/wallet", headers=vendor["headers"]).json()
    assert wallet["available_balance"] == 9000.0
    assert wallet["total_withdrawn"] == 0.0


def test_payout_completion_deducts_available_balance_and_increases_total_withdrawn(
    client, customer, vendor, admin
):
    _earn_via_completed_booking(client, customer, vendor, admin)
    payout = client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 5000.0, "payout_method": "bank_transfer"},
    ).json()

    client.patch(f"/admin/payouts/{payout['id']}/approve", headers=admin["headers"])

    complete_resp = client.patch(
        f"/admin/payouts/{payout['id']}/complete", headers=admin["headers"]
    )
    assert complete_resp.status_code == 200
    completed = complete_resp.json()
    assert completed["payout_status"] == "completed"
    assert completed["reference"] is not None

    wallet = client.get("/wallet", headers=vendor["headers"]).json()
    assert wallet["available_balance"] == 4000.0
    assert wallet["total_withdrawn"] == 5000.0
    assert wallet["total_earned"] == 9000.0

    cannot_complete_again = client.patch(
        f"/admin/payouts/{payout['id']}/complete", headers=admin["headers"]
    )
    assert cannot_complete_again.status_code == 400


def test_vendor_can_list_own_payouts_and_admin_can_list_all(client, customer, vendor, admin):
    _earn_via_completed_booking(client, customer, vendor, admin)
    client.post(
        "/wallet/payout-request",
        headers=vendor["headers"],
        json={"amount": 1000.0, "payout_method": "bank_transfer"},
    )

    vendor_list = client.get("/wallet/payouts", headers=vendor["headers"])
    assert vendor_list.status_code == 200
    assert len(vendor_list.json()) == 1

    admin_list = client.get("/admin/payouts", headers=admin["headers"])
    assert admin_list.status_code == 200
    assert len(admin_list.json()) == 1
