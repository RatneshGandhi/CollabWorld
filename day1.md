# Day 1: Project Setup, Environment Config, & API Skeleton (PostgreSQL + Drizzle ORM)

> **Phase:** 1 — Foundation & Authentication  
> **Date:** September 3, 2026  
> **Milestone:** `v0.1.0 - Auth & CRUD`  
> **Folder Names:** `/backend` and `/frontend`  
> **Suggested Commit:** `feat: initialize monorepo, backend express postgres drizzle and frontend vite react`

---

Welcome to Day 1 of building **CollabSpace**. Today is all about establishing a clean developer environment, mastering professional project planning tools, and connecting your server to a relational database using **PostgreSQL** and **Drizzle ORM**.

Today's focus is on **Phase 1: Foundation & Authentication**, setting up your project tracking systems, and establishing database connectivity.

---

## Today's Objectives

1. Set up the GitHub Project Board, Milestones, and Initial Tickets.
2. Establish the Monorepo directory structure (`/backend` and `/frontend`).
3. Initialize Git and configure defensive `.gitignore` templates.
4. Set up the Backend Node workspace with PostgreSQL and Drizzle ORM.
5. Configure PostgreSQL connection pooling using the `pg` driver and Drizzle client.
6. Set up the Frontend client skeleton with Vite and React.
7. Verify local execution of both applications.

---

## Architecture Layout

```
              [ collabspace-monorepo ] (Root Directory)
                         |
         +---------------+---------------+
         |                               |
     /backend                        /frontend
(Node + Express + Drizzle)        (React + Vite)
```

---

## Step-by-Step Assignment

### Task 0: GitHub Project Board & Versioning Setup

Before writing any code, a professional developer aligns their work to a sprint board. This is how we organize tasks, prevent feature creep, and measure velocity.

#### 1. What is a GitHub Project Board?
A GitHub Project Board is a visual Kanban board consisting of columns representing stages of work:
* **Backlog:** The parking lot for all ideas, bugs, and future features. It is unsorted and represents long-term project requirements.
* **To Do (Sprint):** The specific tickets you commit to completing during the current phase (e.g., `v0.1.0 - Auth & CRUD`).
* **In Progress:** The tasks you are actively writing code for *right now*. Keep this to a maximum of 1 or 2 items to maintain focus.
* **Review/Testing:** Code is written, but needs manual validation, API testing, or peer review.
* **Done:** The work is complete, tested, and merged into the main development branch.

#### 2. What is a "Ticket" (Issue)?
A ticket represents a single unit of work. It should answer three questions:
1. **What** needs to be built? (Title & Description)
2. **Why** are we building it? (Context)
3. **How** do we know it works? (Acceptance Criteria)

#### 3. How to Set It Up:
1. **Create your Board:** Go to your GitHub profile or repository, select **Projects** (top navigation bar), click **New Project**, and select **Board**. Name it `CollabSpace Board`.
2. **Set up Columns:** Add or rename columns to: `Backlog`, `To Do`, `In Progress`, `Review/Testing`, and `Done`.
3. **Define the Version 0.1.0 Milestone:** 
   * In your GitHub repository, click on **Issues** -> **Milestones** -> **New Milestone**.
   * Name it `v0.1.0 - Auth & CRUD`. Add description: *"Initial stable release containing user authentication and single-user document management."*
4. **Create and Link Today's Tickets:**
   * Go to **Issues** in your repo, click **New Issue**, and write out your first ticket:
     * **Title:** `chore: repository, monorepo directory layout, and git initialization`
     * **Description:** .
     * **Milestone:** Associate with `v0.1.0 - Auth & CRUD`.
     * **Project:** Link to `CollabSpace Board`.Setup folders `/frontend` and `/backend`, initialize Git, and write `.gitignore`
   * Create two more issues using the same process:
     * `feat: backend node/express skeleton & postgresql (drizzle) connection`
     * `feat: frontend vite react skeleton & api client integration`
