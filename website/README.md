# RideNest — Website

Customer-facing React app for browsing vehicles, registering, booking, and managing reservations.

**Dev URL:** http://localhost:5173

## Features

- Marketing home page and vehicle catalog
- Vehicle detail pages and booking flow
- Customer registration and login (customer role only)
- Customer dashboard — view and cancel bookings

Links to the [vendor panel](http://localhost:5174) for vendors who want to list vehicles.

## Setup

```bash
cd website
npm install
cp .env.example .env
npm run dev
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://127.0.0.1:8001` | Backend API base URL |
| `VITE_VENDOR_PANEL_URL` | `http://localhost:5174` | Vendor portal link in navbar |
| `VITE_ADMIN_PANEL_URL` | `http://localhost:5175` | Admin panel link (wrong-role redirects) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Routes

| Path | Description |
|------|-------------|
| `/` | Home / marketing |
| `/vehicles` | Browse approved vehicles |
| `/vehicles/:id` | Vehicle details |
| `/book/:id` | Booking form (customer login required) |
| `/login` | Customer login |
| `/register` | Customer registration |
| `/dashboard` | Customer bookings dashboard |

## Backend dependency

Ensure the backend is running before using the site:

```bash
cd ../backend
uvicorn main:app --reload --port 8001
```
