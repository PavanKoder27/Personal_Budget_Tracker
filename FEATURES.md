# Budget Tracker Feature Guide

This document supplements the existing `des.txt` (kept unchanged) and explains the newly added functionality and how to use it in both the UI and via API.

> NOTE: All new backend endpoints are under the `/api` prefix and are protected by the hybrid Clerk/JWT middleware (you must be authenticated with either legacy JWT token `Authorization: Bearer <token>` or a valid Clerk session header).

## 1. Recurring Transactions (Template Based)
Create a **template transaction** that generates future concrete transactions automatically.

### UI
Open the transaction form -> click **"🧩 Make This A Recurring Template"** -> configure:
- Frequency: daily / weekly / monthly / yearly / custom (every N days)
- Interval: e.g. every 2 weeks
- Occurrences (optional): limit number of generations
- End Date (optional): stop after date
- Active / Paused toggle

The first `nextRunAt` is derived from the chosen Date field. A background scheduler (server interval every minute) materializes due occurrences and advances `nextRunAt`.

### API (POST /api/transactions)
```json
{
  "type": "expense",
  "amount": 50,
  "category": "Bills & Utilities",
  "description": "Internet Plan",
  "date": "2025-09-14",
  "isTemplate": true,
  "recurrence": {
    "active": true,
    "frequency": "monthly",
    "interval": 1,
    "occurrencesLeft": null,
    "endDate": null,
    "nextRunAt": "2025-09-14T00:00:00.000Z"  // optional; server can infer
  }
}
```
Concrete generated transactions have `generatedFrom` pointing to the template `_id`.

## 2. Savings Goals
Track progress towards savings targets with category & optional deadline.

### UI
Navigate to Dashboard or Goals panel section (embedded). Create a goal with:
- Name (unique per user)
- Target Amount
- Current Amount (starting progress)
- Category (optional)
- Deadline (optional) -> badge flags urgency when <= 14 days
- Notes (optional)

Progress bars animate and a badge shows when goal reaches 100%.

### API
- `GET /api/goals` list
- `POST /api/goals` body: `{ name, targetAmount, currentAmount?, category?, deadline?, notes? }`
- `PUT /api/goals/:id` update any field
- `DELETE /api/goals/:id`

## 3. Financial Health Score
Composite score (0–1) combining:
- Savings Rate (35%)
- Budget Adherence (25%)
- Volatility Inverse (20%) – compares last 2–3 month expense stability
- Discretionary Balance (20%) – lower discretionary ratio is better

### UI
Dashboard radial gauge (color shifts greener > 70%). Recommendations appear as chips if under thresholds.

### API
`GET /api/insights/health`
Returns:
```json
{
  "score": 0.74,
  "components": [
    { "key": "savingsRate", "value": 0.22, "weight": 0.35 },
    { "key": "budgetAdherence", "value": 0.6, "weight": 0.25 },
    { "key": "volatilityInverse", "value": 0.8, "weight": 0.2 },
    { "key": "discretionaryBalance", "value": 0.7, "weight": 0.2 }
  ],
  "recommendations": ["Increase savings rate above 10% by reducing discretionary outflows."]
}
```

## 4. Anomaly Detection
Each new expense updates a rolling Welford mean & variance per (user, category, type). A transaction is flagged anomalous when:
```
amount > mean + 2 * stdDev  AND count > 5
```
Flagged transactions receive:
```json
"anomaly": { "isAnomaly": true, "score": 2.8, "reason": "Amount 900 exceeds mean (420.33) + 2σ (255.11)" }
```

### UI
A dismissible animated banner surfaces recent anomalies (top 3, plus count of remainder). Expand to see reason snippets and jump to reports.

### API
`GET /api/transactions/anomalies` – last 30 days (up to 50 entries).

## 5. Group Settlement Optimizer
Computes minimal payment suggestions to settle balances inside a group by netting positive/negative balances greedily.

### API
`GET /api/groups/:id/settlements/suggest`
Response example:
```json
{
  "transfers": [
    { "from": "USER_A", "to": "USER_B", "amount": 42.5 },
    { "from": "USER_A", "to": "USER_C", "amount": 18.0 }
  ]
}
```
(Frontend UI wiring placeholder—extend Groups component to display and optionally materialize transfers.)

## 6. Onboarding Checklist
Guides new users through first actions: first transaction, budget, goal, group, inviting (placeholder) member.

### API
`GET /api/insights/checklist` -> `{ tasks: [{key,done}], progress }`

### UI (Planned)
Can integrate as progress bar or chips (foundation endpoint available).

## 7. Hybrid Authentication (Clerk + Legacy JWT)
Protected routes accept either a valid Clerk session (token stored in `clerkToken`) or classic JWT token. Middleware short-circuits if `req.user` is already populated.

### Headers Priority
1. Clerk (if present) -> user ensured/created (with `clerkId` field).
2. Fallback JWT (Authorization header).

## 8. Data Model Extensions (Summary)
| Model | Additions | Purpose |
|-------|-----------|---------|
| Transaction | `recurrence`, `isTemplate`, `generatedFrom`, `anomaly` | Scheduling & anomaly tagging |
| Goal | New model | Savings targets |
| Stats | New model per (user, category, type) | Streaming mean/variance |
| User | `clerkId` | Hybrid identity mapping |

## 9. Scheduled Recurrence Engine
A simple `setInterval` (1 min) scans for due templates by `recurrence.nextRunAt <= now`, creates a concrete transaction, advances `nextRunAt`, decrements `occurrencesLeft`, and deactivates when exhausted or past `endDate`.

## 10. Frontend Components Added
- `TransactionForm` recurrence section
- `GoalsPanel` (CRUD + progress animations)
- Dashboard health gauge + goals snapshot + anomaly banner

## 11. Quick Testing Tips
1. Create a recurring template with a date in the past and short interval to observe materialization soon.
2. Insert several regular expenses in a category, then add a large outlier to trigger an anomaly.
3. Create multiple goals; verify urgent badge when deadline within 14 days.
4. Call `/api/insights/health` before/after adding budgets & transactions to see score shifts.

## 12. Future Enhancements (Safe Backlog)
- Apply settlement suggestions automatically (persist transfers)
- Auto-allocation of surplus to goals (`autoAllocate` stub)
- Per-goal contribution suggestions based on health score
- UI for onboarding checklist tasks
- Export anomalies CSV

---
**Version:** Feature layer updated September 2025
