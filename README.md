# CRSP — Community Resource Sharing Platform

**Borrow. Share. Build Community.**

A full-stack MERN application where users lend/borrow items temporarily, or give
items away permanently for free. Built as a college major project.

---

## 1. What's implemented (honestly)

**Fully working, connected to a real database, no placeholders:**
- JWT auth: register, login, logout (client-side token clear), forgot/reset password
  (dev-mode — see note below), protected routes, role-based authorization (user/admin)
- Full resource CRUD with image upload (local disk storage by default), ownership checks
- Search, filter (category / location / sharing mode / status / available-only),
  sort, pagination — all server-side, hitting the real database
- **Complete LEND/BORROW workflow** as a server-enforced state machine:
  `PENDING → ACCEPTED → COLLECTED → RETURNED` (plus `REJECTED`/`CANCELLED`)
- **Complete GIVEAWAY workflow** as a server-enforced state machine:
  `PENDING → ACCEPTED → HANDED_OVER` (permanent, terminal), with an
  **atomic, race-condition-safe accept operation** (see below) so two owners can't
  both successfully accept a claim on the same item
- Wishlist (add/remove/view, duplicate-proof)
- In-app notifications (DB-backed, read/unread, mark-as-read)
- Reviews/ratings, gated so you can only review a transaction you completed, once
- Reports (users report listings; admin resolves/removes)
- Database-backed chat between an owner and a requester with an active request
  (polling-based, not Socket.IO — see note below)
- **Two distinct dashboards with different options, as requested:**
  - **User dashboard** (`/dashboard`): profile summary (editable), live counts for
    incoming requests / my pending requests / wishlist / unread notifications, my
    resources, active borrowings, my giveaway listings, completed given-away and
    received items, a preview of pending sent requests, and a preview of recent
    notifications — all built from real aggregated database queries, not static data.
  - **Admin dashboard** (`/admin`, visible only to `role: 'admin'` accounts):
    platform-wide stats (total users, total resources, available now, active
    borrowings, completed giveaways, pending reports) plus three separate
    management tools regular users never see:
    - **User Management** (`/admin/users`) — suspend/reactivate/delete accounts
    - **Resource Management** (`/admin/resources`) — browse/search *every* listing
      on the platform and remove fake, duplicate, or inappropriate ones directly,
      independent of whether anyone reported them
    - **Reported Listings** (`/admin/reports`) — review and resolve user-submitted
      reports, optionally removing the reported listing

**Implemented with a documented limitation instead of a fake success message:**
- *Forgot password*: no email service is configured (would need a real SMTP/SES/etc.
  account). The reset token is generated, hashed and stored exactly as it would be in
  production, but instead of emailing it, the API returns it directly in the response
  in a `devResetToken` field so the whole flow is testable end-to-end. **Do not ship
  this to real users** — wire up an email provider (e.g. Nodemailer + SMTP, or SendGrid)
  and stop returning the token before deploying for real.
- *Chat*: implemented as database-backed messaging with 5-second polling, not
  Socket.IO. It works and persists, it's just not real-time push. Swapping in
  Socket.IO later is possible without changing the data model.
- *Image storage*: local disk storage under `backend/uploads/`, served statically.
  Cloudinary env vars are scaffolded in `.env.example` but not wired up — local
  storage is fully functional and needs zero external accounts, which is why it's
  the default for a student project.

---

## 2. Tech stack

- **Frontend**: React 18 + Vite, React Router 6, Axios, Bootstrap 5
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Images**: Multer (local disk storage)

---

## 3. Folder structure

