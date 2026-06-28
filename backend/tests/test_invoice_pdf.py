"""Tests for PDF invoice generation/download."""

import pytest

from tests.conftest import (
    create_approved_vehicle,
    create_confirmed_booking,
    pay_booking,
    signup_and_login,
)


@pytest.fixture(autouse=True)
def _isolate_generated_invoices_dir(tmp_path, monkeypatch):
    """Redirect PDF output to a throwaway directory so tests never touch
    the real project's generated_invoices/ folder."""
    monkeypatch.setattr("services.payment.GENERATED_INVOICES_DIR", tmp_path)


def _get_invoice_id(client, customer, booking_id):
    payment_resp = next(
        p
        for p in client.get("/payments/my", headers=customer["headers"]).json()
        if p["booking_id"] == booking_id
    )
    return payment_resp["invoice"]["id"]


def _setup_paid_booking(client, customer, vendor, admin):
    vehicle_id = create_approved_vehicle(client, vendor, admin)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)
    pay_booking(client, customer, booking_id)
    invoice_id = _get_invoice_id(client, customer, booking_id)
    return invoice_id


def test_download_invoice_pdf_returns_pdf_bytes(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)

    resp = client.get(f"/invoices/{invoice_id}/pdf", headers=customer["headers"])

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:5] == b"%PDF-"
    assert len(resp.content) > 0


def test_pdf_content_disposition_includes_invoice_number(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)
    invoice = client.get(f"/invoices/{invoice_id}", headers=customer["headers"]).json()

    resp = client.get(f"/invoices/{invoice_id}/pdf", headers=customer["headers"])

    assert resp.status_code == 200
    disposition = resp.headers["content-disposition"]
    assert "attachment" in disposition
    assert invoice["invoice_number"] in disposition


def test_pdf_path_is_persisted_after_first_download(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)

    before = client.get(f"/invoices/{invoice_id}", headers=customer["headers"]).json()
    assert before["pdf_path"] is None

    client.get(f"/invoices/{invoice_id}/pdf", headers=customer["headers"])

    after = client.get(f"/invoices/{invoice_id}", headers=customer["headers"]).json()
    assert after["pdf_path"] is not None
    assert after["pdf_path"].endswith(".pdf")


def test_pdf_is_reused_identically_on_second_request(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)

    first = client.get(f"/invoices/{invoice_id}/pdf", headers=customer["headers"])
    second = client.get(f"/invoices/{invoice_id}/pdf", headers=customer["headers"])

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.content == second.content


def test_non_owner_customer_cannot_download_invoice_pdf(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)
    other_customer = signup_and_login(client, "customer")

    resp = client.get(f"/invoices/{invoice_id}/pdf", headers=other_customer["headers"])
    assert resp.status_code == 403


def test_vendor_cannot_download_invoice_pdf(client, customer, vendor, admin):
    invoice_id = _setup_paid_booking(client, customer, vendor, admin)

    resp = client.get(f"/invoices/{invoice_id}/pdf", headers=vendor["headers"])
    assert resp.status_code == 403


def test_download_pdf_for_nonexistent_invoice_returns_404(client, customer):
    resp = client.get("/invoices/999999/pdf", headers=customer["headers"])
    assert resp.status_code == 404
