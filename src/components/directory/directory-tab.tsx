'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, Globe, MapPin, AlertCircle, Edit, Trash2, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getLeads, updateLeadDetails, deleteLeadPermanently, restoreLeadToQueue, getLeadAreas } from '@/app/actions/leads';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type DirectoryTabProps = {
  callerName: string;
  callerRole: string;
};

type SubTab = 'leads' | 'warm' | 'callbacks' | 'lost';

export function DirectoryTab({ callerName, callerRole }: DirectoryTabProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtering & Pagination State
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('leads');
  const [search, setSearch] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [areasList, setAreasList] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Edit Form state
  const [agencyName, setAgencyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phone2, setPhone2] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [email2, setEmail2] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [websiteQuality, setWebsiteQuality] = useState<string>('Medium');
  const [leadArea, setLeadArea] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [callNotes, setCallNotes] = useState<string>('');
  const [leadPriority, setLeadPriority] = useState<number>(3);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    setPage(1); // Reset page on filter changes
    fetchLeads();
  }, [activeSubTab, search, priority, area]);

  useEffect(() => {
    fetchLeads();
  }, [page]);

  const fetchAreas = async () => {
    const res = await getLeadAreas();
    if (res.success) {
      setAreasList(res.areas || []);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    
    // Map internal tab to the getLeads options
    let statusFilter = '';
    let excludeLost = false;

    switch (activeSubTab) {
      case 'leads':
        excludeLost = true;
        break;
      case 'warm':
        statusFilter = 'WarmLeads';
        break;
      case 'callbacks':
        statusFilter = 'Followups';
        break;
      case 'lost':
        statusFilter = 'Lost';
        break;
    }

    const res = await getLeads({
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priority || undefined,
      area: area || undefined,
      page,
      limit,
      excludeLost,
    });

    if (res.success) {
      setLeads(res.leads || []);
      setTotalLeads(res.total || 0);
    } else {
      console.error('[Fetch Leads Error]', res.error);
    }
    setLoading(false);
  };

  const handleOpenEdit = (lead: any) => {
    setSelectedLead(lead);
    setAgencyName(lead.agency_name || '');
    setPhone(lead.phone || '');
    setPhone2(lead.phone_2 || '');
    setEmail(lead.email || '');
    setEmail2(lead.email_2 || '');
    setWebsite(lead.website || '');
    setWebsiteQuality(lead.website_quality || 'Medium');
    setLeadArea(lead.area || '');
    setAddress(lead.address || '');
    setNotes(lead.notes || '');
    setCallNotes(lead.call_notes || '');
    setLeadPriority(Number(lead.priority) || 3);
    setIsEditOpen(true);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setFormSubmitting(true);
    const res = await updateLeadDetails(selectedLead.id, {
      agency_name: agencyName,
      phone,
      phone_2: phone2 || null,
      email: email || null,
      email_2: email2 || null,
      website: website || null,
      website_quality: websiteQuality,
      area: leadArea,
      address: address || null,
      notes,
      call_notes: callNotes,
      priority: leadPriority,
    });
    setFormSubmitting(false);

    if (res.success) {
      setIsEditOpen(false);
      setSelectedLead(null);
      void fetchLeads();
      void fetchAreas();
    } else {
      alert(`Error updating lead: ${res.error}`);
    }
  };

  const handleRecall = async (leadId: number) => {
    if (!confirm('Are you sure you want to push this lead back into the active dialer queue?')) return;
    const res = await restoreLeadToQueue(leadId);
    if (res.success) {
      void fetchLeads();
    } else {
      alert(`Error restoring lead: ${res.error}`);
    }
  };

  const handleDelete = async (leadId: number) => {
    if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete this lead and its full calling history? This cannot be undone.')) return;
    const res = await deleteLeadPermanently(leadId);
    if (res.success) {
      void fetchLeads();
    } else {
      alert(`Error deleting lead: ${res.error}`);
    }
  };

  const totalPages = Math.ceil(totalLeads / limit) || 1;

  const getPriorityBadge = (p: number) => {
    const map: any = {
      1: 'bg-rose-50 text-rose-700 border-rose-100',
      2: 'bg-amber-50 text-amber-700 border-amber-100',
      3: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      4: 'bg-slate-50 text-slate-700 border-slate-100',
      5: 'bg-slate-50 text-slate-500 border-slate-150',
    };
    return (
      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${map[p] || 'bg-slate-50 text-slate-600'}`}>
        P{p}
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="text-[10px] text-slate-400">Not Called</span>;
    
    let styles = 'bg-slate-50 text-slate-600 border-slate-150';
    if (['Accepted', 'Client Configured'].includes(status)) {
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-150';
    } else if (status === 'Interested') {
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-150';
    } else if (['Callback', 'Recalled'].includes(status)) {
      styles = 'bg-amber-50 text-amber-700 border-amber-150';
    } else if (['Busy', 'No Answer'].includes(status)) {
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
    } else if (['Not Interested', 'Wrong Number'].includes(status)) {
      styles = 'bg-rose-50 text-rose-700 border-rose-150';
    }
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-1">
      {/* Tab select bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('leads')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'leads'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          All Active Leads
        </button>
        <button
          onClick={() => setActiveSubTab('warm')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'warm'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Warm Leads
        </button>
        <button
          onClick={() => setActiveSubTab('callbacks')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'callbacks'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Callbacks / Busy
        </button>
        <button
          onClick={() => setActiveSubTab('lost')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'lost'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Lost Leads
        </button>
      </div>

      {/* Spreadsheet Control Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads name, area, phone, website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Priority select */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-650 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Priority:</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-750 font-bold border-none"
          >
            <option value="">All Priorities</option>
            <option value="1">P1 (High Socials)</option>
            <option value="2">P2 (High Reviews)</option>
            <option value="3">P3 (Medium)</option>
            <option value="4">P4 (Low)</option>
            <option value="5">P5 (Lowest)</option>
          </select>
        </div>

        {/* Area filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-655 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Area:</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-750 font-bold border-none"
          >
            <option value="">All Areas</option>
            {areasList.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-body ml-auto">
          Found: <span className="text-slate-800 font-extrabold font-display">{totalLeads}</span> leads
        </div>
      </div>

      {/* Spreadsheet Table Grid */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
          <table className="w-full text-left border-collapse font-body text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/65 font-display text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <th className="px-6 py-3.5">Agency / Company</th>
                <th className="px-6 py-3.5">Phone Details</th>
                <th className="px-6 py-3.5">Web Presence</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Call Status</th>
                <th className="px-6 py-3.5">Last Caller</th>
                <th className="px-6 py-3.5">Meeting / Callback Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
                      <span className="text-[10px] uppercase font-bold tracking-widest font-display">Syncing directory table...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <AlertCircle className="w-6 h-6 text-slate-350" />
                      <span className="text-xs font-semibold uppercase tracking-wider">No matching leads found</span>
                      <span className="text-[10px] text-slate-350">Try broadening your search index query or select different filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium ${
                      idx % 2 === 1 ? 'bg-slate-50/15' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-display font-bold text-slate-800 uppercase tracking-wide">
                          {lead.agency_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-350 shrink-0" />
                          {lead.area}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-350 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.phone_2 && (
                          <div className="flex items-center gap-1.5 text-slate-400 font-normal">
                            <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                            <span>{lead.phone_2}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[10px]">
                        {lead.website && lead.website !== 'None' && lead.website !== 'Not found' ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 underline font-bold"
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{lead.website}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">No Web</span>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-slate-500 font-normal">
                            <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                            <span className="truncate max-w-[120px]">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(lead.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(lead.call_status)}</td>
                    <td className="px-6 py-4 text-slate-650 font-bold uppercase tracking-wider text-[10px]">
                      {lead.caller_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[10px] font-semibold">
                      {lead.meeting_date || 'None'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        {activeSubTab === 'lost' && (
                          <button
                            onClick={() => handleRecall(lead.id)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all cursor-pointer"
                            title="Recall Lead to Queue"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(callerRole === 'Admin' || callerRole === 'Supervisor') && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider font-body text-slate-550">
          <div>
            Showing <span className="text-slate-850 font-extrabold">{leads.length}</span> of{' '}
            <span className="text-slate-850 font-extrabold">{totalLeads}</span> leads
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 hover:text-slate-800 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="text-slate-850 font-extrabold font-display">{page}</span> of{' '}
              <span className="text-slate-850 font-extrabold font-display">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 hover:text-slate-800 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lead details editor modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedLead(null); }}
        title="Edit Lead Registry"
        subtitle={selectedLead ? `Registry ID: #${selectedLead.id} (${selectedLead.agency_name})` : 'Edit Details'}
        size="lg"
      >
        <form onSubmit={handleUpdateDetails} className="flex flex-col gap-4 font-body text-xs">
          <div className="grid grid-cols-2 gap-4">
            {/* Primary Details */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
                Company Details
              </h4>
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Agency Name *</label>
                <Input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Area / City *</label>
                <Input
                  type="text"
                  required
                  value={leadArea}
                  onChange={(e) => setLeadArea(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Physical Address</label>
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Dialer Priority</label>
                <select
                  value={leadPriority}
                  onChange={(e) => setLeadPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-700 text-xs"
                >
                  <option value={1}>P1: High Socials, No Web</option>
                  <option value={2}>P2: High Reviews, Low Web</option>
                  <option value={3}>P3: Standard</option>
                  <option value={4}>P4: Low Priority</option>
                  <option value={5}>P5: Lowest Priority</option>
                </select>
              </div>
            </div>

            {/* Contacts & Notes */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
                Contact & Web Details
              </h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Phone 1 *</label>
                  <Input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Phone 2</label>
                  <Input
                    type="text"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Email 1</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Email 2</label>
                  <Input
                    type="email"
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Website Link</label>
                  <Input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Web Quality</label>
                  <select
                    value={websiteQuality}
                    onChange={(e) => setWebsiteQuality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-700 text-xs"
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              Ledger Outlines & Summaries
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Scraping / Agency Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Latest Call Notes</label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsEditOpen(false); setSelectedLead(null); }}
              disabled={formSubmitting}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={formSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {formSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SAVE CHANGES'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
