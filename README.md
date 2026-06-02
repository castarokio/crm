# 📞 Call-OS CRM

An advanced, high-performance cold outreach dialer and lead management CRM tailored for travel agency acquisition and sales operations. Built with Next.js, Tailwind CSS, Supabase (PostgreSQL), and Gemini AI.

---

## 🚀 Key Features

* **⚡ Premium Command Center Dialer**: Interactive calling interface supporting continuous queue dialing, uncalled lead priority sorting, and quick navigation actions.
* **🔒 Secure Caller Sessions**: Custom authentication gate featuring individual 6-digit PIN locks for callers (**Hamid**, **Oussama**, **Kamel**) with session isolation.
* **🤖 AI Post-Call Note Parser**: Built-in integration with Google Gemini AI to analyze raw call summaries, automatically categorize call outcomes, update contact details, and schedule meeting deadlines.
* **🗣️ Dynamic AI Cold Outreach**: Live French copywriting pitch templates custom-engineered for travel agencies, supporting real-time refinement through custom AI prompts.
* **🛡️ Concurrency Locking system**: Heartbeat-based lease management preventing callers from dialing the same target lead concurrently, with automatic skipping and release features.
* **📊 Team Leaderboards & Analytics**: Comprehensive stats tracking (call counts, warm deals, success rates) and real-time leaderboard rankings to incentivize team performance.
* **📁 Admin Control Panel**: Centralized workspace for the team leader (**Hamid**) to distribute leads by region/priority, clear locks, reset campaigns, and download full database backups.
* **💾 Hybrid Connection Engine**: Dual database pipeline operating cloud-hosted Supabase Cloud PostgreSQL in production, with automatic fallback to local SQLite for isolated offline/development environments.

---

## 🛠️ Tech Stack

* **Frontend**: [Next.js](https://nextjs.org/) (App Router, Server Actions), [React](https://react.dev/), [Framer Motion](https://www.framer.com/motion/) (Aesthetic transitions), [Lucide React](https://lucide.dev/) (Icons)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (curated dark/glassmorphic color systems)
* **Databases**: [Supabase PostgreSQL](https://supabase.com/) (Production PostgREST), [SQLite](https://www.sqlite.org/) (Local Fallback)
* **AI Engine**: [Google Gemini 1.5 Flash API](https://ai.google.dev/) (Dynamic Copywriting & Note Parsing)
* **Hosting**: [Vercel](https://vercel.com/) (Edge Serverless Functions)

---

## 📂 Project Directory Structure

```text
.
├── src/
│   ├── app/                      # Next.js App Router routing & layout
│   │   ├── actions.ts            # Server Actions (DB updates, AI parsing, etc.)
│   │   ├── globals.css           # Global Tailwind and font definitions
│   │   ├── layout.tsx            # Main HTML structure wrapping the app
│   │   └── page.tsx              # Auth Gate & Caller login dashboard entrypoint
│   │
│   ├── components/               # React UI Components
│   │   ├── Dashboard.tsx         # Master CRM UI & tab controller (200KB Command Center)
│   │   ├── InquiryForm.tsx       # Custom landing page customer inquiry intake
│   │   └── Sections.tsx          # Public informational landing page sections
│   │
│   └── lib/                      # Database Clients & Helpers
│       ├── db.ts                 # Unified query router (Supabase <-> SQLite)
│       └── supabase.ts           # Singleton Supabase Client configurations
│
├── public/                       # Static public assets (images, icons, etc.)
├── scripts/                      # Developer migration, test, and utility scripts
├── .env.example                  # Template configuration file for credentials
├── .cursorrules                  # Custom rules for LLM IDE workspace agents
└── README.md                     # Documentation (this file)
```

---

## ⚙️ Environment Variables Setup

Create a `.env` or `.env.local` file in the root directory. Use the following checklist:

```env
# Gemini/GLM API Token for copywriting and call parsing
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Production Credentials (REST & Service Role)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Secure Portal & Caller Login PIN Codes
NEXT_PUBLIC_PORTAL_PIN=676869
NEXT_PUBLIC_HAMID_PIN=343536
NEXT_PUBLIC_OUSSAMA_PIN=121314
NEXT_PUBLIC_KAMEL_PIN=232425
```

---

## 🏃 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build & Compile for Production
```bash
npm run build
```

---

## 🚀 Deployment (Vercel)

Deploy to production using the Vercel CLI:
```bash
npx vercel --prod
```
The CRM handles edge API compilation, connecting server actions securely using environment variables configured in the Vercel dashboard.

---

## 🛡️ License

Private Propety of Web-OS Cold Outreach Team. Unauthorized copying, distribution, or execution of this software is strictly prohibited.
