"""Tests for the Customer <-> Vendor Messaging module."""

from tests.conftest import (
    create_approved_vehicle,
    create_confirmed_booking,
    signup_and_login,
)


def _start_conversation(client, customer, vendor, booking_id=None):
    payload = {"vendor_id": vendor["user"]["id"]}
    if booking_id is not None:
        payload["booking_id"] = booking_id
    resp = client.post("/conversations", headers=customer["headers"], json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---- conversation creation ----------------------------------------------------


def test_conversation_creation_without_booking(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    assert conversation["customer_id"] == customer["user"]["id"]
    assert conversation["vendor_id"] == vendor["user"]["id"]
    assert conversation["booking_id"] is None
    assert conversation["unread_count"] == 0


def test_conversation_creation_with_booking(client, customer, vendor, admin):
    vehicle_id = create_approved_vehicle(client, vendor, admin)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)

    conversation = _start_conversation(client, customer, vendor, booking_id=booking_id)
    assert conversation["booking_id"] == booking_id


def test_conversation_create_requires_existing_vendor(client, customer):
    resp = client.post(
        "/conversations", headers=customer["headers"], json={"vendor_id": 999999}
    )
    assert resp.status_code == 404


def test_conversation_create_rejects_vendor_mismatch_for_booking(
    client, customer, vendor, admin
):
    vehicle_id = create_approved_vehicle(client, vendor, admin)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)

    other_vendor = signup_and_login(client, "vendor")
    resp = client.post(
        "/conversations",
        headers=customer["headers"],
        json={"vendor_id": other_vendor["user"]["id"], "booking_id": booking_id},
    )
    assert resp.status_code == 400


# ---- duplicate prevention ------------------------------------------------------


def test_duplicate_conversation_for_same_booking_is_prevented(
    client, customer, vendor, admin
):
    vehicle_id = create_approved_vehicle(client, vendor, admin)
    booking_id = create_confirmed_booking(client, customer, vendor, vehicle_id)

    _start_conversation(client, customer, vendor, booking_id=booking_id)

    resp = client.post(
        "/conversations",
        headers=customer["headers"],
        json={"vendor_id": vendor["user"]["id"], "booking_id": booking_id},
    )
    assert resp.status_code == 409


def test_multiple_booking_less_conversations_are_allowed(client, customer, vendor):
    first = _start_conversation(client, customer, vendor)
    second = _start_conversation(client, customer, vendor)
    assert first["id"] != second["id"]


# ---- authorization --------------------------------------------------------------


def test_only_customer_can_create_conversation(client, vendor, admin):
    resp = client.post(
        "/conversations", headers=vendor["headers"], json={"vendor_id": vendor["user"]["id"]}
    )
    assert resp.status_code == 403

    resp = client.post(
        "/conversations", headers=admin["headers"], json={"vendor_id": vendor["user"]["id"]}
    )
    assert resp.status_code == 403


def test_non_participant_cannot_access_conversation(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    outsider = signup_and_login(client, "customer")

    resp = client.get(f"/conversations/{conversation['id']}", headers=outsider["headers"])
    assert resp.status_code == 403


def test_non_participant_cannot_send_message(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    outsider = signup_and_login(client, "vendor")

    resp = client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=outsider["headers"],
        json={"message": "Hi"},
    )
    assert resp.status_code == 403


def test_admin_cannot_send_messages(client, customer, vendor, admin):
    conversation = _start_conversation(client, customer, vendor)

    resp = client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=admin["headers"],
        json={"message": "Hi"},
    )
    assert resp.status_code == 403


# ---- unread counts and mark-as-read ---------------------------------------------


