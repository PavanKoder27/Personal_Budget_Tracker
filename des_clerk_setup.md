# Clerk Integration Setup

This project now supports hybrid authentication (legacy JWT/OTP + Clerk). Follow these steps to enable Clerk:

## 1. Create a Clerk Application
1. Go to https://dashboard.clerk.com/ and create (or open) your application.
2. In the dashboard, find your keys under: API Keys.
   - Publishable Key (frontend) e.g. `pk_live_xxxxx`
   - Secret Key (backend) e.g. `sk_live_xxxxx`

## 2. Add Environment Variables
Create / update the following files (do NOT commit secrets):

backend/.env
```
CLERK_SECRET_KEY=sk_test_or_live_value_here
JWT_SECRET=your_existing_jwt_secret
MONGODB_URI=your_mongo_uri
```

frontend/.env
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_or_live_value_here
REACT_APP_API_URL=http://localhost:5000/api
```
(Adjust API URL if fallback port chose 5050.)

Restart both backend and frontend after adding the env files so they are picked up.

## 3. Start Servers
From project root (two terminals):
```
cd backend
npm run dev
```
```
cd frontend
npm start
```

## 4. Try Clerk Sign In
Navigate to: http://localhost:3000/#/clerk-sign-in (hash routing used by the injected `<SignIn>` component because we used `routing="hash"`).
After signing in, you will be redirected inside the app (you can manually go to /dashboard). The Clerk session token is stored temporarily in localStorage under `clerkToken` for the hybrid bridge and sent as `Authorization: Bearer <token>` to the backend. The backend middleware tries Clerk verification first.

## 5. Existing Users
When a Clerk-authenticated user accesses backend for the first time, the middleware will:
- Look up by `clerkId`.
- Else try match by email.
- Else create a new local User document with a placeholder password and link `clerkId`.

## 6. Migrating Fully to Clerk (Optional Later)
- Remove password & OTP logic from `User` schema (keep for now).
- Delete legacy auth routes except a migration advisory endpoint.
- Remove JWT issuance on register/login.
- Remove `localStorage.getItem('token')` logic and rely exclusively on Clerk's `getToken()` per request.

## 7. Security Notes
- Never expose `CLERK_SECRET_KEY` to frontend.
- Rotate keys in Clerk dashboard if leaked.
- Ensure HTTPS in production so bearer tokens are protected in transit.

## 8. Improvements To Consider
- Replace localStorage token bridge with per-request header injection using `useAuth().getToken()` in a custom axios interceptor for stronger security (avoid persistent storage).
- Add a `clerkId` index (already defined) and maybe a compound index on email.
- Add role/permissions via Clerk organization or metadata fields and mirror them locally if needed.

## 9. Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 after Clerk sign in | Missing backend `CLERK_SECRET_KEY` or token not stored | Verify .env backend + restart, check localStorage for `clerkToken`. |
| `Cannot find module '@clerk/clerk-react'` | Dependencies not installed in frontend | Run `npm install` inside `frontend` folder. |
| User duplicates | Signed in with Clerk using different email than legacy account | Manually link by setting `clerkId` on existing user record. |

## 10. Removing the Bridge Token (Future Hardening)
Instead of storing token in localStorage, modify `api.ts` to dynamically pull a fresh token:
```ts
import { getToken } from '@clerk/clerk-react'; // pseudo; inside a hook or context only
```
Wrap axios calls in a React Hook that runs inside ClerkProvider so you can await `getToken()` each time.

---
Happy building! This hybrid approach lets you migrate gradually and keep current users working.
