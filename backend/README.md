# Backend (Express + Prisma)

This backend uses Express, TypeScript and Prisma ORM targeting Supabase Postgres (Supabase acts as PostgreSQL).

Environment variables (see `.env.example`):

- DATABASE_URL - postgres connection string
- JWT_SECRET - secret for signing JWT tokens
- PORT - server port
- SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD - optional values used by the seed script

Setup & run (local development):

1. Install dependencies

```bash
cd backend
npm install
```

2. Generate Prisma client & migrate (you must set DATABASE_URL pointing to your Supabase / Postgres instance)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Seed an admin account (optional)

```bash
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=password123 node --loader ts-node/esm src/seed.ts
```

4. Start dev server

```bash
npm run dev
```

Swagger UI: http://localhost:4000/api-docs

Default dev admin credentials (after running the seed script):

- email: admin@example.com
- password: password123

Dev fallback admin (if DB is unreachable or for quick local testing):
- Set `DEV_ADMIN_ENABLED=true` in `.env` along with `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`.
- Example (already in this workspace for testing): DEV_ADMIN_EMAIL=kareemdiyaaaa2007@gmail.com


Resetting passwords (dev)

The API provides a development reset endpoint to update an admin's password when you have the Supabase service role key.

POST /auth/reset-password
Headers:
- x-service-role: <SERVICE_ROLE_KEY>
Body:
{ "email": "admin@example.com", "newPassword": "newpass123" }

This endpoint is intended for development and testing only.


Scripts:

- npm run dev — start dev server with ts-node-dev
- npm run prisma:generate — generate prisma client
- npm run prisma:migrate — run prisma migrations

Swagger available at: /api-docs

---

## Production security notes 🔐

- Cookies used for auth are marked `HttpOnly` for tokens and `Secure` when `NODE_ENV=production`.
- In production we use SameSite=Strict for both the access and refresh cookies; the `XSRF-TOKEN` cookie is readable by JS but will also use `SameSite=Strict` in production.
- Because cookies are marked `Secure` in production, your app must be served over HTTPS (TLS). Set `FRONTEND_ORIGIN` to your frontend's HTTPS origin and ensure `NODE_ENV=production`.
- If the app is deployed behind a reverse proxy (nginx, cloud load balancer), set `TRUST_PROXY=1` so Express reads the original protocol (https) and sets cookies correctly.
- To prevent accidental start in an insecure configuration, you can enable `ENFORCE_HTTPS=true` — the server will fail to start if `FRONTEND_ORIGIN` is not https.

Recommended env vars for production:

```
NODE_ENV=production
FRONTEND_ORIGIN=https://your-frontend.example.com
TRUST_PROXY=1
ENFORCE_HTTPS=true   # optional, blocks startup when frontend origin is not HTTPS
```

Also remember:
- Deploy behind TLS (let's encrypt, cloud-managed TLS) so cookies are delivered securely.
- Migrate Prisma to create the `Session` table so refresh tokens and session pruning work (see Prisma commands above).
