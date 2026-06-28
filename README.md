# RideNest

Multi-vendor car rental marketplace with a shared FastAPI backend and three independent React frontends.

## Brand

**RideNest** — Pakistan's trusted car rental marketplace.

## Project structure

```
car-booking/
├── backend/        # FastAPI API + PostgreSQL
├── website/        # Public site + customer booking (port 5173)
├── vendor-panel/   # Vendor fleet & booking management (port 5174)
└── admin-panel/    # Admin vehicle approvals (port 5175)
```

| App | URL | Audience |
|-----|-----|----------|
| Website | http://localhost:5173 | Customers — browse, register, book |
| Vendor panel | http://localhost:5174 | Vendors — list vehicles, manage bookings |
| Admin panel | http://localhost:5175 | Admins — approve/reject listings |

All frontends connect to the same backend API and PostgreSQL database.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** running locally

## Quick start

### 1. Backend

```bash
cd backend
python -m venv env
# Windows: env\Scripts\activate
# macOS/Linux: source env/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL and SECRET_KEY
uvicorn main:app --reload --port 8001
```

API docs: http://127.0.0.1:8001/docs

### 2. Frontends

Open three terminals:

```bash
cd website && npm install && npm run dev
cd vendor-panel && npm install && npm run dev
cd admin-panel && npm install && npm run dev
```

Copy each app's `.env.example` to `.env` before running if you need custom URLs.

## User flows

1. **Customer** — Register on the website → browse vehicles → book → manage bookings in dashboard.
2. **Vendor** — Register on the vendor panel → add vehicles → respond to booking requests after admin approval.
3. **Admin** — Sign in on the admin panel (no public registration) → approve or reject vendor listings.

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT auth |
| Frontends | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios |

## Documentation

- [backend/README.md](backend/README.md) — API setup and configuration
- [website/README.md](website/README.md) — Customer-facing app
- [vendor-panel/README.md](vendor-panel/README.md) — Vendor portal
- [admin-panel/README.md](admin-panel/README.md) — Admin portal
