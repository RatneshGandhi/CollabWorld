# Master Project Guide — PERN Real-Time Google Docs Clone (`CollabSpace`)

> **Timeline:** September 2, 2026 – September 30, 2026  
> **Stack:** PostgreSQL · Docker · Drizzle ORM · Zod · Express.js · React.js · Node.js · Socket.IO · Tailwind CSS · JWT  
> **Folder Names:** `/backend` and `/frontend`  
> **Status:** Active Master Blueprint  

---

## Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [Final Deliverable & Scope](#2-final-deliverable--scope)
3. [Feature Priority System (P0 / P1 / P2)](#3-feature-priority-system)
4. [Technology Stack & Architectural Decisions](#4-technology-stack--architectural-decisions)
5. [Docker & Containerization Strategy](#5-docker--containerization-strategy)
6. [Monorepo & Proposed Folder Structure](#6-monorepo--proposed-folder-structure)
7. [System Architecture Overview](#7-system-architecture-overview)
8. [Database Schema & Drizzle ORM Modeling](#8-database-schema--drizzle-orm-modeling)
9. [Zod Validation Layer](#9-zod-validation-layer)
10. [REST API Specification](#10-rest-api-specification)
11. [Authentication & Authorization Flow](#11-authentication--authorization-flow)
12. [Document & Editor Architecture](#12-document--editor-architecture)
13. [Real-Time Collaboration & Socket.IO Architecture](#13-real-time-collaboration--socketio-architecture)
14. [Git Workflow & Commit Convention](#14-git-workflow--commit-convention)
15. [GitHub Projects & Issue Management](#15-github-projects--issue-management)
16. [Security & Performance Strategy](#16-security--performance-strategy)
17. [Testing & Quality Assurance Strategy](#17-testing--quality-assurance-strategy)
18. [Deployment & DevOps Plan](#18-deployment--devops-plan)
19. [Month-Long Daily Roadmap (Sept 2 – Sept 30)](#19-month-long-daily-roadmap-sept-2--sept-30)
20. [Checkpoints, Contingencies & Scope-Triage Rules](#20-checkpoints-contingencies--scope-triage-rules)
21. [Definition of Done (DoD)](#21-definition-of-done-dod)
22. [Final Portfolio Presentation & Repository Checklist](#22-final-portfolio-presentation--repository-checklist)

---

## 1. Project Overview & Vision

**CollabSpace** is a production-grade, full-stack collaborative rich text editor inspired by Google Docs. The platform allows users to securely register, organize documents in a responsive personal dashboard, create and format rich text documents, invite collaborators with role-based permissions (view/edit), and simultaneously edit documents in real-time with live synchronization and auto-saving.

### Modern Full-Stack Approach (PERN + Drizzle + Zod + Docker)
Rather than a traditional untyped MongoDB setup, this project leverages a modern, rock-solid engineering stack:
- **PostgreSQL**: Industry-standard ACID-compliant relational database with native `JSONB` support for Quill Deltas.
- **Docker & Docker Compose**: Instant, reproducible local database and service orchestration.
- **Drizzle ORM & Drizzle Kit**: Lightning-fast, type-safe SQL query builder and schema migration tool.
- **Zod & Drizzle-Zod**: Schema-driven runtime validation ensuring zero untrusted payloads reach the database or controllers.
- **Socket.IO + Express + React**: Real-time bi-directional WebSocket delta sync with modern React 18 UI.

---

## 2. Final Deliverable & Scope

By **September 30, 2026**, the completed repository will include:
1. **Fully Functional Full-Stack Application**: Decoupled Express API + Socket.IO server connected to PostgreSQL via Drizzle ORM in `/backend`, paired with a React + Tailwind CSS client in `/frontend`.
2. **Containerized Local Environment**: Docker Compose configuration managing PostgreSQL with persistent volume storage and automated healthchecks.
3. **Robust Authentication**: JWT-based session handling, password hashing with bcrypt, protected route guards on frontend and backend.
4. **Comprehensive Document Lifecycle**: CRUD operations, title editing, soft-delete or archiving, search, and responsive dashboard.
5. **Rich Text Formatting Engine**: Full rich text toolbar (headings, bold, italic, underline, lists, alignments, code blocks, links, clean formatting).
6. **Real-Time Collaboration Engine**: Live multi-user synchronization with Socket.IO rooms, broadcast delta changes, and active presence awareness.
7. **Optimized Persistence (Auto-Save)**: Non-blocking debounced saving strategy storing Quill Deltas into PostgreSQL `JSONB` columns.
8. **Clean Git History & Portfolio Documentation**: Professional commit history, comprehensive `README.md`, setup guide, system architecture diagrams, and deployed public URLs.

---

## 3. Feature Priority System

To ensure completion before the September 30 deadline, all features are categorized by strict priority:

| Priority | Level | Description | Features Included |
| :--- | :--- | :--- | :--- |
| **P0** | **Must Have** | Mandatory for project completion. Zero compromise. | • JWT User Registration / Login / Logout<br>• Dockerized PostgreSQL + Drizzle ORM migrations<br>• Zod request validation on all endpoints<br>• User Dashboard & Document List<br>• Create / Read / Rename / Delete Document<br>• Rich Text Editor integration with Quill Delta<br>• Real-Time Delta Broadcast via Socket.IO<br>• Debounced Auto-Save to PostgreSQL JSONB<br>• Document-level access authorization (Owner/Shared) |
| **P1** | **Should Have** | High-value features that elevate portfolio strength. | • Share modal (invite user by email with View/Edit role)<br>• Active collaborator presence indicator (online badges)<br>• Document search & filtering on dashboard<br>• Responsive Google Docs-inspired navigation & toolbar<br>• Error toast notification system & skeleton loaders |
| **P2** | **Nice to Have** | Only implemented if ahead of schedule during Week 4. | • Live cursor position awareness with user names<br>• Export document to PDF / HTML<br>• Dark / Light theme toggle<br>• Version history snapshot / restore |

---

## 4. Technology Stack & Architectural Decisions

```
+-----------------------------------------------------------------------+
|                             FRONTEND TIER                             |
|   React 18  *  Tailwind CSS  *  Quill.js (Deltas)  *  Socket.IO Client |
|   React Router v6  *  Lucide Icons  *  Axios / Fetch Interceptors     |
+-----------------------------------------------------------------------+
                                  |
                   HTTP REST API  |  WebSocket (ws/wss)
                   (JSON / JWT)   |  (Rooms & Deltas)
                                  v
+-----------------------------------------------------------------------+
|                             BACKEND TIER                              |
|   Node.js  *  Express.js  *  Socket.IO Server  *  JWT  *  Bcryptjs     |
|   Zod Validation  *  Drizzle ORM  *  CORS  *  Helmet  *  Morgan       |
+-----------------------------------------------------------------------+
                                  |
                        Postgres Connection Pool
                                  v
+-----------------------------------------------------------------------+
|                            DATABASE TIER                              |
|          PostgreSQL 16 (Docker Compose in Dev / Managed in Prod)      |
|               JSONB Delta Storage  *  Relational Foreign Keys          |
+-----------------------------------------------------------------------+
```

### Architectural Decisions

| Layer | Chosen Tool | Rationale |
| :--- | :--- | :--- |
| **Database** | **PostgreSQL 16** | Strict relational integrity, foreign key cascades, high-performance indexing, and native `JSONB` column support for storing complex Quill Delta JSON trees. |
| **Dev Environment** | **Docker & Docker Compose** | Isolated database container eliminates "works on my machine" issues; one-command startup for any developer. |
| **ORM & Migrations** | **Drizzle ORM + Drizzle Kit** | Zero-bloat, SQL-like syntax, blazing fast performance, built-in migration generation, and Drizzle Studio GUI. |
| **Validation Layer** | **Zod + Drizzle-Zod** | Type-safe schema validation at HTTP boundaries; guarantees sanitized input before controllers execute. |
| **Frontend Framework** | **React.js (Vite)** | Fast HMR, clean component tree, modular hooks for WebSocket and editor lifecycle. |
| **Styling** | **Tailwind CSS** | Rapid UI development, pixel-perfect Google Docs styling, zero runtime CSS overhead. |
| **Rich Text Core** | **Quill.js (via Delta Format)** | Industry-standard operational delta format; stores text modifications as compact JSON operations rather than raw HTML strings. |
| **Backend Framework** | **Express.js (Node.js)** | Lightweight, standard middleware pattern, easy integration with HTTP server and Socket.IO. |
| **Real-Time Engine** | **Socket.IO** | Automatic fallbacks, built-in room isolation per document (`room = documentId`), reliable reconnect logic. |
| **Auth Strategy** | **JWT (JSON Web Tokens) + Bcrypt** | Stateless authentication verified across both Express REST endpoints and Socket.IO connection handshakes. |

---

## 5. Docker & Containerization Strategy

### 5.1 `docker-compose.yml` (Root)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: collabspace-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-collabspace}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-collabspace}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### 5.2 Docker Commands Cheatsheet
- **Start Database**: `docker compose up -d`
- **Stop Database**: `docker compose down`
- **View Logs**: `docker compose logs -f postgres`
- **Reset Database Volume**: `docker compose down -v`

---

## 6. Monorepo & Proposed Folder Structure

```
collabspace/
│
├── .github/
│   ├── workflows/                # CI / Lint checks
│   └── ISSUE_TEMPLATE/           # Standard issue templates
│
├── docs/                         # Extended documentation
│   ├── API.md                    # Complete REST API specification
│   ├── ARCHITECTURE.md           # System design & socket flow diagrams
│   └── DEPLOYMENT.md             # Deployment step-by-step instructions
│
├── docker-compose.yml            # Local PostgreSQL container configuration
├── day1.md                       # Daily execution guide
│
├── frontend/                     # React Frontend Application (Vite)
│   ├── public/                   # Static assets & favicon
│   ├── src/
│   │   ├── assets/               # Local images, logos, icons
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # Button, Input, Modal, Loader, Toast, Badge
│   │   │   ├── dashboard/        # DocumentCard, DocumentGrid, Header, CreateModal
│   │   │   ├── editor/           # Toolbar, EditorArea, TitleInput, ShareModal, ActiveUsers
│   │   │   └── layout/           # Navbar, Sidebar, ProtectedLayout
│   │   ├── context/              # React Context Providers
│   │   │   ├── AuthContext.jsx   # User state, login, logout, token handling
│   │   │   └── SocketContext.jsx # Global socket connection manager
│   │   ├── hooks/                # Custom React Hooks
│   │   │   ├── useAuth.js        # Easy access to AuthContext
│   │   │   ├── useDocument.js    # Document CRUD operations
│   │   │   └── useDebounce.js    # Debounce utility for auto-save and title edits
│   │   ├── pages/                # Top-level Page views
│   │   │   ├── LoginPage.jsx     # User login view
│   │   │   ├── RegisterPage.jsx  # New user registration view
│   │   │   ├── DashboardPage.jsx # Document management hub
│   │   │   ├── EditorPage.jsx    # The collaborative workspace
│   │   │   └── NotFoundPage.jsx  # 404 fallback page
│   │   ├── services/             # API integration layer
│   │   │   ├── api.js            # Axios/Fetch client with JWT interceptor
│   │   │   ├── authService.js    # Authentication API calls
│   │   │   └── docService.js     # Document API calls
│   │   ├── utils/                # Helper functions, date formatting, constants
│   │   ├── App.jsx               # Route configuration
│   │   ├── index.css             # Tailwind directives & custom global styles
│   │   └── main.jsx              # Application entry point
│   ├── .env.example              # Frontend environment template
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                      # Node.js + Express Backend Application
│   ├── drizzle.config.js         # Drizzle Kit migration configuration
│   ├── src/
│   │   ├── config/               # Configuration & environment variables
│   │   ├── db/                   # Database & Drizzle layer
│   │   │   ├── index.js          # Drizzle client instance (postgres.js / pg pool)
│   │   │   ├── schema/           # Drizzle table definitions
│   │   │   │   ├── users.js      # Users table schema
│   │   │   │   ├── documents.js  # Documents table schema
│   │   │   │   ├── collaborators.js # Collaborators table schema
│   │   │   │   └── index.js      # Barrel export & table relations
│   │   │   └── migrations/       # SQL migrations generated by Drizzle Kit
│   │   ├── validators/           # Zod schema validators
│   │   │   ├── authValidator.js  # Registration & Login schemas
│   │   │   ├── docValidator.js   # Document CRUD schemas
│   │   │   └── shareValidator.js # Collaborator schemas
│   │   ├── controllers/          # Business logic handlers
│   │   │   ├── authController.js # Register, login, me
│   │   │   ├── docController.js  # CRUD operations for documents
│   │   │   └── userController.js # User search & profile endpoints
│   │   ├── middlewares/          # Express middlewares
│   │   │   ├── authMiddleware.js # JWT verification guard
│   │   │   ├── errorMiddleware.js# Centralized error handler
│   │   │   └── validateMiddleware.js # Zod validation middleware wrapper
│   │   ├── routes/               # API route definitions
│   │   │   ├── authRoutes.js     # /api/v1/auth
│   │   │   ├── docRoutes.js      # /api/v1/documents
│   │   │   └── userRoutes.js     # /api/v1/users
│   │   ├── sockets/              # Socket.IO event handlers
│   │   │   ├── documentHandler.js# Document room join, delta broadcast, presence
│   │   │   └── socketAuth.js     # WebSocket JWT authentication handshake
│   │   ├── utils/                # Utility helpers (generateToken, password)
│   │   └── server.js             # HTTP & Socket server bootstrap
│   ├── .env.example              # Backend environment template
│   └── package.json
│
├── .gitignore
├── GUIDE.md                      # Master Roadmap & Architecture Guide (This file)
└── README.md                     # Portfolio-grade presentation & overview
```

---

## 7. System Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React + Tailwind)"]
        UI[User Interface / Pages]
        AuthCtx[Auth Context & State]
        DocHook[useDocument Hook]
        Quill[Quill Rich Text Editor]
        SocketCl[Socket.IO Client]
    end

    subgraph Backend ["Backend (Node.js + Express)"]
        HTTP[Express HTTP Server]
        WSS[Socket.IO Server]
        AuthMW[Auth Middleware (JWT)]
        ZodMW[Zod Request Validation]
        DocCtrl[Document Controller]
        SockHandler[Socket Event Handler]
        Drizzle[Drizzle ORM Client]
    end

    subgraph Database ["Persistence Layer (Docker / Cloud)"]
        PG[(PostgreSQL 16)]
    end

    UI -->|1. REST Calls (JSON)| HTTP
    HTTP --> AuthMW
    AuthMW --> ZodMW
    ZodMW --> DocCtrl
    DocCtrl -->|Query Builder / SQL| Drizzle
    Drizzle -->|pg Pool / TCP| PG

    Quill -->|2. Local Deltas| SocketCl
    SocketCl <-->|3. Bi-directional WebSocket| WSS
    WSS --> SockHandler
    SockHandler -->|4. Room Broadcast to Collaborators| SocketCl
    SockHandler -.->|5. Debounced Save JSONB Delta| Drizzle
```

---

## 8. Database Schema & Drizzle ORM Modeling

### 8.1 Users Table Schema (`backend/src/db/schema/users.js`)

```javascript
const { pgTable, uuid, varchar, text, timestamp } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: text('avatar').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = { users };
```

### 8.2 Documents Table Schema (`backend/src/db/schema/documents.js`)

```javascript
const { pgTable, uuid, varchar, jsonb, boolean, timestamp, index } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { users } = require('./users');

const documents = pgTable(
  'documents',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull().default('Untitled Document'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    data: jsonb('data').default({ ops: [{ insert: '\n' }] }).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    lastModifiedBy: uuid('last_modified_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('owner_idx').on(table.ownerId, table.isArchived, table.updatedAt),
  })
);

module.exports = { documents };
```

### 8.3 Collaborators Table Schema (`backend/src/db/schema/collaborators.js`)

```javascript
const { pgTable, uuid, varchar, timestamp, uniqueIndex } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { users } = require('./users');
const { documents } = require('./documents');

const documentCollaborators = pgTable(
  'document_collaborators',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().default('editor'), // 'viewer' | 'editor'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    docUserUniqueIdx: uniqueIndex('doc_user_unique_idx').on(table.documentId, table.userId),
  })
);

module.exports = { documentCollaborators };
```

---

## 9. Zod Validation Layer

### 9.1 Validation Middleware Wrapper (`backend/src/middlewares/validateMiddleware.js`)

```javascript
const validate = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
};

module.exports = { validate };
```

### 9.2 Validation Schemas Example (`backend/src/validators/authValidator.js`)

```javascript
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const createDocumentSchema = z.object({
  title: z.string().trim().max(255).optional().default('Untitled Document'),
});

const updateDocumentTitleSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255),
});

const addCollaboratorSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(['viewer', 'editor']).default('editor'),
});

module.exports = {
  registerSchema,
  loginSchema,
  createDocumentSchema,
  updateDocumentTitleSchema,
  addCollaboratorSchema,
};
```

---

## 10. REST API Specification

Base URL: `/api/v1`

### 10.1 Authentication Endpoints (`/auth`)

| Method | Endpoint | Access | Description | Request Body (Zod Validated) | Response (Success) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user account | `{ name, email, password }` | `201 Created` + `{ token, user }` |
| `POST` | `/auth/login` | Public | Authenticate user & receive JWT | `{ email, password }` | `200 OK` + `{ token, user }` |
| `GET` | `/auth/me` | Private | Fetch currently authenticated user | Headers: `Authorization: Bearer <jwt>` | `200 OK` + `{ user }` |

### 10.2 Document Endpoints (`/documents`)

| Method | Endpoint | Access | Description | Request Body | Response (Success) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/documents` | Private | List all owned & shared documents | Query: `?search=&archived=false` | `200 OK` + `[{ document }]` |
| `POST` | `/documents` | Private | Create a new blank document | `{ title?: string }` | `201 Created` + `{ document }` |
| `GET` | `/documents/:id` | Private | Get single document by ID (with permissions check) | None | `200 OK` + `{ document, role }` |
| `PATCH`| `/documents/:id` | Private | Update document title / metadata | `{ title: string }` | `200 OK` + `{ document }` |
| `PUT`  | `/documents/:id/save` | Private | Persist full editor delta state (HTTP fallback) | `{ data: Object }` | `200 OK` + `{ document }` |
| `DELETE`|`/documents/:id`| Private (Owner only) | Delete document (cascade removes collaborators) | None | `200 OK` + `{ message }` |

### 10.3 Sharing & Collaborator Endpoints (`/documents/:id/collaborators`)

| Method | Endpoint | Access | Description | Request Body | Response (Success) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/documents/:id/collaborators` | Private (Owner only) | Add collaborator by email | `{ email: string, role: "viewer" \| "editor" }` | `200 OK` + `{ collaborator }` |
| `DELETE`|`/documents/:id/collaborators/:userId`| Private (Owner only) | Remove collaborator access | None | `200 OK` + `{ message }` |

---

## 11. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React)
    participant AuthAPI as Express Auth Route
    participant Zod as Zod Validation
    participant Drizzle as Drizzle ORM
    participant PG as PostgreSQL

    User->>AuthAPI: POST /api/v1/auth/login (email, password)
    AuthAPI->>Zod: loginSchema.parse(req.body)
    Zod-->>AuthAPI: Validated Credentials
    AuthAPI->>Drizzle: db.select().from(users).where(eq(users.email, email))
    Drizzle->>PG: SELECT * FROM users WHERE email = $1
    PG-->>Drizzle: User Row
    Drizzle-->>AuthAPI: User Object
    AuthAPI->>AuthAPI: bcrypt.compare(password, user.password)
    AuthAPI->>AuthAPI: Sign JWT with user.id, email & expiresIn (7d)
    AuthAPI-->>User: 200 OK { token, user: { id, name, email } }
    User->>User: Save token to localStorage & update AuthContext State

    Note over User,AuthAPI: Subsequent Authenticated Requests
    User->>AuthAPI: GET /api/v1/documents (Header: Authorization: Bearer <token>)
    AuthAPI->>AuthAPI: authMiddleware verifies JWT & attaches req.user
    AuthAPI->>Drizzle: Query documents where ownerId == user.id OR joined collaborator
    Drizzle->>PG: SQL SELECT with INNER/LEFT JOIN
    PG-->>Drizzle: Records
    Drizzle-->>AuthAPI: Documents Array
    AuthAPI-->>User: 200 OK { documents }
```

---

## 12. Document & Editor Architecture

### 12.1 Why Quill Delta stored in PostgreSQL `JSONB`?
Storing raw HTML (`<p>Hello <b>world</b></p>`) causes tag mismatch bugs during concurrent merges.
Quill Deltas represent text transformations in a strict JSON array:
```json
{
  "ops": [
    { "insert": "Hello " },
    { "insert": "world", "attributes": { "bold": true } },
    { "insert": "\n" }
  ]
}
```
**PostgreSQL `JSONB` Advantages:**
1. Binary JSON format enables indexed, lightning-fast reads and writes.
2. Complete data fidelity: preserves Delta attributes without string escaping issues.
3. Easy future migration to operational transforms or Yjs/CRDTs.

### 12.2 Auto-Save Flow & Debounce Strategy
1. **Instant Real-Time Broadcast**: Keystrokes generate micro-deltas emitted over Socket.IO to connected room peers in `< 50ms`.
2. **Debounced Database Persistence**: When user stops typing for `2000ms`, client emits `save-document` with full snapshot, updating the PostgreSQL `documents.data` column via Drizzle ORM.

---

## 13. Real-Time Collaboration & Socket.IO Architecture

### 13.1 Connection & Room Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Client A)
    actor Bob as Bob (Client B)
    participant SocketServer as Socket.IO Server
    participant Drizzle as Drizzle ORM
    participant PG as PostgreSQL

    Alice->>SocketServer: connect() + token handshake
    SocketServer->>SocketServer: socketAuth verifies token
    Alice->>SocketServer: emit("join-document", { documentId })
    SocketServer->>SocketServer: socket.join(documentId)
    SocketServer->>Drizzle: db.query.documents.findFirst({ where: eq(documents.id, documentId) })
    Drizzle->>PG: SELECT * FROM documents WHERE id = $1
    PG-->>Drizzle: Document Row
    Drizzle-->>SocketServer: doc
    SocketServer-->>Alice: emit("load-document", doc.data)

    Bob->>SocketServer: emit("join-document", { documentId })
    SocketServer->>SocketServer: socket.join(documentId)
    SocketServer-->>Alice: emit("user-joined", { userId: Bob.id, name: Bob.name })
    SocketServer-->>Bob: emit("load-document", doc.data)

    Alice->>SocketServer: emit("send-changes", delta)
    SocketServer->>Bob: socket.to(documentId).emit("receive-changes", delta)
    Bob->>Bob: quill.updateContents(delta)

    Alice->>SocketServer: emit("save-document", fullDocumentData) [Debounced]
    SocketServer->>Drizzle: db.update(documents).set({ data: fullDocumentData, updatedAt: new Date() }).where(eq(documents.id, documentId))
    Drizzle->>PG: UPDATE documents SET data = $1 WHERE id = $2
    PG-->>Drizzle: Updated
    SocketServer-->>Alice: emit("save-status", "saved")
```

---

## 14. Git Workflow & Commit Convention

### 14.1 Branching Strategy
* `main`: Production-ready, verified code. Deployed to production.
* `develop`: Integration branch where daily feature branches merge.
* `feat/<feature-name>`: Daily work branches (e.g., `feat/docker-postgres`, `feat/drizzle-schema`, `feat/socket-sync`).
* `fix/<bug-name>`: Dedicated bug fix branches.

### 14.2 Conventional Commits Standard

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat:` | A new feature or endpoint | `feat: add docker-compose for postgres and drizzle connection` |
| `fix:` | A bug fix | `fix: prevent race condition in auto-save debounce` |
| `refactor:`| Code change that neither fixes a bug nor adds a feature | `refactor: optimize drizzle relational queries for dashboard` |
| `docs:` | Documentation updates | `docs: add postgres drizzle schema to GUIDE.md` |
| `style:` | Formatting, whitespace, UI styling (no logic change) | `style: improve document card hover transitions in dashboard` |
| `test:` | Adding or fixing test cases | `test: add zod schema validation test for auth payloads` |
| `chore:` | Build tools, package dependencies, config files | `chore: configure drizzle-kit migrations and scripts` |

---

## 15. GitHub Projects & Issue Management

### 15.1 Board Columns
1. 📋 **Backlog**: Planned future tasks and P2 features.
2. 📌 **Todo**: Tasks assigned for current sprint/week.
3. 🚀 **In Progress**: Actively working on today.
4. 🔍 **Review / Verify**: Feature implemented, undergoing manual testing & code review.
5. ✅ **Done**: Verified, tested, documented, and merged.

### 15.2 Milestone Epics
* **Epic 1: Foundation, Docker & Drizzle Setup** (Issues #1 – #4)
* **Epic 2: PostgreSQL Schema, Zod & Auth System** (Issues #5 – #9)
* **Epic 3: Document Management API & RBAC** (Issues #10 – #14)
* **Epic 4: Frontend Core, Auth UI & Dashboard** (Issues #15 – #20)
* **Epic 5: Rich Text Editor Engine & Auto-Save** (Issues #21 – #25)
* **Epic 6: Real-Time Synchronization & Presence** (Issues #26 – #30)
* **Epic 7: Production Hardening, Testing & Deployment** (Issues #31 – #36)

---

## 16. Security & Performance Strategy

### 16.1 Security Measures
1. **Password Security**: Bcrypt with salt factor `10` or `12`. Passwords stripped from responses.
2. **Strict Zod Validation**: Blocks unexpected fields, malformed payloads, and injection vectors before touching controllers.
3. **Parametrized SQL**: Drizzle ORM uses native parameterized queries, eliminating SQL injection.
4. **JWT Security**: Signed with strong secret, configured with expiration, transmitted via `Authorization: Bearer` headers.
5. **CORS Configuration**: Restrict allowed origins to frontend URL (`http://localhost:5173` in development).
6. **Authorization Guards**: Strict check verifying that `req.user.id` is either the document owner or in `document_collaborators`.
7. **Rate Limiting**: Apply `express-rate-limit` on `/api/v1/auth` routes.

### 16.2 Performance Optimizations
1. **PostgreSQL Indexes**: Compound index on `(owner_id, is_archived, updated_at)`.
2. **Selective Payload Delivery**: Dashboard listing selects only metadata (`id`, `title`, `updatedAt`, `ownerId`), excluding heavy `data` JSONB payload.
3. **Debounced Persistence**: Reduces DB writes by `~95%` during continuous typing sessions.
4. **Connection Pooling**: Reusable connection pool via `pg.Pool`.

---

## 17. Testing & Quality Assurance Strategy

1. **API Integration Testing**: Postman / Thunder Client collection testing all HTTP status codes:
   - `200 / 201`: Success flows
   - `400 Bad Request`: Zod validation errors with clear error messages
   - `401 Unauthorized`: Missing or invalid JWT
   - `403 Forbidden`: Attempting to edit a document without permissions
   - `404 Not Found`: Non-existent document UUID
2. **WebSocket Integration Testing**: Multi-browser window test verifying instant delta mirroring between two distinct sessions.
3. **Docker & Migration Verification**: Running `npx drizzle-kit migrate` against clean container.

---

## 18. Deployment & DevOps Plan

### Target Environment
* **Database**: Managed PostgreSQL (Neon / Supabase / Railway / Render PostgreSQL)
* **Backend + Socket.IO Server**: Render / Railway (Web Service with WebSocket support)
* **Frontend Client**: Vercel / Netlify (Production CDN build)

### Environment Variable Manifest

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collabspace
JWT_SECRET=super_secret_jwt_key_collabspace_2026
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 19. Month-Long Daily Roadmap (Sept 2 – Sept 30, 2026)

```
========================================================================================
                               SEPTEMBER 2026 ROADMAP CALENDAR
========================================================================================
Week 1 (Sept 2 - Sept 8)   : Setup, Docker, PostgreSQL, Drizzle ORM, Zod & Auth API
Week 2 (Sept 9 - Sept 15)  : Document CRUD, Permissions, Frontend Setup & Auth UI
Week 3 (Sept 16 - Sept 22) : Dashboard, Rich Text Quill Editor, Deltas & Auto-Save
Week 4 (Sept 23 - Sept 29) : Socket.IO Real-Time Sync, Multi-user Rooms, Polish & Deploy
Day 29 (Sept 30)           : Final Audit, Portfolio Presentation & Project Showcase
========================================================================================
```

---

### 📅 Phase 1: Setup, Docker, PostgreSQL & Drizzle ORM (Sept 2 – Sept 4)

#### Day 01 — Wednesday, Sept 3, 2026
* **Focus:** Master Blueprint, Monorepo Architecture, PostgreSQL & Git Setup
* **Goals:** Create `GUIDE.md`, initialize Git repository, setup monorepo directory layout (`/backend` & `/frontend`), initialize backend and frontend packages.
* **Tasks:**
  1. Finalize and review `GUIDE.md` and `day1.md` master specifications.
  2. Initialize local Git repository and create root `.gitignore`.
  3. Set up GitHub Project Board (`CollabSpace Board`) and Milestone `v0.1.0 - Auth & CRUD`.
  4. Initialize `backend/package.json` with dependencies (`express`, `pg`, `drizzle-orm`, `dotenv`, `cors`, `bcrypt`, `jsonwebtoken`, `zod`, `nodemon`, `drizzle-kit`).
  5. Setup PostgreSQL instance (Docker / Local / Neon.tech) and configure `backend/drizzle.config.js`.
  6. Create `backend/src/db/schema.js`, `backend/src/db/index.js` connection pool, and `backend/src/server.js` health route (`GET /api/v1/health`).
  7. Initialize `frontend/` using Vite with React template.
  8. Commit: `feat: initialize monorepo, backend express postgres drizzle and frontend vite react`

#### Day 02 — Thursday, Sept 4, 2026
* **Focus:** Express Server Baseline, Central Error Handling & Environment Setup
* **Goals:** Build modular Express server structure, configure environment variables, and implement central error handling middleware.
* **Tasks:**
  1. Review Node.js Event Loop, Express middleware chaining, and HTTP status codes.
  2. Implement central error handling middleware (`backend/src/middlewares/errorMiddleware.js`).
  3. Create async error wrapper utility (`backend/src/utils/asyncHandler.js`).
  4. Build modular route mounting system in `backend/src/routes/index.js`.
  5. Test error handler with deliberate 400 and 500 error triggers.
  6. Commit: `feat: implement central error handling middleware and route mounting`

#### Day 03 — Friday, Sept 5, 2026
* **Focus:** Docker PostgreSQL Containerization & Resilient Drizzle ORM Connection
* **Goals:** Formalize Docker Compose setup for PostgreSQL, verify connection pooling retry logic, and test Drizzle Studio GUI.
* **Tasks:**
  1. Finalize `docker-compose.yml` with health checks and volume persistence.
  2. Configure connection pool event listeners (`connect`, `error`, `remove`).
  3. Run `npx drizzle-kit studio` to visually inspect database tables.
  4. Document Docker workflow in `docs/SETUP.md`.
  5. Commit: `feat: configure dockerized postgresql and drizzle studio connection`

---

### 📅 Phase 2: Drizzle Schemas, Zod Validation & Authentication (Sept 6 – Sept 8)

#### Day 04 — Saturday, Sept 6, 2026
* **Focus:** Users Table Schema, Drizzle Migrations & Password Hashing
* **Goals:** Define `users` table schema in Drizzle, generate and apply migrations, implement bcrypt password hashing utility.
* **Tasks:**
  1. Create `backend/src/db/schema/users.js` with fields: `id` (UUID), `name`, `email`, `password`, `avatar`, `timestamps`.
  2. Run `npm run db:generate` and `npm run db:migrate`.
  3. Verify table in Drizzle Studio.
  4. Create password hashing helper module using `bcrypt` (`backend/src/utils/password.js`).
  5. Commit: `feat: create drizzle users schema and generate initial migration`

#### Day 05 — Sunday, Sept 7, 2026
* **Focus:** Zod Auth Validation & User Registration API
* **Goals:** Create Zod schemas for user registration, build validation middleware, implement registration endpoint with duplicate email rejection.
* **Tasks:**
  1. Create `backend/src/validators/authValidator.js` with `registerSchema`.
  2. Implement `validateMiddleware.js` to catch Zod validation errors.
  3. Create JWT helper module to sign and verify tokens (`backend/src/utils/generateToken.js`).
  4. Build `registerUser` in `backend/src/controllers/authController.js` inserting new user via Drizzle.
  5. Define route `POST /api/v1/auth/register` in `backend/src/routes/authRoutes.js`.
  6. Test registration via Postman (verify duplicate email rejection and 400 validation formatting).
  7. Commit: `feat: implement user registration with zod validation and drizzle`

#### Day 06 — Monday, Sept 8, 2026
* **Focus:** User Login & Credential Verification Controller
* **Goals:** Build login endpoint, authenticate credentials against PostgreSQL, return JWT and sanitized user profile.
* **Tasks:**
  1. Create `loginSchema` in `authValidator.js`.
  2. Build `loginUser` in `authController.js` querying user by email using Drizzle.
  3. Verify password hash with `bcrypt`.
  4. Return signed JWT token and sanitized user details (`id`, `name`, `email`).
  5. Define route `POST /api/v1/auth/login`.
  6. Test login with correct and incorrect credentials.
  7. Commit: `feat: implement user login endpoint and credential verification`

#### Day 07 — Tuesday, Sept 9, 2026
* **Focus:** JWT Protected Route Middleware & User Profile Endpoint (`/auth/me`)
* **Goals:** Implement reusable `authMiddleware` that extracts Bearer token, fetches user from DB, and protects private routes.
* **Tasks:**
  1. Create `backend/src/middlewares/authMiddleware.js`.
  2. Decode JWT, fetch user record from PostgreSQL (excluding password), attach to `req.user`.
  3. Handle expired tokens, malformed tokens, and missing headers.
  4. Implement `getMe` controller and route `GET /api/v1/auth/me`.
  5. Test `/auth/me` with valid, expired, and absent tokens.
  6. **Checkpoint 2 Review:** Full PostgreSQL + Drizzle Auth layer verified.
  7. Commit: `feat: implement auth middleware and current user profile endpoint`

---

### 📅 Phase 3: Document Model & REST API Layer (Sept 10 – Sept 13)

#### Day 08 — Wednesday, Sept 10, 2026
* **Focus:** Document & Collaborators Schemas with JSONB Delta
* **Goals:** Design Drizzle tables for `documents` and `document_collaborators` with foreign keys, compound indexes, and relations.
* **Tasks:**
  1. Create `backend/src/db/schema/documents.js` with `data` JSONB column for Quill Deltas.
  2. Create `backend/src/db/schema/collaborators.js` with unique index on `(document_id, user_id)`.
  3. Run `npm run db:generate` and `npm run db:migrate`.
  4. Verify tables and foreign key constraints in Drizzle Studio.
  5. Commit: `feat: create documents and collaborators schema with jsonb delta`

#### Day 09 — Thursday, Sept 11, 2026
* **Focus:** Document Creation & User Documents List APIs
* **Goals:** Build endpoints to create a new blank document and retrieve all documents owned by or shared with the user.
* **Tasks:**
  1. Create `createDocumentSchema` in `validators/docValidator.js`.
  2. Build `createDocument` controller (`POST /api/v1/documents`) inserting record with default delta.
  3. Build `getUserDocuments` controller (`GET /api/v1/documents`) querying owned and shared documents.
  4. Project only metadata fields (omit heavy `data` JSONB column for list view).
  5. Commit: `feat: implement document creation and dashboard listing endpoints`

#### Day 10 — Friday, Sept 12, 2026
* **Focus:** Get Single Document & Update Metadata (Rename / Save)
* **Goals:** Implement permission-checked document retrieval and title/metadata update endpoints.
* **Tasks:**
  1. Create `getDocumentById` controller (`GET /api/v1/documents/:id`).
  2. Check if user is owner or collaborator; return document data and user's role (`owner` | `editor` | `viewer`).
  3. Create `updateDocumentTitle` controller (`PATCH /api/v1/documents/:id`) with Zod title validation.
  4. Create `saveDocumentData` controller (`PUT /api/v1/documents/:id/save`) as REST fallback.
  5. Test endpoints with authorized and unauthorized user tokens.
  6. Commit: `feat: implement document fetch and metadata update endpoints`

#### Day 11 — Saturday, Sept 13, 2026
* **Focus:** Document Deletion & Sharing Permissions API
* **Goals:** Implement owner-only document deletion and collaborator management API with foreign key cascades.
* **Tasks:**
  1. Create `deleteDocument` controller (`DELETE /api/v1/documents/:id`).
  2. Enforce strict authorization: Only the `owner` can delete the document.
  3. Create `addCollaborator` controller (`POST /api/v1/documents/:id/collaborators`) allowing owner to add a collaborator by email with role (`viewer` / `editor`).
  4. Create `removeCollaborator` controller (`DELETE /api/v1/documents/:id/collaborators/:userId`).
  5. Update API documentation in `docs/API.md`.
  6. **Checkpoint 3 Review:** Backend REST API is 100% complete and verified.
  7. Commit: `feat: implement document deletion and collaborator management api`

---

### 📅 Phase 4: Frontend Foundation, Authentication UI & Dashboard (Sept 14 – Sept 17)

#### Day 12 — Sunday, Sept 14, 2026
* **Focus:** React 18 Setup, Tailwind CSS Configuration & Routing
* **Goals:** Configure modern React project in `frontend/` with Tailwind CSS, Google Fonts (Inter), Lucide icons, and React Router v6.
* **Tasks:**
  1. Configure `frontend/tailwind.config.js` with custom color palette.
  2. Setup global styles in `frontend/src/index.css`.
  3. Install and configure `react-router-dom` and `lucide-react`.
  4. Setup top-level layout with `frontend/src/App.jsx` and placeholder routes.
  5. Commit: `feat: configure tailwind design system and react router layout`

#### Day 13 — Monday, Sept 15, 2026
* **Focus:** API Client & Global Authentication Context
* **Goals:** Build reusable Axios/Fetch client with token interceptor and React AuthContext.
* **Tasks:**
  1. Create `frontend/src/services/api.js` with base URL and automatic `Authorization` header attachment.
  2. Create `frontend/src/services/authService.js` with `login`, `register`, `getMe` API functions.
  3. Create `frontend/src/context/AuthContext.jsx` storing `user`, `token`, `isAuthenticated`, and `loading`.
  4. Implement `loginUser` and `logoutUser` actions in context.
  5. Create `useAuth` custom hook for easy component access.
  6. Commit: `feat: implement auth service and global auth context provider`

#### Day 14 — Tuesday, Sept 16, 2026
* **Focus:** Protected Route Guards & Auth UI (Login & Register)
* **Goals:** Build polished, responsive Login and Register pages with error handling and protected route wrapper.
* **Tasks:**
  1. Create `ProtectedRoute.jsx` component that redirects unauthenticated users to `/login`.
  2. Build `LoginPage.jsx` with email/password inputs, validation messages, loading spinner, and link to register.
  3. Build `RegisterPage.jsx` with name, email, password, and confirm password fields.
  4. Test full authentication lifecycle in browser (Register -> Auto Login -> Redirect to Dashboard -> Logout).
  5. Commit: `feat: build login and register pages with protected route wrapper`

#### Day 15 — Wednesday, Sept 17, 2026
* **Focus:** Dashboard UI — Navigation, Header & Quick Actions
* **Goals:** Build Google Docs-inspired navigation bar, user avatar menu, and "Create New Document" action button.
* **Tasks:**
  1. Create `Navbar.jsx` with logo, search bar placeholder, and user profile dropdown with Logout action.
  2. Create `DashboardPage.jsx` layout with top action bar ("Start a new document" template cards).
  3. Implement "Blank Document" button that triggers `POST /api/v1/documents` and navigates to the new document ID.
  4. Create `Button`, `Input`, and `Loader` reusable UI components.
  5. Commit: `feat: build dashboard navbar and document creation action`

---

### 📅 Phase 5: Rich Text Editor Engine & Auto-Save (Sept 18 – Sept 22)

#### Day 16 — Thursday, Sept 18, 2026
* **Focus:** Dashboard Document Grid, Cards & Search
* **Goals:** Display owned and shared documents in a responsive grid with menu actions (Rename, Delete, Open).
* **Tasks:**
  1. Create `docService.js` with API calls for listing, creating, renaming, and deleting documents.
  2. Build `DocumentCard.jsx` displaying document thumbnail icon, title, last modified date, and owner badge.
  3. Add dropdown menu on card for "Rename" and "Delete" actions.
  4. Implement modal for renaming document title.
  5. Add client-side search/filter input to filter documents by title.
  6. Commit: `feat: build document grid, card actions, and search filtering`

#### Day 17 — Friday, Sept 19, 2026
* **Focus:** Quill.js Integration & Custom Google Docs Canvas
* **Goals:** Embed Quill.js rich text editor into React, configure toolbar options, and style editor page to mimic Google Docs.
* **Tasks:**
  1. Review Quill lifecycle inside React (`useRef`, `useEffect`, clean unmount).
  2. Install and configure Quill (`quill` package).
  3. Build `EditorPage.jsx` layout containing top header and paginated white page container (`816px` width with drop shadow).
  4. Configure full toolbar options: Headings, Font sizes, Bold, Italic, Underline, Strike, Colors, Lists, Alignment, Code block.
  5. Commit: `feat: integrate quill editor with google docs canvas styling`

#### Day 18 — Saturday, Sept 20, 2026
* **Focus:** Document Loading & Title Editing in Editor
* **Goals:** Fetch document by ID on editor mount, populate Quill content, and enable inline editable document title.
* **Tasks:**
  1. Fetch document via `GET /api/v1/documents/:id` when `/document/:id` route mounts.
  2. Handle 404 / 403 error states if document does not exist or user lacks permission.
  3. Set Quill editor contents with fetched document Delta (`quill.setContents(data)`).
  4. Build inline editable `TitleInput.jsx` in header with debounced `PATCH /api/v1/documents/:id`.
  5. Add "Back to Dashboard" button in editor header.
  6. Commit: `feat: load document content and implement inline title editing`

#### Day 19 — Sunday, Sept 21, 2026
* **Focus:** Delta Change Detection & Local Edit Handling
* **Goals:** Capture user keystrokes in Quill, distinguish between user edits and programmatic updates.
* **Tasks:**
  1. Deep-dive into Quill `text-change` event parameters (`delta`, `oldDelta`, `source`).
  2. Implement source filtering: only process changes where `source === 'user'`.
  3. Track unsaved changes state in React.
  4. Add visual save status indicator in header ("Saving...", "Saved to Cloud", "Offline").
  5. Commit: `feat: implement delta change listener and save status indicator`

#### Day 20 — Monday, Sept 22, 2026
* **Focus:** Debounced Auto-Save Engine
* **Goals:** Implement reliable client-side debounced save mechanism that persists full document state to database.
* **Tasks:**
  1. Create custom `useDebounce` hook or lodash debounce helper.
  2. Implement debounced auto-save function (triggers `2000ms` after user stops typing).
  3. Call `PUT /api/v1/documents/:id/save` with current `quill.getContents()`.
  4. Update save status to "Saved" upon successful response.
  5. Handle network error gracefully with retry attempt.
  6. Commit: `feat: implement robust debounced auto-save persistence`

---

### 📅 Phase 6: Sharing, Real-Time Collaboration & Sockets (Sept 23 – Sept 26)

#### Day 21 — Tuesday, Sept 23, 2026
* **Focus:** Document Sharing Modal UI
* **Goals:** Build interactive Share modal allowing owner to invite other users by email and select role (viewer/editor).
* **Tasks:**
  1. Build `ShareModal.jsx` component.
  2. Display current owner and list of existing collaborators with role badges.
  3. Add input field to invite user by email with role selector (`viewer` / `editor`).
  4. Implement API call to `POST /api/v1/documents/:id/collaborators`.
  5. Disable Quill editing if logged-in user has role `viewer` (`quill.enable(false)`).
  6. **Checkpoint 4 Review:** Full standalone Rich Text Editor with Auto-Save and Sharing UI complete.
  7. Commit: `feat: implement document share modal and read-only viewer mode`

#### Day 22 — Wednesday, Sept 24, 2026
* **Focus:** Socket.IO Server Setup & Room Isolation
* **Goals:** Integrate Socket.IO with Express HTTP server, implement connection handshake authentication and room joining logic.
* **Tasks:**
  1. Install `socket.io` on server and `socket.io-client` on client.
  2. Create `backend/src/sockets/socketAuth.js` to verify JWT in socket handshake.
  3. Create `backend/src/sockets/documentHandler.js` handling `join-document` event.
  4. Ensure socket joins isolated room: `socket.join(documentId)`.
  5. Verify client connection in browser console.
  6. Commit: `feat: initialize socket.io server with room management and auth`

#### Day 23 — Thursday, Sept 25, 2026
* **Focus:** Real-Time Delta Broadcasting
* **Goals:** Broadcast live typing deltas from client to server and reflect immediately in connected peer editors.
* **Tasks:**
  1. On client: Listen to Quill `text-change` (`source === 'user'`) and emit `send-changes` with delta payload.
  2. On server: Listen to `send-changes` and broadcast `socket.to(documentId).emit("receive-changes", delta)`.
  3. On client: Listen to `receive-changes` and execute `quill.updateContents(delta)`.
  4. Open two different browser windows side-by-side and verify live character synchronization.
  5. Commit: `feat: implement live character-by-character delta synchronization`

#### Day 24 — Friday, Sept 26, 2026
* **Focus:** Server-Side Debounced Delta Persistence via Sockets & Drizzle
* **Goals:** Streamline persistence by handling debounced save events directly over WebSocket pipeline into PostgreSQL JSONB.
* **Tasks:**
  1. Add `save-document` socket event handler on server.
  2. Save document data directly to PostgreSQL `documents.data` column via Drizzle ORM.
  3. Emit `save-status` back to room members so all collaborators see synchronized save status.
  4. Test concurrent editing between multiple simultaneous sessions.
  5. Commit: `feat: implement socket-driven document persistence and status sync`

#### Day 25 — Saturday, Sept 27, 2026
* **Focus:** Collaborator Presence & Active Users Bar
* **Goals:** Display real-time active user avatars in the editor header when multiple users view/edit the same document.
* **Tasks:**
  1. Track connected user list per document room in memory on server.
  2. Broadcast `presence-update` with array of active users upon `join-document` and `disconnect`.
  3. Build `ActiveUsers.jsx` component in editor header showing colored avatar badges for online users.
  4. **Checkpoint 5 Review:** Real-Time Multi-User Collaboration complete.
  5. Commit: `feat: implement real-time collaborator presence tracking and active badges`

---

### 📅 Phase 7: Polish, Security, Testing, Deployment & Presentation (Sept 28 – Sept 30)

#### Day 26 — Sunday, Sept 28, 2026
* **Focus:** Error Handling, Toast Notifications & UI Polish
* **Goals:** Polish UX across the entire application with toast alerts, skeleton loaders, and responsive mobile adaptations.
* **Tasks:**
  1. Integrate toast notification system for login, save errors, copy link, and share alerts.
  2. Add skeleton loaders for dashboard document cards and editor initial fetch.
  3. Polish toolbar responsiveness for smaller laptop screens.
  4. Audit and fix any console warnings.
  5. Commit: `feat: add toast notifications, skeleton loaders, and ui polish`

#### Day 27 — Monday, Sept 29, 2026
* **Focus:** Security Hardening & End-to-End Bug Testing
* **Goals:** Perform complete security audit, rate limiting, helmet integration, and thorough edge-case regression testing.
* **Tasks:**
  1. Install `helmet` and `express-rate-limit` on server.
  2. Audit all document mutation endpoints to ensure non-collaborators cannot read or modify data.
  3. Test edge cases: Rapid tab closing, network disconnection recovery, invalid document IDs.
  4. Clean up unused imports, dead code, and debug `console.log` statements.
  5. Commit: `chore: apply security middleware, rate limiting, and lint cleanup`

#### Day 28 — Tuesday, Sept 30, 2026
* **Focus:** Production Deployment (Backend + Frontend + Managed PostgreSQL)
* **Goals:** Deploy managed PostgreSQL, deploy backend to Render/Railway, deploy frontend to Vercel/Netlify, verify live production WebSockets.
* **Tasks:**
  1. Provision cloud PostgreSQL database on Neon / Supabase / Railway and run migrations.
  2. Deploy `backend/` to Render/Railway as a Web Service.
  3. Deploy `frontend/` to Vercel/Netlify.
  4. Verify live WebSocket connection and cross-domain CORS in production environment.
  5. Conduct multi-device collaborative live test on deployed URL.
  6. **Checkpoint 6 Review:** Production deployment live and operational.
  7. Commit: `chore: configure production deployment on render and vercel`

#### Day 29 — Wednesday, Sept 30, 2026 (Final Audit & Launch)
* **Focus:** Final Portfolio Presentation, Master Documentation & Showcase
* **Goals:** Create a portfolio-ready `README.md` with system architecture diagrams, live demo links, features summary, setup instructions, and final project review.
* **Tasks:**
  1. Write professional `README.md` featuring: Project banner, Live Demo URL, Tech Stack badges, Key Features, Architecture Diagram, API Reference summary, and Local Setup Guide.
  2. Capture high-quality screenshots and GIF animations of real-time multi-window editing.
  3. Complete `docs/API.md` and `docs/DEPLOYMENT.md`.
  4. Audit GitHub Projects board: move all completed issues to **Done**.
  5. Create GitHub Release `v1.0.0` with release notes.
  6. Final self-evaluation against Definition of Done.
  7. Commit: `docs: complete portfolio-grade readme, diagrams, and project showcase`

---

## 20. Checkpoints, Contingencies & Scope-Triage Rules

To ensure we never miss the **September 30, 2026** hard deadline, progress is evaluated at 6 mandatory checkpoints:

```mermaid
graph LR
    CP1[Sept 5: Checkpoint 1<br/>Docker & Drizzle Ready] --> CP2[Sept 9: Checkpoint 2<br/>Auth & Zod Done]
    CP2 --> CP3[Sept 13: Checkpoint 3<br/>REST APIs Complete]
    CP3 --> CP4[Sept 17: Checkpoint 4<br/>Frontend & Dashboard]
    CP4 --> CP5[Sept 23: Checkpoint 5<br/>Editor & Auto-Save]
    CP5 --> CP6[Sept 27: Checkpoint 6<br/>Socket Sync Done]
    CP6 --> Final[Sept 30: Launch<br/>Deploy & Portfolio]
```

---

## 21. Definition of Done (DoD)

### Feature-Level Definition of Done
- [ ] Code is implemented cleanly in `/backend` or `/frontend`.
- [ ] Zod schemas strictly validate and sanitize all inputs.
- [ ] Drizzle migrations are generated and applied cleanly against PostgreSQL.
- [ ] Relevant errors (400, 401, 403, 404, 500) are caught and handled.
- [ ] No hardcoded secrets or URLs exist in source code (all in `.env`).
- [ ] Verified manually across test scenarios.
- [ ] Conventional Git commit is made.
- [ ] Associated GitHub Projects issue is moved to **Done**.

---

## 22. Final Portfolio Presentation Checklist

* [ ] Clear project title, tagline, badges, and Live Demo link on README.
* [ ] Animated GIF/screenshots of real-time collaboration.
* [ ] System architecture diagram and API reference.
* [ ] Zero exposed API keys or secrets.
* [ ] 100% of tracked issues in GitHub Projects moved to **Done**.
* [ ] Release `v1.0.0` tagged on GitHub.
