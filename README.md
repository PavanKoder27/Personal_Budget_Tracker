# Budget Tracker (Advanced Edition)

A full‑stack personal & group finance platform featuring password + JWT authentication, recurring transaction engine, savings goals, financial health analytics, anomaly detection, and group settlement suggestions. Designed for extensibility, resilience, and a polished animated UI.

---
## Table of Contents
1. Core Value Proposition
2. High-Level Architecture
3. Tech Stack
4. Authentication Model (Password + JWT)
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
23. Documentation Suite
24. License / Notes

---
## 1. Core Value Proposition
Traditional budget apps track numbers; this platform adds proactive intelligence (health score, anomaly surfacing), automation (recurring templates), collaborative settling for groups, and motivational goal progress—secured with a simple password + JWT authentication model (no external identity provider, no OTP flow).

---
## 2. High-Level Architecture
```
frontend/ (React + TS + MUI)
  -> Auth context (password + JWT)
  -> Animated dashboard widgets
backend/ (Node.js Express + MongoDB)
  -> REST API under /api
  -> Auth middleware (auth)
  -> Recurrence materializer (interval scheduler)
  -> Streaming anomaly stats (Stats collection)
  -> Insights endpoints (health, checklist)
MongoDB (Mongoose schemas)
```
Runtime flow:
1. Client authenticates (password login → JWT).
2. Protected requests pass through `auth` middleware → `req.user` hydrated.
3. Business logic routes perform validation, persistence, analytics updates.
4. Background loop materializes recurring templates.
5. Frontend polls/refetches anomalies, health, goals for real‑time feel.

---
## 3. Tech Stack
- Backend: Node.js, Express 5, Mongoose 8, JWT
- Frontend: React 18, TypeScript, MUI 5, React Router, custom animated components
- Algorithms: Welford online variance, greedy net settlement, composite scoring
- Tooling: Nodemon (dev), Dotenv, ES features (no transpile backend)

---
## 4. Authentication Model (Password + JWT)
Single layer:
- Users register with name, email, password.
- Successful registration immediately returns a JWT.
- Subsequent logins return a new JWT (7d expiry by default).

Middleware contract (`auth`):
- Input: `Authorization: Bearer <JWT>`
- Output: `req.user` (Mongoose User doc)
- Behavior: Verifies JWT and attaches user or returns 401.

Security notes:
- Passwords hashed with bcrypt (12 rounds).
- JWT secret must be overridden in production (env: `JWT_SECRET`).
- Consider adding rate limiting & account lockout for brute force protection.

---
## 5. Data Models (Summarized)
User: name, email(unique), password(hash), profilePicture.
Transaction: user, type, amount, category, description, date, recurrence subdoc, template flags, anomaly subdoc.
Goal: user, name(unique per user), targetAmount, currentAmount, category, deadline, notes.
Stats: rolling mean/variance per (user, category, type).
Group: members, expenses (not fully expanded here).

---
## 6. Key Backend Modules & Algorithms
- `routes/transactions.js`: Inserts update Stats via Welford algorithm; anomalies flagged when amount > mean + 2σ + min sample threshold.
- `routes/goals.js`: Standard CRUD with unique composite index.
- `routes/insights.js`: Health & onboarding checklist aggregation queries.
- `routes/groups.js`: Net balance computation + greedy settlement.
- `server.js`: Boot, self‑check, recurrence interval, process-level safety handlers.

---
## 7. API Overview (Selected)
Auth:
- POST /api/auth/register → { token, user }
- POST /api/auth/login → { token, user }
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

All protected (except register/login) via `auth`.

---
## 8. Frontend Architecture & UI Patterns
Context Providers:
- AuthContext: Manages token state (JWT) + user profile.
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

Production build (frontend):
```
cd frontend
npm run build
```
The `frontend/build` output is intentionally git‑ignored; produce it during deployment.

---
## 15. Environment Variables
Backend `.env` (example):
```
MONGODB_URI=mongodb://localhost:27017/budgettrackr
JWT_SECRET=super-secret-change
PORT=5000
NODE_ENV=development
```

// (All third‑party identity provider code removed – only internal password + JWT auth remains.)

---
## 16. Running & Testing
Health Check: `GET /health` after backend start (self-check also logs).
Manual API Testing: Use curl or Postman with JWT token.
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
- Passwords never stored in plain text (bcrypt hash).
- JWT fallback secret required; fallback-string allowed only in dev.
- (Recommended) add rate limiting & account lockout to mitigate brute force.
- Input validation at registration / profile update.

---
## 19. Performance Notes
- Welford stats O(1) per transaction.
- Recurrence batching prevents lockups; could shard by user for scale.
- Indexes: `(recurrence.nextRunAt, user)` and `(user, name)` for goals; `(user, category, type)` for stats ensure targeted lookups.
- Minimal payload projection for profiles to reduce transfer size.

---
## 20. Deployment Considerations
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
  (Optional enhancement: add TOTP or WebAuthn second factor / MFA.)

---
## 22. Troubleshooting Guide
Issue: Server exits with code 1
- Check MongoDB reachable; ensure `MONGODB_URI` correct.
- Verify no duplicate port usage; fallback logic attempts alternate.

Issue: Anomalies not appearing
- Ensure at least 6 historical samples in the category.
- Large outlier must exceed mean + 2σ.

Issue: Recurring not materializing
- Verify `isTemplate=true` and `recurrence.active=true`.
- Ensure `nextRunAt <= now`.

---
## 23. Documentation Suite
Primary documentation lives under `docs/`.

| Document | Purpose |
|----------|---------|
| [`docs/SRS.md`](docs/SRS.md) | Formal Software Requirements Specification (functional & non-functional) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System, component, data, and sequence diagrams (Mermaid) |
| [`docs/TECHNICAL_GUIDE.md`](docs/TECHNICAL_GUIDE.md) | Developer-centric setup, conventions, extension notes |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | End-user onboarding & feature walkthrough |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Endpoint contracts, example requests & responses |

Update cadence: bump Version headings in each doc on material architectural or contract change. Keep README sections concise—defer deep dives to the above.

## 24. License / Notes
Internal project / educational reference. Replace placeholder decisions (interval scheduler, Gmail SMTP) before production use.

---
Happy building! Contributions & iterations welcome.
