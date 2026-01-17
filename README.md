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

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)

## Deployment Options

This is a monorepo containing both frontend and backend. You can deploy the frontend to various platforms:

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
- Defines the `NEXT_PUBLIC_API_URL` environment variable

### To Deploy to Vercel:
1. Go to https://vercel.com and sign in
2. Click "New Project" and import your GitHub repo (lolmanflix/task1)
3. **Important**: In the project configuration, set the "Root Directory" to `frontend`
4. Vercel should automatically detect this as a Next.js project
5. Add the environment variable `NEXT_PUBLIC_API_URL` with the URL of your deployed backend (e.g., `https://your-backend-app.vercel.app`)
6. Click "Deploy"

**Note**: Setting the Root Directory to `frontend` is crucial for monorepo deployments. This tells Vercel to look for the Next.js application in the frontend directory rather than trying to build the entire repository.

### To Deploy to Netlify:
1. Go to https://netlify.com and sign in
2. Click "Add new site" and select "Deploy with GitHub"
3. Find and select your repository (lolmanflix/task1)
4. In the build settings:
   - Base directory: `frontend`
   - Build command: `npm run build && npm run export`
   - Publish directory: `frontend/out`
5. Add the environment variable `NEXT_PUBLIC_API_URL` with your backend URL
6. Click "Deploy"

**Note**: The netlify.toml file in the repository handles the deployment configuration automatically.