def test_unread_count_increments_and_clears_on_view(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)

    client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello vendor"},
    )

    vendor_view = client.get(
        f"/conversations/{conversation['id']}", headers=vendor["headers"]
    ).json()
    assert vendor_view["unread_count"] == 1

    customer_view = client.get(
        f"/conversations/{conversation['id']}", headers=customer["headers"]
    ).json()
    assert customer_view["unread_count"] == 0

    list_resp = client.get(
        f"/conversations/{conversation['id']}/messages", headers=vendor["headers"]
    )
    assert list_resp.status_code == 200
    assert list_resp.json()[0]["is_read"] is True

    vendor_view_after = client.get(
        f"/conversations/{conversation['id']}", headers=vendor["headers"]
    ).json()
    assert vendor_view_after["unread_count"] == 0


def test_unread_count_in_my_conversations_list(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello"},
    )

    listing = client.get("/conversations/my", headers=vendor["headers"]).json()
    assert len(listing) == 1
    assert listing[0]["unread_count"] == 1


def test_mark_message_as_read_explicitly(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    message = client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello vendor"},
    ).json()
    assert message["is_read"] is False

    resp = client.patch(f"/messages/{message['id']}/read", headers=vendor["headers"])
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True


def test_sender_cannot_mark_own_message_as_read(client, customer, vendor):
    conversation = _start_conversation(client, customer, vendor)
    message = client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello vendor"},
    ).json()

    resp = client.patch(f"/messages/{message['id']}/read", headers=customer["headers"])
    assert resp.status_code == 403


# ---- admin read access -----------------------------------------------------------


def test_admin_can_view_conversation_and_messages(client, customer, vendor, admin):
    conversation = _start_conversation(client, customer, vendor)
    client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello vendor"},
    )

    get_resp = client.get(f"/conversations/{conversation['id']}", headers=admin["headers"])
    assert get_resp.status_code == 200

    messages_resp = client.get(
        f"/conversations/{conversation['id']}/messages", headers=admin["headers"]
    )
    assert messages_resp.status_code == 200
    assert len(messages_resp.json()) == 1

    admin_listing = client.get("/conversations/my", headers=admin["headers"]).json()
    assert len(admin_listing) == 1


def test_admin_viewing_does_not_consume_recipient_unread_state(
    client, customer, vendor, admin
):
    conversation = _start_conversation(client, customer, vendor)
    client.post(
        f"/conversations/{conversation['id']}/messages",
        headers=customer["headers"],
        json={"message": "Hello vendor"},
    )

    client.get(f"/conversations/{conversation['id']}/messages", headers=admin["headers"])

    vendor_view = client.get(
        f"/conversations/{conversation['id']}", headers=vendor["headers"]
    ).json()
    assert vendor_view["unread_count"] == 1


# ---- customer/vendor isolation --------------------------------------------------


def test_vendor_does_not_see_another_vendors_conversations(client, customer, vendor):
    other_vendor = signup_and_login(client, "vendor")
    _start_conversation(client, customer, vendor)
    _start_conversation(client, customer, other_vendor)

    vendor_listing = client.get("/conversations/my", headers=vendor["headers"]).json()
    assert len(vendor_listing) == 1
    assert vendor_listing[0]["vendor_id"] == vendor["user"]["id"]

    other_listing = client.get("/conversations/my", headers=other_vendor["headers"]).json()
    assert len(other_listing) == 1
    assert other_listing[0]["vendor_id"] == other_vendor["user"]["id"]


def test_customer_does_not_see_another_customers_conversations(client, vendor):
    customer_a = signup_and_login(client, "customer")
    customer_b = signup_and_login(client, "customer")

    _start_conversation(client, customer_a, vendor)
    _start_conversation(client, customer_b, vendor)

    listing_a = client.get("/conversations/my", headers=customer_a["headers"]).json()
    assert len(listing_a) == 1
    assert listing_a[0]["customer_id"] == customer_a["user"]["id"]

    listing_b = client.get("/conversations/my", headers=customer_b["headers"]).json()
    assert len(listing_b) == 1
    assert listing_b[0]["customer_id"] == customer_b["user"]["id"]
