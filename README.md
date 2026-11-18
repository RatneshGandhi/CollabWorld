<div align="center">

# 📝 CollabSpace

### Real-Time Collaborative Document Workspace

*A production-hardened, Google Docs-inspired collaborative rich-text editor built on the PERN stack and Socket.IO.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Release](https://img.shields.io/badge/Release-v1.0.0-2563EB?style=for-the-badge)](https://github.com/RatneshGandhi/CollabWorld/releases/tag/v1.0.0)

[Live Demo](https://collabworld-frontend-nu.vercel.app) · [API Reference](./docs/API.md) · [Deployment Guide](./docs/DEPLOYMENT.md)

</div>

---

## ✨ Overview

**CollabSpace** enables teams to create, share, and co-edit rich-text documents in real time with sub-50ms Delta synchronization, live collaborator presence, role-based access control, and cloud auto-save persistence.

Built with a focus on **production engineering**, CollabSpace pairs a responsive Google Docs-style editing canvas with a security-hardened Express & WebSocket backend backed by PostgreSQL JSONB storage.

---

## 🚀 Key Features

### Real-Time Collaboration Engine
- **Sub-50ms Delta Sync:** Streams incremental Quill.js Delta operations over isolated Socket.IO document rooms so multiple users can type simultaneously without overwriting each other.
- **Live Collaborator Presence:** Real-time avatar stack in the editor header with deterministic color assignment and multi-tab deduplication per user.
- **Synchronized Save Status & Title Updates:** Live room-wide broadcasts for document title renames and `Saving...` / `Saved` persistence indicators.
- **Dual-Engine Auto-Save:** Debounced auto-save persists full Quill JSONB snapshots via WebSocket with automatic REST API fallback on connection hiccups.

### Workspace & Access Control (RBAC)
- **Granular Document Permissions:** Enforces **Owner**, **Editor**, and **Viewer** roles across both REST endpoints and WebSocket room subscriptions.
- **Read-Only Viewer Enforcement:** Viewers are locked out of editing in the Quill UI and blocked from emitting changes or saves on the server.
- **Interactive Share Modal:** Invite teammates by email, promote/demote roles dynamically, revoke access, or copy document links with one click.
- **Document Dashboard:** Starter templates, grid/list view toggle, instant client-side search, ownership filters (`All`, `Owned by me`, `Shared with me`), rename, and delete modals.

### Production UX & Security Hardening
- **Zero-Layout-Shift Skeletons:** Custom shimmer skeletons mirror exact Dashboard cards and the 816px Editor paper canvas during initial fetches.
- **Global Toast Notifications & Error Boundary:** Floating auto-dismissing feedback alerts and a top-level React Error Boundary for graceful crash recovery.
- **Defense-in-Depth Backend:** Helmet HTTP security headers (`HSTS`, `nosniff`, `SAMEORIGIN`), strict anti-brute-force rate limiting on auth routes, general API rate limiting, 2MB payload limits, Zod input validation, and JWT authentication for both HTTP and WebSocket handshakes.

---

## 📸 Visual Showcase

> *Screenshots and real-time collaboration GIFs live in [`docs/assets/`](./docs/assets/).*

| Live Real-Time Collaboration | Document Dashboard |
| :---: | :---: |
| ![Real-Time Collaboration Demo](./docs/assets/live-collab.gif) | ![Document Dashboard](./docs/assets/dashboard.png) |

| Rich Text Editor Canvas | Collaborator Share & RBAC Modal |
| :---: | :---: |
| ![Editor Canvas](./docs/assets/editor.png) | ![Share Modal](./docs/assets/share-modal.png) |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Clients["Clients (Browser / Mobile)"]
        U1["User A (React 19 + Quill 2)"]
        U2["User B (React 19 + Quill 2)"]
    end

    subgraph Edge["Frontend Hosting (Vercel Edge CDN)"]
        SPA["Vite SPA Bundle + vercel.json SPA Rewrites"]
    end

    subgraph Server["Backend Web Service (Render / Node.js)"]
        Helmet["Helmet Headers + Dynamic CORS + Rate Limiters"]
        REST["Express 5 REST API (/api/v1)"]
        WS["Socket.IO Server + JWT Handshake Auth"]
        Presence["In-Memory Room Presence Registry"]
    end

    subgraph Data["Managed Cloud Database (Neon PostgreSQL)"]
        DB[("PostgreSQL 16\nusers · documents [JSONB] · document_collaborators")]
    end

    U1 --> SPA
    U2 --> SPA
    U1 <-->|"HTTPS REST + WSS Deltas"| Helmet
    U2 <-->|"HTTPS REST + WSS Deltas"| Helmet
    Helmet --> REST
    Helmet --> WS
    WS <--> Presence
    REST <-->|"Drizzle ORM (TLS 1.3)"| DB
    WS <-->|"Drizzle ORM (TLS 1.3)"| DB
```

### Real-Time Collaboration Flow

```mermaid
sequenceDiagram
    participant A as User A (Editor)
    participant S as Socket.IO Server
    participant DB as PostgreSQL (JSONB)
    participant B as User B (Editor)

    A->>S: Connect with JWT (socketAuth)
    A->>S: join-document (documentId)
    S->>DB: Verify Owner or Collaborator Role
    DB-->>S: Role = "owner"
    S-->>A: Callback { success, activeUsers }
    S-->>B: presence-update { activeUsers }

    A->>S: send-changes { documentId, delta }
    S-->>B: receive-changes { delta, senderId }

    Note over A: 2000ms debounce after typing pauses
    A->>S: save-document { documentId, data }
    S-->>A: save-status { status: "saving" }
    S-->>B: save-status { status: "saving" }
    S->>DB: UPDATE documents SET data = $1, updated_at = NOW()
    DB-->>S: OK
    S-->>A: save-status { status: "saved" }
    S-->>B: save-status { status: "saved" }
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Quill.js 2.0, React Router 7, Axios, Socket.IO Client 4.8, Lucide Icons |
| **Backend** | Node.js (ESM), Express 5, Socket.IO 4.8, Drizzle ORM, Zod 4, JSON Web Tokens (JWT), Bcrypt |
| **Security** | Helmet, `express-rate-limit` (Auth + Global limiters), Dynamic CORS, Row-Level RBAC |
| **Database** | PostgreSQL 16 (JSONB Delta storage, composite & unique indexes) |
| **Deployment** | Vercel (Frontend SPA), Render (Backend Web Service), Neon (Serverless PostgreSQL) |

---

## 📁 Project Structure

```text
CollabWorld/
├── backend/
│   ├── drizzle/                  # Versioned SQL migrations generated by Drizzle Kit
│   ├── src/
│   │   ├── controllers/          # Auth, Document CRUD, and Collaborator handlers
│   │   ├── db/                   # PostgreSQL connection pool & Drizzle schema
│   │   ├── middlewares/          # JWT protect, Zod validate, Rate limiters, Error handler
│   │   ├── routes/               # Express v1 route definitions
│   │   ├── sockets/              # Socket.IO init, JWT handshake auth, Room & Presence handlers
│   │   ├── utils/                # AppError, asyncHandler, JWT helpers
│   │   ├── validators/           # Strict Zod schemas for auth & documents
│   │   └── server.js             # Express + HTTP + Socket.IO server entry point
│   ├── drizzle.config.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/        # TemplateBar, DocumentCard, Skeletons, Rename/Delete Modals
│   │   │   ├── editor/           # TextEditor (Quill), EditorHeader, ActiveUsers, ShareModal, Skeleton
│   │   │   └── ui/               # Navbar, Modal, Button, Input, Alert, ToastContainer, ErrorBoundary
│   │   ├── context/              # AuthContext & ToastContext
│   │   ├── pages/                # LoginPage, RegisterPage, DashboardPage, EditorPage
│   │   ├── services/             # Axios API client, authService, docService, socketService
│   │   └── App.jsx
│   ├── vercel.json               # SPA deep-link rewrite rules
│   └── .env.example
└── docs/
    ├── API.md                    # Complete REST & WebSocket contract
    ├── DEPLOYMENT.md             # Cloud deployment runbook
    └── assets/                   # Screenshots & demo GIFs
```

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js** v20+ and npm
- **PostgreSQL 16** (or Docker Desktop)

### 1. Clone the Repository
```bash
git clone https://github.com/RatneshGandhi/CollabWorld.git
cd CollabWorld
```

### 2. Start PostgreSQL (via Docker)
```bash
docker run --name collab-pg \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=collabspace \
  -p 5433:5432 \
  -d postgres:16-alpine
```

### 3. Configure & Start the Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npm run db:migrate
npm run dev
```
The API & WebSocket server will run on `http://localhost:5000`.

### 4. Configure & Start the Frontend
Open a second terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173` in your browser!

---

## 📚 Documentation

- **[API & WebSocket Reference](./docs/API.md)** — Full REST endpoint payloads, status codes, rate limits, and Socket.IO events.
- **[Cloud Deployment Guide](./docs/DEPLOYMENT.md)** — Step-by-step setup for Neon PostgreSQL, Render Web Service, and Vercel.

---

## 👤 Author

**Ratnesh Gandhi**  
- GitHub: [@RatneshGandhi](https://github.com/RatneshGandhi)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