```
crsp/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # business logic per resource
│   ├── middleware/         # auth, roles, error handling, upload
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── utils/               # generateToken, notify helper, seed, createAdmin
│   ├── uploads/             # uploaded images (created automatically)
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, ResourceCard, Loader, EmptyState, ...
    │   ├── pages/           # one file per route
    │   ├── services/api.js  # axios instance + auth interceptor
    │   ├── context/AuthContext.jsx
    │   ├── routes/ProtectedRoute.jsx
    │   ├── utils/getErrorMessage.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

---

## 4. Database design & relationships

| Model | Key fields | Relationships |
|---|---|---|
| **User** | name, email, password (hashed), phone, address, role, status | referenced by almost everything below |
| **Resource** | title, description, category, condition, images[], location, owner, sharingMode (`LEND`/`GIVEAWAY`), status, currentHolder, finalizedAt | `owner` → User, `currentHolder` → User |
| **BorrowRequest** | resource, requester, owner, status, message, dates | `resource` → Resource, `requester`/`owner` → User |
| **GiveawayRequest** | resource, requester, owner, status, message, confirmation flags | `resource` → Resource, `requester`/`owner` → User |
| **Review** | resource, reviewer, reviewee, rating, comment, transactionType, transactionId | tied to one BorrowRequest or GiveawayRequest, unique per (transaction, reviewer) |
| **Notification** | user, type, message, link, isRead, relatedResource | `user` → User |
| **Wishlist** | user, resource | unique per (user, resource) |
| **Report** | resource, reportedBy, reason, status, resolvedBy | `resource` → Resource |
| **Message** | resource, participants[2], sender, text | scopes a conversation to one resource + two users |

**Unified resource status model** (shared by both workflows so the frontend has one
set of states to render):

```
AVAILABLE → RESERVED → BORROWED → AVAILABLE            (lend/borrow cycle repeats)
AVAILABLE → RESERVED → HANDED_OVER                       (giveaway — terminal, permanent)
```

**Why giveaway claims can't double-accept:** `acceptGiveawayRequest` in
`giveawayController.js` uses
`Resource.findOneAndUpdate({ _id, status: 'AVAILABLE' }, { status: 'RESERVED', ... })`.
MongoDB executes that find-and-update as a single atomic operation. If two owners
(or two requests) race to accept, only the first one finds the resource still
`AVAILABLE`; the second gets `null` back and the controller returns a clean
409 "already claimed" error instead of corrupting state. The same pattern guards
the final `confirmHandover` transition to `HANDED_OVER`.

---

## 5. Windows / VS Code setup (PowerShell)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- MongoDB Community Server running locally (https://www.mongodb.com/try/download/community)
  — install it as a service, or run `mongod` manually in its own terminal.

### Step 1 — Get the code
Unzip this project, then open the `crsp` folder in VS Code.

### Step 2 — Backend setup
```powershell
cd crsp\backend
npm install
Copy-Item .env.example .env
```
Open `.env` and adjust if needed (defaults work for a local MongoDB on the default
port). At minimum, set `JWT_SECRET` to any long random string.

Start MongoDB (if not already running as a service):
```powershell
mongod
```

In a new terminal, seed some demo data (optional but recommended for your demo):
```powershell
cd crsp\backend
npm run seed
```
This creates 3 demo users (`alice@example.com` / `bob@example.com` / `carol@example.com`,
all with password `Password@123`) and 4 demo resources (mix of LEND and GIVEAWAY).

Create an admin account:
```powershell
$env:ADMIN_EMAIL="admin@crsp.local"
$env:ADMIN_PASSWORD="Admin@12345"
npm run seed:admin
```
**Log in and change this password immediately** — it's only safe because it's local.

Start the backend:
```powershell
npm run dev
```
It runs on `http://localhost:5000`. Visit `http://localhost:5000/api/health` to confirm.

### Step 3 — Frontend setup
```powershell
cd crsp\frontend
npm install
Copy-Item .env.example .env
npm run dev
```
It runs on `http://localhost:5173`. Open that URL in your browser.

### Troubleshooting
- **"MongoDB connection error"** → make sure `mongod` is running, or that the MongoDB
  service is started (`Get-Service MongoDB` in PowerShell, `Start-Service MongoDB` if stopped).
- **CORS errors in the browser console** → make sure `CLIENT_URL` in `backend/.env`
  matches the URL the frontend is actually running on.
- **Images don't show** → confirm `VITE_UPLOADS_URL` in `frontend/.env` points at the
  backend (`http://localhost:5000` by default), and that the backend is running.
- **"Not authorized, token invalid or expired"** → log out and log back in; tokens
  expire after `JWT_EXPIRES_IN` (7 days by default).

---

## 6. API reference

All endpoints are prefixed with `/api`. Protected endpoints require
`Authorization: Bearer <token>`.

### Auth (`/auth`)
| Method | Endpoint | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | Public | name, email, password, confirmPassword, phone, address | Duplicate email rejected |
| POST | `/login` | Public | email, password | Returns `{ user, token }` |
| GET | `/me` | Private | — | Current user |
| POST | `/forgot-password` | Public | email | Returns `devResetToken` (no email service configured) |
| POST | `/reset-password/:token` | Public | password, confirmPassword | |

### Users (`/users`)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| PUT | `/profile` | Private | multipart/form-data, `avatar` field optional |
| PUT | `/change-password` | Private | currentPassword, newPassword |
| GET | `/:id` | Private | Public-safe view (name, avatar, joined date) |
| GET | `/` | Admin | List all users |
| PUT | `/:id/status` | Admin | `{ status: 'active'|'suspended' }` |
| DELETE | `/:id` | Admin | |

### Resources (`/resources`)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/` | Public | Query: `q, category, location, sharingMode, status, availableOnly, sort, page, limit, owner` |
| POST | `/` | Private | multipart/form-data, up to 5 `images` |
| GET | `/:id` | Public | |
| PUT | `/:id` | Owner/Admin | Locked once RESERVED/BORROWED/etc. |
| DELETE | `/:id` | Owner/Admin | Soft delete; blocked for owners while an active transaction is in progress — admin can override this for moderation |
| DELETE | `/:id/images` | Owner | `{ imagePath }` |
| GET | `/admin/all` | Admin | Lists every resource for the Resource Management screen; `?q=&category=&sharingMode=&status=&page=&limit=` |

### Borrow requests (`/borrow-requests`)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/` | Private | `{ resourceId, message, requestedFrom, requestedTo }` |
| GET | `/` | Private | `?role=requester|owner&status=` |
| PUT | `/:id/accept` | Owner | Auto-rejects other pending requests |
| PUT | `/:id/reject` | Owner | |
| PUT | `/:id/cancel` | Requester | |
| PUT | `/:id/collect` | Owner | Resource → BORROWED |
| PUT | `/:id/return` | Owner | Resource → AVAILABLE |

