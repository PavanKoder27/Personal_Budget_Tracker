# Architecture & Design

## 1. High-Level System Overview
The Budget Tracker is a classic SPA + REST API stack:
- Browser (React SPA) communicates with Express backend via JSON.
- MongoDB persists domain entities.
- A lightweight in-process scheduler handles recurring transaction materialization.

```mermaid
flowchart LR
  subgraph Client[Browser SPA]
    UI[React Components]
    Ctx[Contexts: Auth / Theme / Notifications]
    APIService[Axios Service]
  end

  subgraph Server[Node.js Express]
    Routes[Routes: auth, tx, goals, groups, budgets, insights]
    MW[Auth Middleware]
    Scheduler[Recurrence Scheduler]
    Anomaly[Anomaly / Stats Engine]
  end

  DB[(MongoDB)]

  UI --> APIService --> Routes
  Routes --> MW --> DB
  Routes --> Anomaly --> DB
  Scheduler --> Routes
```

## 2. Component Structure (Frontend)
```mermaid
flowchart TD
  App[App.tsx] --> Layout
  Layout --> Nav[Navigation / Theme Toggle]
  Layout --> Pages
  Pages --> Dashboard
  Pages --> Transactions
  Pages --> Budgets
  Pages --> Goals
  Pages --> Groups
  Pages --> Reports
  Pages --> Profile
  App --> AuthContext
  App --> ThemeContext
  App --> NotificationContext
  Dashboard --> HealthGauge & AnomalyBanner & GoalsSnapshot
  Transactions --> TransactionForm & TransactionList
```

## 3. Backend Module Diagram
```mermaid
flowchart LR
  server.js --> authRoute
  server.js --> txRoute
  server.js --> goalsRoute
  server.js --> groupsRoute
  server.js --> budgetsRoute
  server.js --> insightsRoute
  authRoute --> UserModel
  txRoute --> TransactionModel & StatsModel
  goalsRoute --> GoalModel
  groupsRoute --> GroupModel
  budgetsRoute --> BudgetModel
  insightsRoute --> StatsModel & TransactionModel & GoalModel
  Recurrence[Recurrence Engine] --> TransactionModel
  AnomalyEngine[Anomaly Logic] --> StatsModel
```

## 4. Data Model Overview
```mermaid
erDiagram
  USER ||--o{ TRANSACTION : owns
  USER ||--o{ GOAL : sets
  USER ||--o{ BUDGET : allocates
  USER ||--o{ GROUP : memberOf
  GROUP ||--o{ TRANSACTION : includes
  TRANSACTION ||--o| TRANSACTION : generatedFrom
  TRANSACTION ||--o| STATS : updates

  USER {
    string name
    string email
    string passwordHash
    string profilePicture
  }
  TRANSACTION {
    string userId
    enum type
    number amount
    string category
    date date
    object recurrence
    bool isTemplate
    string generatedFrom
    object anomaly
  }
  GOAL {
    string userId
    string name
    number targetAmount
    number currentAmount
    date deadline
    string notes
  }
  BUDGET {
    string userId
    string category
    number limit
    date month
  }
  GROUP {
    string name
    string[] memberIds
    object[] expenses
  }
  STATS {
    string userId
    string category
    string type
    number count
    number mean
    number M2
  }
```

## 5. Key Sequences
### 5.1 Login Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend (React)
  participant BE as Backend (Express)
  participant DB as MongoDB

  U->>FE: Submit email/password
  FE->>BE: POST /api/auth/login
  BE->>DB: findOne(User by email)
  DB-->>BE: User doc
  BE->>BE: verify password & sign JWT
  BE-->>FE: { token, user }
  FE->>FE: store token (localStorage)
  FE-->>U: Navigate to dashboard
```

### 5.2 Recurring Transaction Materialization
```mermaid
sequenceDiagram
  participant Scheduler
  participant BE as Backend Logic
  participant DB as MongoDB

  Scheduler->>DB: Query due templates (nextRunAt <= now)
  DB-->>Scheduler: List templates
  loop for each template
    Scheduler->>DB: Insert concrete transaction
    Scheduler->>DB: Update template nextRunAt / occurrencesLeft
  end
```

### 5.3 Anomaly Detection on Insert
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Transactions Route
  participant DB as MongoDB
  participant Stats as Stats Logic

  FE->>API: POST /api/transactions
  API->>DB: Insert transaction
  API->>Stats: update rolling mean/variance
  Stats->>API: anomaly? true/false + metadata
  API->>DB: update transaction with anomaly field (if any)
  API-->>FE: transaction (with anomaly info)
```

## 6. Deployment View
Single-process Node server + CRA dev server (or static build behind reverse proxy). For production: build frontend once, serve via CDN or static hosting, point to API domain with CORS allowed.

## 7. Cross-Cutting Concerns
| Concern | Approach |
|---------|----------|
| Auth | JWT Bearer, middleware validates and attaches `req.user` |
| Validation | Inline checks (could extend with schema lib later) |
| Security | Bcrypt hashing, secret-based JWT, CORS open (tighten in prod) |
| Observability | Heartbeat logs, request logs, anomaly & register/login logs |
| Scheduling | In-process `setInterval` (upgrade path: job queue) |

## 8. Known Limitations & Future
| Area | Limitation | Future Direction |
|------|------------|------------------|
| Scheduler | Single instance only | External worker / queue (BullMQ) |
| Auth Storage | localStorage token | HttpOnly cookie + refresh token flow |
| Anomalies | Basic z-score heuristic | Adaptive thresholds & category baselines |
| Groups | Settlement suggestion only | Persist & automate settlement postings |
| Budgets | Simple monthly cap | Rolling averages, predictive variance |

---
Version: 1.0  
Update this file as architecture evolves.
