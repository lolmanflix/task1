# Employee Management System (EMS)

Full-stack admin web application — backend (Express + Prisma) and frontend (Next.js + TailwindCSS).

This workspace contains two services:

- `backend/` — Node + Express + TypeScript + Prisma + Swagger
- `frontend/` — Next.js + TypeScript + Tailwind

Read the sub-READMEs for each service to run them locally. Quick start:

1) Backend

```powershell
cd backend
npm install
# set .env or use .env.example
npm run dev
```

2) Frontend

```powershell
cd frontend
npm install
# set NEXT_PUBLIC_API_URL (default http://localhost:4000)
npm run dev
```

Open the frontend at http://localhost:3000 (should redirect to /login). Backend docs (Swagger): http://localhost:4000/api-docs

