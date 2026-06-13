# LeadStream CRM — Production Hosting Guide

Now that the Next.js frontend has been replaced with a high-performance **FastAPI (Python) backend** and a **Vanilla HTML/CSS/JS single-page frontend**, the deployment architecture is different.

---

## ⚠️ The Vercel + SQLite Hosting Dilemma

**Vercel** is a serverless platform designed for stateless frontend frameworks (like Next.js) and API routes.
1. **Serverless Ephemerality**: Every request to a serverless function spins up a fresh container and spins it down.
2. **Read-Only / Non-Persistent Disk**: If you run an SQLite database (`leads.db`) on Vercel, any changes (e.g. processing leads, writing notes) will be lost when the function spins down. Furthermore, SQLite requires a writeable file system which is not reliably persistent in serverless environments.

Below are the **three recommended options** for hosting your new application in production.

---

## Option 1: Deploy Everything to Render or Railway (Recommended / Simplest)

Hosting the entire FastAPI application with a persistent disk volume on **Render** or **Railway** is the easiest way to keep using SQLite.

### Steps for Render:
1. Create a free account at [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`https://github.com/castarokio/crm.git`).
4. Set the following configurations:
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend` (or leave blank and set Start Command to `python -m uvicorn main:app --host 0.0.0.0 --port $PORT` from project root).
5. Add a **Persistent Disk Volume** (under the "Disk" tab on Render):
   - **Mount Path**: `/data`
   - **Size**: 1 GB is plenty.
   - Update your `backend/database.py` path to store the database on the mounted volume:
     `DATABASE_PATH = "/data/leads.db"`
6. Add an environment variable to Render:
   - `PYTHON_VERSION = 3.11.0` (or matching your version).

---

## Option 2: Split Deploy (Vercel Frontend + Render Backend)

Keep the frontend on **Vercel** (fast, free, static hosting) and move only the backend to **Render**.

### Step A: Deploy the Frontend on Vercel
1. Create a `vercel.json` file in the project root:
   ```json
   {
     "cleanUrls": true,
     "rewrites": [
       { "source": "/(.*)", "destination": "/frontend/$1" }
     ]
   }
   ```
2. Point Vercel to host your static files from the `frontend/` directory.

### Step B: Deploy Backend on Render
1. Follow **Option 1** steps to launch a Python web service.
2. Get the public URL of your Render web service (e.g. `https://crm-api.onrender.com`).

### Step C: Connect Frontend to Backend
1. Modify `frontend/app.js` first line:
   ```javascript
   const API = 'https://crm-api.onrender.com/api';
   ```
2. Redeploy frontend to Vercel.

---

## Option 3: Use Vercel Serverless + Supabase (Cloud Database)

Since your old repository had `@supabase/supabase-js` and `pg` dependencies, you already have a **Supabase PostgreSQL database**. You can run FastAPI serverless on Vercel by switching from SQLite to Supabase.

### Step A: Update FastAPI to connect to Supabase
In `backend/database.py`, replace SQLite URL with your Supabase Connection String:
```python
import os
# Read connection string from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
```

### Step B: Configure Vercel Serverless
1. Add `mangum` to `backend/requirements.txt` (to run FastAPI inside AWS Lambda/Vercel serverless function).
2. Create `vercel.json` in the root:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "backend/main.py" },
       { "source": "/(.*)", "destination": "frontend/$1" }
     ]
   }
   ```
3. Set your `DATABASE_URL` environment variable in the Vercel Dashboard project settings.
