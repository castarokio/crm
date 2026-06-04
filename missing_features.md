# Missing Features Report: Monolithic vs. Modular CRM

This document lists all features, UI layouts, widgets, helper utilities, and database-linked states present in the legacy 7,500-line monolithic `Dashboard.tsx` (commit `af7522e`) that were **not** carried over during the modular Next.js refactoring.

---

## 🔗 1. Social Media Profile Badges (`SocialProfileBadges` Widget)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: A component (`SocialProfileBadges`) dynamically rendered hoverable badges for active leads.
* **Missing Capabilities**:
  * **Social Normalization Utilities**: Normalizes handles (e.g. `@username` or raw text) into fully qualified URLs:
    * `normalizeFacebookProfileUrl` -> Matches `facebook.com` domains or raw handles to direct profile links.
    * `normalizeInstagramProfileUrl` -> Converts Instagram handles into direct profile URLs.
    * `normalizeTikTokUrl` -> Converts handles to `tiktok.com/@username`.
    * `normalizeLinkedInUrl` -> Converts company names or handles to company profiles.
    * `normalizeExternalUrl` -> Sanitizes websites.
  * **Link Parsing & Badges**: Filtered out empty/N/A entries and rendered clean, responsive icon badges (Globe, Facebook, Instagram, TikTok, LinkedIn) in the directory grids and the dialer details panel.

---

## ⚡ 2. Direct Outreach Messaging & Proposal Redirects
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Action buttons located in the Dialer active card (`dialerCardTab === 'pitch'`) that dynamically generated pre-filled outreach templates and directly launched messaging windows:
  * **WhatsApp Msg**: Formatted Algerian phone numbers (converting `06...` to `2136...` via `formatWhatsappPhone`) and launched a chat with the custom Gemini AI proposal text prefilled:
    `https://wa.me/213xxxxxxxxx?text=Pre-filled%20Proposal%20Paragraph...`
  * **WhatsApp Chat**: Opens a clean chat window without pre-filled text.
  * **Instagram Direct DM**: Auto-copied the custom AI pitch/proposal text to the system clipboard, displayed a success toast, and opened the Direct Message screen:
    `https://ig.me/m/{handle}` (falling back to `/direct/inbox/`).
  * **Facebook Messenger**: Auto-copied the proposal text to the clipboard and opened the direct Messenger thread:
    `https://m.me/{handle}` (falling back to the main messenger page).

---

## 📅 3. Callback Scheduler Modal
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: When a caller marked a lead as a `Callback`, instead of typing details into a text box, the app popped open a dedicated **Scheduler Modal**:
  * An interactive calendar grid displaying dates.
  * Dropdown selectors for Hour and Minute.
  * Saved the combined timestamp to the database in a standardized structure.
* **New Implementation**: Replaced with a simple date/time text input inside the update status panel, which lacks the styled, guided date-grid scheduler.

---

## 📋 4. Outbox Checklist Checkbox States
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Inside the dialer checklist sub-panel, separate checkboxes tracked specific social media sends, saving their state inside the database:
  * **WhatsApp Sent** (`message_whatsapp` boolean)
  * **Facebook Sent** (`message_facebook` boolean)
  * **Instagram Sent** (`message_instagram` boolean)
  * **TikTok Sent** (`message_tiktok` boolean)
  * **Email Sent** (`message_email` boolean)
* **New Implementation**: Although these boolean columns exist in the database, there is no UI rendering or state hooks inside `lead-info-card.tsx` or `DirectoryTab` to view or check these off.

---

## 🗂️ 5. Tabbed Sub-Panels on Dialer Card
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: The active lead card on the dialer tab was split into three custom tabs to keep information dense and clean:
  * `'info'`: Core contact details (editable names, phones, emails, and notes).
  * `'pitch'`: Editable Gemini AI French Pitch text-box and the direct messaging redirects.
  * `'history'`: Displayed the chronological calls audit log timeline for that specific lead alongside the raw scraper metadata.
* **New Implementation**: A single, static vertical form list. There is no pitch tab, call timeline log, or outreach redirect pane.

---

## 📊 6. Central Campaign Analytics Rates (Admin Panel)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Calculations displaying overall outreach success rates:
  * **Coverage Rate** (% of database called vs. uncalled)
  * **Positive Outcome Rate** (% of Interested + Won leads out of called ones)
  * **Conversion Rate** (% of Won leads out of called ones)
  * **Unreachable Rate** (% of Busy + No Answer + Wrong Number out of called ones)
  * **Refusal Rate** (% of Not Interested out of called ones)
* **New Implementation**: Omitted from the UI. Only a basic individual targets tracker is visible to callers on the sidebar.

---

## 📅 7. Meetings & Deadlines Tab (`deadlines`)
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: A sidebar navigation tab containing a full meetings coordination panel:
  * **Calendar View**: Interactive grid of days of the month showing callback count badges. Clicking a day displayed callback details below.
  * **List Table View**: Tabular scroll of upcoming meetings.

