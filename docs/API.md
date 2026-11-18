# CollabSpace API & WebSocket Reference

> **Base URL (Local):** `http://localhost:5000/api/v1`  
> **Base URL (Production):** `https://<your-render-service>.onrender.com/api/v1`  
> **Authentication:** Bearer JWT in `Authorization: Bearer <token>` header (REST) and `auth: { token }` handshake (Socket.IO).

---

## 1. Security & Rate Limits

| Policy | Scope | Limit | Window | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Limiter** | `/auth/login`, `/auth/register` | 10 requests / IP | 15 minutes | `429 Too Many Requests` |
| **Global API Limiter** | All `/api/v1/*` (except `/health`) | 300 requests / IP | 15 minutes | `429 Too Many Requests` |
| **Body Payload Limit** | JSON & URL-encoded bodies | `2mb` max | Per request | `413 Payload Too Large` |

---

## 2. Health & Status Endpoints

### `GET /api/v1/health`
Public health check for uptime monitors and cloud load balancers (exempt from rate limiting).
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "message": "CollabSpace API server is operational and secure",
    "environment": "production",
    "timestamp": "2026-11-18T08:30:00.000Z"
  }
  ```

### `GET /api/v1/ping`
Lightweight API router liveness probe.
- **Response `200 OK`:** `{ "success": true, "message": "API v1 is operational" }`

---

## 3. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user account and returns a signed JWT.
- **Rate Limited:** Yes (`authLimiter`)
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securePassword123"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "data": { "user": { "id", "name", "email" }, "token": "<jwt>" } }`
  - `400 Bad Request`: Zod validation failure
  - `409 Conflict`: Email already registered
  - `429 Too Many Requests`: Rate limit exceeded

### `POST /api/v1/auth/login`
Authenticates an existing user and returns a signed JWT.
- **Rate Limited:** Yes (`authLimiter`)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "securePassword123"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "data": { "user": { "id", "name", "email" }, "token": "<jwt>" } }`
  - `401 Unauthorized`: Invalid email or password
  - `429 Too Many Requests`: Rate limit exceeded

### `GET /api/v1/auth/me`
Returns the profile of the currently authenticated user.
- **Auth Required:** Bearer JWT
- **Response `200 OK`:** `{ "success": true, "data": { "user": { "id", "name", "email", "createdAt" } } }`

---

## 4. Document Endpoints (`/api/v1/documents`)

All `/documents` routes require a valid **Bearer JWT**.

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/documents` | Authenticated | Create a new document (`{ "title": "Project Plan" }`) |
| `GET` | `/documents` | Authenticated | Fetch all documents grouped into `{ owned: [], shared: [] }` |
| `GET` | `/documents/:id` | Owner, Editor, Viewer | Fetch document metadata, Quill Delta `data`, and caller's `userRole` |
| `PATCH` | `/documents/:id` | Owner, Editor | Rename document title (`{ "title": "Updated Title" }`) |
| `PUT` | `/documents/:id/save` | Owner, Editor | Persist full Quill Delta snapshot (`{ "data": { "ops": [...] } }`) |
| `DELETE` | `/documents/:id` | Owner only | Soft-archive / delete a document |

### Common Error Responses
- `401 Unauthorized`: Missing, malformed, or expired JWT.
- `403 Forbidden`: User lacks ownership or required collaborator role (`viewer` cannot edit/save; non-owner cannot delete).
- `404 Not Found`: Document UUID does not exist or is archived.

---

## 5. Collaborator Endpoints (`/api/v1/documents/:id/collaborators`)

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/documents/:id/collaborators` | Owner, Editor, Viewer | List document `owner` and all `collaborators` with roles |
| `POST` | `/documents/:id/collaborators` | Owner only | Invite user by email or update existing role (`{ "email": "...", "role": "editor" \| "viewer" }`) |
| `DELETE` | `/documents/:id/collaborators/:userId` | Owner only | Revoke a collaborator's access |

---

## 6. Socket.IO Real-Time Protocol

**Connection Handshake:**
```javascript
const socket = io(SERVER_URL, {
  auth: { token: localStorage.getItem('collabspace_token') },
  transports: ['websocket', 'polling'],
});
```
Unauthenticated sockets are rejected immediately by `socketAuth` middleware before any event listeners attach.

### Client ➔ Server Events

| Event | Payload | Ack Callback | Behavior |
| :--- | :--- | :--- | :--- |
| `join-document` | `documentId` or `{ documentId }` | `{ success, documentId, userRole, activeUsers, userColor }` | Verifies DB ownership/collaboration; joins isolated room; broadcasts `presence-update` |
| `leave-document` | `documentId` or `{ documentId }` | — | Leaves room, updates presence map, broadcasts `presence-update` |
| `send-changes` | `{ documentId, delta }` | — | Blocked for `viewer`; broadcasts `receive-changes` to all other sockets in room |
| `send-title-change` | `{ documentId, title }` | — | Blocked for `viewer`; broadcasts `receive-title-change` to peers |
| `save-document` | `{ documentId, data }` | `{ success, error? }` | Blocked for `viewer`; persists Quill JSONB to PostgreSQL; broadcasts `save-status` |
| `ping-server` | — | `{ status: 'ok', serverTime }` | Connectivity & latency check |

### Server ➔ Client Events

| Event | Payload | Trigger |
| :--- | :--- | :--- |
| `presence-update` | `{ documentId, activeUsers: [{ userId, name, email, role, color }] }` | User joins, leaves, or disconnects (deduplicated per `userId`) |
| `receive-changes` | `{ delta, senderId }` | Remote peer edits document |
| `receive-title-change` | `{ title, senderId }` | Remote peer renames document |
| `save-status` | `{ status: 'saving' \| 'saved' \| 'error' }` | Auto-save lifecycle updates synchronized across room |

