# RideNest — Vendor Panel

React app for vehicle vendors to register, list cars, and manage incoming booking requests.

**Dev URL:** http://localhost:5174

## Features

- Vendor registration and login (vendor role only)
- Dashboard with fleet overview and approval status
- Add vehicle listings (pending admin approval)
- Accept or reject customer booking requests
- Route guards — only authenticated vendors can access protected pages

## Setup

```bash
cd vendor-panel
npm install
cp .env.example .env
npm run dev
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://127.0.0.1:8001` | Backend API base URL |
| `VITE_WEBSITE_URL` | `http://localhost:5173` | Public website link in navbar |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5174 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Routes

| Path | Auth | Description |
|------|------|-------------|
| `/login` | Public | Vendor login |
| `/register` | Public | Vendor registration |
| `/dashboard` | Vendor | Fleet + booking requests |
| `/add-vehicle` | Vendor | Create new listing |
| `/` | Vendor | Redirects to `/dashboard` |

## Workflow

1. Register or log in as a **vendor**.
2. Add a vehicle via **Add Vehicle**.
3. Wait for an **admin** to approve the listing on the admin panel.
4. Once approved, the vehicle appears on the public website.
5. Manage **booking requests** from the dashboard.

## Backend dependency

```bash
cd ../backend
uvicorn main:app --reload --port 8001
```
