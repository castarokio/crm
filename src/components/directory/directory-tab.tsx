'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Phone, Mail, Globe, MapPin, AlertCircle, Edit, 
  Trash2, RotateCcw, ChevronLeft, ChevronRight, Loader2, Plus 
} from 'lucide-react';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { 
  getLeads, 
  updateLeadDetails, 
  deleteLeadPermanently, 
  restoreLeadToQueue, 
  getLeadAreas,
  createLeadAction,
  bulkDeleteLeadsAction,
  bulkRestoreLeadsAction
} from '@/app/actions/leads';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GlassCard } from '../ui/glass-card';

type DirectoryTabProps = {
  callerName: string;
  callerRole: string;
  searchQuery?: string;
  onClearSearchQuery?: () => void;
};

// 7 sub-tabs: active, warm, callbacks, lost, treated, good_clients, database
type SubTab = 'leads' | 'warm' | 'callbacks' | 'lost' | 'treated' | 'good_clients' | 'database';

export function DirectoryTab({ callerName, callerRole, searchQuery, onClearSearchQuery }: DirectoryTabProps) {
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

  // Bulk Select State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal forms state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null); // null if creating a new lead
  
  // Lead Form state fields
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
  
  // Social profile fields inside Edit/Create modal
  const [facebook, setFacebook] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [tiktok, setTiktok] = useState<string>('');
  const [linkedin, setLinkedin] = useState<string>('');
  const [socialLink, setSocialLink] = useState<string>('');
  
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ leadId: number; field: 'priority' | 'contact_person' | 'work_hours' } | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');

  // Selected Simple Profile State
  const [profileLead, setProfileLead] = useState<any | null>(null);
  const [profileFields, setProfileFields] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const handleSelectProfileLead = (lead: any) => {
    setProfileLead(lead);
    setProfileFields({
      agency_name: lead.agency_name || '',
      area: lead.area || '',
      address: lead.address || '',
      priority: lead.priority ?? 3,
      call_status: lead.call_status || 'Not Called',
      phone: lead.phone || '',
      phone_2: lead.phone_2 || '',
      email: lead.email || '',
      email_2: lead.email_2 || '',
      website: lead.website || '',
      website_quality: lead.website_quality || 'Medium',
      facebook: lead.facebook || '',
      instagram: lead.instagram || '',
      tiktok: lead.tiktok || '',
      linkedin: lead.linkedin || '',
      social_link: lead.social_link || '',
      work_hours: lead.work_hours || '',
      notes: lead.notes || '',
      call_notes: lead.call_notes || '',
    });
  };

  const handleProfileFieldChange = (field: string, val: any) => {
    setProfileFields((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileLead) return;
    setSavingProfile(true);
    const res = await updateLeadDetails(profileLead.id, profileFields);
    setSavingProfile(false);
    if (res.success) {
      // Update local state in table list
      setLeads(prev => prev.map(l => l.id === profileLead.id ? { ...l, ...profileFields } : l));
      setProfileLead((prev: any) => ({ ...prev, ...profileFields }));
      alert('Lead profile updated successfully.');
    } else {
      alert(`Failed to update profile: ${res.error}`);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setSearch(searchQuery);
      setActiveSubTab('database');
      if (onClearSearchQuery) onClearSearchQuery();
    }
  }, [searchQuery, onClearSearchQuery]);

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    setPage(1); // Reset page on filter changes
    setSelectedIds(new Set()); // Clear selection
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
      case 'treated':
        statusFilter = 'Treated';
        break;
      case 'good_clients':
        statusFilter = 'GoodClients';
        break;
      case 'database':
        // database represents no filters on status and not excluding lost
        statusFilter = '';
        excludeLost = false;
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

  // Open Create Lead form modal
  const handleOpenCreate = () => {
    setSelectedLead(null);
    setAgencyName('');
    setPhone('');
    setPhone2('');
    setEmail('');
    setEmail2('');
    setWebsite('');
    setWebsiteQuality('Medium');
    setLeadArea('');
    setAddress('');
    setNotes('');
    setCallNotes('');
    setLeadPriority(3);
    setFacebook('');
    setInstagram('');
    setTiktok('');
    setLinkedin('');
    setSocialLink('');
    setIsEditOpen(true);
  };

  // Open Edit Lead form modal
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
    setFacebook(lead.facebook || '');
    setInstagram(lead.instagram || '');
    setTiktok(lead.tiktok || '');
    setLinkedin(lead.linkedin || '');
    setSocialLink(lead.social_link || '');
    setIsEditOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !phone || !leadArea) {
      alert('Agency Name, primary Phone, and Area/City are required.');
      return;
    }

    setFormSubmitting(true);
    const payload = {
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
      facebook: facebook || null,
      instagram: instagram || null,
      tiktok: tiktok || null,
      linkedin: linkedin || null,
      social_link: socialLink || null,
    };

    let res;
    if (selectedLead) {
      // Edit mode
      res = await updateLeadDetails(selectedLead.id, payload);
    } else {
      // Create mode
      res = await createLeadAction(payload);
    }

    setFormSubmitting(false);

    if (res.success) {
      setIsEditOpen(false);
      setSelectedLead(null);
      void fetchLeads();
      void fetchAreas();
    } else {
      alert(`Error saving lead registry: ${res.error}`);
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
    if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete this lead and its full history?')) return;
    const res = await deleteLeadPermanently(leadId);
    if (res.success) {
      void fetchLeads();
    } else {
      alert(`Error deleting lead: ${res.error}`);
    }
  };

  // Bulk selectors
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const handleToggleSelectAll = () => {
    const pageIds = leads.map(l => l.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => copy.delete(id));
      } else {
        pageIds.forEach(id => copy.add(id));
      }
      return copy;
    });
  };

  // Double-click inline edits
  const handleStartInlineEdit = (leadId: number, field: 'priority' | 'contact_person' | 'work_hours', val: any) => {
    setEditingCell({ leadId, field });
    setInlineValue(String(val || ''));
  };

  const handleSaveInlineEdit = async (leadId: number, field: 'priority' | 'contact_person' | 'work_hours') => {
    if (!editingCell) return;
    
    const valueToSave = field === 'priority' ? Number(inlineValue) : inlineValue;
    
    // Update local state optimistically
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: valueToSave } : l));
    setEditingCell(null);

    const res = await updateLeadDetails(leadId, { [field]: valueToSave });
    if (!res.success) {
      alert(`Failed to save: ${res.error}`);
      void fetchLeads();
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
    if (!status) return <span className="text-[10px] text-slate-450">Not Called</span>;
    
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

  // Render compact social icons row for cell
  const renderSocialBadgesCell = (lead: any) => {
    const hasFb = !!lead.facebook;
    const hasIg = !!lead.instagram;
    const hasTt = !!lead.tiktok;
    const hasLi = !!lead.linkedin;

    if (!hasFb && !hasIg && !hasTt && !hasLi) {
      return <span className="text-slate-350 select-none">-</span>;
    }

    return (
      <div className="flex items-center gap-1.5 text-slate-400">
        {hasFb && <Facebook className="w-3.5 h-3.5 text-blue-500" />}
        {hasIg && <Instagram className="w-3.5 h-3.5 text-rose-500" />}
        {hasTt && <span className="text-[8px] font-extrabold bg-slate-900 text-white px-1 py-0.5 rounded tracking-tighter" title="TikTok">TT</span>}
        {hasLi && <Linkedin className="w-3.5 h-3.5 text-indigo-650" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full items-start w-full">
      {/* Grid List View */}
      <div className="flex-1 flex flex-col gap-6 w-full">
      {/* 7 Directories Tab Select Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('leads')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'leads' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Active Leads
        </button>
        <button
          onClick={() => setActiveSubTab('warm')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'warm' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Warm
        </button>
        <button
          onClick={() => setActiveSubTab('callbacks')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'callbacks' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Callbacks / Busy
        </button>
        <button
          onClick={() => setActiveSubTab('treated')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'treated' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Treated
        </button>
        <button
          onClick={() => setActiveSubTab('good_clients')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'good_clients' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Good Clients
        </button>
        <button
          onClick={() => setActiveSubTab('lost')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'lost' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Lost Leads
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeSubTab === 'database' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          All Database
        </button>
      </div>

      {/* Spreadsheet Controls Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agency, area, phone, website, socials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-bold">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Priority:</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-750 font-extrabold border-none"
          >
            <option value="">All</option>
            <option value="1">P1 (High Socials)</option>
            <option value="2">P2 (High Reviews)</option>
            <option value="3">P3 (Medium)</option>
            <option value="4">P4 (Low)</option>
            <option value="5">P5 (Lowest)</option>
          </select>
        </div>

        {/* Area Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-bold">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Area:</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-750 font-extrabold border-none"
          >
            <option value="">All Regions</option>
            {areasList.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Create Lead Button */}
        <Button
          onClick={handleOpenCreate}
          icon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 rounded-xl py-1.5"
        >
          Add Contact
        </Button>

        <div className="text-slate-400 text-[10px] uppercase font-black tracking-wider font-body ml-auto">
          Found: <span className="text-slate-800 font-extrabold font-display">{totalLeads}</span> leads
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
          <table className="w-full text-left border-collapse font-body text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/65 font-display text-[10px] text-slate-400 uppercase font-black tracking-wider select-none">
                <th className="px-4 py-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && leads.every(l => selectedIds.has(l.id))}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5">Agency / Company</th>
                <th className="px-5 py-3.5">Phone Details</th>
                <th className="px-5 py-3.5">Web Presence</th>
                <th className="px-5 py-3.5">Social Networks</th>
                <th className="px-5 py-3.5">Work Hours (Double Click)</th>
                <th className="px-5 py-3.5">Decision Maker (Double Click)</th>
                <th className="px-5 py-3.5 w-24">Priority (Double Click)</th>
                <th className="px-5 py-3.5">Call Status</th>
                <th className="px-5 py-3.5">Last Caller</th>
                <th className="px-5 py-3.5">Callback / Meeting Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
                      <span className="text-[10px] uppercase font-bold tracking-widest font-display">Synchronizing Spreadsheet...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <AlertCircle className="w-6 h-6 text-slate-350" />
                      <span className="text-xs font-semibold uppercase tracking-wider">No matching leads found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const isChecked = selectedIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleSelectProfileLead(lead)}
                      className={`border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium cursor-pointer ${
                        profileLead?.id === lead.id
                          ? 'bg-indigo-50/40 hover:bg-indigo-50/50 border-l-4 border-indigo-650'
                          : isChecked 
                          ? 'bg-indigo-50/30 hover:bg-indigo-50/40' 
                          : idx % 2 === 1 
                          ? 'bg-slate-50/15' 
                          : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(lead.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Agency details */}
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-display font-extrabold text-slate-800 uppercase tracking-wide">
                            {lead.agency_name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-350 shrink-0" />
                            {lead.area}
                          </span>
                        </div>
                      </td>

                      {/* Phone Numbers details */}
                      <td className="px-5 py-3 text-[10.5px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-350 shrink-0" />
                            <a href={`tel:${lead.phone}`} className="hover:text-indigo-650 hover:underline">{lead.phone}</a>
                          </div>
                          {lead.phone_2 && (
                            <div className="flex items-center gap-1.5 text-slate-400 font-normal text-[9.5px]">
                              <Phone className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                              <span className="truncate max-w-[140px]">{lead.phone_2}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Web Presence details */}
                      <td className="px-5 py-3 text-[10.5px]">
                        <div className="flex flex-col gap-0.5">
                          {lead.website && lead.website !== 'None' && lead.website !== 'Not found' ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-850 underline font-bold"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{lead.website}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Website</span>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1 text-slate-500 font-normal text-[9.5px]">
                              <Mail className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                              <span className="truncate max-w-[120px]">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Social media networks columns */}
                      <td className="px-5 py-3">
                        {renderSocialBadgesCell(lead)}
                      </td>

                      {/* Double click inline: Work hours */}
                      <td 
                        className="px-5 py-3 font-semibold cursor-text text-slate-650 hover:bg-slate-100/50"
                        onDoubleClick={() => handleStartInlineEdit(lead.id, 'work_hours', lead.work_hours)}
                      >
                        {editingCell?.leadId === lead.id && editingCell?.field === 'work_hours' ? (
                          <input
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(lead.id, 'work_hours')}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(lead.id, 'work_hours')}
                            className="px-2 py-0.5 border border-indigo-500 rounded bg-white text-xs outline-none w-28"
                            autoFocus
                          />
                        ) : (
                          lead.work_hours || <span className="text-slate-350 font-normal">-</span>
                        )}
                      </td>

                      {/* Double click inline: Contact person */}
                      <td 
                        className="px-5 py-3 font-semibold cursor-text text-slate-650 hover:bg-slate-100/50"
                        onDoubleClick={() => handleStartInlineEdit(lead.id, 'contact_person', lead.contact_person)}
                      >
                        {editingCell?.leadId === lead.id && editingCell?.field === 'contact_person' ? (
                          <input
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(lead.id, 'contact_person')}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(lead.id, 'contact_person')}
                            className="px-2 py-0.5 border border-indigo-500 rounded bg-white text-xs outline-none w-32"
                            autoFocus
                          />
                        ) : (
                          lead.contact_person || <span className="text-slate-350 font-normal">-</span>
                        )}
                      </td>

                      {/* Double click inline: Dialer priority */}
                      <td 
                        className="px-5 py-3 cursor-pointer hover:bg-slate-100/50"
                        onDoubleClick={() => handleStartInlineEdit(lead.id, 'priority', lead.priority)}
                      >
                        {editingCell?.leadId === lead.id && editingCell?.field === 'priority' ? (
                          <select
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(lead.id, 'priority')}
                            className="p-0.5 border border-indigo-500 rounded bg-white text-xs outline-none w-16"
                            autoFocus
                          >
                            <option value={1}>P1</option>
                            <option value={2}>P2</option>
                            <option value={3}>P3</option>
                            <option value={4}>P4</option>
                            <option value={5}>P5</option>
                          </select>
                        ) : (
                          getPriorityBadge(lead.priority)
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">{getStatusBadge(lead.call_status)}</td>

                      {/* Last caller */}
                      <td className="px-5 py-3 text-slate-650 font-bold uppercase tracking-wider text-[10px]">
                        {lead.caller_name || 'N/A'}
                      </td>

                      {/* Meeting/Callback date */}
                      <td className="px-5 py-3 text-slate-500 text-[10px] font-semibold">
                        {lead.meeting_date || 'None'}
                      </td>

                      {/* Action buttons row */}
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
                  );
                })
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

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-6 z-40 border border-slate-700 backdrop-blur-md animate-fade-in font-body text-xs">
          <div>
            <span className="font-extrabold font-display text-indigo-400">{selectedIds.size}</span> leads selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!confirm(`Are you sure you want to push ${selectedIds.size} selected leads back into active queue?`)) return;
                setLoading(true);
                const res = await bulkRestoreLeadsAction(Array.from(selectedIds));
                setLoading(false);
                if (res.success) {
                  setSelectedIds(new Set());
                  void fetchLeads();
                } else {
                  alert(res.error || 'Failed to restore leads.');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 font-bold uppercase cursor-pointer"
            >
              Recall Selected
            </button>
            {(callerRole === 'Admin' || callerRole === 'Supervisor') && (
              <button
                onClick={async () => {
                  if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${selectedIds.size} selected leads and their calling history?`)) return;
                  setLoading(true);
                  const res = await bulkDeleteLeadsAction(Array.from(selectedIds));
                  setLoading(false);
                  if (res.success) {
                    setSelectedIds(new Set());
                    void fetchLeads();
                  } else {
                    alert(res.error || 'Failed to delete leads.');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-750 font-bold uppercase cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold uppercase cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Unified Edit/Create Lead modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedLead(null); }}
        title={selectedLead ? 'Edit Lead Registry' : 'Create New Lead Registry'}
        subtitle={selectedLead ? `Registry ID: #${selectedLead.id} (${selectedLead.agency_name})` : 'Insert new agency registry details'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 font-body text-xs">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Primary Details Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-705 text-xs cursor-pointer"
                >
                  <option value={1}>P1: High Socials, No Web</option>
                  <option value={2}>P2: High Reviews, Low Web</option>
                  <option value={3}>P3: Standard</option>
                  <option value={4}>P4: Low Priority</option>
                  <option value={5}>P5: Lowest Priority</option>
                </select>
              </div>
            </div>

            {/* Contact Details Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] text-slate-455 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-705 text-xs cursor-pointer"
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

          {/* Social Networks edit block */}
          <div className="flex flex-col gap-3 mt-1">
            <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              Social Networks Links
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Facebook Link</label>
                <Input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="facebook username or url"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Instagram Link</label>
                <Input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="instagram username or url"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">TikTok Link</label>
                <Input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="tiktok username or url"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">LinkedIn Profile</label>
                <Input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin username or url"
                />
              </div>
              <div className="flex flex-col col-span-2 gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Other Social Link</label>
                <Input
                  type="text"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder="General social URL link"
                />
              </div>
            </div>
          </div>

          {/* Scraper / call notes */}
          <div className="flex flex-col gap-3 mt-1">
            <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-widest border-b border-slate-100 pb-1">
              Ledger Outlines & Notes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Scraping / Agency Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Latest Call Notes</label>
                <textarea
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal buttons */}
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

      {/* Simple Profile Side Card */}
      {profileLead && (
        <GlassCard className="w-full xl:w-96 shrink-0 border border-slate-200/80 shadow-md p-5 flex flex-col gap-4 max-h-[calc(100vh-160px)] overflow-y-auto font-body relative bg-white/75 backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Agency Profile</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: #{profileLead.id}</p>
            </div>
            <button
              onClick={() => setProfileLead(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer font-bold border-none bg-transparent"
              type="button"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 text-[11px]">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Agency Name *</label>
              <Input
                type="text"
                required
                value={profileFields.agency_name || ''}
                onChange={(e) => handleProfileFieldChange('agency_name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Area / City *</label>
                <Input
                  type="text"
                  required
                  value={profileFields.area || ''}
                  onChange={(e) => handleProfileFieldChange('area', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Priority</label>
                <select
                  value={profileFields.priority || 3}
                  onChange={(e) => handleProfileFieldChange('priority', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-850 text-xs cursor-pointer"
                >
                  <option value={1}>P1 (High Socials)</option>
                  <option value={2}>P2 (High Reviews)</option>
                  <option value={3}>P3 (Standard)</option>
                  <option value={4}>P4 (Low)</option>
                  <option value={5}>P5 (Minimal)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Physical Address</label>
              <Input
                type="text"
                value={profileFields.address || ''}
                onChange={(e) => handleProfileFieldChange('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Phone 1 *</label>
                <Input
                  type="text"
                  required
                  value={profileFields.phone || ''}
                  onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Phone 2</label>
                <Input
                  type="text"
                  value={profileFields.phone_2 || ''}
                  onChange={(e) => handleProfileFieldChange('phone_2', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Email 1</label>
                <Input
                  type="email"
                  value={profileFields.email || ''}
                  onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Email 2</label>
                <Input
                  type="email"
                  value={profileFields.email_2 || ''}
                  onChange={(e) => handleProfileFieldChange('email_2', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Website</label>
                <Input
                  type="text"
                  value={profileFields.website || ''}
                  onChange={(e) => handleProfileFieldChange('website', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Web Quality</label>
                <select
                  value={profileFields.website_quality || 'Medium'}
                  onChange={(e) => handleProfileFieldChange('website_quality', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-850 text-xs cursor-pointer"
                >
                  <option value="None">None</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Facebook Link</label>
              <Input
                type="text"
                value={profileFields.facebook || ''}
                onChange={(e) => handleProfileFieldChange('facebook', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Instagram Link</label>
              <Input
                type="text"
                value={profileFields.instagram || ''}
                onChange={(e) => handleProfileFieldChange('instagram', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">TikTok Link</label>
              <Input
                type="text"
                value={profileFields.tiktok || ''}
                onChange={(e) => handleProfileFieldChange('tiktok', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">LinkedIn Link</label>
              <Input
                type="text"
                value={profileFields.linkedin || ''}
                onChange={(e) => handleProfileFieldChange('linkedin', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Other Social Link</label>
              <Input
                type="text"
                value={profileFields.social_link || ''}
                onChange={(e) => handleProfileFieldChange('social_link', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Work Hours</label>
                <Input
                  type="text"
                  value={profileFields.work_hours || ''}
                  onChange={(e) => handleProfileFieldChange('work_hours', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Call Status</label>
                <select
                  value={profileFields.call_status || 'Not Called'}
                  onChange={(e) => handleProfileFieldChange('call_status', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-850 text-xs cursor-pointer"
                >
                  <option value="Not Called">Not Called</option>
                  <option value="Interested">Interested</option>
                  <option value="Callback">Callback</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Accepted">Accepted / Booked</option>
                  <option value="Client Configured">Client Configured</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Latest Call Notes</label>
              <textarea
                rows={2}
                value={profileFields.call_notes || ''}
                onChange={(e) => handleProfileFieldChange('call_notes', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-850 font-medium resize-none"
              />
            </div>

            <Button
              type="submit"
              loading={savingProfile}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] tracking-wider"
            >
              Save Profile Changes
            </Button>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
