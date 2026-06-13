/**
 * LeadStream CRM — Frontend Application
 * Communicates with FastAPI backend at http://localhost:8000
 */

const API = 'http://localhost:8000/api';

// ─── State ──────────────────────────────────────────────────────────────────
const state = {
  // Tab 1 — To Call
  leadIds: [],          // all IDs in order
  currentIndex: 0,      // position in leadIds array
  currentLead: null,    // current lead object
  selectedStatus: null, // selected call status string
  totalLeads: 0,        // live count from server

  // Tab 2 — Processed
  processedLeads: [],
  processedTotal: 0,
  processedPage: 0,
  processedPageSize: 25,
  processedFilter: 'all',
  processedSearch: '',

  // UI
  activeTab: 'to-call',
  isLoading: false,
};

// ─── Status Options ──────────────────────────────────────────────────────────
const STATUSES = [
  'Did not pick up',
  'Picked up',
  'Not interested',
  'Interested',
  'Wants more information',
  'Call later',
  'Wrong number',
  'No WhatsApp',
  'Already has a website',
  'Needs follow-up',
  'Potential client',
  'Closed deal',
  'Other',
];

const STATUS_BADGE_CLASS = {
  'Did not pick up':        'badge-noanswer',
  'Picked up':              'badge-pickedup',
  'Not interested':         'badge-notinterested',
  'Interested':             'badge-interested',
  'Wants more information': 'badge-info',
  'Call later':             'badge-later',
  'Wrong number':           'badge-wrong',
  'No WhatsApp':            'badge-nowhatsapp',
  'Already has a website':  'badge-haswebsite',
  'Needs follow-up':        'badge-followup',
  'Potential client':       'badge-potential',
  'Closed deal':            'badge-closed',
  'Other':                  'badge-other',
};

const CATEGORY_EMOJI = {
  'car rental':   '🚗', 'visa':         '📋',
  'travel':       '✈️', 'agency':       '🏢',
  'restaurant':   '🍽️', 'hotel':        '🏨',
  'education':    '🎓', 'real estate':  '🏠',
};

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderStatusGrid();
  await loadLeadIds();
  await loadCurrentLead();
  await refreshProcessedCount();
  setupSearch();
  setupProcessedSearch();
});

// ─── Helpers: API ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    if (e.name === 'TypeError') throw new Error('Cannot connect to server. Is the backend running?');
    throw e;
  }
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function switchTab(tab) {
  state.activeTab = tab;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');

  if (tab === 'processed') {
    loadProcessedLeads(true);
  }
}

// ─── Lead IDs & Navigation ───────────────────────────────────────────────────
async function loadLeadIds() {
  try {
    const data = await apiFetch('/leads/ids');
    state.leadIds = data.ids;
    state.totalLeads = data.total;
    updateCounterUI();
  } catch (e) {
    showToast(e.message, 'error');
    renderEmptyState('to-call');
  }
}

function updateCounterUI() {
  const label = document.getElementById('counter-label');
  const badge = document.getElementById('counter-badge');
  const tabBadge = document.getElementById('tab-badge-to-call');

  label.textContent = 'Leads to call';
  badge.textContent = state.totalLeads;
  tabBadge.textContent = state.totalLeads;
}

async function loadCurrentLead() {
  if (state.leadIds.length === 0) {
    renderEmptyState('to-call');
    updateNavBar();
    return;
  }

  const id = state.leadIds[state.currentIndex];
  if (!id) {
    // Clamp index
    state.currentIndex = Math.max(0, state.leadIds.length - 1);
    return loadCurrentLead();
  }

  try {
    const lead = await apiFetch(`/leads/${id}`);
    state.currentLead = lead;
    state.selectedStatus = null;
    renderLeadCard(lead);
    updateNavBar();
    // Reset notes and status
    document.getElementById('notes-input').value = '';
    document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('selected'));
  } catch (e) {
    // Lead might have been deleted, try advancing
    if (state.leadIds.length > 1) {
      state.leadIds.splice(state.currentIndex, 1);
      if (state.currentIndex >= state.leadIds.length) state.currentIndex = state.leadIds.length - 1;
      await loadCurrentLead();
    } else {
      state.leadIds = [];
      renderEmptyState('to-call');
      updateNavBar();
    }
  }
}

async function navigateLead(direction) {
  const newIndex = state.currentIndex + direction;
  if (newIndex < 0 || newIndex >= state.leadIds.length) return;
  state.currentIndex = newIndex;
  await loadCurrentLead();
}

