# Requirements Traceability Matrix
Source: `des.txt` (Original project description & plan) → Implemented artifacts & notes.

## Legend
Status Codes:
- DONE: Implemented in current codebase.
- PARTIAL: Some aspects implemented; refinement pending.
- FUTURE: Not yet implemented (roadmap).

## 1. Objectives Mapping
| Original Objective | Key Details (des.txt) | Implementation Artifact(s) | Status | Notes |
|--------------------|------------------------|----------------------------|--------|-------|
| Daily Financial Entry Logging | Add/edit/delete income & expense | `routes/transactions.js`, React `TransactionForm`, `TransactionList` | DONE | Supports CRUD; filtering partially implemented via query params. |
| Category-Based Budget Setting | Define monthly budgets & real-time tracking | `routes/budgets.js`, UI `Budgets.tsx` | DONE | Real-time bar logic handled client-side via fetched totals. |
| Data Visualization | Bar, pie, trend lines | `Reports.tsx`, `DashboardWorking.tsx` | PARTIAL | Core summaries; full chart suite depends on present components (some charts may be placeholders). |
| Financial Summaries & Insights | Monthly savings, overspending alerts | `routes/insights.js` | DONE | Health scoring + anomaly and budget pressure planned/partially in insights. |
| Data Storage & Management | Structured DB | Mongoose models (`models/*.js`) | DONE | Index tuning future improvement. |
| Optional Auth & Sync | Basic login/logout | `routes/auth.js`, frontend AuthContext | DONE | JWT only; no sync/export yet. |
| Group Expense Management | Split expenses, balances, settlements | `routes/groups.js`, `Groups.tsx` | PARTIAL | Settlement suggestions logic referenced; full persistence of settlements future. |

## 2. Key Features Mapping
| Feature | Sub-Requirement | Implementation | Status | Notes |
|---------|-----------------|----------------|--------|-------|
| Transaction Management | CRUD + filter/search | Back: `transactions.js`; Front filters partial | PARTIAL | Advanced text search not fully exposed yet. |
| Category-Based Budgeting | Monthly budgets & alerts | `budgets.js` + UI | DONE | Overspend alert via comparison logic client side. |
| Dashboard & Visual Reports | Income vs Expense, category pie, trends | `DashboardWorking.tsx` | PARTIAL | Some visualization abstractions require chart lib confirmation. |
| Search & Filters | Keyword/category/date | Backend query params | PARTIAL | Keyword search limited; add text index future. |
| Secure Storage | Cloud/local + encryption (optional) | MongoDB + bcrypt password | PARTIAL | At-rest encryption not implemented; relies on Mongo security. |
| (Optional) Authentication | Sign-up/Login | Implemented (JWT) | DONE | No MFA, no email verification. |
| Group Expense Handling | Splits + balances + settlements | `groups.js` | PARTIAL | Automated settlement recording future. |

## 3. Data Model Requirements
| Entity | Fields in Spec | Implemented | Status | Notes |
|--------|---------------|-------------|--------|-------|
| Users | name, email, password | `models/User.js` | DONE | Additional profile fields minimal. |
| Transactions | amount, type, category, date, notes | `models/Transaction.js` | DONE | Extended with recurrence, anomaly, generatedFrom. |
| Budgets | category, limit, month | `models/Budget.js` | DONE | User scoping included. |
| Goals | name, target, current, deadline | `models/Goal.js` | DONE | category optional; progress logic simple. |
| Groups | members, expenses | `models/Group.js` | DONE | Settlement suggestion algorithm external to model. |
| Stats (Derived) | rolling mean/variance | `models/Stats.js` | DONE | Not in original spec—added for anomaly feature. |