---

## 👁️ 8. Audit Event Logs Viewer UI (Admin Panel)
* **Status**: ⚠️ **Partially Missing (Backend Ready, UI Omitted)**
* **Legacy Implementation**: Rendered a structured table of system actions (assignments, profile creations, database resets) from the `audit_logs` table.
* **New Implementation**: The `AdminTab` queries the database and populates the `auditLogs` state, but the code to display the table in the UI is missing from the admin interface.

---

## ✏️ 9. Directory Spreadsheet Inline Cell Inputs
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Allowed double-clicking or focusing fields like `work_hours`, `contact_person`, or `priority` directly inside the spreadsheet table rows to edit them instantly without leaving the grid.
* **New Implementation**: Edits require opening a modal popup.

---

## 🎉 10. Success Confetti Explosion
* **Status**: 🔴 **Completely Missing**
* **Legacy Implementation**: Triggered a full confetti explosion when a lead was successfully converted to `Accepted` or `Client Configured`.

---

## 🔄 11. Case Study: Lead Queue Depletion & Caller Stalling
* **The Problem**: In `getDialerQueue()`, the database query only selects leads with a `call_status` of `'Not Called'`, `NULL`, or `'Recalled'`. 
* **The Consequences**:
  * As callers log outcomes (e.g. `Busy`, `No Answer`, `Callback`, `Wrong Number`), the leads are instantly filtered out of the queue list.
  * Once a caller dials through their allocated range (e.g. 100 leads), their dialer queue hits **0 (empty state)**.
  * Callers are left idle and locked out from calling, even though there may be dozens of unanswered leads (`Busy` or `No Answer`) in their history.
* **Missing Feature Solutions**:
  * **Empty-State Direct Recall Triggers**: An empty queue screen that displays: *"Queue Complete! Click here to automatically recall your unanswered leads (Busy / No Answer) back into the dialer queue."*
  * **Admin Range Alerts**: Live indicators in Hamid's Admin view showing which callers have empty or low queues so he can immediately assign fresh ranges.

---

## 📈 12. Case Study: Why the Daily Target is 80 Calls
* **The Math**: An 8-hour shift has **480 minutes**.
  * **At 80 calls/day**, a caller must cycle through a lead every **6 minutes** (dialing, ringing, pitched, logging results).
  * **Unanswered Ratio (~60%)**: Out of 80 calls, ~48 result in `Busy`, `No Answer`, or `Wrong Number`. These are logged and skipped within **30–60 seconds** (~48 minutes total).
  * **Active Conversations (~40%)**: The remaining ~32 calls result in active conversations. This leaves **13.5 minutes per active call** to walk through the website audit, read the French pitch, copy/paste outreach paragraphs to WhatsApp/DMs, and type call notes.
* **The Problem**: If a caller has **fewer than 80 fresh leads** left in their queue at start-of-day, it is mathematically impossible for them to meet their daily target.
* **Missing Feature Solutions**:
  * **Low Allocation Warning**: A yellow warning banner on the goals tracker: *"Allocated leads remaining (X) is lower than your daily target (80). Request a new range from Hamid to hit your target."*
  * **Automated Admin Top-ups**: An admin option allowing the database to automatically allocate a chunk of 50 new leads to a caller's name when their uncalled lead count falls below 20.

---

## 🔔 13. Case Study: Callback Reminders & Alarm Triggers
* **The Problem**: Callbacks are scheduled for specific dates and times (e.g. `2026-06-05 10:30`). However, callers only see this if they manually click on the "Callbacks" directory sub-tab.
* **The Consequences**: Callers miss critical scheduled callback times because they are busy calling fresh leads from the queue, leading to lost conversion opportunities.
* **Missing Feature Solutions**:
  * **Real-time Callback Checker**: A background listener checking every 60 seconds if any callback dates are due.
  * **Visual & Audio Alarms**: A floating browser notification with a sound prompt (Web Audio API) alerting: *"Meeting Due: [Agency Name] is scheduled for a callback now!"*
  * **Auto-Queue Injection**: Automatically injecting callback leads directly into the top of the active Dialer Queue as the next item once their scheduled time is reached.

---

## 🔒 14. Case Study: Concurrency Lock Gaps
* **The Problem**: Real-time locking locks leads to `assigned_to = callerName` while they are viewing them. 
* **The Consequences**: If a caller closes their tab abruptly, shuts down their computer, or loses internet without clicking away from the dialer, the lead remains locked indefinitely until an inactivity check query runs on the backend (defaulted to 10 minutes).
* **Missing Feature Solutions**:
  * **Manual Unlock Override**: A button for Admins inside the Directory or Admin tab to forcefully unlock any lead locked by another caller.
  * **Lock Expiry Timer**: A live visual countdown timer (e.g., `09:59`) on the active dialer card displaying when the current lease lock expires.
