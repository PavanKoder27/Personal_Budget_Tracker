# User Guide

## 1. Introduction
This guide helps end users navigate the Budget Tracker: creating an account, logging transactions, setting budgets & goals, collaborating in groups, and interpreting insights.

## 2. Getting Started
### 2.1 Create an Account
1. Open the application URL.
2. Go to Register.
3. Enter name, email, password (store securely).
4. Submit – you are automatically authenticated.

### 2.2 Log In
1. Open Login page.
2. Enter email + password.
3. On success, you land on the dashboard.

### 2.3 Log Out
- Use profile / account menu (if present) or clear browser storage (temporary fallback).

## 3. Core Concepts
| Concept | Description |
|---------|-------------|
| Transaction | An income or expense with amount, category, and date. |
| Budget | A monthly spending limit for a category. |
| Goal | A savings or accumulation target with deadline. |
| Group | A shared space to track multi-user expenses. |
| Anomaly | A transaction flagged as statistically unusual. |

## 4. Recording Transactions
1. Navigate to Transactions module.
2. Fill form: type (income/expense), amount, category, date, optional notes.
3. (Optional) Set recurrence (e.g., monthly) if the expense repeats.
4. Save – list updates instantly.

### 4.1 Recurring Transactions
- Selecting recurrence creates a template; system auto-generates future instances.
- You can later edit or disable recurrence by modifying the template entry.

### 4.2 Anomaly Indicators
- An unusual transaction shows an alert icon or highlight (depends on UI styling).
- Review: confirm if expected; otherwise adjust category or amount.

## 5. Budgets
1. Open Budgets page.
2. Add a budget: category + monthly limit.
3. Dashboard or budgets view displays remaining amount.
4. Adjust by editing or removing outdated limits.

## 6. Goals
1. Go to Goals.
2. Create goal: name, target amount, deadline.
3. Track progress bar as contributions accumulate (future: tie to tagged transactions or manual updates).
4. Mark complete when target reached.

## 7. Groups (Collaborative Expenses)
1. Create a group and invite members (currently by entering their identifiers/emails—implementation details may vary).
2. Log shared expenses specifying payer + split method.
3. View suggested settlement transfers (planned enhancement) to balance debts.

## 8. Reports & Insights
- Reports summarize spending by category and trend.
- Insights highlight anomalies, goal status, and budget pressure.
- Use timeframe selectors (if available) to refine analysis.

## 9. Profile Management
- Access profile page to view basic details.
- Update features (avatar, password change) may arrive in later versions.

## 10. Notifications
- Inline alerts show success or error states (e.g., transaction saved, login failed). Dismiss manually or wait for auto-hide.

## 11. Troubleshooting
| Issue | Possible Cause | Resolution |
|-------|----------------|-----------|
| Cannot log in | Wrong credentials | Reset password feature (future) or re-register with different email |
| API errors visible | Backend offline | Ensure server running on expected port |
| Budgets not updating | Sync delay | Refresh; if persistent, re-add budget |
| Duplicate recurring entries | Interval executed twice after restart | Remove duplicates; report to support |
| Missing anomaly flags | Not enough history | Add more transactions for baseline |

## 12. Privacy & Security Tips
- Use a unique password.
- Log out on shared devices (clear local storage if needed).
- Avoid sharing screenshots containing personal financial data.

## 13. Roadmap Highlights (User-Facing)
| Upcoming | Benefit |
|----------|---------|
| Password reset | Account recovery |
| Multi-factor auth (optional) | Stronger security |
| Export CSV | Data portability |
| Mobile-friendly refinements | Better small-screen use |
| Smart budget suggestions | Adaptive planning |

## 14. FAQ
| Question | Answer |
|----------|--------|
| Are transactions editable? | Yes—open the transaction and modify fields (UI specifics may vary). |
| Can I delete a goal? | Yes; progress data will be removed. |
| Why is a transaction flagged? | Amount deviates significantly from historical average in its category. |
| Are group balances automatic? | Suggestions appear; applying them may be manual currently. |

## 15. Support
For issues: provide steps to reproduce, browser version, and any error message displayed in the console.

---
Version: 1.0 – Update as UI evolves.
