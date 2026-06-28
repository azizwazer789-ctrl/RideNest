"""Shared pytest fixtures: isolated in-memory SQLite DB + auth/data helpers.

main.py is never modified. The real Postgres `create_all` call it triggers
on import still runs (harmlessly), while all test data flows through a
separate in-memory SQLite database installed via a `get_db` override.
"""

import sys
from datetime import date, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.connection import Base  # noqa: E402
from dependencies.database import get_db  # noqa: E402

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def client():
    """A TestClient backed by a fresh in-memory SQLite schema per test."""
    import main  # noqa: F401  (import first so all models register on Base.metadata)

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[get_db] = override_get_db

    with TestClient(main.app) as test_client:
        yield test_client

    main.app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


_counter = {"n": 0}


def _unique_email(prefix: str) -> str:
    _counter["n"] += 1
    return f"{prefix}_{_counter['n']}@example.com"


def signup_and_login(client, role: str, password: str = "TestPass123") -> dict:
    """Sign up a new user with the given role and return {token, headers, user, email}."""
    email = _unique_email(role)
    signup_resp = client.post(
        "/users/signup",
        json={
            "full_name": f"Test {role.capitalize()}",
            "email": email,
            "password": password,
            "role": role,
        },
    )
    assert signup_resp.status_code == 201, signup_resp.text

    login_resp = client.post(
        "/users/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    return {
        "token": token,
        "headers": headers,
        "user": signup_resp.json()["user"],
        "email": email,
    }


@pytest.fixture()
def customer(client):
    return signup_and_login(client, "customer")


@pytest.fixture()
def vendor(client):
    return signup_and_login(client, "vendor")


@pytest.fixture()
def admin(client):
    return signup_and_login(client, "admin")


def create_approved_vehicle(client, vendor, admin, price_per_day: float = 10000.0) -> int:
    """Create a vehicle as `vendor` and approve it as `admin`. Returns the vehicle id."""
    create_resp = client.post(
        "/vehicles/",
        headers=vendor["headers"],
        json={
            "title": "Test Car",
            "brand": "Toyota",
            "model": "Corolla",
            "year": 2022,
            "car_type": "sedan",
            "transmission": "automatic",
            "fuel_type": "petrol",
            "seating_capacity": 5,
            "city": "Lahore",
            "location": "DHA Phase 5",
            "price_per_day": price_per_day,
            "price_per_hour": 500.0,
            "description": "A reliable test vehicle.",
        },
    )
    assert create_resp.status_code == 201, create_resp.text
    vehicle_id = create_resp.json()["id"]

    approve_resp = client.patch(f"/vehicles/{vehicle_id}/approve", headers=admin["headers"])
    assert approve_resp.status_code == 200, approve_resp.text

    return vehicle_id


def create_confirmed_booking(client, customer, vendor, vehicle_id: int) -> int:
    """Create a booking as `customer` and confirm it as `vendor`. Returns the booking id."""
    start = date.today() + timedelta(days=1)
    end = start  # single inclusive rental day -> total_price == price_per_day

    create_resp = client.post(
        "/bookings/",
        headers=customer["headers"],
        json={
            "vehicle_id": vehicle_id,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "pickup_location": "Airport",
            "dropoff_location": "Airport",
        },
    )
    assert create_resp.status_code == 201, create_resp.text
    booking_id = create_resp.json()["id"]

    confirm_resp = client.patch(f"/bookings/{booking_id}/confirm", headers=vendor["headers"])
    assert confirm_resp.status_code == 200, confirm_resp.text

    return booking_id


def pay_booking(client, customer, booking_id: int) -> dict:
    """Pay a confirmed booking as `customer`. Returns the payment response body."""
    pay_resp = client.post(
        "/payments",
        headers=customer["headers"],
        json={"booking_id": booking_id, "payment_method": "card"},
    )
    assert pay_resp.status_code == 201, pay_resp.text
    return pay_resp.json()


def complete_booking(client, vendor, booking_id: int) -> dict:
    """Mark a confirmed+paid booking as completed by the owning vendor."""
    complete_resp = client.patch(f"/bookings/{booking_id}/complete", headers=vendor["headers"])
    assert complete_resp.status_code == 200, complete_resp.text
    return complete_resp.json()
