# Technical Guide

## 1. Purpose
A practical companion for developers working on the Budget Tracker. Covers environment setup, architecture reasoning, code conventions, and extension patterns.

## 2. Stack Summary
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + MUI |
| State (local) | React Context (Auth / Theme / Notification) |
| HTTP | Axios (central API service) |
| Backend | Node.js + Express 5 |
| Persistence | MongoDB (Mongoose 8 models) |
| Auth | JWT (access token only) |
| Scheduling | In-process interval for recurring transactions |
| Analytics | Rolling statistics (Welford) + anomaly tagging |

## 3. Environment Setup
### 3.1 Prerequisites
- Node.js >= 18
- MongoDB instance (local or Atlas)
- npm (bundled with Node)

### 3.2 Backend
```
cd backend
cp .env.example .env   # if present (else create manually)
# Edit .env:
MONGODB_URI=mongodb://localhost:27017/budget_tracker
JWT_SECRET=change_me_dev_secret
PORT=5000
NODE_ENV=development

npm install
npm run dev
```

### 3.3 Frontend
```
cd frontend
cp .env.local.example .env.local  # if added later; current repo: ensure REACT_APP_API_URL present
REACT_APP_API_URL=http://localhost:5000/api

npm install
npm start
```

Frontend runs on 3000; API proxied via explicit env URL.

## 4. Folder Structure Rationale
| Path | Notes |
|------|-------|
| `backend/models` | Mongoose schemas, each independent & lean |
| `backend/routes` | Thin Express routers calling model operations + domain logic |
| `backend/middleware` | Auth layering + composite JWT/clerk placeholder removed |
| `backend/utils` | Cross-cutting helpers (mailer removed post-OTP) |
| `frontend/src/components` | Page-level & reusable UI primitives |
| `frontend/src/context` | React contexts (auth, notifications, theming) |
| `frontend/src/services/api.ts` | Single Axios instance & dynamic base discovery |
| `frontend/src/types` | Shared TypeScript domain interfaces |

## 5. Data Flow
1. User action triggers component handler.
2. Component calls API service method (`api.ts`) with JWT auto-attached.
3. Express route validates auth (if protected) & performs DB ops.
4. Transaction creation triggers stat update & anomaly tagging.
5. Response surfaces to component -> state -> UI.

## 6. Authentication Deep Dive
- Registration: stores bcrypt hash (work factor from bcryptjs default 10). No email verification currently.
- Login: On success returns `{ token, user }`.
- Storage: `localStorage` (simple; susceptible to XSS if introduced). Future: switch to HttpOnly cookie pair (access+refresh).
- Middleware: Extracts `Authorization: Bearer <token>`, verifies, fetches user, sets `req.user`.

## 7. Recurring Transactions Engine
- Implemented via `setInterval` in `server.js` (or a helper) scanning for due templates.
- Each template: `isTemplate: true`, recurrence descriptor (frequency, nextRunAt, optional remaining count).
- On trigger: inserts concrete child transaction with `generatedFrom` field for traceability.
- Caveat: Horizontal scaling would duplicate execution; requires distributed lock or external scheduler (e.g., Redis + BullMQ).

## 8. Anomaly Detection Method
- Maintains rolling statistics per (userId, category, type) in `Stats` collection: `count`, `mean`, `M2` (sum of squared diffs) via Welford.
- After each transaction: compute stddev = sqrt(M2/(count-1)). If abs(amount - mean) > k * stddev (k default 3) => mark transaction anomaly.
- Stored as `transaction.anomaly = { zScore, baselineMean, baselineStdDev, flaggedAt }`.
- Cold Start: Fewer than 3 samples => never flag.

## 9. Groups & Settlement Logic
- Group maintains members + expenses each with payer & splits.
- Settlement algorithm (planned/partial): Greedy netting of balances to minimize transfers. Future step: persist suggestions.

## 10. Budgets & Goals
- Budgets: monthly category limit; enforcement currently advisory (UI shows remaining; backend can add guard later).
- Goals: target accumulation; progress updated via contributions (transactions tagged or explicit endpoint).

## 11. Error Handling Strategy
| Layer | Pattern |
|-------|---------|
| Routes | Try/catch inline; respond JSON `{ error: message }` |
| Auth | Early returns with 400/401 codes |
| Frontend | Axios interceptor logs; component-level toast / alert via NotificationContext |

## 12. Logging & Observability
- Backend prints: request method+path, login diagnostics, heartbeat.
- Suggested Enhancement: Add correlation IDs (UUID v4) propagated through responses.
- Metrics TODO: Count anomalies, average response time, recurrence job stats.

## 13. Testing Strategy (Proposed)
| Scope | Tool | Status |
|-------|------|--------|
| Unit (models, utils) | Jest | Not implemented |
| Integration (auth, tx) | Supertest + in-memory Mongo | Partial (see existing integration test) |
| Frontend components | React Testing Library | Not implemented |
| E2E | Playwright/Cypress | Not implemented |

Adopt incremental approach: start with auth & transactions core flows.

## 14. Security Review Snapshot
| Aspect | Current State | Risk | Action |
|--------|---------------|------|--------|
| Password Storage | bcrypt hash | Low | Tune cost factor for production |
| JWT Secret | .env plain | Medium | Rotate & secure via vault |
| Token Storage | localStorage | Medium | Move to HttpOnly cookie |
| Input Validation | Minimal | Medium | Add schema validation (Zod / Joi) |
| Rate Limiting | None | High | Introduce express-rate-limit |
| CORS | Likely permissive | Medium | Restrict origins in prod |

## 15. Performance Considerations
- Indices: Ensure indices on `userId`, `date`, `(userId, category)` for stats queries.
- Batch Stats: Current per-transaction updates O(1); fine at moderate scale.
- Pagination: Add `limit/skip` (or cursor) for large transaction histories (future).

## 16. Extension Points
| Area | Extension Idea |
|------|----------------|
| Auth | Refresh tokens, social login providers |
| Analytics | Forecasting (ARIMA-lite / moving averages) |
| Notifications | Webhooks / Email (reintroduce mailer with provider abstraction) |
| Export | CSV / XLSX generation endpoint |
| Mobile | React Native client sharing API layer |

## 17. Coding Conventions
- Use async/await; avoid promise chains.
- Keep route handlers <= ~60 lines; extract helpers if more.
- Consistent response shapes: success objects vs `{ error }` for failures.
- Prefer pure functions in utilities; side effects localized.

## 18. Operational Playbook
| Scenario | Action |
|----------|--------|
| Mongo down | API 500s; restart DB, inspect logs, add retry w/ backoff |
| JWT secret rotated | Invalidate existing tokens; force relogin |
| High latency | Profile slow Mongo queries; add indices |
| Duplicate recurrence inserts | Implement distributed lock or idempotency key |

## 19. Deployment Notes
- Build frontend: `npm run build` (in `frontend`) -> static bundle.
- Serve static separately (NGINX / S3) or integrate via Express static middleware (copy `build` folder to backend and mount).
- Configure environment via process env; do not bake secrets into frontend.

## 20. Migration Log (Auth Simplification)
- Removed Clerk & OTP (email, code fields, mailer usage).
- JWT only; simplified login/registration; docs & features updated.

---
Version: 1.0 – Update as system evolves.
