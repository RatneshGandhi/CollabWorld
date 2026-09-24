# Day 4: JWT Route Protection, Auth Middleware & User Profile (`/auth/me`)

> **Phase:** 1 — Foundation & Authentication  
> **Date:** September 24, 2026  
> **Milestone:** `v0.1.0 - Auth & CRUD` (Checkpoint 2: Full Auth Complete)  
> **Git Feature Branch:** `feat/auth-middleware-and-profile`  
> **Suggested Commit:** `feat: implement jwt auth middleware and get current user profile endpoint`

---

## 🌿 Professional Engineering Rule: Feature Branching

Starting today, **we never commit new features directly to `main`**.

Professional software teams use **Feature Branching**:
1. `main` always represents stable, deployable production code.
2. Every new feature is developed in an isolated branch: `feat/<feature-name>`.
3. The branch is tested, committed, pushed to GitHub, and merged into `main`.

For today's work, our branch is:
```bash
git checkout -b feat/auth-middleware-and-profile
```

---

## 🔥 A Word of Motivation for Day 4

> *"Small disciplines repeated with consistency every day lead to great achievements gained slowly over time."* — John C. Maxwell

**Look at how far you've traveled in just 3 days:**
- You set up the monorepo, Docker PostgreSQL, and Drizzle ORM.
- You built the error handling architecture and generic Zod validation.
- Yesterday, you wrote salted bcrypt hashing, JWT issuance, and registration/login controllers.

Today is a milestone day. We are completing **Checkpoint 2: The Complete Authentication Layer**.

By the end of today, your API will be able to lock down any private route in your application with a single middleware: `authMiddleware`. Unauthorized visitors without a token will be stopped cold, while authenticated users will have their verified identities attached to `req.user`.

Let's build Day 4! 🛡️

---

## Today's Objectives

1. Create and switch to feature branch `feat/auth-middleware-and-profile`.
2. Update the **GitHub Project Board** (Move Day 3 tickets to `Done`, add Day 4 tickets).
3. Build a **JWT Verification Utility** (`verifyToken`) with defensive expiration and signature checking.
4. Implement the **`authMiddleware` Gatekeeper** to extract the `Bearer <token>` header, verify the signature, ensure the user still exists in PostgreSQL, and attach `req.user`.
5. Implement the **`getMe` Controller & Route (`GET /api/v1/auth/me`)** to return the currently logged-in user's profile.
6. Test all 4 edge cases: Missing token (401), Malformed token (401), Expired token (401), and Valid token (200).
7. Push the feature branch to GitHub and merge it cleanly into `main`.

---

## Architecture Flow: How Protected Routes Work

```
[ Client Request: GET /api/v1/auth/me ]
(Header: Authorization: Bearer eyJhbGciOi...)
       │
       ▼
[ authMiddleware (The Gatekeeper) ]
       │
       ├── 1. Check Header exists? ─────────(Missing)──────────▶ [ 401 "Authentication token required" ]
       │
       ├── 2. Extract Token ───────────────(Malformed)────────▶ [ 401 "Invalid token format" ]
       │
       ├── 3. jwt.verify(token, secret) ───(Expired/Tampered)──▶ [ 401 "Token expired or invalid" ]
       │
       ├── 4. Query DB: users.id == decoded.id
       │          │
       │          └──(User deleted from DB)───────────────────▶ [ 401 "User no longer exists" ]
       │
       ▼ (Valid & Verified)
Attach `req.user = { id, name, email, createdAt }`
Call `next()`
       │
       ▼
[ Protected Controller: getMe ]
       │
       ▼
[ 200 OK Response: { success: true, user: req.user } ]
```

---

## Step-by-Step Assignment

### Task 0: Feature Branch & GitHub Project Board Setup

#### 1. Create and checkout the feature branch:
Open your terminal in the root directory:
```bash
# Ensure you are on latest main
git checkout main

# Create and switch to the new feature branch
git checkout -b feat/auth-middleware-and-profile
```

Verify your active branch:
```bash
git branch
# * feat/auth-middleware-and-profile
#   main
```

