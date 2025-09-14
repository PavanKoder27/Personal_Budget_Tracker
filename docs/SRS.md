# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This SRS defines the requirements for the Budget Tracker application, a full-stack web system enabling individuals and groups to record financial transactions, manage category budgets, analyze spending, and settle shared expenses.

### 1.2 Scope
The system provides:
- User registration & authentication (password + JWT)
- CRUD for transactions, budgets, goals, and groups
- Financial insights (health score, anomaly detection, recurring transactions)
- Group expense settlement suggestions
- Responsive React UI with Material-UI styling

### 1.3 Definitions & Acronyms
| Term | Definition |
|------|------------|
| JWT | JSON Web Token used for stateless authentication |
| Recurring Template | A transaction definition that generates future transactions based on a schedule |
| Anomaly | Transaction flagged as statistically unusual using rolling mean + variance |
| Health Score | Composite score evaluating financial habits (savings rate, adherence, volatility, discretionary balance) |

### 1.4 References
- `des.txt` original requirements document
- `README.md` project overview
- `FEATURES.md` feature expansion details

## 2. Overall Description
### 2.1 Product Perspective
This is a standalone web application (SPA + REST API). The backend exposes JSON endpoints; frontend consumes them via Axios. MongoDB provides persistence. No external identity provider.

### 2.2 Product Functions (High Level)
- Authenticate: register / login / logout
- Manage Transactions (CRUD, recurrence, anomaly awareness)
- Manage Budgets (category allocations & progress)
- Manage Goals (savings targets)
- Group Expense Handling (create groups, compute settlements)
- Insights & Reporting (health score, anomalies, checklist)

### 2.3 User Classes
| User Type | Description | Privileges |
|-----------|-------------|------------|
| Standard User | Individual managing personal finances | All personal CRUD, goals, budgets |
| Group Participant | User added to a group | View/add group transactions, view settlements |
| (Future: Admin) | Elevated management & moderation | System metrics, user management |

### 2.4 Operating Environment
- Backend: Node.js 18+, Express 5, MongoDB 6+
- Frontend: React 18 (create-react-app stack), modern browsers (Chrome/Firefox/Edge latest)
- Deployment Targets: Container, Render/Netlify (frontend build), Any Node hosting + Mongo service

### 2.5 Design & Implementation Constraints
- Single Mongo database (no sharding assumed)
- In-memory scheduler for recurrence (non-distributed)
- JWT secret must be provided for production
- No guaranteed email facility (mailer removed)

### 2.6 Assumptions & Dependencies
| Assumption | Impact if False |
|------------|----------------|
| Stable MongoDB connectivity | API failures; degraded UX |
| Limited concurrent users (dev scale) | Recurrence scheduler might lag under high volume |
| Users trust browser local storage for JWT | Need alt storage (cookies) for security enhancements |

## 3. System Features & Requirements
### 3.1 Authentication
| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-1 | Users can register with name, email, password. | High |
| AUTH-2 | Users can login and receive JWT (7d expiry). | High |
| AUTH-3 | Authenticated requests validated via `Authorization: Bearer <token>`. | High |
| AUTH-4 | System rejects invalid credentials with 400. | High |

### 3.2 Transactions
| ID | Requirement | Priority |
|----|-------------|----------|
| TX-1 | Create expense or income transaction with type, amount, date, category. | High |
| TX-2 | Edit/delete own transactions. | High |
| TX-3 | Filter by date range, category, type. | Medium |
| TX-4 | Support recurring templates generating future transactions. | High |
| TX-5 | Flag anomalies using streaming statistics. | Medium |

### 3.3 Budgets
| ID | Requirement | Priority |
|----|-------------|----------|
| BUD-1 | Create monthly category budgets with limits. | High |
| BUD-2 | View progress bars vs. spending. | High |
| BUD-3 | Alert when spending exceeds limit. | Medium |

### 3.4 Goals
| ID | Requirement | Priority |
|----|-------------|----------|
| GOAL-1 | Define savings goals (target amount, optional deadline). | Medium |
| GOAL-2 | Track progress and mark completion at 100%. | Medium |
| GOAL-3 | Display urgency when deadline near. | Low |

### 3.5 Groups & Settlement
| ID | Requirement | Priority |
|----|-------------|----------|
| GRP-1 | Create groups with members. | High |
| GRP-2 | Record shared expenses. | High |
| GRP-3 | Compute settlement suggestions (transfer list). | Medium |
| GRP-4 | (Future) Materialize settlement payments automatically. | Low |

### 3.6 Insights & Analytics
| ID | Requirement | Priority |
|----|-------------|----------|
| INS-1 | Show financial health score with components. | Medium |
| INS-2 | Provide anomaly list for recent transactions. | Medium |
| INS-3 | Provide onboarding checklist tasks & progress. | Low |

### 3.7 Non-Functional Requirements
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Availability (dev) | >= 99% uptime local session |
| NFR-2 | Response time (common APIs) | < 300ms p95 |
| NFR-3 | Security | Bcrypt password hashing, JWT validation |
| NFR-4 | Scalability | Vertical (single instance) baseline |
| NFR-5 | Maintainability | Modular routes & models, documented README |
| NFR-6 | Observability | Basic logs for requests & scheduler heartbeats |

## 4. External Interface Requirements
### 4.1 API Interfaces
REST JSON with standard HTTP methods. See API Reference for endpoint list.

### 4.2 UI Interfaces
Responsive SPA: navigation to Dashboard, Transactions, Budgets, Goals, Groups, Reports, Profile.

### 4.3 Hardware Interfaces
None (browser client + server host only).

### 4.4 Software Interfaces
- MongoDB driver via Mongoose
- Node crypto/bcrypt for hashing

## 5. System Models (Overview)
- ER Concepts: User, Transaction, Goal, Budget, Group, Stats.
- Sequence: Login -> Token -> /auth/me -> Protected route.

(Full diagrams in `ARCHITECTURE.md`).

## 6. Validation & Acceptance Criteria
| Feature | Acceptance Test |
|---------|-----------------|
| Register | POST `/api/auth/register` returns 201 + token + user JSON. |
| Login | POST `/api/auth/login` returns 200 + token; invalid creds => 400. |
| Recurrence | Template with past `nextRunAt` materializes a concrete transaction within 60s. |
| Anomaly | Large outlier after >=6 samples flagged with anomaly metadata. |
| Group Settlement | GET `/api/groups/:id/settlements/suggest` returns non-empty `transfers` when imbalanced. |

## 7. Future Enhancements
- WebSockets/SSE for real-time anomaly pushes
- MFA (TOTP/WebAuthn)
- Export/import (CSV/JSON)
- Automated allocation to goals
- Distributed recurrence worker & job queue

## 8. Appendices
### Appendix A: Risk Table
| Risk | Mitigation |
|------|------------|
| Single point scheduler | External worker / queue later |
| JWT theft (localStorage) | Consider httpOnly cookies, CSRF defenses |
| Large anomaly noise | Tune z-score threshold or add category min variance gate |

---
Version: 1.0 (Generated)  
Maintainer: Auto-generated baseline – refine as project evolves.