function updateNavBar() {
  const total = state.leadIds.length;
  const pos = total === 0 ? 0 : state.currentIndex + 1;

  document.getElementById('nav-info').innerHTML =
    total === 0
      ? '<strong>No leads remaining</strong>'
      : `Lead <strong>${pos}</strong> of <strong>${total}</strong>`;

  document.getElementById('btn-prev').disabled = state.currentIndex <= 0;
  document.getElementById('btn-next').disabled = state.currentIndex >= state.leadIds.length - 1;
  document.getElementById('btn-delete').disabled = total === 0;
  document.getElementById('btn-save').disabled = total === 0;
}

// ─── Render Lead Card ─────────────────────────────────────────────────────────
function renderLeadCard(lead) {
  const container = document.getElementById('lead-card-container');

  // Format phones
  const primaryPhone = getPrimaryPhone(lead.phones);
  const allPhones = getPhones(lead.phones);
  const phoneFormatted = formatPhoneDisplay(lead.phones);

  // Category emoji
  const catKey = (lead.category || '').toLowerCase();
  let emoji = '🏢';
  for (const [k, v] of Object.entries(CATEGORY_EMOJI)) {
    if (catKey.includes(k)) { emoji = v; break; }
  }

  // Stars
  const starsHtml = lead.rating
    ? `<span class="stars">${renderStars(lead.rating)}</span> ${lead.rating.toFixed(1)}${lead.reviews_count ? ` <span style="color:var(--color-outline)">(${lead.reviews_count})</span>` : ''}`
    : '';

  container.innerHTML = `
    <div class="lead-card fade-in">
      <div class="lead-card-header">
        <div class="lead-card-title">
          <div class="lead-avatar">${emoji}</div>
          <div>
            <div class="lead-name">${esc(lead.business_name)}</div>
            <div class="lead-meta">
              ${lead.city ? `<span class="lead-city"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>${esc(lead.city)}</span>` : ''}
              ${lead.category ? `<span class="category-chip">${esc(lead.category)}</span>` : ''}
              <span class="lead-id-badge">ID #${lead.id}</span>
            </div>
            ${starsHtml ? `<div class="lead-rating" style="margin-top:6px;">${starsHtml}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="lead-info-grid">
        ${phoneFormatted ? infoItem(phoneIcon(), 'Phone', phoneFormatted) : ''}
        ${lead.email ? infoItem(emailIcon(), 'Email', esc(lead.email)) : ''}
        ${lead.address ? infoItem(addressIcon(), 'Address', esc(lead.address)) : ''}
        ${lead.website ? infoItem(webIcon(), 'Website', `<a href="${esc(lead.website)}" target="_blank" style="color:var(--color-secondary)">${esc(lead.website)}</a>`) : ''}
      </div>

      <div class="divider"></div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        ${actionBtn('btn-instagram', 'instagram', lead.instagram, instagramIcon(), 'Instagram', lead.instagram)}
        ${actionBtn('btn-facebook', 'facebook', lead.facebook, facebookIcon(), 'Facebook', lead.facebook)}
        ${actionBtn('btn-maps', 'maps', lead.maps_url, mapsIcon(), 'Maps', lead.maps_url)}
        ${allPhones.length > 0
          ? allPhones.map((p, i) => `<a class="action-btn btn-phone" href="tel:${formatTelNumber(p)}" title="Call ${p}">${phoneIcon2()}${i === 0 ? 'Call' : 'Alt #'}</a>`).join('')
          : `<button class="action-btn btn-phone disabled" disabled>${phoneIcon2()} Call</button>`
        }
        ${allPhones.length > 0
          ? allPhones.map((p, i) => `<a class="action-btn btn-whatsapp" href="https://wa.me/${formatWaNumber(p)}" target="_blank" title="WhatsApp ${p}">${whatsappIcon()}${i === 0 ? 'WhatsApp' : 'WA Alt'}</a>`).join('')
          : `<button class="action-btn btn-whatsapp disabled" disabled>${whatsappIcon()} WhatsApp</button>`
        }
      </div>
    </div>
  `;
}

function infoItem(icon, label, value) {
  if (!value) return '';
  return `
    <div class="lead-info-item">
      <div class="info-icon" style="color:var(--color-outline)">${icon}</div>
      <div class="info-block">
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
      </div>
    </div>`;
}

function actionBtn(id, type, href, icon, label, url) {
  if (!url || !url.trim()) {
    return `<button class="action-btn btn-${type} disabled" id="${id}" disabled>${icon} ${label}</button>`;
  }
  return `<a class="action-btn btn-${type}" id="${id}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon} ${label}</a>`;
}