5. **Start your Sprint:** Go to your project board, locate the card for the git initialization task, and drag it into the **In Progress** column.

---

### Task 1: Monorepo Root & Git Initialization

Before writing code, establish version control boundaries.

1. **Initialize Git:** Open your terminal in the root directory `CollabSpace2/` and initialize git:
   ```bash
   git init
   ```
2. **Define Git Ignore rules:** Create a `.gitignore` file at the root. We must ensure we never commit `node_modules`, database secrets, or client builds.
   * Create `.gitignore` in the root directory and add:
     ```text
     # Dependency directories
     node_modules/
     jspm_packages/

     # Build outputs
     dist/
     build/

     # Environment variables (CRITICAL: never commit secrets)
     .env
     .env.local
     .env.development.local
     .env.test.local
     .env.production.local
     *.env

     # Docker local data volume
     postgres_data/

     # Debug logs
     npm-debug.log*
     yarn-debug.log*
     yarn-error.log*

     # OS Files
     .DS_Store
     Thumbs.db
     .vscode/
     .idea/
     ```

---

### Task 2: Backend Scaffold Setup (PostgreSQL + Drizzle ORM)

We are using **Drizzle ORM** with the **node-postgres (`pg`)** driver. Drizzle acts as a lightweight, SQL-like type-safe mapper that provides excellent transparency, minimal runtime overhead, and blazing speed.

1. **Create folders:** Inside the root directory, create a folder named `backend/`. Navigate inside it:
   ```bash
   mkdir backend
   cd backend
   ```
2. **Initialize npm:** Run `npm init -y` inside `/backend` to create your initial `package.json`.
3. **Install runtime dependencies:**
   ```bash
   npm install express pg drizzle-orm dotenv cors bcrypt jsonwebtoken zod
   ```
4. **Install devDependencies:**
   ```bash
   npm install -D nodemon drizzle-kit
   ```
5. **Configure Scripts:** Open `backend/package.json` and configure:
   ```json
   {
     "name": "backend",
     "version": "1.0.0",
     "description": "CollabSpace Express & Drizzle Backend API",
     "main": "src/server.js",
     "scripts": {
       "start": "node src/server.js",
       "dev": "nodemon src/server.js",
       "db:generate": "drizzle-kit generate",
       "db:migrate": "drizzle-kit migrate",
       "db:studio": "drizzle-kit studio"
     },
     "dependencies": {
       "bcrypt": "^5.1.1",
       "cors": "^2.8.5",
       "dotenv": "^16.4.5",
       "drizzle-orm": "^0.33.0",
       "express": "^4.19.2",
       "jsonwebtoken": "^9.0.2",
       "pg": "^8.12.0",
       "zod": "^3.23.8"
     },
     "devDependencies": {
       "drizzle-kit": "^0.24.2",
       "nodemon": "^3.1.4"
     }
   }
   ```
6. **Create Directory Layout:** Build the directory structure inside `backend/`:
   * `backend/src/`
   * `backend/src/config/`
   * `backend/src/controllers/`
   * `backend/src/db/` *(holds database config, connection pool, and schemas)*
   * `backend/src/middlewares/`
   * `backend/src/routes/`
   * `backend/src/services/`
   * `backend/src/utils/`

---

### Task 3: Database, Drizzle, & Environment Configuration

You need a PostgreSQL database instance running to connect your application to. Choose **one** of the two options below:

---

#### 🛠️ Option A: Local PostgreSQL Setup

##### Method 1: Using Docker (Recommended for Clean Development)
Docker keeps your machine clean by running PostgreSQL in an isolated container.
1. **Run the Postgres container:**
   ```bash
   docker run --name collab-pg -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=collabspace -p 5432:5432 -d postgres:16-alpine
   ```
2. **Verify it is running:** Run `docker ps` to verify that the container is active.
3. **Your `.env` Database URL:**
   ```env
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/collabspace"
   ```

