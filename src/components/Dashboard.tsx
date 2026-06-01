'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Globe,
  MapPin,
  Star,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Copy,
  Check,
  Edit3,
  Loader2,
  ChevronDown,
  User,
  Users,
  LogOut,
  Clock,
  Briefcase,
  Smile,
  Frown,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getLeads,
  getDialerQueue,
  updateLeadDetails,
  getAnalytics,
  updateCallStatusWithAI,
  getTeamLeaderboard,
  getMeetingsList,
} from '@/app/actions';

// Custom SVG components for brand icons that are missing in newer lucide-react versions
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

// Custom TikTok SVG Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.19 1.11 1.25 2.67 2.05 4.31 2.3v3.7c-1.88-.06-3.71-.87-5.1-2.18-.08-.07-.15-.15-.24-.25v7.41c.01 4.54-3.23 8.65-7.73 9.32-4.96.86-9.76-2.58-10.22-7.55C-.53 14.15 2.5 9.07 7.57 8.52c1.08-.12 2.18-.01 3.23.27v3.7c-1.28-.43-2.69-.32-3.87.32-1.39.77-2.18 2.37-1.95 3.94.27 2.02 2.14 3.42 4.16 3.16 1.76-.23 3.08-1.74 3.08-3.52v-16.4Z" />
  </svg>
);

// Fallback Mock Data for UI when DB is NOT configured
const MOCK_LEADS = [
  {
    id: 1,
    agency_name: 'Algerian Sahara Adventures (Mock)',
    area: 'Algiers',
    maps_link: 'https://maps.google.com',
    address: '12 Rue Didouche Mourad, Alger',
    phone: '+213 21 00 00 00',
    email: 'contact@sahara-adventures.dz',
    website: 'sahara-adventures.dz',
    website_quality: 'Low',
    facebook: 'https://facebook.com/sahara.adv',
    instagram: 'https://instagram.com/sahara.adv',
    tiktok: 'Not found',
    linkedin: 'Not found',
    google_rating: 4.2,
    review_count: 148,
    followers_if_visible: '12K followers',
    facebook_followers: '12,450',
    instagram_followers: 'Not found',
    running_ads: 'No',
    services: 'Sahara Tours, Flight Tickets',
    notes: 'No website but high facebook followers. Needs dynamic booking engine.',
    priority: 1,
    call_status: 'Not Called',
    call_notes: '',
  },
  {
    id: 2,
    agency_name: 'Constantine Sky Travel (Mock)',
    area: 'Constantine',
    maps_link: 'https://maps.google.com',
    address: '45 Avenue Aouati Mustapha, Constantine',
    phone: '+213 31 11 22 33',
    email: 'info@skytravel.dz',
    website: 'Not found',
    website_quality: 'None',
    facebook: 'https://facebook.com/skytravelconstantine',
    instagram: 'https://instagram.com/skytravelconst',
    tiktok: 'https://tiktok.com/@skytravel',
    linkedin: 'Not found',
    google_rating: 3.9,
    review_count: 24,
    followers_if_visible: '24K followers',
    facebook_followers: '24,200',
    instagram_followers: '5,120',
    running_ads: 'Yes',
    services: 'Hajj & Umrah, International flights',
    notes: 'Highly active on Instagram/Facebook. No website!',
    priority: 1,
    call_status: 'Callback',
    call_notes: 'Spoke with secretary, manager is out until 2 PM. Call back then.',
  }
];

interface DashboardProps {
  callerName: string;
  onLogoutCaller: () => void;
}