## 4. Non-Functional (Derived from Plan)
| NFR | Implementation | Status | Notes |
|-----|---------------|--------|-------|
| Responsiveness | MUI + responsive layout | PARTIAL | Needs audit for mobile breakpoints. |
| Data Privacy | Password hashing | PARTIAL | JWT only; no PII encryption. |
| Ease of Use | Simplified forms & dashboard | PARTIAL | Needs user testing metrics. |
| Reliability | Heartbeat & basic logging | PARTIAL | Lacks structured logs & retries. |
| Scalability | Stateless API, Mongo collections | PARTIAL | Recurrence scheduler single-instance constraint. |

## 5. Plan Phase Deliverables
| Deliverable | Implemented Location | Status | Notes |
|------------|----------------------|--------|-------|
| SRS | `docs/SRS.md` | DONE | Added beyond minimal spec. |
| Wireframes | (Not committed) | FUTURE | Could add `/docs/wireframes` if produced. |
| ER Diagram | `docs/ARCHITECTURE.md` | DONE | Mermaid ER. |
| Class/Flow Diagrams | `docs/ARCHITECTURE.md` sequences | DONE | Includes login, recurrence, anomaly. |
| Tech Stack Finalization | README & `TECHNICAL_GUIDE.md` | DONE | --- |

## 6. Advanced / Added Features (Not in Original)
| Feature | Justification |
|---------|--------------|
| Anomaly Detection | Proactive insight into unusual spending. |
| Financial Health Scoring | Composite metric for user guidance. |
| Onboarding Checklist | Improves initial engagement & retention. |
| Recurring Engine | Automation reduces manual entry burden. |

## 7. Gaps & Future Work
| Gap | Recommendation |
|-----|---------------|
| Visualization completeness | Implement missing charts (trend line, category pie) using Chart.js or Recharts. |
| Settlement persistence | Add endpoint to commit suggested settlements as transactions. |
| Export/Import | Provide CSV/JSON export; import mapper with validation. |
| Rate Limiting & Brute Force Protection | Add `express-rate-limit` and account lockout thresholds. |
| Token Refresh Flow | Introduce short-lived access + refresh token rotation. |
| Mobile Optimization | Add viewport meta & responsive layout refinements. |
| Advanced Search | Text index on notes + category, fuzzy search option. |
| Automated Tests | Add Jest + Supertest coverage for auth, transactions, budgets, groups. |
| Observability | Structured logging (pino) + metrics (Prometheus). |

## 8. Traceability Coverage Summary
| Category | Total Items | Implemented (Full/Partial) | Outstanding |
|----------|-------------|----------------------------|-------------|
| Core Functional | 7 | 5 Full / 2 Partial | 0 Not Started |
| Key Features | 7 | 3 Full / 4 Partial | 0 Not Started |
| Data Models | 6 | 6 Full | 0 |
| NFRs | 5 | 0 Full / 5 Partial | 0 Not Started (need maturation) |
| Plan Deliverables | 5 | 4 Full / 0 Partial | 1 (Wireframes) |

## 9. Change Log (Documentation Phase)
| Date | Change | Files |
|------|--------|-------|
| YYYY-MM-DD | Added formal SRS | `docs/SRS.md` |
| YYYY-MM-DD | Added architecture diagrams | `docs/ARCHITECTURE.md` |
| YYYY-MM-DD | Added technical & user guides | `docs/TECHNICAL_GUIDE.md`, `docs/USER_GUIDE.md` |
| YYYY-MM-DD | Added API reference | `docs/API_REFERENCE.md` |
| YYYY-MM-DD | README cross-link section | `README.md` |

(Replace YYYY-MM-DD with actual commit dates if maintaining manually or automate via script.)

## 10. Verification Strategy Summary
| Requirement Type | Verification Method |
|------------------|--------------------|
| CRUD Operations | API manual tests / future Jest integration tests |
| Budgets | Create + exceed scenario test case |
| Recurrence | Set past `nextRunAt`, observe materialization log |
| Anomalies | Insert baseline series + outlier; assert anomaly flag |
| Groups | Create group, add expenses, verify balance computation |

---
Version: 1.0 – Maintain alongside functional evolution.
