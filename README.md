# Budget Tracker (Advanced Edition)

A full‑stack personal & group finance platform featuring hybrid authentication (Clerk + JWT + email OTP verification), recurring transaction engine, savings goals, financial health analytics, anomaly detection, and group settlement suggestions. Designed for extensibility, resilience, and a polished animated UI.

---
## Table of Contents
1. Core Value Proposition
2. High-Level Architecture
3. Tech Stack
4. Authentication Model (Hybrid + OTP)
5. Data Models
6. Key Backend Modules & Algorithms
7. API Overview
8. Frontend Architecture & UI Patterns
9. Recurring Transaction Engine Internals
10. Anomaly Detection (Streaming Stats)
11. Financial Health Scoring
12. Group Settlement Optimizer
13. Onboarding Checklist Logic
14. Development Setup
15. Environment Variables
16. Running & Testing
17. Error Handling & Observability
18. Security Considerations
19. Performance Notes
20. Deployment Considerations
21. Roadmap / Future Enhancements
22. Troubleshooting Guide
23. License / Notes

---
## 1. Core Value Proposition
Traditional budget apps track numbers; this platform adds proactive intelligence (health score, anomaly surfacing), automation (recurring templates), collaborative settling for groups, and motivational goal progress—all wrapped in a hybrid auth system allowing gradual migration to a managed identity provider.

---
## 2. High-Level Architecture
```
frontend/ (React + TS + MUI)
  -> Auth context (JWT or Clerk)
  -> Animated dashboard widgets
backend/ (Node.js Express + MongoDB)
  -> REST API under /api
  -> Hybrid auth middleware (clerkOrJwt)
  -> Recurrence materializer (interval scheduler)
  -> Streaming anomaly stats (Stats collection)
  -> Insights endpoints (health, checklist)
MongoDB (Mongoose schemas)
```
Runtime flow:
1. Client authenticates (JWT login, Clerk, or OTP→JWT).
2. Protected requests pass through `clerkOrJwt` middleware → `req.user` hydrated.
3. Business logic routes perform validation, persistence, analytics updates.
4. Background loop materializes recurring templates.
5. Frontend polls/refetches anomalies, health, goals for real‑time feel.

---
## 3. Tech Stack
- Backend: Node.js, Express 5, Mongoose 8, JWT, Clerk SDK, Nodemailer
- Frontend: React 18, TypeScript, MUI 5, React Router, custom animated components
- Algorithms: Welford online variance, greedy net settlement, composite scoring
- Tooling: Nodemon (dev), Dotenv, ES features (no transpile backend)

---
## 4. Authentication Model (Hybrid + OTP)
Three complementary layers:
- Clerk (managed identity). If `CLERK_SECRET_KEY` set, tokens verified first.
- Legacy JWT (fallback) for existing users and OTP-issued sessions.
- Email OTP (registration + optional login) — generates hashed code, time‑boxed validity, attempt limits.

Middleware contract (`clerkOrJwt`):
- Input: `Authorization: Bearer <token>` (either Clerk or legacy JWT)
- Output: `req.user` (Mongoose User doc), `req.authSource` in {clerk|jwt}
- Behavior: Clerk verification attempt → fallback to JWT. If both fail: 401.

Registration + OTP verify flow:
1. POST `/api/auth/register` creates unverified user + sends OTP (6 digits, 10 min expiry).
2. User submits `/api/auth/verify-otp` with `{ userId, code }`.
3. On success: `isVerified=true`, JWT returned.
4. Login blocks (`423 Locked`) until verified.

Resend guard: 60s throttle; attempt guard: 5 invalid attempts → require resend.

---
## 5. Data Models (Summarized)
User: name, email(unique), password(hash), clerkId(optional), otpHash(+expires, attempts), isVerified, profilePicture.
Transaction: user, type, amount, category, description, date, recurrence subdoc, template flags, anomaly subdoc.
Goal: user, name(unique per user), targetAmount, currentAmount, category, deadline, notes.
Stats: rolling mean/variance per (user, category, type).
Group: members, expenses (not fully expanded here).

