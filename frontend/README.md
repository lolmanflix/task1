# Frontend (Next.js + Tailwind)

This is the Next.js + Tailwind frontend for the EMS admin dashboard.

## Key features we added

1. **Persistent JWT auth** – the app now consumes the backend's cookie-based JWT/refresh-token flow through a dedicated `AuthContext`, so admins stay signed in across refreshes, protected routes, and navigation.
2. **Global layout & navigation** – a sticky header with role-aware links (Employees, Admins, Profile, Logout) is shared across pages, improving UX.
3. **Profile management** – `/profile` lets an admin update email or change their password after confirming the current password.
4. **Table & form styling** – site-wide styles were updated to make tables larger, more readable, and form inputs consistent.
5. **Reset password UX** – `/reset-password` now accepts just an email and asks Supabase to email a secure recovery link (no service-role key in the browser).

## Environment configuration

- `NEXT_PUBLIC_API_URL` (optional) – override the backend origin (default `/api` proxy to http://localhost:4000).
- The backend must expose `FRONTEND_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_RESET_REDIRECT` for password-reset emails.

Developer tip: during local development the Next.js dev server rewrites `/api/*` to `NEXT_PUBLIC_API_URL`, keeping requests same-origin so httpOnly cookies are sent reliably. If you disable the proxy, ensure cookies are configured for your frontend origin.

## Run locally

```
npm install
npm run dev
```

Default dev admin credentials (after running the backend seed or enabling the dev fallback):

- email: `admin@example.com`
- password: `password123`

## Password reset flow

1. Visit `/reset-password`.
2. Enter the admin email. The backend calls Supabase's `generate_link` API with the service-role key and sends a recovery email.
3. Follow the link (redirect defaults to `/login` unless overridden via `SUPABASE_RESET_REDIRECT`).

## Admin management UI

- View admins at `/admins` and add new ones at `/admins/add` (protected routes).
- Employees CRUD screens live under `/employees` (also protected).

