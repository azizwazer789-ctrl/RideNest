# RideNest — Backend

FastAPI REST API for the car rental marketplace. Handles authentication, vehicles, and bookings for customers, vendors, and admins.

## Requirements

- Python 3.10+
- PostgreSQL

## Setup

```bash
cd backend
python -m venv env

# Activate virtual environment
# Windows:
env\Scripts\activate
# macOS/Linux:
source env/bin/activate

pip install -r requirements.txt
```

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL=postgresql://user@localhost:5432/cars_booking_db
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175
```

Create the PostgreSQL database before starting:

```sql
CREATE DATABASE cars_booking_db;
```

Tables are created automatically on startup via SQLAlchemy `create_all()`.

## Run

```bash
uvicorn main:app --reload --port 8001
```

- Health check: http://127.0.0.1:8001/
- Swagger UI: http://127.0.0.1:8001/docs

The frontends expect the API on **port 8001** by default.

## API overview

| Prefix | Description |
|--------|-------------|
| `/users` | Signup, login (OAuth2 password → JWT) |
| `/vehicles` | Public browse, vendor CRUD, admin approval |
| `/bookings` | Customer bookings, vendor confirm/reject |

### Roles

- `customer` — create and manage own bookings
- `vendor` — manage fleet and vendor bookings
- `admin` — approve/reject vehicle listings
- `driver` — defined in schema; no endpoints yet

## Project layout

```
backend/
├── main.py              # App entry point, CORS, routers
├── core/                # Config, security, enums, exceptions
├── database/            # SQLAlchemy engine and session
├── models/              # User, Vehicle, Booking
├── schemas/             # Pydantic request/response models
├── routers/             # API route handlers
├── services/            # Business logic
└── dependencies/        # Auth guards (require_customer, etc.)
```

## Creating an admin user

There is no admin registration in the UI. Create an admin via the signup API:

```bash
curl -X POST http://127.0.0.1:8001/users/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Admin","email":"admin@example.com","password":"yourpassword","role":"admin"}'
```

Then sign in at http://localhost:5175.