---
## 6. Key Backend Modules & Algorithms
- `middleware/clerkOrJwt.js`: Hybrid chain; opportunistic Clerk linking by email.
- `routes/transactions.js`: Inserts update Stats via Welford algorithm; anomalies flagged when amount > mean + 2σ + min sample threshold.
- `routes/goals.js`: Standard CRUD with unique composite index.
- `routes/insights.js`: Health & onboarding checklist aggregation queries.
- `routes/groups.js`: Net balance computation + greedy settlement.
- `server.js`: Boot, self‑check, recurrence interval, process-level safety handlers.

---
## 7. API Overview (Selected)
Auth:
- POST /api/auth/register → { needsVerification, userId }
- POST /api/auth/verify-otp → { token, user }
- POST /api/auth/resend-otp
- POST /api/auth/login → JWT (if verified)
- POST /api/auth/request-otp → email login code
- POST /api/auth/login-otp → JWT (one-time code path)
- GET  /api/auth/me

Transactions / Anomalies:
- POST /api/transactions
- GET  /api/transactions/anomalies

Goals:
- CRUD under /api/goals

Insights:
- GET /api/insights/health
- GET /api/insights/checklist

Groups:
- GET /api/groups/:id/settlements/suggest

Budgets: (Existing legacy endpoints under /api/budgets)

All protected (except register/login/otp endpoints) via `clerkOrJwt`.

---
## 8. Frontend Architecture & UI Patterns
Context Providers:
- AuthContext: Manages token state (JWT or Clerk) + user profile.
- ThemeContext: Light/dark & dynamic toggling.
- NotificationContext: Snackbars/toasts.

Components Highlights:
- TransactionForm: Recurrence configuration with conditional inputs.
- GoalsPanel: Animated progress bars, urgency badges, optimistic updates.
- DashboardWorking: Health gauge (SVG radial), anomaly banner (collapsible), goals snapshot.
- AnimatedButton & AnimatedBackground: Micro-interaction polish.

Patterns:
- TypeScript interfaces in `types/index.ts` unify backend contract.
- API abstraction layer `services/api.ts` centralizes fetch logic.
- Progressive disclosure (recurrence form section appears only when toggled active).

---
## 9. Recurring Transaction Engine Internals
Loop (every 60s):
1. Query templates: `isTemplate && recurrence.active && nextRunAt <= now` (batch limit 50).
2. For each template: create concrete transaction with `generatedFrom` pointer.
3. Advance `nextRunAt` based on frequency + interval.
4. Decrement `occurrencesLeft`; deactivate when 0 or past endDate.
5. Log each materialization `[RECUR]`.

Design Decisions:
- Interval chosen over cron to stay portable and simple.
- Batch limiting protects DB under backlog conditions.
- Future: promote to distributed worker / queue for scale.

---
## 10. Anomaly Detection (Streaming Stats)
Maintains rolling mean & variance without storing full history.
Welford update on new amount `x`:
```
count += 1
Delta = x - mean
mean += Delta / count
Delta2 = x - mean
M2 += Delta * Delta2
variance = count > 1 ? M2 / (count - 1) : 0
stdDev = Math.sqrt(variance)
```
Threshold Rule: `x > mean + 2 * stdDev` and `count > 5` → mark anomaly with reason & z‑score approx.

Benefits:
- O(1) update cost
- Numerically stable for large counts

---
## 11. Financial Health Scoring
Weighted components (normalized 0–1):
- Savings Rate (35%)
- Budget Adherence (25%)
- Volatility Inverse (20%)
- Discretionary Balance (20%)
Final score = Σ(weight * componentValue). Recommendations emitted when components below heuristic thresholds.

---
## 12. Group Settlement Optimizer
Computes net balance per member: contributions - share. Two pointers (largest creditor, largest debtor) matched greedily until one zeroes out; repeat. Complexity O(n log n) for sorting + O(n) iterations.

