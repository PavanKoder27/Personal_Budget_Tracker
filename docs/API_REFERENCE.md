# API Reference
Base URL: `http://localhost:5000/api`
Authentication: Bearer JWT in `Authorization` header for protected routes.
Content-Type: `application/json` unless stated.

## Auth
### POST /auth/register
Request:
```json
{ "name": "Alice", "email": "alice@example.com", "password": "Secret123" }
```
Responses:
- 201 Created:
```json
{ "token": "<jwt>", "user": { "_id": "...", "name": "Alice", "email": "alice@example.com" } }
```
- 400 Error (duplicate / validation): `{ "error": "Email already registered" }`

### POST /auth/login
Request:
```json
{ "email": "alice@example.com", "password": "Secret123" }
```
Success 200:
```json
{ "token": "<jwt>", "user": { "_id": "...", "name": "Alice", "email": "alice@example.com" } }
```
Errors:
- 400 `{ "error": "Invalid credentials" }`

### GET /auth/me (Protected)
Headers: `Authorization: Bearer <jwt>`
Success:
```json
{ "_id": "...", "name": "Alice", "email": "alice@example.com" }
```

## Transactions
### POST /transactions (Protected)
Create a transaction.
```json
{
  "type": "expense",   // or "income"
  "amount": 42.5,
  "category": "Food",
  "date": "2024-05-01",
  "notes": "Lunch",
  "recurrence": { "frequency": "monthly", "interval": 1 }  // optional
}
```
Response 201:
```json
{
  "_id": "...",
  "type": "expense",
  "amount": 42.5,
  "category": "Food",
  "date": "2024-05-01T00:00:00.000Z",
  "userId": "...",
  "anomaly": null,
  "recurrence": { "frequency": "monthly", "interval": 1, "nextRunAt": "..." }
}
```

### GET /transactions (Protected)
Query params: `?limit=50&offset=0&from=2024-05-01&to=2024-05-31&category=Food`
Response 200: array of transaction objects.

### PATCH /transactions/:id (Protected)
Partial update.
```json
{ "amount": 50 }
```

### DELETE /transactions/:id (Protected)
204 No Content.

## Budgets
### POST /budgets (Protected)
```json
{ "category": "Food", "limit": 400, "month": "2024-05-01" }
```
### GET /budgets (Protected)
Returns budgets for user (optionally filter by `month=`).
### PATCH /budgets/:id (Protected)
Update fields.
### DELETE /budgets/:id (Protected)
Remove budget.

## Goals
### POST /goals
```json
{ "name": "Emergency Fund", "targetAmount": 5000, "deadline": "2024-12-31", "notes": "6 months cushion" }
```
### GET /goals
List goals.
### PATCH /goals/:id
Update progress or details.
### DELETE /goals/:id
Remove goal.

## Groups
### POST /groups
```json
{ "name": "Trip Crew", "members": ["<userId1>", "<userId2>"] }
```
### GET /groups
List groups for user.
### GET /groups/:id
Detail including expenses.
### POST /groups/:id/expenses
```json
{ "description": "Hotel", "amount": 300, "paidBy": "<userId1>", "split": { "type": "equal" } }
```
### POST /groups/:id/settlements (Future)
Generate or apply suggested transfers.

## Insights
### GET /insights/summary (Protected)
Aggregated snapshot (budgets, anomalies, goals summary).
### GET /insights/anomalies (Protected)
List flagged transactions.
### GET /insights/health (Protected)
Financial health score & breakdown.

## Stats (Internal / Future Exposure)
Rolling statistical aggregates (not publicly exposed yet). Potential future route: `/stats/:category`.

## Error Format
All errors (client or server) return:
```json
{ "error": "Human readable message" }
```

## Authentication Errors
- 401 when token missing or invalid.
- 403 reserved for future authorization distinctions.

## Rate Limiting (Planned)
Future responses may include headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1717000000
```

## Versioning
Current: v1 (implicit). Future: prefix with `/v2` when breaking changes introduced.

## Pagination Pattern (Recommended)
Adopt for large lists:
- Request: `GET /transactions?limit=50&cursor=<lastId>`
- Response wrapper example:
```json
{ "data": [ ... ], "nextCursor": "654321...", "hasMore": true }
```

## Webhooks (Future Idea)
Planned endpoints for outbound notifications when:
- Goal reached
- Budget threshold exceeded
- Anomaly flagged

---
Version: 1.0 – Align with code changes as endpoints evolve.