#### 2. Update your GitHub Project Board:
1. Open [`CollabWorld Board`](https://github.com/RatneshGandhi/CollabWorld).
2. Move Day 3 cards to **Done**:
   * `feat: create password hashing and jwt token utilities` ➔ **Done**
   * `feat: define zod validation schemas for auth endpoints` ➔ **Done**
   * `feat: implement user registration controller and duplicate check` ➔ **Done**
   * `feat: implement user login controller with credential verification` ➔ **Done**
   * `feat: mount auth routes under /api/v1/auth and verify with postman` ➔ **Done**
3. Create today's tickets in **To Do** linked to Milestone `v0.1.0 - Auth & CRUD`:
   * `feat: create jwt verification helper utility`
   * `feat: build authMiddleware to protect private routes`
   * `feat: implement GET /api/v1/auth/me profile endpoint`
   * `test: verify token edge cases (missing, expired, malformed, valid)`
4. Drag the first ticket to **In Progress**.

---

### Task 1: JWT Verification Helper (`verifyToken.js`)

In Day 3, we built `generateToken.js`. Now we need the counterpart to verify and decode incoming tokens safely.

Create `backend/src/utils/verifyToken.js`:

```javascript
import jwt from 'jsonwebtoken';

/**
 * Verifies a JWT token against the server secret
 * @param {string} token - Raw JWT token string
 * @returns {Object} Decoded token payload (e.g. { id, email, iat, exp })
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};
```

---

### Task 2: The `authMiddleware` Gatekeeper

The `authMiddleware` intercepts incoming requests for protected routes. It performs four essential security checks:
1. Checks for the `Authorization: Bearer <token>` header.
2. Strips the `"Bearer "` prefix.
3. Cryptographically validates the token with `verifyToken`.
4. Queries PostgreSQL to verify that the user still exists (in case the account was deleted or revoked after token generation).
5. Attaches the clean user object to `req.user`.

Create `backend/src/middlewares/authMiddleware.js`:

```javascript
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { verifyToken } from '../utils/verifyToken.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and follows "Bearer <token>" format
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Reject if token is missing
  if (!token) {
    throw new AppError('Authentication required. Please log in to access this resource.', 401);
  }

  // 3. Verify token signature and expiration
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid authentication token. Please log in again.', 401);
  }

  // 4. Verify user still exists in database
  const [currentUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, decoded.id))
    .limit(1);

  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  // 5. Grant access: attach user object to request
  req.user = currentUser;
  next();
});
```

---

### Task 3: The User Profile Controller (`getMe`)

Now we build the controller for `GET /api/v1/auth/me`. Because `protect` already fetched and verified `req.user`, this controller is blazing fast and completely secure:

Open `backend/src/controllers/authController.js` and append the `getMe` function:

```javascript
/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user was populated by protect middleware
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
```

---

### Task 4: Mount the Protected Route

Open `backend/src/routes/authRoutes.js` and:
1. Import `protect` from `../middlewares/authMiddleware.js`.
2. Import `getMe` from `../controllers/authController.js`.
3. Add `router.get('/me', protect, getMe);`.

Here is the complete `backend/src/routes/authRoutes.js`:

```javascript
import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Protected routes
router.get('/me', protect, getMe);

export default router;
```

---

## Verification Plan (Definition of Done)

Let's test all 4 scenarios using Postman, Thunder Client, or curl:

### Test 1: Missing Token (Expected: `401 Unauthorized`)
* **Request:** `GET http://localhost:5000/api/v1/auth/me`
* **Headers:** *(None)*
* **Expected Response:**
  ```json
  {
    "success": false,
    "status": "fail",
    "message": "Authentication required. Please log in to access this resource."
  }
  ```

### Test 2: Invalid / Tampered Token (Expected: `401 Unauthorized`)
* **Request:** `GET http://localhost:5000/api/v1/auth/me`
* **Headers:** `Authorization: Bearer invalidtoken12345`
* **Expected Response:**
  ```json
  {
    "success": false,
    "status": "fail",
    "message": "Invalid authentication token. Please log in again."
  }
  ```

### Test 3: Valid Token (Expected: `200 OK`)
1. Log in via `POST /api/v1/auth/login` and copy the returned `token`.
2. Send: `GET http://localhost:5000/api/v1/auth/me`
3. **Headers:** `Authorization: Bearer <PASTE_YOUR_TOKEN_HERE>`
4. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "id": 1,
         "name": "Ratnesh Gandhi",
         "email": "ratnesh@collabspace.dev",
         "createdAt": "2026-09-23T..."
       }
     }
   }
   ```
   *(Notice that the password hash is completely excluded!)*

---

## 🌿 Git Feature Branch Workflow: Commit, Push & Merge

Now that your feature is fully verified, complete the professional Git cycle:

### 1. Stage and commit on your feature branch:
```bash
git status
git add .
git commit -m "feat: implement jwt auth middleware and get current user profile endpoint"
```

### 2. Push the feature branch to GitHub:
```bash
git push -u origin feat/auth-middleware-and-profile
```

### 3. Merge the feature branch into `main`:
```bash
# Switch back to main
git checkout main

# Merge the feature branch
git merge feat/auth-middleware-and-profile

# Push the updated main to GitHub
git push origin main
```

*(Optional: You can keep the feature branch or delete it locally using `git branch -d feat/auth-middleware-and-profile`)*

---

## 🧠 Mental Model Check-in (Review Questions)

#### 1. Why is the `Authorization: Bearer <token>` header format the industry standard?
* The word `Bearer` signifies the authentication scheme (RFC 6750). It means: *"The bearer of this token is granted access to the associated identity."* Specifying the scheme allows servers to support multiple auth methods on the same API (e.g., `Bearer`, `Basic`, `ApiKey`).

#### 2. If JWT tokens are cryptographically signed, why do we still query PostgreSQL in `authMiddleware`?
* JWT signatures prove that the token was signed by our server and has not expired.
* However, a token could be valid for 7 days, but the user's account might have been **deleted, banned, or revoked** 5 minutes ago. Checking `db.select().from(users).where(eq(users.id, decoded.id))` ensures deleted or suspended users cannot continue calling protected endpoints with active tokens.

#### 3. How does `req.user` benefit downstream controllers?
* By attaching `currentUser` to `req.user` in the middleware, every subsequent controller (e.g., creating documents, editing documents, deleting documents) has instant access to `req.user.id` without having to parse headers or query the user table again.

---

> **Checkpoint 2 Complete! 🏆**  
> You now have a complete, secure, production-grade Authentication System:
> - Password Hashing (`bcrypt`)
> - Token Generation & Verification (`jwt`)
> - Input Validation (`zod`)
> - Registration (`/auth/register`)
> - Login (`/auth/login`)
> - Route Guard (`protect` middleware)
> - Profile (`/auth/me`)
>
> Say: **"Give me Day 5"** to begin **Phase 3: The Document Model & Document CRUD APIs**!