function renderEmptyState(panel) {
  if (panel === 'to-call') {
    document.getElementById('lead-card-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-title">All done!</div>
        <div class="empty-sub">You have processed all your leads. Check the Reached tab to review outcomes.</div>
      </div>`;
    state.currentLead = null;
  }
}

// ─── Phone Formatting ─────────────────────────────────────────────────────────
function getPhones(raw) {
  if (!raw) return [];
  return raw.split(';').map(p => p.trim()).filter(Boolean);
}
function getPrimaryPhone(raw) {
  return getPhones(raw)[0] || null;
}
function formatPhoneDisplay(raw) {
  return getPhones(raw).join(' • ') || null;
}
function formatTelNumber(phone) {
  // Strip spaces and ensure + prefix is preserved
  return phone.replace(/[\s\-()]/g, '');
}
function formatWaNumber(phone) {
  // Remove + and spaces for wa.me
  return phone.replace(/[\s\-()+ ]/g, '');
}

// ─── Status Grid ─────────────────────────────────────────────────────────────
function renderStatusGrid() {
  const grid = document.getElementById('status-grid');
  grid.innerHTML = STATUSES.map(s => `
    <button class="status-pill" data-status="${s}" onclick="selectStatus('${s}')">
      <span class="dot"></span>
      ${s}
    </button>
  `).join('');
}

function selectStatus(status) {
  state.selectedStatus = status;
  document.querySelectorAll('.status-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.status === status);
  });
}

// ─── Save Lead ────────────────────────────────────────────────────────────────
async function saveLead() {
  if (!state.currentLead) return;
  if (!state.selectedStatus) {
    showToast('Please select a call result status first.', 'info');
    document.querySelector('.status-grid').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const note = document.getElementById('notes-input').value.trim();
  const leadId = state.currentLead.id;
  const leadName = state.currentLead.business_name;

  document.getElementById('btn-save').disabled = true;
  document.getElementById('btn-save').textContent = 'Saving…';

  try {
    await apiFetch(`/leads/${leadId}/process`, {
      method: 'POST',
      body: JSON.stringify({ call_status: state.selectedStatus, note }),
    });

    // Remove from local list
    state.leadIds.splice(state.currentIndex, 1);
    state.totalLeads = Math.max(0, state.totalLeads - 1);
    updateCounterUI();

    // Clamp index
    if (state.currentIndex >= state.leadIds.length) {
      state.currentIndex = Math.max(0, state.leadIds.length - 1);
    }

    showToast(`✅ "${leadName}" saved as ${state.selectedStatus}`, 'success');

    // Update processed badge
    await refreshProcessedCount();

    // Load next lead
    await loadCurrentLead();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    document.getElementById('btn-save').disabled = false;
    document.getElementById('btn-save').innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
      Save & Process`;
  }
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────
function confirmDelete() {
  if (!state.currentLead) return;
  document.getElementById('delete-modal-name').textContent = state.currentLead.business_name;
  document.getElementById('delete-modal').classList.add('open');
}
function closeModal() {
  document.getElementById('delete-modal').classList.remove('open');
}
async function executeDelete() {
  closeModal();
  if (!state.currentLead) return;

  const leadId = state.currentLead.id;
  const leadName = state.currentLead.business_name;

  try {
    await apiFetch(`/leads/${leadId}`, { method: 'DELETE' });

    state.leadIds.splice(state.currentIndex, 1);
    state.totalLeads = Math.max(0, state.totalLeads - 1);
    updateCounterUI();

    if (state.currentIndex >= state.leadIds.length) {
      state.currentIndex = Math.max(0, state.leadIds.length - 1);
    }

    showToast(`🗑️ "${leadName}" deleted`, 'info');
    await loadCurrentLead();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Close modal on overlay click
document.getElementById('delete-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── Search ───────────────────────────────────────────────────────────────────
let searchTimeout = null;

function setupSearch() {
  const input = document.getElementById('global-search');
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) {
      // Restore normal navigation
      loadLeadIds().then(loadCurrentLead);
      return;
    }
    searchTimeout = setTimeout(() => runSearch(q), 300);
  });
}

async function runSearch(q) {
  try {
    const data = await apiFetch(`/leads/search?q=${encodeURIComponent(q)}`);
    if (data.leads.length === 0) {
      document.getElementById('lead-card-container').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No results for "${esc(q)}"</div>
          <div class="empty-sub">Try searching by name, phone number, city, or lead ID.</div>
        </div>`;
      state.currentLead = null;
      updateNavBar();
      return;
    }
    // Use search results as the navigation list
    state.leadIds = data.leads.map(l => l.id);
    state.currentIndex = 0;
    await loadCurrentLead();
    showToast(`Found ${data.total} lead${data.total !== 1 ? 's' : ''}`, 'info');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ─── Processed Leads ─────────────────────────────────────────────────────────
async function refreshProcessedCount() {
  try {
    const data = await apiFetch('/processed/count');
    document.getElementById('tab-badge-processed').textContent = data.count;
  } catch (_) {}
}

async function loadProcessedLeads(reset = false) {
  if (reset) {
    state.processedPage = 0;
    state.processedLeads = [];
    document.getElementById('processed-list').innerHTML = '';
  }

  const skip = state.processedPage * state.processedPageSize;
  const statusParam = state.processedFilter !== 'all' ? `&status=${encodeURIComponent(state.processedFilter)}` : '';

  try {
    const data = await apiFetch(`/processed?skip=${skip}&limit=${state.processedPageSize}${statusParam}`);
    state.processedLeads.push(...data.leads);
    state.processedTotal = data.total;
    renderProcessedList(data.leads, reset);

    const loadMoreBtn = document.getElementById('load-more-btn');
    const shown = state.processedLeads.length;
    if (shown < state.processedTotal) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = `Load more (${state.processedTotal - shown} remaining)`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function loadMoreProcessed() {
  state.processedPage++;
  loadProcessedLeads(false);
}

function renderProcessedList(leads, reset) {
  const list = document.getElementById('processed-list');
  if (reset) list.innerHTML = '';

  if (leads.length === 0 && state.processedLeads.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No processed leads yet</div>
        <div class="empty-sub">Start calling and saving leads from the "To Call" tab.</div>
      </div>`;
    return;
  }

  leads.forEach(lead => {
    const div = document.createElement('div');
    div.className = 'processed-card fade-in';
    div.innerHTML = renderProcessedCard(lead);
    list.appendChild(div);
  });
}

function renderProcessedCard(lead) {
  const badgeClass = STATUS_BADGE_CLASS[lead.call_status] || 'badge-other';
  const phones = getPhones(lead.phones);
  const date = lead.processed_at ? formatDate(lead.processed_at) : '—';

  return `
    <div class="processed-card-header">
      <div>
        <div class="processed-card-name">${esc(lead.business_name)}</div>
        <div class="processed-card-sub">
          ${lead.city ? `📍 ${esc(lead.city)}` : ''}
          ${lead.category ? ` · ${esc(lead.category)}` : ''}
        </div>
      </div>
      <div>
        <span class="status-badge ${badgeClass}">
          <span class="dot" style="background:currentColor"></span>
          ${esc(lead.call_status || 'Other')}
        </span>
      </div>
    </div>
    <div class="processed-card-meta">
      ${phones.length > 0 ? `<span style="font-size:12px;color:var(--color-on-surface-var)">📞 ${esc(phones[0])}</span>` : ''}
      <span class="processed-card-date">🕐 ${date}</span>
      ${lead.original_lead_id ? `<span style="font-size:11px;color:var(--color-outline)">ID #${lead.original_lead_id}</span>` : ''}
    </div>
    ${lead.note ? `<div class="processed-card-note">"${esc(lead.note)}"</div>` : ''}
  `;
}

function filterProcessed(status, el) {
  state.processedFilter = status;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  loadProcessedLeads(true);
}

function setupProcessedSearch() {
  const input = document.getElementById('processed-search');
  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    const q = input.value.trim();
    if (!q) { loadProcessedLeads(true); return; }
    t = setTimeout(async () => {
      try {
        const data = await apiFetch(`/processed/search?q=${encodeURIComponent(q)}&status=${encodeURIComponent(state.processedFilter)}`);
        state.processedLeads = data.leads;
        renderProcessedList(data.leads, true);
        document.getElementById('load-more-btn').classList.add('hidden');
      } catch (e) { showToast(e.message, 'error'); }
    }, 300);
  });
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '★'.repeat(full);
  if (half) html += '⯨';
  html += '☆'.repeat(5 - full - (half ? 1 : 0));
  return html;
}

// ─── Date format ─────────────────────────────────────────────────────────────
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const instagramIcon = () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z"/></svg>`;
const facebookIcon = () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
const mapsIcon = () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:var(--maps-color)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`;
const phoneIcon2 = () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
const whatsappIcon = () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;
const phoneIcon = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
const emailIcon = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
const addressIcon = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`;
const webIcon = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;

// ─── XSS escape ───────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span> ${esc(msg)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Don't fire when typing in input/textarea
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  if (state.activeTab === 'to-call') {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); navigateLead(-1); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navigateLead(1); }
    if (e.key === 'Enter' && e.ctrlKey) saveLead();
    if (e.key === 'Delete' && e.ctrlKey) confirmDelete();
  }
  if (e.key === '1' && e.ctrlKey) { e.preventDefault(); switchTab('to-call'); }
  if (e.key === '2' && e.ctrlKey) { e.preventDefault(); switchTab('processed'); }
});
