# CRM Campaign & System Configuration Guide

This file contains all critical information, paths, API keys, credentials, database details, Vercel deployment URLs, and system instructions for the **Call-OS CRM** application.

---

## 1. Project Folder & File Locations

* **Project Root Directory**: `C:\Users\elweh\Desktop\OS workflow`
* **Local SQLite Database**: `C:\Users\elweh\Desktop\WORK\travel_agency_scraper\algeria_travel_agencies.db`
* **Vercel Project ID / Org**: `castarokios-projects / crm`
* **App Data Directory**: `C:\Users\elweh\.gemini\antigravity`
* **Conversation History & Logs**: `C:\Users\elweh\.gemini\antigravity\brain\5bdb29ac-50fb-452e-8ec0-8a829600e4d8\`

### Key Source Files
- **Server Actions**: [actions.ts](file:///C:/Users/elweh/Desktop/OS%20workflow/src/app/actions.ts)
- **Main React Dashboard UI**: [Dashboard.tsx](file:///C:/Users/elweh/Desktop/OS%20workflow/src/components/Dashboard.tsx)
- **Main NextJS Page**: [page.tsx](file:///C:/Users/elweh/Desktop/OS%20workflow/src/app/page.tsx)
- **Database Connection Handler**: [db.ts](file:///C:/Users/elweh/Desktop/OS%20workflow/src/lib/db.ts)
- **Supabase Client Setup**: [supabase.ts](file:///C:/Users/elweh/Desktop/OS%20workflow/src/lib/supabase.ts)

---

## 2. API Keys, Passcodes & Environment Variables

These variables are defined in the local `.env` file ([C:\Users\elweh\Desktop\OS workflow\.env](file:///C:/Users/elweh/Desktop/OS%20workflow/.env)):

```env
GLM_API_KEY=1894765db80f49ea80e7ab451dc39ffe.ZbWkA6Xyx8NSBlDQ
DATABASE_URL=
NEXT_PUBLIC_PORTAL_PIN=676869
NEXT_PUBLIC_SUPABASE_URL=https://bpenacfdynhgcvdznygb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZW5hY2ZkeW5oZ2N2ZHpueWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDQzMDcsImV4cCI6MjA5NTkyMDMwN30.jYwL19ffUiEWSJSkN0nclRsf5CQOd7EwUzNSLpUfxU4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZW5hY2ZkeW5oZ2N2ZHpueWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM0NDMwNywiZXhwIjoyMDk1OTIwMzA3fQ.BZs8y_hunwvNCX__LoDVUHfWSrATo_matUvThFLhZ6Q
```

* **CRM Gate Login PIN**: `676869`
* **Hamid Admin PIN**: `343536`

---

## 3. Database Credentials & Pooler Configuration

### PostgreSQL (Supabase) Database
- **Project ID**: `bpenacfdynhgcvdznygb`
- **Host**: `aws-1-eu-central-1.pooler.supabase.com`
- **Port**: `6543` (Transaction Pooler)
- **User**: `postgres.bpenacfdynhgcvdznygb`
- **Password**: `tA4J%nHKFLPdz.D`
- **Connection URI**: `postgresql://postgres.bpenacfdynhgcvdznygb:tA4J%25nHKFLPdz.D@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`

### SQLite Database (Local Scraper)
- **Path**: `C:\Users\elweh\Desktop\WORK\travel_agency_scraper\algeria_travel_agencies.db`

---

## 4. Vercel Production Deployment

- **Production App Domain**: [https://crm-nine-liard.vercel.app](https://crm-nine-liard.vercel.app)
- **Production Unique Vercel URL**: [https://crm-fa0u41z01-castarokios-projects.vercel.app](https://crm-fa0u41z01-castarokios-projects.vercel.app)
- **Vercel Project Dashboard**: [https://vercel.com/castarokios-projects/crm](https://vercel.com/castarokios-projects/crm)
- **Deployment Inspector URL**: [https://vercel.com/castarokios-projects/crm/3EJEBZMuQ6dbmT1LKi4iHsiewcFf](https://vercel.com/castarokios-projects/crm/3EJEBZMuQ6dbmT1LKi4iHsiewcFf)

### Command to deploy manually
To deploy new code changes manually, run this command inside the project root `C:\Users\elweh\Desktop\OS workflow`:
```powershell
vercel --prod --token vcp_75EyHrc1g5RMw7zHD4XKdi0Tm3pu8Q6VzLf8yt5XzcwwxSLBq50Nx0w6 --yes
```

---

## 5. Main Dashboard Instructions

This CRM contains custom pipelines designed specifically for cold-calling campaigns operated by **Hamid**, **Oussama**, and **Kamel**.

### 📞 Dialer & Call Queue
- Supports dialing **Primary** and **Alternative** (Phone 2) numbers.
- Tracks which phone number was dialed by highlighting the last clicked dial/copy button.
- Updates status instantly with the "Quick Log Buttons" (Accepted, Rejected, Callback, Busy/No Answer, Wrong No, Configured) or processes raw transcripts using Gemini AI.
- Logs include timestamps and the exact dialed number (e.g., `(Dialed: 055...)`).

### ⏱️ Busy / No Answer Tab
- Collects all leads marked as `Busy` or `No Answer`.
- Logs call history and last called timestamp.
- Features a **Recall** button to send the lead directly back into the caller's active queue.

### 🌟 Good Clients Tab
- Premium directory representing converted leads (`Interested`, `Accepted`, `Client Configured`).
- Renders direct clickable icons for their website, Facebook profile, Instagram feed, and LinkedIn/other custom socials.

### 📊 Admin Panel (Hamid Only)
- **ID Range Allocator**: Hamid can allocate ranges of targets (e.g. ID `#0-100` to Kamel, ID `#0-400` to Oussama). This locks the targets so that callers never cross paths or call the same client.
- **Region & Priority Allocator**: Assign leads based on their Algerian district (e.g. Algiers) or priority bracket.
- **Campaign Analytics**: Shows overall statistics (Total Leads, Total Called, Calls Today, Won/Interested count, Busy/No Answer count, Refused count).
