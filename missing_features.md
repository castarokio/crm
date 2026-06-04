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
