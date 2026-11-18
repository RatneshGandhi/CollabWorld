# CollabSpace Production Deployment Guide

This guide covers deploying CollabSpace to a 100% free-tier cloud architecture:
- **Database:** Neon (Serverless PostgreSQL 16)
- **Backend & WebSockets:** Render (Node.js Persistent Web Service)
- **Frontend SPA:** Vercel (Global Edge CDN)

---

## 1. Provision Cloud PostgreSQL (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the PostgreSQL connection string (must include `?sslmode=require`):
   ```text
   postgresql://<user>:<password>@<host>/neondb?sslmode=require
   ```
3. Run Drizzle migrations against the cloud database from your local machine:
   ```powershell
   $env:DATABASE_URL="postgresql://<user>:<password>@<host>/neondb?sslmode=require"
   npm run db:migrate --prefix backend
   $env:DATABASE_URL=""
   ```
4. Verify in the Neon Console that `users`, `documents`, and `document_collaborators` exist.

---

## 2. Deploy Backend Web Service (Render)

1. Create a **New Web Service** on [render.com](https://render.com) connected to your GitHub repository.
2. Configure build settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Configure Environment Variables:

| Variable | Example Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables SSL pool mode and hides stack traces |
| `PORT` | `10000` | Default Render port |
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Neon connection string |
| `JWT_SECRET` | `<64-char random hex>` | Generate via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRE` | `7d` | Token validity duration |
| `CLIENT_URL` | `https://your-app.vercel.app` | Comma-separated allowed origins |

4. Verify deployment:
   ```bash
   curl -i https://<your-render-service>.onrender.com/api/v1/health
   ```
   Confirm `HTTP/2 200` and Helmet security headers (`x-content-type-options: nosniff`).

---

## 3. Deploy Frontend SPA (Vercel)

1. Import your GitHub repository at [vercel.com](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api/v1` |

4. Verify `frontend/vercel.json` is committed so client-side routes (`/dashboard`, `/document/:id`) rewrite cleanly to `/index.html`.
5. Deploy, copy your live `https://<your-app>.vercel.app` domain, and ensure it is listed in Render's `CLIENT_URL` variable.

---

## 4. Troubleshooting Checklist

| Symptom | Root Cause | Fix |
| :--- | :--- | :--- |
| `404 NOT_FOUND` when refreshing `/dashboard` on Vercel | Missing SPA rewrite rules | Ensure `frontend/vercel.json` exists in the `frontend/` root directory |
| CORS error in browser console | `CLIENT_URL` missing or has trailing slash | Set `CLIENT_URL` on Render without trailing slash (e.g. `https://collabspace.vercel.app`) |
| WebSocket stuck on `connecting` | Free Render instance sleeping or wrong `VITE_API_URL` | Hit `/api/v1/health` to wake Render cold start (~30s); confirm `VITE_API_URL` uses `https://` |
| Database `no pg_hba.conf entry` / SSL error | Missing SSL config on cloud DB | Ensure `DATABASE_URL` ends with `?sslmode=require` and `NODE_ENV=production` |