### Giveaway requests (`/giveaway-requests`)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/` | Private | `{ resourceId, message }` |
| GET | `/` | Private | `?role=requester|owner&status=` |
| PUT | `/:id/accept` | Owner | **Atomic**; 409 if already claimed; auto-rejects others |
| PUT | `/:id/reject` | Owner | |
| PUT | `/:id/cancel` | Requester | Frees the resource if it was RESERVED |
| PUT | `/:id/confirm-handover` | Owner | **Terminal** — resource → HANDED_OVER permanently |
| PUT | `/:id/confirm-receipt` | Requester | Optional secondary confirmation |

### Notifications (`/notifications`)
GET `/`, PUT `/:id/read`, PUT `/read-all` — all Private.

### Wishlist (`/wishlist`)
GET `/`, POST `/` (`{ resourceId }`), DELETE `/:resourceId` — all Private.

### Reviews (`/reviews`)
POST `/` (`{ transactionType: 'BORROW'|'GIVEAWAY', transactionId, rating, comment }`) —
only after RETURNED/HANDED_OVER, one per transaction.
GET `/user/:userId` and GET `/resource/:resourceId` — Public.

### Messages (`/messages`)
GET `/` (list my conversations), POST `/` (`{ resourceId, recipientId, text }`),
GET `/:resourceId/:otherUserId` (thread history) — all Private, restricted to
actual participants with an active request on that resource.

### Reports (`/reports`)
POST `/` (`{ resourceId, reason, details }`) — Private.
GET `/` and PUT `/:id` (`{ status, resolutionNote, removeResource }`) — Admin.

### Dashboard (`/dashboard`)
GET `/` — Private, current user's stats and lists.
GET `/admin` — Admin, platform-wide stats.

### Error format
Every error response is `{ success: false, message: "..." }` with an appropriate
HTTP status code (400/401/403/404/409/500).

---

## 7. Manual testing checklist

**Authentication**
- [ ] Register with a new email → succeeds, logs you in
- [ ] Register with an existing email → rejected with clear message
- [ ] Register with mismatched passwords → rejected
- [ ] Login with wrong password → "Invalid email or password"
- [ ] Visiting `/dashboard` while logged out → redirected to `/login`
- [ ] Forgot password → reset link works, new password logs in

**Resources**
- [ ] Add a LEND resource with images → appears in Browse
- [ ] Add a GIVEAWAY resource → shows FREE badge, no price shown anywhere
- [ ] Edit your own resource → saves
- [ ] Try editing someone else's resource via API → 403
- [ ] Delete your own resource → disappears from listings
- [ ] Search by keyword → returns matching titles/descriptions only
- [ ] Filter by category / location / sharing mode → results match
- [ ] Filter "available only" → RESERVED/BORROWED items excluded

**Borrowing**
- [ ] Request to borrow → owner sees it under Incoming Requests
- [ ] Try to borrow your own item → rejected
- [ ] Owner accepts → resource becomes RESERVED, other pending requests auto-rejected
- [ ] Owner marks Collected → resource becomes BORROWED
- [ ] Owner confirms Return → resource becomes AVAILABLE again, borrower can review
- [ ] Requester cancels a pending request → status becomes CANCELLED

**Giveaway (the core feature)**
- [ ] Create a GIVEAWAY listing → FREE badge, AVAILABLE status
- [ ] Filter Browse by "Free Giveaway" → item appears
- [ ] Request to claim → owner sees it under Incoming Requests
- [ ] Try to claim your own item → rejected
- [ ] Owner accepts one requester → resource RESERVED, other pending requests auto-rejected
- [ ] Owner confirms handover → resource becomes HANDED_OVER **permanently**
- [ ] Confirm the resource does NOT return to AVAILABLE after handover
- [ ] Confirm a second claim attempt on a HANDED_OVER item is rejected
- [ ] **Race condition test**: open two browser tabs as two different owners... actually,
      since only the resource owner can accept, simulate the race by firing two
      `PUT /giveaway-requests/:id/accept` calls back-to-back (e.g. via curl or Postman)
      for two different pending requests on the same resource — confirm only one
      succeeds and the second gets a 409.

**Admin**
- [ ] Non-admin hitting `/admin` → redirected
- [ ] Admin can suspend a user → that user can no longer log in
- [ ] Admin can resolve/remove a reported listing

Test with curl/Postman example:
```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice@example.com\",\"password\":\"Password@123\"}"
```

---

## 8. Security notes

- Passwords hashed with bcrypt (never stored/returned in plain text)
- JWT required on all private routes via `protect` middleware
- Role-based `authorize('admin')` middleware on admin-only routes
- Ownership checks on every update/delete (resource, requests)
- `.env` is git-ignored; only `.env.example` (no real secrets) is committed
- Giveaway acceptance and handover use atomic, condition-guarded MongoDB updates
  to prevent concurrent double-claims