##### Method 2: Native PostgreSQL Installation
If you prefer to install PostgreSQL directly onto Windows:
1. **Download & Install:** EnterpriseDB PostgreSQL (defaults to port `5432` and superuser `postgres`).
2. **Create the Database:** Open terminal or `psql` shell:
   ```bash
   psql -U postgres
   ```
   Inside SQL prompt:
   ```sql
   CREATE DATABASE collabspace;
   \q
   ```
3. **Your `.env` Database URL:**
   ```env
   DATABASE_URL="postgresql://postgres:your_installation_password@localhost:5432/collabspace"
   ```

---

#### ☁️ Option B: Cloud PostgreSQL Setup (Neon.tech / Free Managed Postgres)

If you prefer a zero-install cloud database:
1. **Sign Up:** Visit [Neon.tech](https://neon.tech/) and create a project named `CollabSpace`.
2. **Copy Connection String:** Copy the pooled connection string (includes `sslmode=require`).
3. **Your `.env` Database URL:**
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xYz12345@ep-cool-glade-a5w8h.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

---

#### Environment & Drizzle Files Setup

1. **Create `backend/.env`:**
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/collabspace"
   JWT_SECRET=super_secret_jwt_key_collabspace_2026
   JWT_EXPIRE=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```
2. **Create `backend/.env.example`:**
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?sslmode=require"
   JWT_SECRET=your_jwt_signing_secret
   JWT_EXPIRE=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```
3. **Create `backend/drizzle.config.js`:**
   ```javascript
   const { defineConfig } = require('drizzle-kit');
   require('dotenv').config();

   module.exports = defineConfig({
     schema: './src/db/schema.js',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       url: process.env.DATABASE_URL,
     },
   });
   ```

---

### Task 4: Connect Express to PostgreSQL via Drizzle

1. **Define Initial Schema (`backend/src/db/schema.js`):**
   ```javascript
   const { pgTable, serial, text, timestamp } = require('drizzle-orm/pg-core');

   // Baseline schema to test database migrations and connection
   const users = pgTable('users', {
     id: serial('id').primaryKey(),
     email: text('email').unique().notNull(),
     createdAt: timestamp('created_at').defaultNow().notNull(),
   });

   module.exports = { users };
   ```

2. **Create Database Client with Connection Pooling (`backend/src/db/index.js`):**
   ```javascript
   const { drizzle } = require('drizzle-orm/node-postgres');
   const { Pool } = require('pg');
   const schema = require('./schema');
   require('dotenv').config();

   // Setup connection pool
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.DATABASE_URL?.includes('sslmode=require')
       ? { rejectUnauthorized: false }
       : false,
   });

   // Drizzle ORM client instance
   const db = drizzle(pool, { schema });

   module.exports = { db, pool };
   ```

3. **Build Entry Point Server (`backend/src/server.js`):**
   ```javascript
   require('dotenv').config();
   const express = require('express');
   const cors = require('cors');
   const { pool } = require('./db/index');

   const app = express();

   // Middleware
   app.use(cors({
     origin: process.env.CLIENT_URL || 'http://localhost:5173',
     credentials: true,
   }));
   app.use(express.json());

   // Health check route
   app.get('/api/v1/health', (req, res) => {
     res.status(200).json({
       status: 'ok',
       message: 'Server is healthy',
       timestamp: new Date().toISOString(),
     });
   });

   const PORT = process.env.PORT || 5000;

   async function startServer() {
     try {
       // Query database time to verify connectivity
       const result = await pool.query('SELECT NOW()');
       console.log(`[Database] PostgreSQL connected successfully. DB Time: ${result.rows[0].now}`);

       app.listen(PORT, () => {
         console.log(`[Server] CollabSpace API is running on http://localhost:${PORT}`);
       });
     } catch (error) {
       console.error('[Database] Failed to connect to PostgreSQL:', error.message);
       process.exit(1);
     }
   }

   startServer();
   ```

---

### Task 5: Frontend Scaffold Setup (Vite + React)

Now set up the React client:
1. **Initialize React App with Vite:** From the root directory:
   ```bash
   npx create-vite frontend --template react
   ```
2. **Install base packages:**
   ```bash
   cd frontend
   npm install
   npm install axios react-router-dom @tanstack/react-query lucide-react clsx tailwind-merge
   ```
3. **Create `frontend/.env.example`:**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```
4. **Create `frontend/.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```
5. **Verify Dev Command:** Ensure `npm run dev` starts the client without errors.

