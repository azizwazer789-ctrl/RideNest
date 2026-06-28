# RideNest — Admin Panel

React app for platform administrators to review and approve vendor vehicle listings.

**Dev URL:** http://localhost:5175

## Features

- Admin-only login (no public registration)
- Dashboard with marketplace stats
- Approval queue for pending vehicles
- Approve or reject any vehicle listing

## Setup

```bash
cd admin-panel
npm install
cp .env.example .env
npm run dev
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://127.0.0.1:8001` | Backend API base URL |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5175 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Routes

| Path | Auth | Description |
|------|------|-------------|
| `/login` | Public | Admin login |
| `/dashboard` | Admin | Approval queue + all listings |
| `/` | Admin | Redirects to `/dashboard` |

## Creating an admin account

Admin registration is disabled in the UI. Create an admin user via the backend API:

```bash
curl -X POST http://127.0.0.1:8001/users/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Admin","email":"admin@example.com","password":"yourpassword","role":"admin"}'
```

Then sign in at http://localhost:5175/login.

## Backend dependency

```bash
cd ../backend
uvicorn main:app --reload --port 8001
```
