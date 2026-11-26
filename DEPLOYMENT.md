# Deployment guide (GitHub + Vercel + Render)

This project has a React/Vite frontend and a Flask/SQLite backend. Deploy the frontend to Vercel and the backend to Render.

## GitHub
1. Extract this project folder and create a GitHub repository.
2. From this folder, run `git init`, `git add .`, `git commit -m "Initial project upload"`, `git branch -M main`, then `git remote add origin YOUR_GITHUB_REPOSITORY_URL` and `git push -u origin main`.

## Backend (Render)
- Create a Render Web Service from this GitHub repository.
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Copy the service URL, e.g. `https://your-api.onrender.com`.

## Frontend (Vercel)
- Import the same GitHub repository into Vercel.
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add Environment Variable: `VITE_API_URL` = your Render service URL (without `/api` at the end).
- Deploy.

## Important
- SQLite on a typical free cloud instance may not provide durable storage across restarts/redeploys. The app is a demo; use a persistent disk or managed database such as PostgreSQL for real data.
- After changing `VITE_API_URL`, redeploy the Vercel frontend.
