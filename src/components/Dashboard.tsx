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
  updateCallStatus,
  assignLeadsByRegion,
  assignLeadsByPriority,
  clearAssignments,
  splitLeadsEqually,
  getCallHistory,
  getAssignmentStats,
  assignLeadsByRange,
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
  const [activeTab, setActiveTab] = useState<'dialer' | 'deadlines' | 'database' | 'lost' | 'admin' | 'followups' | 'warm_leads' | 'good_clients'>('dialer');
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assignmentStats, setAssignmentStats] = useState<{ stats: any[]; unassigned: number }>({ stats: [], unassigned: 0 });
  const [isAdminActionPending, setIsAdminActionPending] = useState<boolean>(false);

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
  const [totalLostCount, setTotalLostCount] = useState<number>(0);
  const [totalFollowupsCount, setTotalFollowupsCount] = useState<number>(0);
  const [totalWarmCount, setTotalWarmCount] = useState<number>(0);
  const [totalGoodClientsCount, setTotalGoodClientsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

  // Edit details overlay drawer
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  // Copy Feedback
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  // New States for Dialed Number Tracking & Admin Analytics
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);

  // Sync dialedNumber with active lead
  useEffect(() => {
    const activeLead = dialerQueue[currentQueueIndex];
    if (activeLead) {
      setDialedNumber(activeLead.phone || '');
    } else {
      setDialedNumber('');
    }
  }, [dialerQueue, currentQueueIndex]);

  // Fetch Team Scores
  const fetchLeaderboardData = async () => {
    const res = await getTeamLeaderboard();
    if (res.success && res.leaderboard) {
      setLeaderboard(res.leaderboard);
    }
  };

  // Fetch Meetings checklist
  const fetchMeetingsData = async () => {
    const res = await getMeetingsList();
    if (res.success && res.meetings) {
      setMeetingsList(res.meetings);
    }
  };

  // Fetch Assignment stats for Hamid
  const fetchAssignmentStats = useCallback(async () => {
    if (callerName !== 'Hamid') return;
    const [assignRes, analyticsRes] = await Promise.all([
      getAssignmentStats(),
      getAnalytics()
    ]);
    if (assignRes.success) {
      setAssignmentStats({ stats: assignRes.stats || [], unassigned: assignRes.unassigned || 0 });
    }
    if (analyticsRes.success) {
      setAnalyticsData(analyticsRes.stats);
    }
  }, [callerName]);

  // Load active Dialer
  const loadDialer = useCallback(async () => {
    const res = await getDialerQueue(callerName);
    if (!res.success) {
      setDbConfigured(false);
      setDialerQueue(MOCK_LEADS);
    } else {
      setDbConfigured(true);
      setDialerQueue(res.queue);
    }
    setCurrentQueueIndex(0);
  }, [callerName]);

  // Fetch leads for directory
  const fetchDatabaseLeads = useCallback((excludeLost: boolean) => {
    startTransition(async () => {
      const res = await getLeads({
        search: debouncedSearchQuery,
        status: filterStatus,
        priority: filterPriority,
        area: filterArea,
        page: currentPage,
        limit: 12,
        excludeLost,
      });

      if (res.success) {
        setLeadsList(res.leads);
        if (activeTab === 'database') {
          setTotalLeadsCount(res.total);
        } else if (activeTab === 'lost') {
          setTotalLostCount(res.total);
        } else if (activeTab === 'followups') {
          setTotalFollowupsCount(res.total);
        } else if (activeTab === 'warm_leads') {
          setTotalWarmCount(res.total);
        } else if (activeTab === 'good_clients') {
          setTotalGoodClientsCount(res.total);
        }
        setDbConfigured(true);
      } else {
        setLeadsList(MOCK_LEADS);
        if (activeTab === 'database') {
          setTotalLeadsCount(MOCK_LEADS.length);
        } else if (activeTab === 'lost') {
          setTotalLostCount(0);
        } else if (activeTab === 'followups') {
          setTotalFollowupsCount(0);
        } else if (activeTab === 'warm_leads') {
          setTotalWarmCount(0);
        } else if (activeTab === 'good_clients') {
          setTotalGoodClientsCount(0);
        }
        setDbConfigured(false);
      }
    });
  }, [debouncedSearchQuery, filterStatus, filterPriority, filterArea, currentPage, activeTab]);

  // Initial load all data in parallel on mount
  const fetchAllData = useCallback(async (showBlockingLoader = true) => {
    if (showBlockingLoader) setIsLoading(true);
    try {
      const promises = [
        getDialerQueue(callerName),
        getTeamLeaderboard(),
        getMeetingsList(),
        getLeads({
          search: '',
          status: '',
          priority: '',
          area: '',
          page: 1,
          limit: 12,
          excludeLost: true,
        }),
      ] as any[];

      if (callerName === 'Hamid') {
        promises.push(getAssignmentStats());
        promises.push(getAnalytics());
      }

      const results = await Promise.all(promises);
      const queueRes = results[0];
      const leaderboardRes = results[1];
      const meetingsRes = results[2];
      const leadsRes = results[3];

      if (queueRes.success) {
        setDbConfigured(true);
        setDialerQueue(queueRes.queue);
      } else {
        setDbConfigured(false);
        setDialerQueue(MOCK_LEADS);
      }
      setCurrentQueueIndex(0);

      if (leaderboardRes.success && leaderboardRes.leaderboard) {
        setLeaderboard(leaderboardRes.leaderboard);
      }

      if (meetingsRes.success && meetingsRes.meetings) {
        setMeetingsList(meetingsRes.meetings);
      }

      if (leadsRes.success) {
        setLeadsList(leadsRes.leads);
        setTotalLeadsCount(leadsRes.total);
      } else {
        setLeadsList(MOCK_LEADS);
        setTotalLeadsCount(MOCK_LEADS.length);
      }

      if (callerName === 'Hamid') {
        const assignmentRes = results[4];
        const analyticsRes = results[5];
        if (assignmentRes && assignmentRes.success) {
          setAssignmentStats({ stats: assignmentRes.stats || [], unassigned: assignmentRes.unassigned || 0 });
        }
        if (analyticsRes && analyticsRes.success) {
          setAnalyticsData(analyticsRes.stats);
        }
      }
    } catch (err) {
      console.error('[fetchAllData] Error:', err);
    } finally {
      setIsLoading(false);
      setInitialLoadDone(true);
    }
  }, [callerName]);

  // Run initial fetch
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Trigger directory search on params change (background transition)
  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'database') {
      fetchDatabaseLeads(true);
    } else if (activeTab === 'lost') {
      fetchDatabaseLeads(false);
    } else if (activeTab === 'followups') {
      fetchDatabaseLeads(false);
    } else if (activeTab === 'warm_leads') {
      fetchDatabaseLeads(false);
    } else if (activeTab === 'good_clients') {
      fetchDatabaseLeads(false);
    }
  }, [currentPage, debouncedSearchQuery, filterPriority, filterArea, filterStatus, fetchDatabaseLeads, activeTab, initialLoadDone]);

  // Handle Tab Switch (silent refreshes, instant transitions)
  useEffect(() => {
    if (!initialLoadDone) return;

    fetchLeaderboardData();

    if (activeTab === 'dialer') {
      loadDialer();
    } else if (activeTab === 'deadlines') {
      fetchMeetingsData();
    } else if (activeTab === 'admin') {
      fetchAssignmentStats();
    } else if (activeTab === 'database') {
      if (['Not Interested', 'Followups', 'WarmLeads', 'GoodClients'].includes(filterStatus)) {
        setFilterStatus('');
      } else {
        fetchDatabaseLeads(true);
      }
    } else if (activeTab === 'lost') {
      setFilterStatus('Not Interested');
    } else if (activeTab === 'followups') {
      setFilterStatus('Followups');
    } else if (activeTab === 'warm_leads') {
      setFilterStatus('WarmLeads');
    } else if (activeTab === 'good_clients') {
      setFilterStatus('GoodClients');
    }
  }, [activeTab, initialLoadDone, fetchAssignmentStats, loadDialer, fetchDatabaseLeads, fetchMeetingsData, filterStatus]);

  const currentLead = dialerQueue[currentQueueIndex];

  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Reset notes box when active target updates
  useEffect(() => {
    if (currentLead) {
      setRawNotesInput('');
      setExtractedData(null);
    }
  }, [currentLead]);

  // Direct Inline Dialer editing handlers
  const updateLeadFieldInQueue = (leadId: number, field: string, value: any) => {
    setDialerQueue(prev =>
      prev.map(item => (item.id === leadId ? { ...item, [field]: value } : item))
    );
  };

  const saveLeadFieldToServer = async (leadId: number, field: string, value: any) => {
    const res = await updateLeadDetails(leadId, { [field]: value });
    if (!res.success && dbConfigured) {
      console.error('Failed to auto-save field:', field, res.error);
    }
  };

  // Quick Outcome status button handler
  const handleQuickOutcome = async (status: string) => {
    if (!currentLead) return;

    if (['Interested', 'Accepted', 'Client Configured'].includes(status)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    const prevQueue = [...dialerQueue];
    const prevQueueIndex = currentQueueIndex;

    // Optimistic Leaderboard update
    setLeaderboard(prev => {
      return prev.map(item => {
        if (item.name === callerName) {
          const isWarm = ['Interested', 'Accepted', 'Client Configured', 'Callback'].includes(status);
          const isLost = ['Not Interested', 'Wrong Number'].includes(status);
          const newTotal = item.total_calls + 1;
          const newWarm = item.warm_deals + (isWarm ? 1 : 0);
          const newLost = item.lost_deals + (isLost ? 1 : 0);
          return {
            ...item,
            total_calls: newTotal,
            warm_deals: newWarm,
            lost_deals: newLost,
            success_rate: newTotal > 0 ? parseFloat(((newWarm / newTotal) * 100).toFixed(1)) : 0.0,
          };
        }
        return item;
      });
    });

    // Advance queue instantly
    if (currentQueueIndex < dialerQueue.length - 1) {
      setCurrentQueueIndex(currentQueueIndex + 1);
    } else {
      loadDialer();
    }

    // Call server action to update status directly (saving AI API cost)
    const res = await updateCallStatus(
      currentLead.id,
      status,
      `Outcome logged via quick buttons. Dialed: ${dialedNumber || currentLead.phone}`,
      `Outcome logged via quick buttons. Status is ${status}. Dialed: ${dialedNumber || currentLead.phone}`,
      callerName
    );

    if (!res.success && dbConfigured) {
      // Rollback on failure
      setDialerQueue(prevQueue);
      setCurrentQueueIndex(prevQueueIndex);
      alert('Failed to log outcome: ' + res.error);
    }
  };

  // Handle running raw notes summary through Gemini
  const handleAIParse = async () => {
    if (!currentLead) return;
    if (!rawNotesInput.trim()) {
      alert('Please type or dictate call details in the note field first!');
      return;
    }

    setParsingAI(true);
    // Call server action to run Gemini note processing + save directly to Postgres
    const res = await updateCallStatusWithAI(currentLead.id, callerName, `${rawNotesInput} (Dialed: ${dialedNumber || currentLead.phone})`);
    
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
    if (!currentLead || !extractedData) return;

    if (['Interested', 'Accepted', 'Client Configured'].includes(extractedData.call_status)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // 1. Optimistic Leaderboard update
    setLeaderboard(prev => {
      return prev.map(item => {
        if (item.name === callerName) {
          const isWarm = ['Interested', 'Accepted', 'Client Configured', 'Callback'].includes(extractedData.call_status);
          const isLost = ['Not Interested', 'Wrong Number'].includes(extractedData.call_status);
          const newTotal = item.total_calls + 1;
          const newWarm = item.warm_deals + (isWarm ? 1 : 0);
          const newLost = item.lost_deals + (isLost ? 1 : 0);
          return {
            ...item,
            total_calls: newTotal,
            warm_deals: newWarm,
            lost_deals: newLost,
            success_rate: newTotal > 0 ? parseFloat(((newWarm / newTotal) * 100).toFixed(1)) : 0.0,
          };
        }
        return item;
      });
    });

    // 2. Save state changes locally
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

  // Save changes inside lead editor drawer (Optimistic UI)
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    // Capture old states for rollbacks
    const prevLeadsList = [...leadsList];
    const prevMeetingsList = [...meetingsList];
    const prevDialerQueue = [...dialerQueue];

    // Optimistic UI updates
    const updateInArray = (arr: any[]) =>
      arr.map(item => (item.id === editingLead.id ? { ...item, ...editingLead } : item));

    setLeadsList(updateInArray(leadsList));
    setMeetingsList(updateInArray(meetingsList));
    setDialerQueue(updateInArray(dialerQueue));

    // Close the drawer immediately
    setEditingLead(null);

    // Save in the background
    updateLeadDetails(editingLead.id, {
      agency_name: editingLead.agency_name,
      phone: editingLead.phone,
      phone_2: editingLead.phone_2,
      email: editingLead.email,
      email_2: editingLead.email_2,
      website: editingLead.website,
      facebook: editingLead.facebook,
      instagram: editingLead.instagram,
      tiktok: editingLead.tiktok,
      linkedin: editingLead.linkedin,
      social_link: editingLead.social_link,
      priority: editingLead.priority,
      area: editingLead.area,
      notes: editingLead.notes,
      contact_person: editingLead.contact_person,
      meeting_date: editingLead.meeting_date,
    }).then(res => {
      if (!res.success && dbConfigured) {
        // Rollback on failure
        setLeadsList(prevLeadsList);
        setMeetingsList(prevMeetingsList);
        setDialerQueue(prevDialerQueue);
        alert('Failed to save changes to the database: ' + res.error);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const normalizeExternalUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    return `https://${raw}`;
  };

  const normalizeInstagramUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) {
      return 'https://instagram.com/direct/inbox/';
    }
    if (/^https?:\/\//i.test(raw)) return raw;
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://instagram.com/${handle}`;
    return normalizeExternalUrl(handle);
  };

  const normalizeMessengerUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return 'https://m.me/';
    if (/facebook\.com\//i.test(raw)) {
      return normalizeExternalUrl(raw).replace(/https?:\/\/(?:www\.)?facebook\.com/i, 'https://m.me');
    }
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://m.me/${handle}`;
    return normalizeExternalUrl(handle);
  };

  const formatWhatsappPhone = (value?: string | null) => {
    const digits = value?.replace(/[^0-9]/g, '') || '';
    if (!digits) return '';
    if (digits.startsWith('0')) return `213${digits.substring(1)}`;
    if (!digits.startsWith('213')) return `213${digits}`;
    return digits;
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
      case 'Accepted':
      case 'Client Configured':
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
      case 'Dormant':
        return 'bg-zinc-100 text-zinc-500 border border-zinc-200';
      default:
        return 'bg-slate-50 text-slate-400 border border-slate-100';
    }
  };

  const fols = currentLead?.followers_if_visible || currentLead?.facebook_followers || currentLead?.instagram_followers || 'Not visible';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6 select-none text-slate-800 bg-slate-50">
      
      {/* Celebration Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
          {[...Array(60)].map((_, i) => {
            const color = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][i % 6];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = Math.random() * 1.5 + 1.5;
            const size = Math.random() * 8 + 6;
            return (
              <motion.div
                key={i}
                initial={{ y: '100vh', x: `${left}vw`, scale: 0, rotate: 0, opacity: 1 }}
                animate={{
                  y: '-10vh',
                  x: `${left + (Math.random() * 20 - 10)}vw`,
                  scale: [0, 1, 1, 0],
                  rotate: Math.random() * 360 * 3,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: duration,
                  delay: delay,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: size,
                  height: size,
                  borderRadius: i % 2 === 0 ? '50%' : '0%',
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>
      )}
      
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
        <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-2xl flex-wrap justify-center md:justify-start gap-1">
          {[
            { id: 'dialer', label: 'Call Queue' },
            { id: 'deadlines', label: 'Meetings' },
            { id: 'database', label: 'Directory' },
            { id: 'followups', label: 'Followups' },
            { id: 'warm_leads', label: 'Warm Leads' },
            { id: 'good_clients', label: 'Converted' },
            { id: 'lost', label: 'Lost' },
            ...(callerName === 'Hamid' ? [{ id: 'admin', label: 'Admin Panel' }] : [])
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
                    <span>Won/Warm: <strong className="text-emerald-600">{stats.warm_deals}</strong></span>
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
          <AnimatePresence>
            
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
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
                          <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Phones</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {/* Primary Phone */}
                            <div className={`bg-white border rounded-xl p-4.5 flex items-center justify-between shadow-sm transition-all ${dialedNumber === currentLead?.phone ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Primary Phone</span>
                                <span className="font-display text-sm font-bold text-slate-800 tracking-wide font-mono">
                                  {currentLead?.phone || 'No phone number'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={!currentLead?.phone || currentLead?.phone === 'Not found'}
                                  onClick={() => copyToClipboard(currentLead?.phone)}
                                  className="p-2 hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-lg cursor-pointer"
                                  title="Copy Phone"
                                >
                                  {copiedPhone ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  disabled={!currentLead?.phone || currentLead?.phone === 'Not found'}
                                  onClick={() => {
                                    setDialedNumber(currentLead.phone);
                                    window.open(`tel:${currentLead.phone}`, '_self');
                                  }}
                                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                >
                                  <Phone className="w-3.5 h-3.5 fill-current" />
                                  Dial
                                </button>
                              </div>
                            </div>

                            {/* Alternative Phone */}
                            {currentLead?.phone_2 && (
                              <div className={`bg-white border rounded-xl p-4.5 flex items-center justify-between shadow-sm transition-all ${dialedNumber === currentLead?.phone_2 ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Alternative Phone</span>
                                  <span className="font-display text-sm font-bold text-slate-800 tracking-wide font-mono">
                                    {currentLead.phone_2}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyToClipboard(currentLead.phone_2)}
                                    className="p-2 hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-lg cursor-pointer"
                                    title="Copy Phone 2"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDialedNumber(currentLead.phone_2);
                                      window.open(`tel:${currentLead.phone_2}`, '_self');
                                    }}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                  >
                                    <Phone className="w-3.5 h-3.5 fill-current" />
                                    Dial
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details grid list (Editable Inline Form) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                          
                          <div className="flex flex-col gap-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Address</span>
                              <input
                                type="text"
                                value={currentLead?.address || ''}
                                onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'address', e.target.value)}
                                onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'address', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Google Maps Link</span>
                              <input
                                type="text"
                                value={currentLead?.maps_link || ''}
                                onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'maps_link', e.target.value)}
                                onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'maps_link', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-blue-600 focus:outline-none transition-colors font-mono"
                              />
                              {normalizeExternalUrl(currentLead?.maps_link) && (
                                <a
                                  href={normalizeExternalUrl(currentLead.maps_link)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-body text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-semibold mt-1 self-start"
                                >
                                  Open in Maps <MapPin className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Email Address</span>
                                <input
                                  type="email"
                                  value={currentLead?.email || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'email', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'email', e.target.value)}
                                  placeholder="Primary Email"
                                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Email Address 2</span>
                                <input
                                  type="email"
                                  value={currentLead?.email_2 || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'email_2', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'email_2', e.target.value)}
                                  placeholder="Alternative Email"
                                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Person</span>
                                <input
                                  type="text"
                                  value={currentLead?.contact_person || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'contact_person', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'contact_person', e.target.value)}
                                  placeholder="Secretary / Decision Maker"
                                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Phone Number 2</span>
                                <input
                                  type="text"
                                  value={currentLead?.phone_2 || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'phone_2', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'phone_2', e.target.value)}
                                  placeholder="Alternative Phone"
                                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Website Presence</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={currentLead?.website || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'website', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'website', e.target.value)}
                                  placeholder="None"
                                  className="flex-1 bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-blue-600 focus:outline-none transition-colors font-semibold"
                                />
                                <select
                                  value={currentLead?.website_quality || 'None'}
                                  onChange={(e) => {
                                    updateLeadFieldInQueue(currentLead.id, 'website_quality', e.target.value);
                                    saveLeadFieldToServer(currentLead.id, 'website_quality', e.target.value);
                                  }}
                                  className="bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2 font-body text-xs text-slate-800 focus:outline-none"
                                >
                                  <option value="None">None</option>
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Priority (Manual)</span>
                                <select
                                  value={currentLead?.priority || 3}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    updateLeadFieldInQueue(currentLead.id, 'priority', val);
                                    saveLeadFieldToServer(currentLead.id, 'priority', val);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none"
                                >
                                  <option value={1}>P1 (High Socials)</option>
                                  <option value={2}>P2 (High Reviews)</option>
                                  <option value={3}>P3 (Standard)</option>
                                  <option value={4}>P4 (Low Priority)</option>
                                  <option value={5}>P5 (Minimal Priority)</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Google Rating / Reviews</span>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={currentLead?.google_rating || 0.0}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'google_rating', parseFloat(e.target.value) || 0.0)}
                                    onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'google_rating', parseFloat(currentLead.google_rating) || 0.0)}
                                    className="w-16 bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2 font-body text-xs text-slate-800 focus:outline-none"
                                  />
                                  <input
                                    type="number"
                                    value={currentLead?.review_count || 0}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'review_count', parseInt(e.target.value, 10) || 0)}
                                    onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'review_count', parseInt(currentLead.review_count, 10) || 0)}
                                    className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2 font-body text-xs text-slate-800 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Socials & Followers</span>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={currentLead?.facebook || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'facebook', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'facebook', e.target.value)}
                                  placeholder="Facebook URL"
                                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 font-body text-[10px] text-slate-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={currentLead?.instagram || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'instagram', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'instagram', e.target.value)}
                                  placeholder="Instagram URL"
                                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 font-body text-[10px] text-slate-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={currentLead?.tiktok || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'tiktok', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'tiktok', e.target.value)}
                                  placeholder="TikTok URL"
                                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 font-body text-[10px] text-slate-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={currentLead?.followers_if_visible || ''}
                                  onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'followers_if_visible', e.target.value)}
                                  onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'followers_if_visible', e.target.value)}
                                  placeholder="e.g. 15K followers"
                                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 font-body text-[10px] text-slate-800 focus:outline-none font-bold"
                                />
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    value={currentLead?.social_link || ''}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'social_link', e.target.value)}
                                    onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'social_link', e.target.value)}
                                    placeholder="Other Custom Social / LinkedIn URL"
                                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 font-body text-[10px] text-slate-800 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Direct Outreach Social Pitcher */}
                        <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              Dynamic Social Messaging Pitch
                            </span>
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Auto-generated
                            </span>
                          </div>
                          
                          {(() => {
                            const agencyName = currentLead?.agency_name || '';
                            const isNoWeb = !currentLead?.website || currentLead.website === 'Not found' || currentLead.website.toLowerCase() === 'none';
                            const pitch = isNoWeb 
                              ? `Salam ${agencyName}, this is ${callerName} from Web-OS. We noticed you have a great social media presence but don't have a website yet. We build premium, high-speed websites for Algerian travel agencies to get direct bookings. Let me know if we can discuss!`
                              : `Salam ${agencyName}, this is ${callerName} from Web-OS. We checked your website and noticed it could be optimized for mobile and speed. We help travel agencies increase their conversion rates by redesigning outdated portals. Would you like a free speed audit?`;

                            const whatsappPhone = formatWhatsappPhone(currentLead?.phone);
                            
                            return (
                              <div className="flex flex-col gap-3">
                                <textarea
                                  readOnly
                                  value={pitch}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-body text-xs text-slate-600 leading-relaxed resize-none h-[75px] outline-none"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* WhatsApp Msg (prefilled) */}
                                  <button
                                    disabled={!whatsappPhone}
                                    onClick={() => {
                                      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(pitch)}`, '_blank');
                                    }}
                                    className="flex-1 min-w-[110px] px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                  >
                                    WhatsApp Msg
                                  </button>

                                  {/* WhatsApp Chat (direct) */}
                                  <button
                                    disabled={!whatsappPhone}
                                    onClick={() => {
                                      window.open(`https://wa.me/${whatsappPhone}`, '_blank');
                                    }}
                                    className="flex-1 min-w-[110px] px-3 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-100 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                  >
                                    WhatsApp Chat
                                  </button>

                                  {/* Instagram direct links */}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(pitch);
                                      alert('Pitch copied to clipboard! Opening Instagram profile...');
                                      window.open(normalizeInstagramUrl(currentLead?.instagram), '_blank');
                                    }}
                                    className="flex-1 min-w-[120px] px-3.5 py-2.5 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white border border-pink-100 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    Copy & Instagram
                                  </button>

                                  {/* Facebook Messenger */}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(pitch);
                                      alert('Pitch copied to clipboard! Opening Facebook Messenger...');
                                      window.open(normalizeMessengerUrl(currentLead?.facebook), '_blank');
                                    }}
                                    className="flex-1 min-w-[120px] px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    Copy & Messenger
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
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

                        {/* Quick Outcome buttons */}
                        <div className="flex flex-col gap-2">
                          <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">
                            Quick Call Outcome Log
                          </span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button
                              onClick={() => handleQuickOutcome('Interested')}
                              className="py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Smile className="w-3.5 h-3.5" />
                              Warm
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('Accepted')}
                              className="py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accepted
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('Client Configured')}
                              className="py-2.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white border border-cyan-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Configured
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('Not Interested')}
                              className="py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Frown className="w-3.5 h-3.5" />
                              Rejected
                            </button>

                            <button
                              onClick={() => {
                                const dt = prompt("Enter Callback date/time (e.g. Tomorrow 2PM):");
                                if (dt) {
                                  handleQuickOutcome('Callback');
                                  updateLeadDetails(currentLead.id, { meeting_date: dt });
                                }
                              }}
                              className="py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Callback
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('Busy')}
                              className="py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Busy
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('No Answer')}
                              className="py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              No Answer
                            </button>

                            <button
                              onClick={() => handleQuickOutcome('Wrong Number')}
                              className="py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white border border-slate-200 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Wrong No
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 my-1"></div>

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
                            No accepted meetings or callbacks scheduled.
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
                        <option value="Interested">Interested Only</option>
                        <option value="Accepted">Accepted Only</option>
                        <option value="Client Configured">Configured Only</option>
                        <option value="Callback">Callbacks Only</option>
                        <option value="No Answer / Busy">No Answer / Busy</option>
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
                  } transition-all duration-300 relative`}>
                    
                    {/* Subtle Loading overlay instead of wiping table */}
                    {isPending && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20 transition-all duration-300">
                        <div className="flex flex-col items-center gap-2 bg-white/95 border border-slate-100 px-6 py-4 rounded-2xl shadow-md">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          <span className="font-body text-[10px] text-slate-400 tracking-wider uppercase font-bold">Refreshing data...</span>
                        </div>
                      </div>
                    )}
                    
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
                                <select
                                  value={lead.priority || 3}
                                  onChange={async (e) => {
                                    const val = parseInt(e.target.value, 10);
                                    // Update local state optimistically
                                    setLeadsList(prev => prev.map(x => x.id === lead.id ? { ...x, priority: val } : x));
                                    await saveLeadFieldToServer(lead.id, 'priority', val);
                                  }}
                                  className={`rounded font-bold px-2 py-1 text-[9px] cursor-pointer focus:outline-none ${
                                    lead.priority === 1
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : lead.priority === 2
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  <option value={1}>P1 - High</option>
                                  <option value={2}>P2 - Medium</option>
                                  <option value={3}>P3 - Low</option>
                                  <option value={4}>P4 - V. Low</option>
                                  <option value={5}>P5 - Minimal</option>
                                </select>
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
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Primary Phone</label>
                            <input
                              type="text"
                              value={editingLead.phone}
                              onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Alternative Phone (2)</label>
                            <input
                              type="text"
                              value={editingLead.phone_2 || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, phone_2: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-mono"
                            />
                          </div>
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Primary Email</label>
                            <input
                              type="email"
                              value={editingLead.email || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Alternative Email (2)</label>
                            <input
                              type="email"
                              value={editingLead.email_2 || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, email_2: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
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

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Other Social / LinkedIn URL</label>
                          <input
                            type="text"
                            value={editingLead.social_link || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, social_link: e.target.value })}
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                          />
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
                              <option value={4}>Priority 4 (Low)</option>
                              <option value={5}>Priority 5 (Minimal)</option>
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
                    {totalLostCount} Refused / Disconnected Leads
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
                                onClick={() => {
                                  // Optimistic UI update: remove lead from directory list immediately
                                  const prevLeads = [...leadsList];
                                  const prevTotal = totalLostCount;
                                  setLeadsList(prev => prev.filter(x => x.id !== lead.id));
                                  setTotalLostCount(prev => Math.max(0, prev - 1));

                                  // Asynchronous Postgres updates
                                  Promise.all([
                                    updateLeadDetails(lead.id, { notes: 'Restored from lost list.', contact_person: '' }),
                                    updateCallStatusWithAI(lead.id, callerName, 'Restored to queue.')
                                  ]).then(([res1, res2]) => {
                                    if ((!res1.success || !res2.success) && dbConfigured) {
                                      // Rollback on failure
                                      setLeadsList(prevLeads);
                                      setTotalLostCount(prevTotal);
                                      alert('Failed to restore lead.');
                                    }
                                  });
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
                    Showing {leadsList.length} of {totalLostCount} total records
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
                      Page {currentPage} of {Math.ceil(totalLostCount / 12) || 1}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalLostCount / 12)}
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

            {/* TAB 6: FOLLOWUPS (Busy / No Answer) */}
            {activeTab === 'followups' && (
              <motion.div
                key="followups-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Followups Due From Callback / Busy / No Answer
                    </h3>
                  </div>
                  <span className="font-body text-xs text-blue-700 font-bold bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {totalFollowupsCount} Followup Leads
                  </span>
                </div>

                <div className="w-full overflow-x-auto text-xs font-body">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Target Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Area</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Phone Numbers</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Last Called At</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Caller</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Status</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{lead.agency_name}</span>
                            <span className="text-[10px] text-slate-400 italic max-w-xs truncate block" title={lead.call_notes}>
                              "{lead.call_notes || 'No call notes'}"
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{lead.area}</td>
                          <td className="p-4 text-slate-500 font-mono">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">{lead.phone}</span>
                              {lead.phone_2 && <span className="text-[10px] text-slate-400">Alt: {lead.phone_2}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">
                            {lead.last_called_at ? new Date(lead.last_called_at).toLocaleString() : 'N/A'}
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
                                className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 cursor-pointer"
                                title="Recall (Send to Dialer)"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leadsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            No followups pending. Great job!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-body text-[10px] text-slate-400 tracking-wider">
                    Showing {leadsList.length} of {totalFollowupsCount} total followups
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
                      Page {currentPage} of {Math.ceil(totalFollowupsCount / 12) || 1}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalFollowupsCount / 12)}
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

            {/* TAB 7: WARM LEADS (Interested but not converted) */}
            {activeTab === 'warm_leads' && (
              <motion.div
                key="warm-leads-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4.5 h-4.5 text-emerald-500" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Warm Leads Waiting For Close
                    </h3>
                  </div>
                  <span className="font-body text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    {totalWarmCount} Interested Leads
                  </span>
                </div>

                <div className="w-full overflow-x-auto text-xs font-body">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Target Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Area</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Contacts</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Next Step</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Logged By</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Status</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{lead.agency_name}</span>
                            <span className="text-[10px] text-slate-400 italic max-w-xs truncate block" title={lead.call_notes}>
                              "{lead.call_notes || lead.notes || 'Needs closing notes'}"
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{lead.area}</td>
                          <td className="p-4 text-slate-600 font-mono">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">{lead.phone}</span>
                              {lead.phone_2 && <span className="text-[10px] text-slate-400">Alt: {lead.phone_2}</span>}
                              {lead.email && <span className="text-[10px] text-slate-400 font-sans">{lead.email}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">
                            {lead.meeting_date || 'Qualify and ask for accepted next step'}
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
                                title="Edit details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDialerQueue([lead, ...dialerQueue.filter(q => q.id !== lead.id)]);
                                  setCurrentQueueIndex(0);
                                  setActiveTab('dialer');
                                }}
                                className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 cursor-pointer"
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
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            No warm leads waiting for close.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-body text-[10px] text-slate-400 tracking-wider">
                    Showing {leadsList.length} of {totalWarmCount} total warm leads
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
                      Page {currentPage} of {Math.ceil(totalWarmCount / 12) || 1}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalWarmCount / 12)}
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

            {/* TAB 8: CONVERTED CLIENTS */}
            {activeTab === 'good_clients' && (
              <motion.div
                key="good-clients-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Converted Clients
                    </h3>
                  </div>
                  <span className="font-body text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    {totalGoodClientsCount} Converted Leads
                  </span>
                </div>

                <div className="w-full overflow-x-auto text-xs font-body">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Target Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Area</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Contacts</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Socials / Links</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Assigned / Logged By</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Call Status</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{lead.agency_name}</span>
                            {lead.contact_person && (
                              <span className="text-[10px] text-slate-500 block">Contact: {lead.contact_person}</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{lead.area}</td>
                          <td className="p-4 text-slate-600 font-mono">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">{lead.phone}</span>
                              {lead.phone_2 && <span className="text-[10px] text-slate-400">Alt: {lead.phone_2}</span>}
                              {lead.email && <span className="text-[10px] text-slate-400 font-sans">{lead.email}</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {normalizeExternalUrl(lead.website) && (
                                <a href={normalizeExternalUrl(lead.website)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors" title="Website">
                                  <Globe className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {normalizeExternalUrl(lead.facebook) && (
                                <a href={normalizeExternalUrl(lead.facebook)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors" title="Facebook">
                                  <FacebookIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {normalizeExternalUrl(lead.instagram) && (
                                <a href={normalizeInstagramUrl(lead.instagram)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors" title="Instagram">
                                  <InstagramIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {normalizeExternalUrl(lead.social_link) && (
                                <a href={normalizeExternalUrl(lead.social_link)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors" title="Other Social Link / LinkedIn">
                                  <LinkedinIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border text-[10px] self-start">
                                Logged: {lead.caller_name || 'System'}
                              </span>
                              {lead.assigned_to && (
                                <span className="text-[9px] text-slate-400">Assigned: {lead.assigned_to}</span>
                              )}
                            </div>
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
                                title="Edit details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leadsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            No converted clients logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-body text-[10px] text-slate-400 tracking-wider">
                    Showing {leadsList.length} of {totalGoodClientsCount} total converted clients
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
                      Page {currentPage} of {Math.ceil(totalGoodClientsCount / 12) || 1}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalGoodClientsCount / 12)}
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

            {/* TAB 5: ADMIN PANEL */}
            {activeTab === 'admin' && callerName === 'Hamid' && (
              <motion.div
                key="admin-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col gap-6"
              >
                {/* Admin Header with quick summaries */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Unassigned Leads */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Unassigned Active Leads</span>
                    <span className="font-display text-3xl font-black text-slate-800">{assignmentStats.unassigned}</span>
                    <p className="font-body text-[10px] text-slate-400 mt-2 font-semibold">Targets waiting for caller assignment</p>
                  </div>
                  
                  {/* Assigned Leads counts */}
                  {['Hamid', 'Oussama', 'Kamel'].map((name) => {
                    const stats = assignmentStats.stats.find((x: any) => x.name === name) || { count: 0 };
                    return (
                      <div key={name} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                        <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">{name}'s Assigned Queue</span>
                        <span className="font-display text-3xl font-black text-slate-800">{stats.count}</span>
                        <p className="font-body text-[10px] text-slate-400 mt-2 font-semibold">Active uncalled targets assigned</p>
                      </div>
                    );
                  })}
                </div>

                {/* Campaign Analytics Section */}
                {analyticsData && (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                        Campaign Outreach Analytics & Status Breakdown
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Total Leads</span>
                        <span className="font-display text-xl font-bold text-slate-800 mt-1">{analyticsData.totalLeads}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Total Called</span>
                        <span className="font-display text-xl font-bold text-blue-600 mt-1">{analyticsData.totalCalled}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Calls Today</span>
                        <span className="font-display text-xl font-bold text-indigo-600 mt-1">{analyticsData.callsToday}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Warm Leads</span>
                        <span className="font-display text-xl font-bold text-emerald-600 mt-1">{analyticsData.statuses.interested}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Converted</span>
                        <span className="font-display text-xl font-bold text-indigo-600 mt-1">{analyticsData.statuses.converted}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Busy / No Answer</span>
                        <span className="font-display text-xl font-bold text-amber-600 mt-1">{analyticsData.statuses.noAnswer}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                        <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Not Interested</span>
                        <span className="font-display text-xl font-bold text-rose-600 mt-1">{analyticsData.statuses.notInterested}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allocation Controls Forms Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Distribution Panel Controls */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div>
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">Allocate Targets to Caller Teams</h3>
                      <p className="font-body text-xs text-slate-400 mt-1">Assign only uncalled targets by Region, Priority, or emergency ID Range. Warm and converted leads stay locked.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                      
                      {/* Region Allocator */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          const caller = data.get('caller') as string;
                          const region = data.get('region') as string;
                          if (!caller || !region) return;
                          if (!confirm(`Assign currently unassigned uncalled ${region} leads to ${caller}? Warm and converted leads will stay locked.`)) return;

                          setIsAdminActionPending(true);
                          const res = await assignLeadsByRegion(caller, region);
                          setIsAdminActionPending(false);
                          
                          if (res.success) {
                            alert(`Successfully assigned ${region} leads to ${caller}!`);
                            fetchAssignmentStats();
                          } else {
                            alert(`Error assigning leads: ${res.error}`);
                          }
                        }}
                        className="flex flex-col gap-4 font-body text-xs"
                      >
                        <span className="font-display text-[10px] font-bold tracking-wider text-slate-800 uppercase">Assign by Region</span>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Select Caller</label>
                          <select name="caller" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            <option value="Hamid">Hamid</option>
                            <option value="Oussama">Oussama</option>
                            <option value="Kamel">Kamel</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Region Name</label>
                          <select name="region" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            <option value="Algiers">Algiers</option>
                            <option value="Oran">Oran</option>
                            <option value="Constantine">Constantine</option>
                            <option value="Sétif">Sétif</option>
                            <option value="Tlemcen">Tlemcen</option>
                            <option value="Blida">Blida</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isAdminActionPending}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {isAdminActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Region'}
                        </button>
                      </form>

                      {/* Priority Allocator */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          const caller = data.get('caller') as string;
                          const priorityVal = data.get('priority') as string;
                          if (!caller || !priorityVal) return;
                          if (!confirm(`Assign currently unassigned uncalled Priority ${priorityVal} leads to ${caller}? Warm and converted leads will stay locked.`)) return;

                          setIsAdminActionPending(true);
                          const res = await assignLeadsByPriority(caller, parseInt(priorityVal, 10));
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert(`Successfully assigned Priority ${priorityVal} leads to ${caller}!`);
                            fetchAssignmentStats();
                          } else {
                            alert(`Error assigning leads: ${res.error}`);
                          }
                        }}
                        className="flex flex-col gap-4 font-body text-xs"
                      >
                        <span className="font-display text-[10px] font-bold tracking-wider text-slate-800 uppercase">Assign by Priority Bracket</span>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Select Caller</label>
                          <select name="caller" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            <option value="Hamid">Hamid</option>
                            <option value="Oussama">Oussama</option>
                            <option value="Kamel">Kamel</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Select Priority</label>
                          <select name="priority" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            <option value="1">Priority 1 (High Socials)</option>
                            <option value="2">Priority 2 (High Reviews)</option>
                            <option value="3">Priority 3 (Standard)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isAdminActionPending}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {isAdminActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Priority'}
                        </button>
                      </form>

                      {/* Range Allocator */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          const caller = data.get('caller') as string;
                          const startId = parseInt(data.get('startId') as string, 10);
                          const endId = parseInt(data.get('endId') as string, 10);
                          if (!caller || isNaN(startId) || isNaN(endId)) return;
                          if (startId > endId) {
                            alert('Start ID must be lower than or equal to End ID.');
                            return;
                          }
                          if (!confirm(`Assign currently unassigned uncalled lead IDs #${startId} through #${endId} to ${caller}? Warm and converted leads will stay locked.`)) return;

                          setIsAdminActionPending(true);
                          const res = await assignLeadsByRange(caller, startId, endId);
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert(`Successfully assigned ID range #${startId} - #${endId} to ${caller}!`);
                            fetchAssignmentStats();
                          } else {
                            alert(`Error assigning leads: ${res.error}`);
                          }
                        }}
                        className="flex flex-col gap-4 font-body text-xs"
                      >
                        <span className="font-display text-[10px] font-bold tracking-wider text-slate-800 uppercase">Assign by ID Range</span>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Select Caller</label>
                          <select name="caller" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            <option value="Hamid">Hamid</option>
                            <option value="Oussama">Oussama</option>
                            <option value="Kamel">Kamel</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 uppercase font-bold">Start ID</label>
                            <input
                              type="number"
                              name="startId"
                              placeholder="e.g. 0"
                              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 uppercase font-bold">End ID</label>
                            <input
                              type="number"
                              name="endId"
                              placeholder="e.g. 100"
                              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isAdminActionPending}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {isAdminActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Range'}
                        </button>
                      </form>

                    </div>
                  </div>

                  {/* Bulk Actions Control Panel */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                    <div>
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">Quick Splitting & Resets</h3>
                      <p className="font-body text-[11px] text-slate-400 mt-1">One-click distribution for uncalled queues only. Worked leads keep their owner.</p>
                    </div>

                    <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-5">
                      
                      {/* Equal Split Button */}
                      <button
                        onClick={async () => {
                          if (!confirm("Divide all unassigned uncalled targets equally among Hamid, Oussama, and Kamel? Warm and converted leads will stay locked.")) return;
                          setIsAdminActionPending(true);
                          const res = await splitLeadsEqually();
                          setIsAdminActionPending(false);
                          
                          if (res.success) {
                            alert(`Success! Equally split ${res.totalAssigned} targets among the active callers.`);
                            fetchAssignmentStats();
                          } else {
                            alert(`Error splitting leads: ${res.error}`);
                          }
                        }}
                        disabled={isAdminActionPending}
                        className="w-full py-3.5 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        <Users className="w-4 h-4" />
                        EQUAL TEAM SPLIT
                      </button>

                      {/* Clear Assignments Button */}
                      <button
                        onClick={async () => {
                          if (!confirm("Clear caller allocations only for uncalled targets? Warm, followup, lost, and converted leads will keep their owner.")) return;
                          setIsAdminActionPending(true);
                          const res = await clearAssignments();
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert('Successfully cleared uncalled target assignments.');
                            fetchAssignmentStats();
                          } else {
                            alert(`Error clearing assignments: ${res.error}`);
                          }
                        }}
                        disabled={isAdminActionPending}
                        className="w-full py-3.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="w-4 h-4" />
                        CLEAR UNCALLED ASSIGNMENTS
                      </button>

                    </div>
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
