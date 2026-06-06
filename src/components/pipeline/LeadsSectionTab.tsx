'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Phone, Mail, Globe, MapPin, Edit2, 
  RotateCcw, ChevronLeft, ChevronRight, Loader2, Trash2,
  Clock, CheckCircle, AlertCircle, MessageSquare
} from 'lucide-react';
import { 
  getLeads, 
  updateLeadDetails, 
  restoreLeadToQueue, 
  deleteLeadPermanently,
  getCallHistory 
} from '@/app/actions/leads';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { GlassCard } from '../ui/glass-card';
import { toast, confirm } from '@/lib/toast';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

type LeadsSectionTabProps = {
  callerName: string;
  callerRole: string;
  type: 'failures' | 'followups' | 'hot_leads';
  selectedNiche?: string | null;
};

export function LeadsSectionTab({ 
  callerName, 
  callerRole, 
  type, 
  selectedNiche 
}: LeadsSectionTabProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const limit = 12;

  // Selected Lead for Edit Details modal
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editCallNotes, setEditCallNotes] = useState<string>('');
  const [editContactPerson, setEditContactPerson] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editMeetingDate, setEditMeetingDate] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Expandable History State
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let statusFilter = '';
    if (type === 'failures') {
      statusFilter = 'Lost';
    } else if (type === 'followups') {
      statusFilter = 'Followups';
    } else if (type === 'hot_leads') {
      statusFilter = 'GoodClients';
    }

    const res = await getLeads({
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priority || undefined,
      page,
      limit,
      excludeLost: false,
      niche: selectedNiche || undefined,
    });

    if (res.success) {
      // For hot_leads, we also want to manually append 'Interested' status leads if they aren't fully in converted.
      // Wait, getLeads GoodClients query does Accepted & Client Configured. What about Interested?
      // Let's check: "third tab will be for accepted intersed and booked meetings"
      // If the tab is hot_leads, it should contain: Interested, Accepted, Client Configured.
      // Wait! getLeads status filter 'GoodClients' retrieves Accepted & Client Configured. It doesn't retrieve Interested.
      // Let's check if we can query them or filter them. Since getLeads queries by status:
      // If type === 'hot_leads', maybe we can retrieve both 'GoodClients' and 'Interested'?
      // Or, in getLeads, we can pass statusFilter = 'GoodClients' but wait, what if we update getLeads to support multiple statuses?
      // Let's check: in leads.ts, getLeads has:
      // else if (status === 'GoodClients') { q = q.in('call_status', CONVERTED_STATUSES); }
      // where CONVERTED_STATUSES = ['Accepted', 'Client Configured'].
      // If we want hot_leads to display Accepted, Interested, and Client Configured, we can query status = 'hot_leads'!
      // Wait, let's look at getLeads:
      // if (status === 'GoodClients') ...
      // Can we add a custom status filter in getLeads? Let's check. Yes!
      // In leads.ts, we can update getLeads to handle status === 'HotLeads' which selects ['Accepted', 'Client Configured', 'Interested'].
      // Let's modify fetchLeads in LeadsSectionTab to retrieve those.
      // Wait! Let's see: if type === 'hot_leads', we can request status: 'HotLeads' (which we will add in leads.ts) or retrieve it.
      // Let's check: what statuses are lost? ['Not Interested', 'Wrong Number'].
      // What statuses are followups? ['Callback', 'Busy', 'No Answer'].
      // What statuses are hot_leads? ['Interested', 'Accepted', 'Client Configured'].
      // This is exactly matching:
      // - failures: status = 'Lost'
      // - followups: status = 'Followups'
      // - hot_leads: status = 'HotLeads' (Accepted, Client Configured, Interested)
      // Let's support status = 'HotLeads' in getLeads in leads.ts!
      // Let's verify: we already modified leads.ts, but we can easily add a quick replacement chunk or support it!
      // Wait, in fetchLeads here, we will pass status: type === 'hot_leads' ? 'HotLeads' : (type === 'failures' ? 'Lost' : 'Followups').
      
      setLeads(res.leads || []);
      setTotalLeads(res.total || 0);
    }
    setLoading(false);
  }, [type, search, priority, page, selectedNiche]);

  useEffect(() => {
    setPage(1);
    void fetchLeads();
  }, [type, search, priority, selectedNiche, fetchLeads]);

  useEffect(() => {
    void fetchLeads();
  }, [page, fetchLeads]);

  const handleOpenEdit = (lead: any) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditCallNotes(lead.call_notes || '');
    setEditContactPerson(lead.contact_person || '');
    setEditStatus(lead.call_status || '');
    setEditMeetingDate(lead.meeting_date || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setFormSubmitting(true);
    const res = await updateLeadDetails(selectedLead.id, {
      notes: editNotes,
      call_notes: editCallNotes,
      contact_person: editContactPerson,
      call_status: editStatus || undefined,
      meeting_date: editMeetingDate || null
    });
    setFormSubmitting(false);

    if (res.success) {
      toast.success('Lead registry updated successfully.');
      setIsEditOpen(false);
      setSelectedLead(null);
      void fetchLeads();
    } else {
      toast.error(`Error updating registry: ${res.error}`);
    }
  };

  const handleRecall = async (leadId: number, name: string) => {
    const ok = await confirm(`Push ${name} back into the active dialer queue? This will release its locks and make it callable immediately.`, {
      title: 'Recall to Queue',
      confirmLabel: 'Recall',
    });
    if (!ok) return;

    const res = await restoreLeadToQueue(leadId);
    if (res.success) {
      toast.success('Lead successfully recalled to dialer queue.');
      void fetchLeads();
    } else {
      toast.error(`Error recalling lead: ${res.error}`);
    }
  };

  const handleDeleteLead = async (leadId: number, name: string) => {
    if (callerRole !== 'Admin') {
      toast.error('Only Administrators are allowed to delete leads permanently.');
      return;
    }
    const ok = await confirm(`Permanently delete ${name} and all associated call logs? This action is irreversible.`, {
      title: 'Delete Lead Registry',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    const res = await deleteLeadPermanently(leadId);
    if (res.success) {
      toast.success('Lead registry deleted.');
      void fetchLeads();
    } else {
      toast.error(`Error deleting lead: ${res.error}`);
    }
  };

  const handleToggleHistory = async (leadId: number) => {
    if (expandedHistoryId === leadId) {
      setExpandedHistoryId(null);
      return;
    }
    setExpandedHistoryId(leadId);
    setLoadingHistory(true);
    const res = await getCallHistory(leadId);
    if (res.success) {
      setCallHistory(res.history || []);
    } else {
      toast.error('Failed to load call history.');
    }
    setLoadingHistory(false);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="text-[10px] text-slate-400">Not Called</span>;
    let colorClass = 'bg-slate-50 text-slate-500 border-slate-150';
    if (['Accepted', 'Client Configured'].includes(status)) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-150';
    else if (status === 'Interested') colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-150';
    else if (['Callback', 'Recalled'].includes(status)) colorClass = 'bg-amber-50 text-amber-700 border-amber-150';
    else if (['Busy', 'No Answer'].includes(status)) colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
    else if (['Not Interested', 'Wrong Number'].includes(status)) colorClass = 'bg-rose-50 text-rose-700 border-rose-150';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${colorClass}`}>
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(totalLeads / limit) || 1;

  const tabTitleMap = {
    failures: { title: 'Trash & Dead Leads', subtitle: 'Leads categorized as rejected, wrong number, or not interested' },
    followups: { title: 'Follow-up Queue', subtitle: 'Potential comebacks, busy, call back, and no answer leads' },
    hot_leads: { title: 'Hot Leads & Meetings', subtitle: 'Interested agencies, booked meetings, and accepted deals' },
  };

  const currentTabInfo = tabTitleMap[type] || { title: 'Campaign Leads', subtitle: 'Campaign registry leads list' };

  return (
    <div className="flex flex-col gap-5 h-full w-full font-body text-xs">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <div>
          <h2 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
            {currentTabInfo.title}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            {currentTabInfo.subtitle} {selectedNiche && selectedNiche !== 'All' ? `(${selectedNiche} Niche)` : ''}
          </p>
        </div>
        <div className="text-slate-400 text-[10px] uppercase font-black tracking-wider">
          Total: <span className="text-slate-800 font-extrabold font-display">{totalLeads}</span> leads
        </div>
      </div>

      {/* Filter Options Header */}
      <div className="flex flex-wrap items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by agency name, area, phone, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-450 text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-bold">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Priority:</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-750 font-extrabold border-none cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="1">P1 (High Socials)</option>
            <option value="2">P2 (High Reviews)</option>
            <option value="3">P3 (Medium)</option>
            <option value="4">P4 (Low)</option>
            <option value="5">P5 (Lowest)</option>
          </select>
        </div>
      </div>

      {/* Leads Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-display">Retrieving leads ledger...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm gap-2">
            <AlertCircle className="w-7 h-7 text-slate-350" />
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">No matching leads in this list</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {leads.map((lead) => (
              <GlassCard 
                key={lead.id} 
                className={`border border-slate-200/80 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
              >
                {/* Priority Watermark Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-slate-250 ${
                  lead.priority === 1 ? 'bg-rose-500' :
                  lead.priority === 2 ? 'bg-amber-500' :
                  lead.priority === 3 ? 'bg-indigo-500' :
                  'bg-slate-300'
                }`} />

                {/* Card Title Header */}
                <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-extrabold text-slate-800 uppercase tracking-wide truncate max-w-[200px]" title={lead.agency_name}>
                      {lead.agency_name}
                    </h3>
                    <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>{lead.area}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {getStatusBadge(lead.call_status)}
                    {lead.niche && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[8px] uppercase tracking-wider">
                        {lead.niche}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col gap-2 font-medium text-slate-650 text-[10.5px]">
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:text-indigo-650 hover:underline font-bold text-slate-700">{lead.phone}</a>
                    {lead.phone_2 && (
                      <span className="text-slate-400 font-normal"> / {lead.phone_2}</span>
                    )}
                  </div>

                  {/* Email */}
                  {(lead.email || lead.email_2) && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-650">{lead.email || lead.email_2}</span>
                    </div>
                  )}

                  {/* Website */}
                  {lead.website && (
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-650 hover:underline truncate">
                        {lead.website}
                      </a>
                    </div>
                  )}

                  {/* Scheduled Callback date */}
                  {lead.call_status === 'Callback' && lead.meeting_date && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Callback due: {lead.meeting_date}</span>
                    </div>
                  )}

                  {/* Call notes */}
                  {lead.call_notes && (
                    <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Last Call Notes</span>
                      <p className="text-[10px] font-medium text-slate-600 italic leading-relaxed">
                        "{lead.call_notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Call History Dropdown trigger */}
                {expandedHistoryId === lead.id && (
                  <div className="border-t border-slate-150/60 pt-3 flex flex-col gap-2 bg-slate-50/50 -mx-5 -mb-5 px-5 pb-5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest block">Call History Logs</span>
                    {loadingHistory ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto py-2" />
                    ) : callHistory.length === 0 ? (
                      <span className="text-[9.5px] text-slate-400 italic">No historical calls found.</span>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                        {callHistory.map((h, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-450 border-b border-slate-50 pb-0.5">
                              <span>Caller: {h.caller_name}</span>
                              <span>{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="font-extrabold text-[9px] uppercase text-indigo-700">{h.call_status}</span>
                            <p className="text-[9.5px] text-slate-500 font-medium italic">"{h.notes}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleHistory(lead.id)}
                    className="text-[9.5px] font-extrabold text-indigo-650 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    {expandedHistoryId === lead.id ? 'Hide Logs' : 'History Logs'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(lead)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                      title="Edit Lead Registry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {type === 'failures' && (
                      <button
                        onClick={() => handleRecall(lead.id, lead.agency_name)}
                        className="p-1.5 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-650 hover:text-indigo-850 hover:border-indigo-200 transition-all flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                        title="Recall back to Active Dialer Queue"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>RECALL</span>
                      </button>
                    )}

                    {callerRole === 'Admin' && (
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.agency_name)}
                        className="p-1.5 rounded-lg border border-rose-100 hover:border-rose-350 text-rose-500 hover:text-rose-700 hover:bg-rose-50/30 transition-all cursor-pointer"
                        title="Delete Lead Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Custom styled Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm shrink-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="secondary"
              className="p-2 min-w-0 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="secondary"
              className="p-2 min-w-0 rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mini Edit Details Modal */}
      {isEditOpen && selectedLead && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedLead(null); }}
          title="Edit Lead Registry"
          subtitle={`Quickly update details for ${selectedLead.agency_name}`}
        >
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Contact Person</label>
              <Input
                type="text"
                placeholder="e.g. Mourad (Directeur)"
                value={editContactPerson}
                onChange={(e) => setEditContactPerson(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Call Status Outcome</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-705 text-xs cursor-pointer"
              >
                <option value="">-- No Change --</option>
                <option value="Not Called">Not Called</option>
                <option value="Recalled">Recalled</option>
                <option value="Interested">Interested</option>
                <option value="Callback">Callback</option>
                <option value="Busy">Busy</option>
                <option value="No Answer">No Answer</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Wrong Number">Wrong Number</option>
                <option value="Accepted">Accepted</option>
                <option value="Client Configured">Client Configured</option>
              </select>
            </div>

            {['Callback', 'Interested', 'Accepted'].includes(editStatus) && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Callback / Meeting Date (YYYY-MM-DD HH:MM)</label>
                <Input
                  type="text"
                  placeholder="e.g. 2026-06-15 14:00"
                  value={editMeetingDate}
                  onChange={(e) => setEditMeetingDate(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">General Registry Notes</label>
              <textarea
                rows={3}
                placeholder="Notes about business, requirements..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-semibold text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Last Call Notes</label>
              <textarea
                rows={3}
                placeholder="Call log summary..."
                value={editCallNotes}
                onChange={(e) => setEditCallNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-semibold text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button
                variant="secondary"
                onClick={() => { setIsEditOpen(false); setSelectedLead(null); }}
                disabled={formSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {formSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
