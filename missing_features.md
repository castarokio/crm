# Complete Gaps & Missing Features Report: Monolithic vs. Modular CRM

This document lists all features, UI layouts, widgets, helper utilities, and database-linked states present in the legacy 7,500-line monolithic `Dashboard.tsx` (commit `af7522e`) that were **not** carried over during the modular Next.js refactoring.

---

## 📞 1. Dialer tab (Active Queue Page)

### 1.1 Multi-Value Alternate Contacts Editing ("Add New Contacts")
* **Legacy Feature**: Callers could click "Add alternate phone" or "Add alternate email" dynamically inside the Dialer details panel. Multiple phone numbers and emails were split from string fields (`phone_2`, `email_2`) using `splitMultiValue(value)` and mapped to dynamically rendering inputs.
* **Modular Code Status**: Replaced with a single static input text box. Callers cannot dynamically add or remove multiple alternative phone numbers or emails on the active card.

### 1.2 Social Media Links Gaps
* **Legacy Feature**: The active dialer details panel displayed all lead social media links (`facebook`, `instagram`, `tiktok`, `linkedin`, `social_link`) as editable text input fields. 
* **Modular Code Status**: Omitted entirely. No social media fields are visible or editable inside the active dialer details card ([lead-info-card.tsx](file:///c:/Users/elweh/Desktop/CRM/src/components/dialer/lead-info-card.tsx)).

### 1.3 Lead Stats & Audits Display
* **Legacy Feature**: The dialer displayed live Google Ratings and Review Counts as editable parameters so callers could update them if the scraper details were outdated or missing.
* **Modular Code Status**: google ratings and review counts are rendered as read-only static text badges in the card title block. They cannot be edited or manually added.

### 1.4 Open and Closure Times Gaps
* **Legacy Feature**: Displays a text field for `work_hours` (e.g. `09:00-17:00`) directly on the dialer details panel, accompanied by a dynamic check status badge showing `Open` (Sage Green) or `Closed` (Burgundy) based on the current system time.
* **Modular Code Status**: The active details card does not display or allow editing of `work_hours`, and the Open/Closed status badge is missing from the main active lead card layout.

### 1.5 "Delete Lead If Not Related" Action
* **Legacy Feature**: Featured a prominent "Delete if not travel agency" button on the dialer layout (`handleDeleteFalseLead`). This allowed cold callers to immediately purge wrong leads (fake numbers, scrapings from unrelated business areas) from the database with an alert confirmation.
* **Modular Code Status**: Completely missing from the dialer card action block.

### 1.6 Prefilled Proposal Redirection DMs & Templates
* **Legacy Feature**: Action buttons inside `dialerCardTab === 'pitch'` that copied custom proposal paragraphs and triggered messaging apps with pre-filled content:
  * **WhatsApp Msg**: Formatted Algerian phone numbers (converting `06...` to `2136...` via `formatWhatsappPhone`) and launched a chat with the custom Gemini AI proposal text prefilled: `https://wa.me/{phone}?text={pitch}`.
  * **WhatsApp Chat**: Opens a clean chat window without pre-filled text.
  * **Instagram Direct DM**: Auto-copied the custom AI pitch/proposal text to the system clipboard, displayed a success toast, and opened the Direct Message screen: `https://ig.me/m/{handle}` (falling back to `/direct/inbox/`).
  * **Facebook Messenger**: Auto-copied the proposal text to the clipboard and opened the direct Messenger thread: `https://m.me/{handle}`.
* **Modular Code Status**: Completely missing from the pitch generation pane.

### 1.7 "Save Changes" Button & Status Alerts
* **Legacy Feature**: Enabled a clear visual saving state (`fieldSaveStatuses`) showing indicators (saving, saved, failed) next to inputs to guarantee the caller knows changes are persisted.
* **Modular Code Status**: Although auto-save on blur is implemented, the interface lacks the full manual "SAVE CHANGES" or "Save details" confirmation buttons and visual alerts.

---

## 📊 2. Main Dashboard & Sidebar Layout Gaps

### 2.1 Team Score Leaderboard scorecards
* **Legacy Feature**: A three-card grid positioned right below the header displaying scorecards for Hamid, Oussama, and Kamel. It tracked calls made, appointment success rates, and active states with GSAP entry animations (`gsap-leaderboard-card`).
* **Modular Code Status**: Completely missing. Only the individual progress bar is visible on the left navigation sidebar.

### 2.2 Real-time Lock Sync Toast Alerts
* **Legacy Feature**: Displayed real-time notification toasts (`openLeadToast`) on the top-right of the screen when concurrent locking events occurred: *"Oussama is now calling [Agency Name] in [District]!"*.
* **Modular Code Status**: Real-time events are processed silently behind the scenes without visual desktop toast alerts for callers.

---

## ⚙️ 3. Admin Panel Settings Gaps

### 3.1 Live System Audits Table UI
* **Legacy Feature**: Displayed a scrollable grid displaying database transactions from the `audit_logs` table (e.g., reset actions, caller logins, lead assignments, CSV imports).
* **Modular Code Status**: The server action `getAuditLogs` fetches records, but the visual table showing the log rows is completely omitted from the layout.

### 3.2 Registration Applications Decision Workflow
* **Legacy Feature**: Renders candidate profiles submitted via the sign-up page (`team_applications` table) with:
  * Profile candidate name, phone number, email, and gender.
  * Accept and Reject buttons.
  * Input field to assign a 6-digit caller PIN upon acceptance.
* **Modular Code Status**: The state is fetched, but the registration table UI and Accept/Reject modals are completely missing.

### 3.3 Bulk Lead Range & Allocation Actions
* **Legacy Feature**: Action buttons to split leads equally and clear assignments:
  * **Split unassigned leads equally**: Calls `splitLeadsEqually()` to distribute unassigned fresh leads among all active caller profiles in equal numbers.
  * **Clear all allocations**: Calls `clearAssignments()` to release all uncalled leads locked to caller names back into the general unassigned pool.
* **Modular Code Status**: The functions are defined, but the allocation dashboard lacks buttons to trigger them.

### 3.4 Central Campaign Performance Rates
* **Legacy Feature**: Displays statistical percentages calculated from caller counts:
  * **Coverage Rate** (% of database called vs. uncalled)
  * **Positive Outcome Rate** (% of Interested + Won leads out of called ones)
  * **Conversion Rate** (% of Won leads out of called ones)
  * **Unreachable Rate** (% of Busy + No Answer + Wrong Number out of called ones)
  * **Refusal Rate** (% of Not Interested out of called ones)
* **Modular Code Status**: Completely missing. No campaign coverage or conversion analysis is visible to the administrator.

---

## 🗂️ 4. Directory spreadsheet Tab Gaps

### 4.1 Missing Sub-tabs
* **Legacy Feature**: Featured 9 distinct sub-directories to view specific lead buckets:
  * `database` (Main database directory grid showing all leads)
  * `treated` (Treated leads directory grid)
  * `lost` (Lost leads directory grid)
  * `followups` (Followups directory grid)
  * `warm_leads` (Warm leads directory grid)
  * `good_clients` (Good clients directory grid showing websites and social click icons)
* **Modular Code Status**: The new `DirectoryTab` only has 4 sub-tabs (`leads`, `warm`, `callbacks`, `lost`). The `'database'` (all leads including lost/wrong), `'treated'`, and `'good_clients'` (featuring visual social icon buttons for quick access) are missing.

### 4.2 Social Links in Edit Details Modal
* **Legacy Feature**: All social links (Facebook, Instagram, TikTok, LinkedIn, and social link) could be edited or updated inside the details edit panel.
* **Modular Code Status**: Omitted from the edit modal. Only text, phone, email, and websites are editable.

### 4.3 Spreadsheet Inline Cell Inputs
* **Legacy Feature**: Enabled inline editing directly inside the spreadsheet grid. Callers could double-click or focus fields like `work_hours`, `contact_person`, or `priority` to edit and save them on blur, without leaving the directory table view.
* **Modular Code Status**: All edits require opening a large details form modal. Inline inputs inside the spreadsheet table rows are missing.