---
## 13. Onboarding Checklist Logic
Checklist tasks derived from counts (transactions, budgets, goals, groups) with progress ratio = completed / total tasks. Endpoint returns structured task array enabling flexible frontend rendering (chips, progress bar, etc.).

---
## 14. Development Setup
Prerequisites: Node 18+, MongoDB local instance (or remote URI), npm.

Install:
```
cd backend
npm install
cd ../frontend
npm install
```

Run (dev):
```
# Backend (port 5000 default)
npm run dev
# Frontend (typically port 3000)
npm start
```

---
## 15. Environment Variables
Backend `.env` (example):
```
MONGODB_URI=mongodb://localhost:27017/budgettrackr
JWT_SECRET=super-secret-change
CLERK_SECRET_KEY=sk_test_...
GMAIL_USER=yourgmail@gmail.com
GMAIL_PASS=app-password
PORT=5000
```

Frontend may require Clerk publishable key if Clerk UI widgets introduced later.

---
## 16. Running & Testing
Health Check: `GET /health` after backend start (self-check also logs).
Manual API Testing: Use curl or Postman with JWT or Clerk token.
Recurring Engine: Set a template `nextRunAt` = past timestamp to observe quick materialization.
Anomaly: Enter 6+ similar expenses, then a large outlier.

---
## 17. Error Handling & Observability
- Central Express error handler returns standardized `{ message, error }`.
- Process-level listeners for `unhandledRejection`, `uncaughtException` to log root causes.
- Lightweight request log excluding `/health` to reduce noise.
- Heartbeat log every 30s confirms liveness in logs.

---
## 18. Security Considerations
- Passwords hashed (bcrypt 12 rounds).
- OTP codes never stored in plain text (bcrypt hash + expiration + attempt counter).
- Clerk token verification only when secret present (feature toggle safe).
- JWT fallback secret required; fallback-string allowed only in dev.
- Email resend throttling + attempt limit reduce brute force window.
- Input validation at registration / profile update.

---
## 19. Performance Notes
- Welford stats O(1) per transaction.
- Recurrence batching prevents lockups; could shard by user for scale.
- Indexes: `(recurrence.nextRunAt, user)` and `(user, name)` for goals; `(user, category, type)` for stats ensure targeted lookups.
- Minimal payload projection for profiles to reduce transfer size.

---
## 20. Deployment Considerations
- Provide real SMTP provider in production (avoid Gmail limits).
- Replace interval scheduler with dedicated worker or cron in container/orchestrator.
- Enforce HTTPS + secure cookie (if migrating to cookie-based auth later).
- Centralized logging & metrics (e.g., pino + Prometheus exporter) recommended for scale.
- Add rate limiting middleware for auth and transactions endpoints.

---
## 21. Roadmap / Future Enhancements
- Goal auto-allocation engine using surplus detection.
- Checklist UI component with progress gamification.
- Group settlement execution (persist transfers as transactions).
- Export / import data (CSV, JSON).
- Budget variance predictive alerts.
- WebSockets or SSE for live anomaly pushes.
- Multi-factor across Clerk + internal OTP fallback.

---
## 22. Troubleshooting Guide
Issue: Server exits with code 1
- Check MongoDB reachable; ensure `MONGODB_URI` correct.
- Verify no duplicate port usage; fallback logic attempts alternate.

Issue: OTP emails not received
- Confirm `GMAIL_USER/PASS` or switch to a production SMTP.
- Check logs for `[MAILER][DRYRUN]` (means missing credentials).

Issue: Anomalies not appearing
- Ensure at least 6 historical samples in the category.
- Large outlier must exceed mean + 2σ.

Issue: Recurring not materializing
- Verify `isTemplate=true` and `recurrence.active=true`.
- Ensure `nextRunAt <= now`.

Issue: Login blocked (423)
- Complete `/api/auth/verify-otp` for the user.

---
## 23. License / Notes
Internal project / educational reference. Replace placeholder decisions (interval scheduler, Gmail SMTP) before production use.

---
Happy building! Contributions & iterations welcome.
