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

## Deployment to Vercel

This is a monorepo containing both frontend and backend. To deploy to Vercel:

### Option 1: Deploy Frontend Only to Vercel

1. The `vercel.json` file is configured to deploy only the frontend directory to Vercel
2. Run `vercel --cwd frontend` from the root directory
3. Set the environment variable `NEXT_PUBLIC_API_URL` to your backend API URL

### Option 2: Separate Deployments

1. Deploy the backend to a cloud provider (Vercel, Heroku, etc.)
2. Update the `NEXT_PUBLIC_API_URL` in the frontend to point to your deployed backend
3. Deploy the frontend to Vercel

## Configuration

The Vercel configuration in `vercel.json`:
- Sets the root directory to `frontend`
- Uses the Next.js framework preset
- Defines the `NEXT_PUBLIC_API_URL` environment variable

