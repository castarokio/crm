# Missing Features Report: Monolithic vs. Modular CRM

We conducted a deep code audit comparing the original 7,500-line monolithic `Dashboard.tsx` (commit `af7522e`) against the new modular React structure. Below is an honest list of missing or partially integrated features that were present in the first version but have not been carried over.

---

## 📅 1. Upcoming Meetings & Callbacks Tab (`deadlines`)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: A major navigation panel accessible from the sidebar (`activeTab === 'deadlines'`).
* **Missing Capabilities**:
  * **Calendar View**: Renders a visual calendar grid of the current month. Days containing scheduled callback deadlines displayed a number badge; clicking a day filtered and showed specific callback cards below it.
  * **List Table View**: An alternative tabular display showing lead names, phone numbers, districts (`area`), meeting times, and caller names.
  * **Month Navigation**: Buttons to advance or reverse the calendar month.

---

## 📋 2. Outreach Checklist Panel (Dialer Control Center)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: A checkbox sub-panel inside the Dialer Tab sidebar:
  * Checkboxes for: **Call Placed**, **Email Sent**, **Social Message Sent**, and **Audit Report Prepared**.
  * A **"Save Outreach"** action that executed an API call to save the checked items to the database, displaying a temporary "Saved!" alert upon success.
* **New Implementation**: The dialer queue panel (`dialer-queue.tsx`) lacks these checkboxes, and the state hooks/server actions for outreach checklists are not wired up.

---

## 👁️ 3. Live Audit Logs Viewer (Admin Panel)
* **Status**: ⚠️ **Partially Missing (Backend Ready, UI Omitted)**
* **Legacy Implementation**: Renders an interactive table of all events logged inside the `audit_logs` table (campaign resets, deletions, assignments, caller profile updates, logins).
* **New Implementation**: The `AdminTab` fetches the audit records into local React state (`const [auditLogs, setAuditLogs] = useState([])`), but the UI rendering blocks for displaying this table are omitted in `admin-tab.tsx`.

---

## 📊 4. Campaign Analytics Rates (Admin Panel)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Renders overall metrics for Hamid to evaluate lead coverage and outreach conversions:
  * **Coverage Rate** (% of called leads out of total database)
  * **Positive Outcome Rate** (% of Interested + Won leads out of called)
  * **Conversion Rate** (% of Won leads out of called)
  * **Unreachable Rate** (% of Busy + No Answer + Wrong Number out of called)
  * **Refusal Rate** (% of Not Interested out of called)
* **New Implementation**: The `AdminTab` does not show these rate calculations. The sidebar only displays a basic progress tracker for the active caller's target (daily call target vs calls made today), but there is no campaign-wide analysis dashboard.

---

## ✉️ 5. French Outreach Email Template Redirection (`mailto`)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Generates template-based French emails via `getPrefilledMailtoUrl`:
  * Prefills a customized email subject line: `Proposition de Partenariat – Call-OS`
  * Generates a template body referencing the agency's name, rating count, maps presence, and potential optimization pitch.
* **New Implementation**: The new email buttons use a simple raw `mailto:${email}` link with no preset subject, body templates, or agency name interpolation.

---

## ✏️ 6. Directory Inline Cell Editing (Spreadsheet View)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Enabled quick corrections directly within the directory spreadsheet grid. Users could double-click or focus fields (like `work_hours`, `contact_person`, `priority`) to edit and save them on blur, without leaving the list view.
* **New Implementation**: All edits in `DirectoryTab` require selecting a lead, opening a large modal form popup, modifying inputs, and clicking save. Inline inputs in the table are omitted.

---

## 🕒 7. Dialer Card Business Hours & Quick Edit
* **Status**: ⚠️ **Partially Missing**
* **Legacy Implementation**: Enabled editing fields like `work_hours` inside the Dialer Active Card and displayed Open/Closed badges contextually.
* **New Implementation**: The dialer queue sidebar shows the open/closed status badge, but the active card (`lead-info-card.tsx`) does not render the badge and has no text input to quickly view or adjust `work_hours`.