export default function Dashboard({ callerName, onLogoutCaller }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dialer' | 'deadlines' | 'database' | 'lost'>('dialer');
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialer Session State
  const [dialerQueue, setDialerQueue] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  // Post-Call Notes Parser State
  const [rawNotesInput, setRawNotesInput] = useState<string>('');
  const [parsingAI, setParsingAI] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  
  // Deadlines & Meetings
  const [meetingsList, setMeetingsList] = useState<any[]>([]);

  // Team Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Database Tab State
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  // Edit details overlay drawer
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  // Copy Feedback
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  // Fetch Team Scores
  const fetchLeaderboardData = async () => {
    const res = await getTeamLeaderboard();
    if (res.success && res.leaderboard) {
      setLeaderboard(res.leaderboard);
    }
  };

  // Fetch Meetings checklist
  const fetchMeetingsData = async () => {
    setIsLoading(true);
    const res = await getMeetingsList();
    if (res.success && res.meetings) {
      setMeetingsList(res.meetings);
    }
    setIsLoading(false);
  };

  // Load active Dialer
  const loadDialer = useCallback(async () => {
    setIsLoading(true);
    const res = await getDialerQueue();
    if (!res.success) {
      if (res.error === 'DATABASE_URL_MISSING') {
        setDbConfigured(false);
        setDialerQueue(MOCK_LEADS);
      }
    } else {
      setDbConfigured(true);
      setDialerQueue(res.queue);
    }
    setCurrentQueueIndex(0);
    setIsLoading(false);
  }, []);

  // Fetch leads for directory
  const fetchDatabaseLeads = useCallback((excludeLost: boolean) => {
    startTransition(async () => {
      const res = await getLeads({
        search: searchQuery,
        status: filterStatus,
        priority: filterPriority,
        area: filterArea,
        page: currentPage,
        limit: 12,
        excludeLost,
      });

      if (res.success) {
        setLeadsList(res.leads);
        setTotalLeadsCount(res.total);
        setDbConfigured(true);
      } else {
        if (res.error === 'DATABASE_URL_MISSING') {
          setDbConfigured(false);
          setLeadsList(MOCK_LEADS);
          setTotalLeadsCount(MOCK_LEADS.length);
        }
      }
    });
  }, [searchQuery, filterStatus, filterPriority, filterArea, currentPage]);

  // Handle Tab Switch
  useEffect(() => {
    fetchLeaderboardData(); // Always refresh leaderboard on tab transitions to see Hamid/Oussama/Kamel updates!
    
    if (activeTab === 'dialer') {
      loadDialer();
    } else if (activeTab === 'deadlines') {
      fetchMeetingsData();
    } else if (activeTab === 'database') {
      fetchDatabaseLeads(true); // Exclude lost deals from general list
    } else if (activeTab === 'lost') {
      // Set filter status to show lost deals only
      setFilterStatus('Not Interested');
      fetchDatabaseLeads(false); // Do not exclude
    }
  }, [activeTab, loadDialer, fetchDatabaseLeads]);

  // Trigger directory search on params change
  useEffect(() => {
    if (activeTab === 'database') {
      fetchDatabaseLeads(true);
    } else if (activeTab === 'lost') {
      fetchDatabaseLeads(false);
    }
  }, [currentPage, searchQuery, filterPriority, filterArea, fetchDatabaseLeads, activeTab]);

  const currentLead = dialerQueue[currentQueueIndex];

  // Reset notes box when active target updates
  useEffect(() => {
    if (currentLead) {
      setRawNotesInput('');
      setExtractedData(null);
    }
  }, [currentLead]);

  // Handle running raw notes summary through Gemini
  const handleAIParse = async () => {
    if (!currentLead) return;
    if (!rawNotesInput.trim()) {
      alert('Please type or dictate call details in the note field first!');
      return;
    }

    setParsingAI(true);
    // Call server action to run Gemini note processing + save directly to Postgres
    const res = await updateCallStatusWithAI(currentLead.id, callerName, rawNotesInput);
    
    if (res.success || !dbConfigured) {
      const extracted = res.success ? res.extracted : {
        call_status: rawNotesInput.toLowerCase().includes('interested') ? 'Interested' : 'Callback',
        meeting_date: 'AI simulated date extraction',
        contact_person: 'Parsed Secretary',
        updated_email: 'extracted@email.com',
        summary: rawNotesInput
      };
      
      setExtractedData(extracted);
      fetchLeaderboardData();
    } else {
      alert('Error parsing summary notes: ' + res.error);
    }
    setParsingAI(false);
  };

  // Confirm and advance queue
  const handleConfirmAndNext = () => {
    // Save state changes locally
    const updatedQueue = [...dialerQueue];
    updatedQueue[currentQueueIndex] = {
      ...currentLead,
      call_status: extractedData.call_status,
      call_notes: extractedData.summary,
      caller_name: callerName,
      meeting_date: extractedData.meeting_date,
      contact_person: extractedData.contact_person,
    };
    setDialerQueue(updatedQueue);
    setExtractedData(null);
    setRawNotesInput('');

    // Advance to next uncalled lead
    if (currentQueueIndex < dialerQueue.length - 1) {
      setCurrentQueueIndex(currentQueueIndex + 1);
    } else {
      loadDialer();
    }
  };

  // Save changes inside lead editor drawer
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setIsSavingDetails(true);
    const res = await updateLeadDetails(editingLead.id, {
      agency_name: editingLead.agency_name,
      phone: editingLead.phone,
      email: editingLead.email,
      website: editingLead.website,
      facebook: editingLead.facebook,
      instagram: editingLead.instagram,
      tiktok: editingLead.tiktok,
      linkedin: editingLead.linkedin,
      priority: editingLead.priority,
      area: editingLead.area,
      notes: editingLead.notes,
      contact_person: editingLead.contact_person,
      meeting_date: editingLead.meeting_date,
    });

    if (res.success || !dbConfigured) {
      setEditingLead(null);
      if (activeTab === 'database') fetchDatabaseLeads(true);
      else if (activeTab === 'lost') fetchDatabaseLeads(false);
      else if (activeTab === 'deadlines') fetchMeetingsData();
    } else {
      alert('Failed to update details: ' + res.error);
    }
    setIsSavingDetails(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getWebQualityStyles = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'high':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'low':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-rose-50 text-rose-700 border border-rose-100';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Interested':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Callback':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'No Answer':
      case 'Busy':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Not Interested':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Wrong Number':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-50 text-slate-400 border border-slate-100';
    }
  };

  const fols = currentLead?.followers_if_visible || currentLead?.facebook_followers || currentLead?.instagram_followers || 'Not visible';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6 select-none text-slate-800 bg-slate-50">
      
      {/* DB Config Warning Alert */}
      {!dbConfigured && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-xs font-bold text-amber-800">PORTAL OFFLINE - RUNNING LOCAL SIMULATION</p>
              <p className="font-body text-[11px] text-amber-600">
                PostgreSQL database (`DATABASE_URL`) is not configured. Visualizing local simulated mock data for Hamid, Oussama, and Kamel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-black text-slate-900 tracking-wide uppercase">CALL-OS CRM</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-bold tracking-widest uppercase">ACTIVE</span>
            </div>
            <p className="font-body text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
              Campaign: Hamid • Oussama • Kamel
            </p>
          </div>
        </div>

        {/* Navigation Selector Tabs */}
        <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-2xl">
          {[
            { id: 'dialer', label: 'Call Queue' },
            { id: 'deadlines', label: 'Meetings & Deadlines' },
            { id: 'database', label: 'Leads Directory' },
            { id: 'lost', label: 'Lost Deals' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4.5 py-2.5 rounded-xl font-display text-[11px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Caller details */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Caller Logged In</span>
            <span className="block font-display text-sm font-black text-slate-800 uppercase tracking-wide">{callerName}</span>
          </div>
          <button
            onClick={onLogoutCaller}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Switch Caller Name"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Team score Leaderboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Hamid', 'Oussama', 'Kamel'].map((name) => {
          const stats = leaderboard.find(x => x.name === name) || { total_calls: 0, warm_deals: 0, lost_deals: 0, success_rate: 0.0 };
          const isActive = callerName === name;
          return (
            <div
              key={name}
              className={`bg-white border rounded-3xl p-5 shadow-sm flex items-center justify-between transition-all duration-300 relative overflow-hidden ${
                isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-xl">
                  Active
                </div>
              )}
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  name === 'Hamid' ? 'bg-blue-50 text-blue-600' : name === 'Oussama' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide">{name}</h3>
                  <div className="flex gap-2.5 font-body text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
                    <span>Calls: <strong className="text-slate-700">{stats.total_calls}</strong></span>
                    <span>Warm: <strong className="text-emerald-600">{stats.warm_deals}</strong></span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Success Rate</span>
                <span className="block font-display text-lg font-black text-slate-800">{stats.success_rate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Workspace Panels */}
      <div className="w-full min-h-[500px]">
        {isLoading && activeTab === 'dialer' ? (
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/80 rounded-3xl p-10">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="font-body text-[11px] text-slate-400 tracking-wider uppercase font-semibold">Loading campaign leads...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* TAB 1: CALL QUEUE */}
            {activeTab === 'dialer' && (
              <motion.div
                key="dialer-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {dialerQueue.length === 0 ? (
                  <div className="col-span-12 w-full bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6">
                    <Database className="w-16 h-16 text-slate-200" />
                    <div>
                      <h3 className="font-display text-base tracking-widest text-slate-800 uppercase font-black mb-1">Queue Completed</h3>
                      <p className="font-body text-xs text-slate-400 max-w-sm mx-auto">
                        Amazing job Hamid, Oussama, and Kamel! There are no remaining uncalled targets matching active priorities.
                      </p>
                    </div>
                    <button
                      onClick={loadDialer}
                      className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-display text-xs font-bold tracking-widest uppercase hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      Refresh Queue
                    </button>
                  </div>
                ) : (
                  <>
                    {/* LEFT COLUMN: Agency profile detail cards */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                        
                        {/* Queue Indicator row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <span className="font-body text-[10px] text-slate-400 tracking-widest uppercase font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            Target {currentQueueIndex + 1} of {dialerQueue.length} in dialer session
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              disabled={currentQueueIndex === 0}
                              onClick={() => setCurrentQueueIndex(currentQueueIndex - 1)}
                              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              disabled={currentQueueIndex === dialerQueue.length - 1}
                              onClick={() => setCurrentQueueIndex(currentQueueIndex + 1)}
                              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Agency main Header */}
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-display text-xl md:text-2xl font-black text-slate-900 tracking-wide uppercase">
                              {currentLead?.agency_name}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-100`}>
                              P{currentLead?.priority} Priority
                            </span>
                            {currentLead?.call_status !== 'Not Called' && (
                              <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${getStatusStyle(currentLead?.call_status)}`}>
                                {currentLead?.call_status}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-y-2 gap-x-4 font-body text-xs text-slate-500 mt-2 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {currentLead?.area}, Algeria
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {currentLead?.google_rating || '0.0'} ({currentLead?.review_count || 0} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Calling dialer card */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                            <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Phone</span>
                            <span className="font-display text-xl font-bold text-slate-800 tracking-wide">
                              {currentLead?.phone || 'No phone number'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                              disabled={!currentLead?.phone || currentLead?.phone === 'Not found'}
                              onClick={() => copyToClipboard(currentLead?.phone)}
                              className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-body text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {copiedPhone ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </>
                              )}
                            </button>

                            <button
                              disabled={!currentLead?.phone || currentLead?.phone === 'Not found'}
                              onClick={() => window.open(`tel:${currentLead?.phone}`, '_self')}
                              className="flex-1 md:flex-initial px-6 py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                            >
                              <Phone className="w-4 h-4 fill-white" />
                              DIAL PHONE
                            </button>
                          </div>
                        </div>

                        {/* Details grid list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                          
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Address</span>
                              <span className="font-body text-xs text-slate-700 font-semibold">{currentLead?.address || 'Not specified'}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Google Maps</span>
                              <a
                                href={currentLead?.maps_link}
                                target="_blank"
                                rel="noreferrer"
                                className="font-body text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                Open in Google Maps
                                <MapPin className="w-3 h-3" />
                              </a>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Email Address</span>
                              <span className="font-body text-xs text-slate-700 font-semibold">{currentLead?.email || 'Not enriched'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Website Quality</span>
                              {currentLead?.website && currentLead?.website !== 'Not found' ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={currentLead.website.startsWith('http') ? currentLead.website : `https://${currentLead.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-body text-xs text-blue-600 hover:underline flex items-center gap-1.5 font-bold"
                                  >
                                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                                    {currentLead.website}
                                  </a>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${getWebQualityStyles(currentLead.website_quality)}`}>
                                    {currentLead.website_quality}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-body text-xs text-slate-400">No website presence</span>
                                  <span className="px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase bg-rose-50 text-rose-700 border border-rose-100">
                                    NONE
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Social Media Profiles</span>
                              <div className="flex flex-wrap gap-2.5">
                                {/* Facebook */}
                                {currentLead?.facebook && currentLead.facebook !== 'Not found' ? (
                                  <a
                                    href={currentLead.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200"
                                    title={`FB: ${currentLead.facebook_followers}`}
                                  >
                                    <FacebookIcon className="w-4 h-4 fill-current" />
                                  </a>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center">
                                    <FacebookIcon className="w-4 h-4 fill-current" />
                                  </div>
                                )}

                                {/* Instagram */}
                                {currentLead?.instagram && currentLead.instagram !== 'Not found' ? (
                                  <a
                                    href={currentLead.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 text-pink-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all duration-200"
                                    title={`IG: ${currentLead.instagram_followers}`}
                                  >
                                    <InstagramIcon className="w-4 h-4 text-slate-500" />
                                  </a>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center">
                                    <InstagramIcon className="w-4 h-4 text-slate-300" />
                                  </div>
                                )}

                                {/* TikTok */}
                                {currentLead?.tiktok && currentLead.tiktok !== 'Not found' ? (
                                  <a
                                    href={currentLead.tiktok}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all duration-200"
                                  >
                                    <TikTokIcon className="w-3.5 h-3.5 fill-current" />
                                  </a>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center">
                                    <TikTokIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                {/* LinkedIn */}
                                {currentLead?.linkedin && currentLead.linkedin !== 'Not found' ? (
                                  <a
                                    href={currentLead.linkedin}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all duration-200"
                                  >
                                    <LinkedinIcon className="w-4 h-4 fill-current" />
                                  </a>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center">
                                    <LinkedinIcon className="w-4 h-4 fill-current" />
                                  </div>
                                )}
                              </div>
                              <span className="font-body text-[10px] text-slate-400 font-semibold mt-1">
                                Followers details: <strong className="text-slate-600">{fols}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* RIGHT COLUMN: Post-Call Gemini note logger */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h3 className="font-display text-xs tracking-widest text-slate-800 uppercase font-black">
                            Post-Call AI Summary Parser
                          </h3>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">
                            Type call results (AI will extract outcomes & deadlines)
                          </span>
                          <textarea
                            value={rawNotesInput}
                            onChange={(e) => setRawNotesInput(e.target.value)}
                            placeholder="Example: Spoke with manager Kamel, he was very interested in building a website and scheduled a demo Zoom meeting for next Friday at 10:00 AM. Email is kamel@agency.dz"
                            className="w-full min-h-[140px] bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-2xl p-4 font-body text-xs text-slate-800 placeholder-slate-300 focus:outline-none transition-colors leading-relaxed"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (currentQueueIndex < dialerQueue.length - 1) {
                                setCurrentQueueIndex(currentQueueIndex + 1);
                              } else {
                                loadDialer();
                              }
                            }}
                            className="flex-1 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-body text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center"
                          >
                            Skip Lead
                          </button>
                          
                          <button
                            disabled={parsingAI || !rawNotesInput.trim()}
                            onClick={handleAIParse}
                            className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/10"
                          >
                            {parsingAI ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing Notes...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                PARSE WITH AI
                              </>
                            )}
                          </button>
                        </div>

                        {/* Render Extracted AI details */}
                        <AnimatePresence>
                          {extractedData && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4.5 flex flex-col gap-3"
                            >
                              <div className="flex items-center gap-2 font-display text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                AI EXTRACTED UPDATES
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                                <div>
                                  <span className="block text-[8px] text-slate-400 uppercase font-bold">Call Status</span>
                                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase mt-1 ${getStatusStyle(extractedData.call_status)}`}>
                                    {extractedData.call_status}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-400 uppercase font-bold">Meeting Date</span>
                                  <span className="font-semibold text-slate-800 mt-1 block">
                                    {extractedData.meeting_date || 'No meeting scheduled'}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-400 uppercase font-bold">Contact Name</span>
                                  <span className="font-semibold text-slate-800 mt-1 block">
                                    {extractedData.contact_person || 'Not found'}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-400 uppercase font-bold">New Email</span>
                                  <span className="font-semibold text-slate-800 mt-1 block truncate">
                                    {extractedData.updated_email || 'No email mentioned'}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-blue-100/50 pt-2 flex flex-col gap-1">
                                <span className="block text-[8px] text-slate-400 uppercase font-bold">Summary</span>
                                <p className="font-body text-xs text-slate-600 leading-relaxed italic">
                                  "{extractedData.summary}"
                                </p>
                              </div>

                              <button
                                onClick={handleConfirmAndNext}
                                className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/10 text-center"
                              >
                                CONFIRM & SAVE
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* TAB 2: MEETINGS & DEADLINES CHECKLIST */}
            {activeTab === 'deadlines' && (
              <motion.div
                key="deadlines-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Upcoming Meetings & Callbacks
                    </h3>
                  </div>
                  <span className="font-body text-xs text-slate-400 font-semibold bg-slate-50 border px-3 py-1 rounded-full">
                    {meetingsList.length} Active Deadlines
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-body">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Target Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Phone</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Contact Person</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Meeting Date/Time</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Scheduled By</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Call Status</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {meetingsList.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{m.agency_name}</span>
                          </td>
                          <td className="p-4 text-slate-600 font-mono font-semibold">{m.phone}</td>
                          <td className="p-4 text-slate-700 font-semibold">{m.contact_person || 'Secretary'}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              {m.meeting_date}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border">
                              {m.caller_name || 'System'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${getStatusStyle(m.call_status)}`}>
                              {m.call_status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`tel:${m.phone}`, '_self')}
                                className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all cursor-pointer"
                                title="Call Now"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingLead({ ...m })}
                                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
                                title="Edit Date/Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {meetingsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            No upcoming meetings or callbacks scheduled.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB 3: LEADS DIRECTORY */}
            {activeTab === 'database' && (
              <motion.div
                key="database-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col gap-6"
              >
                {/* Directory controls */}
                <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="w-full md:w-1/3 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search travel agencies by name, phone or contact..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl py-3 pl-10 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
                    
                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="appearance-none bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl px-4 py-3 pr-10 font-body text-xs text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="">Active Call Statuses</option>
                        <option value="Not Called">Not Called</option>
                        <option value="Interested">Interested / Won</option>
                        <option value="Callback">Callbacks Only</option>
                        <option value="No Answer">No Answer / Busy</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Priority Filter */}
                    <div className="relative">
                      <select
                        value={filterPriority}
                        onChange={(e) => {
                          setFilterPriority(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="appearance-none bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl px-4 py-3 pr-10 font-body text-xs text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="">All Priorities</option>
                        <option value="1">Priority 1 (High Socials, No Web)</option>
                        <option value="2">Priority 2 (High Reviews, Low Web)</option>
                        <option value="3">Priority 3 (Default standard)</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Area Filter */}
                    <div className="relative">
                      <select
                        value={filterArea}
                        onChange={(e) => {
                          setFilterArea(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="appearance-none bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl px-4 py-3 pr-10 font-body text-xs text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="">All Regions</option>
                        <option value="Algiers">Algiers</option>
                        <option value="Oran">Oran</option>
                        <option value="Constantine">Constantine</option>
                        <option value="Sétif">Sétif</option>
                        <option value="Tlemcen">Tlemcen</option>
                        <option value="Blida">Blida</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('');
                        setFilterPriority('');
                        setFilterArea('');
                        setCurrentPage(1);
                      }}
                      className="px-4.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-body text-xs font-bold tracking-wide transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Lead Directory Directory Card */}
                  <div className={`w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm ${
                    editingLead ? 'xl:col-span-8' : 'xl:col-span-12'
                  } transition-all duration-300`}>
                    
                    {isPending ? (
                      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3 bg-white p-10">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="font-body text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Searching campaign table...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-full overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs font-body">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Agency Name</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Area</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Phone</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Website</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Priority</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Call Status</th>
                                <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {leadsList.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50/30 transition-colors group">
                                  <td className="p-4">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-900">{lead.agency_name}</span>
                                      <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{lead.address}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-semibold text-slate-600">{lead.area}</td>
                                  <td className="p-4 font-semibold text-slate-700 font-mono">{lead.phone}</td>
                                  <td className="p-4">
                                    {lead.website && lead.website !== 'Not found' ? (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase inline-block ${getWebQualityStyles(lead.website_quality)}`}>
                                        {lead.website_quality}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-300">No Website</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                                      lead.priority === 1
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : lead.priority === 2
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-slate-100 text-slate-600 border'
                                    }`}>
                                      P{lead.priority}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${getStatusStyle(lead.call_status)}`}>
                                      {lead.call_status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setEditingLead({ ...lead })}
                                        className="p-2 bg-slate-50 hover:bg-slate-100 border rounded-lg text-slate-600 cursor-pointer"
                                        title="Edit Details"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const foundIndex = dialerQueue.findIndex(q => q.id === lead.id);
                                          if (foundIndex !== -1) {
                                            setCurrentQueueIndex(foundIndex);
                                          } else {
                                            setDialerQueue([lead, ...dialerQueue]);
                                            setCurrentQueueIndex(0);
                                          }
                                          setActiveTab('dialer');
                                        }}
                                        className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100 rounded-lg text-blue-600 cursor-pointer"
                                        title="Send to Dialer"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {leadsList.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-400 font-body text-xs">
                                    No records found matching filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <span className="font-body text-[10px] text-slate-400 tracking-wider">
                            Showing {leadsList.length} of {totalLeadsCount} total leads
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-body text-xs font-semibold"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              Prev
                            </button>
                            <span className="font-body text-xs text-slate-500 font-mono">
                              Page {currentPage} of {Math.ceil(totalLeadsCount / 12) || 1}
                            </span>
                            <button
                              disabled={currentPage >= Math.ceil(totalLeadsCount / 12)}
                              onClick={() => setCurrentPage(currentPage + 1)}
                              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-body text-xs font-semibold"
                            >
                              Next
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* EDIT SIDE DRAWER */}
                  {editingLead && (
                    <div className="xl:col-span-4 w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-slate-800" />
                          <h3 className="font-display text-xs tracking-widest text-slate-800 uppercase font-black">
                            Edit details
                          </h3>
                        </div>
                        <button
                          onClick={() => setEditingLead(null)}
                          className="text-slate-400 hover:text-slate-700 font-body text-xs cursor-pointer font-bold"
                        >
                          Close
                        </button>
                      </div>

                      <form onSubmit={handleSaveDetails} className="flex flex-col gap-4 font-body text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Agency Name</label>
                          <input
                            type="text"
                            value={editingLead.agency_name}
                            onChange={(e) => setEditingLead({ ...editingLead, agency_name: e.target.value })}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Phone Number</label>
                            <input
                              type="text"
                              value={editingLead.phone}
                              onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Region (Area)</label>
                            <input
                              type="text"
                              value={editingLead.area}
                              onChange={(e) => setEditingLead({ ...editingLead, area: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Contact Person</label>
                            <input
                              type="text"
                              value={editingLead.contact_person || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, contact_person: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Meeting Date / Time</label>
                            <input
                              type="text"
                              value={editingLead.meeting_date || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, meeting_date: e.target.value })}
                              placeholder="e.g. Next Tuesday at 10 AM"
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Email Address</label>
                          <input
                            type="email"
                            value={editingLead.email || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Website</label>
                          <input
                            type="text"
                            value={editingLead.website || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, website: e.target.value })}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-semibold text-blue-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Facebook</label>
                            <input
                              type="text"
                              value={editingLead.facebook || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, facebook: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Instagram</label>
                            <input
                              type="text"
                              value={editingLead.instagram || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, instagram: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Campaign Priority</label>
                            <select
                              value={editingLead.priority}
                              onChange={(e) => setEditingLead({ ...editingLead, priority: parseInt(e.target.value, 10) })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            >
                              <option value={1}>Priority 1 (High Socials, No Web)</option>
                              <option value={2}>Priority 2 (High Reviews, Low Web)</option>
                              <option value={3}>Priority 3 (Default standard)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Internal Lead Notes</label>
                          <textarea
                            value={editingLead.notes || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 min-h-[50px] focus:outline-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingDetails}
                          className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          {isSavingDetails ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'SAVE CHANGES'
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                </div>

              </motion.div>
            )}

            {/* TAB 4: LOST DEALS */}
            {activeTab === 'lost' && (
              <motion.div
                key="lost-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Frown className="w-4.5 h-4.5 text-rose-500" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Lost Deals Directory (Not Interested / Wrong Number)
                    </h3>
                  </div>
                  <span className="font-body text-xs text-rose-700 font-bold bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                    {totalLeadsCount} Refused / Disconnected Leads
                  </span>
                </div>

                <div className="w-full overflow-x-auto text-xs font-body">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Target Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Area</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Phone</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Call notes</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Caller Name</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Status</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{lead.agency_name}</span>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{lead.area}</td>
                          <td className="p-4 text-slate-500 font-mono font-semibold">{lead.phone}</td>
                          <td className="p-4 text-slate-500 italic max-w-xs truncate" title={lead.call_notes}>
                            "{lead.call_notes || 'No call summary logged.'}"
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border text-[10px]">
                              {lead.caller_name || 'System'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${getStatusStyle(lead.call_status)}`}>
                              {lead.call_status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingLead({ ...lead })}
                                className="p-2 bg-slate-50 hover:bg-slate-100 border rounded-lg text-slate-600 cursor-pointer"
                                title="Re-inspect / Edit Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  // Restore call status to uncalled
                                  await updateLeadDetails(lead.id, { notes: 'Restored from lost list.', contact_person: '' });
                                  await updateCallStatusWithAI(lead.id, callerName, 'Restored to queue.');
                                  fetchDatabaseLeads(false);
                                }}
                                className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 cursor-pointer"
                                title="Restore to calling queue"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leadsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            No lost deals found. Keep calling!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-body text-[10px] text-slate-400 tracking-wider">
                    Showing {leadsList.length} of {totalLeadsCount} total records
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-body text-xs font-semibold"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="font-body text-xs text-slate-500 font-mono">
                      Page {currentPage} of {Math.ceil(totalLeadsCount / 12) || 1}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalLeadsCount / 12)}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 font-body text-xs font-semibold"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
