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
- **Database Connection Handler**: `src/lib/supabase-admin.ts`
- **Session Handler**: `src/lib/auth-session.ts`

---

## 2. API Keys, Passcodes & Environment Variables

These variables must be defined in the local `.env` file and in the deployment environment. Never commit their values:

```env
GLM_API_KEY=replace_me
PORTAL_PIN=replace_me
ADMIN_RESET_PIN=replace_me
SESSION_SECRET=replace_me
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace_me
SUPABASE_SERVICE_ROLE_KEY=replace_me
```

* **CRM Gate Login PIN**: private environment variable
* **Caller PINs**: private environment variables or database values

---

## 3. Database Credentials & Pooler Configuration

### PostgreSQL (Supabase) Database
- **Project ID**: stored in the deployment environment
- **Host**: stored in the deployment environment
- **Port**: `6543` (Transaction Pooler)
- **User**: stored in the deployment environment
- **Password**: stored in the deployment environment
- **Connection URI**: stored in `DATABASE_URL`; never commit it

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