---

## Verification Plan (Definition of Done)

You are done with Day 1 when you can execute the following verification checklist:

### 0. Verification of Project Board & Planning:
- [ ] GitHub Project Board (`CollabSpace Board`) exists with columns: `Backlog`, `To Do`, `In Progress`, `Review/Testing`, and `Done`.
- [ ] Milestone `v0.1.0 - Auth & CRUD` is created.
- [ ] Issues for today's work are documented and linked to the milestone.
- [ ] Issue #1 (`chore: repository, monorepo directory layout, and git initialization`) is in the **In Progress** column.

### 1. Verification of Migrations:
- [ ] Run `npm run db:generate` inside `/backend` (generates SQL migration files in `/backend/drizzle`).
- [ ] Run `npm run db:migrate` inside `/backend` (pushes the schema to PostgreSQL).

### 2. Verification of Backend API:
- [ ] Run `npm run dev` inside `/backend`.
- [ ] Console logs: `[Database] PostgreSQL connected successfully.` and `[Server] CollabSpace API is running on port 5000`.
- [ ] Request `GET http://localhost:5000/api/v1/health` via browser, curl, or Postman.
- [ ] Response returns status code `200 OK`:
  ```json
  {
    "status": "ok",
    "message": "Server is healthy"
  }
  ```

### 3. Verification of Frontend:
- [ ] Run `npm run dev` inside `/frontend`.
- [ ] Navigate to `http://localhost:5173`.
- [ ] The React + Vite page renders with zero console errors.

### 4. Git Check:
- [ ] Run `git status` from the root directory.
- [ ] Verify that `node_modules/`, `backend/.env`, and `frontend/.env` **do not** appear in untracked files.
- [ ] Commit:
  ```bash
  git add .
  git commit -m "feat: initialize monorepo, backend express postgres drizzle and frontend vite react"
  ```

---

## 🧠 Mental Model Check-in (Review & Revision)

#### 1. What is the difference between `drizzle-kit` and `drizzle-orm`?
* **`drizzle-orm`** is the runtime library you import into your Node.js application (`db.select()`, `db.insert()`). It builds and executes SQL queries.
* **`drizzle-kit`** is a development CLI tool used to inspect your schema files (`schema.js`), generate SQL migration files (`db:generate`), push migrations to the live database (`db:migrate`), and run the visual database browser (`db:studio`).

#### 2. Why does Drizzle use JavaScript objects to describe table fields, and how does this translate into raw PostgreSQL types?
* Drizzle acts as a declarative schema definition layer. When you write `pgTable('users', { id: serial('id').primaryKey() })`, Drizzle maps your JavaScript definitions directly to standard PostgreSQL data types (`SERIAL PRIMARY KEY`, `VARCHAR`, `TIMESTAMP`, `JSONB`).
* This enables full type inference in JavaScript/TypeScript and allows `drizzle-kit` to automatically generate exact SQL `CREATE TABLE` and `ALTER TABLE` statements.

#### 3. What is a database connection pool, and why is it preferred over opening a new database connection for every incoming HTTP request?
* Creating a new TCP/TLS connection to PostgreSQL takes CPU cycles and latency (~50-200ms per handshake).
* A **Connection Pool** (`new Pool()`) maintains a persistent group of open connections in memory. When an HTTP request comes in, Express borrows an already-open connection from the pool, executes the query in <5ms, and releases it back to the pool for the next request.

---

> **Next Step:**  
> Once you verify Day 1 tasks and drag your issue to **Review/Testing** / **Done**, say: **"Give me Day 2"** to build the complete Authentication Controller, User Model, and JWT Protected Middleware!
