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
  Plus,
  Trash2,
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
  deleteLeadPermanently,
  restoreLeadToQueue,
  checkDataSafetySchema,
  downloadFullBackup,
  previewLeadImport,
  commitLeadImport,
  undoLastImport,
  lockLead,
  unlockLead,
  recallLead,
  resetCampaign,
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
  const [skippedLeadNotice, setSkippedLeadNotice] = useState<string>('');

  // New States for Dialed Number Tracking & Admin Analytics
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [showSecondaryPhone, setShowSecondaryPhone] = useState<boolean>(false);
  const [showSecondaryEmail, setShowSecondaryEmail] = useState<boolean>(false);
  const [dataSafetySchema, setDataSafetySchema] = useState<any | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isDataSafetyBusy, setIsDataSafetyBusy] = useState<boolean>(false);

  // Added States for visual improvements and locking system
  const [dialerCardTab, setDialerCardTab] = useState<'info' | 'pitch' | 'history'>('info');
  const [lockedLeadId, setLockedLeadId] = useState<number | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [currentCallHistory, setCurrentCallHistory] = useState<any[]>([]);

  const lockedLeadIdRef = React.useRef<number | null>(null);

  // Sync dialedNumber with active lead
  useEffect(() => {
    const activeLead = dialerQueue[currentQueueIndex];
    if (activeLead) {
      setDialedNumber(activeLead.phone || '');
    } else {
      setDialedNumber('');
    }
  }, [dialerQueue, currentQueueIndex]);

  // Concurrency locking lease effect with 2-minute heartbeat interval
  useEffect(() => {
    if (!dbConfigured || !callerName) return;

    const activeLead = dialerQueue[currentQueueIndex];
    if (!activeLead) {
      if (lockedLeadIdRef.current) {
        const toUnlock = lockedLeadIdRef.current;
        lockedLeadIdRef.current = null;
        unlockLead(toUnlock, callerName);
      }
      return;
    }

    if (activeLead.id === lockedLeadIdRef.current) return;

    let isSubscribed = true;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const syncLock = async () => {
      if (lockedLeadIdRef.current) {
        const toUnlock = lockedLeadIdRef.current;
        lockedLeadIdRef.current = null;
        await unlockLead(toUnlock, callerName);
      }

      const res = await lockLead(activeLead.id, callerName);
      if (!isSubscribed) return;

      if (res.success) {
        lockedLeadIdRef.current = activeLead.id;
        
        // Start heartbeat to refresh lock every 2 minutes
        heartbeatInterval = setInterval(async () => {
          if (lockedLeadIdRef.current === activeLead.id) {
            await lockLead(activeLead.id, callerName);
          }
        }, 2 * 60 * 1000);
      } else if (res.error === 'LEAD_LOCKED_BY_OTHER') {
        // Skip locked lead silently and show notice
        setSkippedLeadNotice(`"${activeLead.agency_name}" is locked by another caller; skipped.`);
        setTimeout(() => setSkippedLeadNotice(''), 4500);
        setDialerQueue(prev => prev.filter(lead => lead.id !== activeLead.id));
      } else {
        lockedLeadIdRef.current = activeLead.id;
      }
    };

    syncLock();

    return () => {
      isSubscribed = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [currentQueueIndex, dialerQueue, callerName, dbConfigured]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (lockedLeadIdRef.current && callerName && dbConfigured) {
        unlockLead(lockedLeadIdRef.current, callerName);
      }
    };
  }, [callerName, dbConfigured]);

  // Load call history timeline dynamically for active lead
  useEffect(() => {
    const activeLead = dialerQueue[currentQueueIndex];
    if (!activeLead || !dbConfigured) {
      setCurrentCallHistory([]);
      return;
    }

    getCallHistory(activeLead.id).then(res => {
      if (res.success && res.history) {
        setCurrentCallHistory(res.history);
      } else {
        setCurrentCallHistory([]);
      }
    });
  }, [dialerQueue, currentQueueIndex, dbConfigured]);

  // Reset page and search query on tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

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
    const [assignRes, analyticsRes, schemaRes] = await Promise.all([
      getAssignmentStats(),
      getAnalytics(),
      checkDataSafetySchema()
    ]);
    if (assignRes.success) {
      setAssignmentStats({ stats: assignRes.stats || [], unassigned: assignRes.unassigned || 0 });
    }
    if (analyticsRes.success) {
      setAnalyticsData(analyticsRes.stats);
    }
    if (schemaRes.success) {
      setDataSafetySchema(schemaRes);
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
        getAnalytics(),
      ] as any[];

      if (callerName === 'Hamid') {
        promises.push(getAssignmentStats());
      }

      const results = await Promise.all(promises);
      const queueRes = results[0];
      const leaderboardRes = results[1];
      const meetingsRes = results[2];
      const leadsRes = results[3];
      const analyticsRes = results[4];

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
      } else {
        setLeadsList(MOCK_LEADS);
      }

      if (analyticsRes.success && analyticsRes.stats) {
        const stats = analyticsRes.stats;
        setAnalyticsData(stats);
        setTotalLeadsCount(stats.totalLeads);
        setTotalWarmCount(stats.statuses.interested);
        setTotalGoodClientsCount(stats.statuses.converted);
        setTotalFollowupsCount(stats.statuses.callback + stats.statuses.noAnswer);
        setTotalLostCount(stats.statuses.notInterested + stats.statuses.wrongNumber);
      }

      if (callerName === 'Hamid') {
        const assignmentRes = results[5];
        if (assignmentRes && assignmentRes.success) {
          setAssignmentStats({ stats: assignmentRes.stats || [], unassigned: assignmentRes.unassigned || 0 });
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
      setShowSecondaryPhone(Boolean(currentLead.phone_2));
      setShowSecondaryEmail(Boolean(currentLead.email_2));
    }
  }, [currentLead?.id]);

  // Direct Inline Dialer editing handlers
  const updateLeadFieldInQueue = (leadId: number, field: string, value: any) => {
    setDialerQueue(prev =>
      prev.map(item => (item.id === leadId ? { ...item, [field]: value } : item))
    );
    setLeadsList(prev =>
      prev.map(item => (item.id === leadId ? { ...item, [field]: value } : item))
    );
    setMeetingsList(prev =>
      prev.map(item => (item.id === leadId ? { ...item, [field]: value } : item))
    );
  };

  const saveLeadFieldToServer = async (leadId: number, field: string, value: any) => {
    const res = await updateLeadDetails(leadId, { [field]: value });
    if (!res.success && dbConfigured) {
      console.error('Failed to auto-save field:', field, res.error);
    }
  };

  const handleSkipLead = () => {
    if (dialerQueue.length <= 1) return;
    setDialerQueue(prev => {
      const next = [...prev];
      const [skipped] = next.splice(currentQueueIndex, 1);
      next.push(skipped);
      return next;
    });
    setCurrentQueueIndex(index => Math.min(index, dialerQueue.length - 2));
  };

  const handleDeleteFalseLead = async () => {
    if (!currentLead) return;
    const label = currentLead.agency_name || `Lead #${currentLead.id}`;
    if (!confirm(`Permanently remove "${label}" from the database because it is not a travel agency? This cannot be undone.`)) return;

    const prevQueue = [...dialerQueue];
    const prevLeadsList = [...leadsList];
    const prevIndex = currentQueueIndex;
    const prevTotalLeads = totalLeadsCount;

    setDialerQueue(prev => {
      const next = prev.filter(lead => lead.id !== currentLead.id);
      return next;
    });
    setLeadsList(prev => prev.filter(lead => lead.id !== currentLead.id));
    setTotalLeadsCount(prev => Math.max(0, prev - 1));
    setCurrentQueueIndex(index => Math.max(0, Math.min(index, dialerQueue.length - 2)));

    const res = await deleteLeadPermanently(currentLead.id);
    if (!res.success && dbConfigured) {
      setDialerQueue(prevQueue);
      setLeadsList(prevLeadsList);
      setCurrentQueueIndex(prevIndex);
      setTotalLeadsCount(prevTotalLeads);
      alert('Failed to remove lead: ' + res.error);
    } else {
      fetchAssignmentStats();
    }
  };

  const handleDownloadBackup = async () => {
    setIsDataSafetyBusy(true);
    const res = await downloadFullBackup();
    setIsDataSafetyBusy(false);
    if (!res.success || !res.backup) {
      alert('Failed to create backup: ' + res.error);
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelected = async (file?: File | null) => {
    if (!file) return;
    setIsDataSafetyBusy(true);
    setImportFileName(file.name);
    setImportPreview(null);
    const text = await file.text();
    const res = await previewLeadImport(text);
    setIsDataSafetyBusy(false);
    if (!res.success || !res.preview) {
      alert('Import preview failed: ' + res.error);
      return;
    }
    setImportPreview(res.preview);
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    if (!dataSafetySchema?.ready) {
      alert('Run scripts/data_safety_migration.sql in Supabase SQL Editor first, then refresh this admin tab.');
      return;
    }
    if (!confirm(`Import ${importPreview.importable_rows} new leads and skip ${importPreview.skipped_rows} duplicate/problem rows?`)) return;

    setIsDataSafetyBusy(true);
    const res = await commitLeadImport(importPreview.rows, importFileName, callerName);
    setIsDataSafetyBusy(false);
    if (!res.success) {
      alert('Import failed: ' + res.error);
      return;
    }

    alert(`Imported ${res.inserted} leads. Skipped ${res.skipped}.`);
    setImportPreview(null);
    setImportFileName('');
    fetchAllData(false);
  };

  const handleUndoLastImport = async () => {
    if (!dataSafetySchema?.ready) {
      alert('Run scripts/data_safety_migration.sql in Supabase SQL Editor first, then refresh this admin tab.');
      return;
    }
    if (!confirm('Undo the most recent import batch? This removes only leads from that import batch.')) return;

    setIsDataSafetyBusy(true);
    const res = await undoLastImport();
    setIsDataSafetyBusy(false);
    if (!res.success) {
      alert('Undo failed: ' + res.error);
      return;
    }

    alert(`Removed ${res.removed} leads from batch ${res.batchId}.`);
    fetchAllData(false);
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
      website_quality: editingLead.website_quality,
      address: editingLead.address,
      maps_link: editingLead.maps_link,
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
    const handle = extractSocialHandle(raw, /(^|\.)instagram\.com$/i);
    if (handle) return `https://instagram.com/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeInstagramProfileUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)instagram\.com$/i);
    if (handle) return `https://instagram.com/${encodeURIComponent(handle)}`;
    return '';
  };

  const extractSocialHandle = (value?: string | null, hostPattern?: RegExp) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const clean = raw.replace(/^@/, '');
    if (!/^https?:\/\//i.test(clean) && !clean.includes('/') && /^[A-Za-z0-9._]+$/.test(clean)) return clean;

    try {
      const url = new URL(normalizeExternalUrl(clean));
      if (hostPattern && !hostPattern.test(url.hostname)) return '';
      if (url.pathname === '/profile.php') return url.searchParams.get('id') || '';
      const firstPathSegment = url.pathname.split('/').filter(Boolean)[0] || '';
      if (['p', 'reel', 'stories', 'direct', 'share', 'groups', 'events', 'marketplace'].includes(firstPathSegment.toLowerCase())) return '';
      return firstPathSegment;
    } catch {
      if (!clean.includes('/') && !clean.includes('.')) return clean;
      return '';
    }
  };

  const normalizeInstagramDmUrl = (value?: string | null) => {
    const handle = extractSocialHandle(value, /(^|\.)instagram\.com$/i);
    return handle ? `https://ig.me/m/${encodeURIComponent(handle)}` : 'https://instagram.com/direct/inbox/';
  };

  const normalizeFacebookProfileUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)facebook\.com$/i);
    if (handle) return `https://facebook.com/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeMessengerUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return 'https://m.me/';
    const facebookHandle = extractSocialHandle(raw, /(^|\.)facebook\.com$/i);
    if (facebookHandle) return `https://m.me/${encodeURIComponent(facebookHandle)}`;
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://m.me/${handle}`;
    return normalizeExternalUrl(handle);
  };

  const normalizeTikTokUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)tiktok\.com$/i).replace(/^@/, '');
    if (handle) return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeLinkedInUrl = (value?: string | null) => {
    const raw = value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    if (/linkedin\.com/i.test(raw)) return normalizeExternalUrl(raw);
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://www.linkedin.com/company/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(handle);
  };

  const SocialProfileBadges = ({ lead, compact = false }: { lead?: Record<string, any> | null; compact?: boolean }) => {
    const links = [
      {
        key: 'website',
        label: 'Website',
        href: normalizeExternalUrl(lead?.website),
        icon: <Globe className="w-3.5 h-3.5" />,
        className: 'hover:bg-slate-900 hover:text-white',
      },
      {
        key: 'facebook',
        label: 'Facebook',
        href: normalizeFacebookProfileUrl(lead?.facebook),
        icon: <FacebookIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-blue-600 hover:text-white',
      },
      {
        key: 'instagram',
        label: 'Instagram',
        href: normalizeInstagramProfileUrl(lead?.instagram),
        icon: <InstagramIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-pink-600 hover:text-white',
      },
      {
        key: 'tiktok',
        label: 'TikTok',
        href: normalizeTikTokUrl(lead?.tiktok),
        icon: <TikTokIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-black hover:text-white',
      },
      {
        key: 'linkedin',
        label: 'LinkedIn',
        href: normalizeLinkedInUrl(lead?.linkedin),
        icon: <LinkedinIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-sky-700 hover:text-white',
      },
      {
        key: 'social_link',
        label: 'Other Link',
        href: normalizeExternalUrl(lead?.social_link),
        icon: <Globe className="w-3.5 h-3.5" />,
        className: 'hover:bg-violet-600 hover:text-white',
      },
    ].filter((link) => Boolean(link.href));

    if (!links.length) return null;

    return (
      <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            title={link.label}
            aria-label={`Open ${link.label}`}
            className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} inline-flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-600 transition-colors ${link.className}`}
          >
            {link.icon}
          </a>
        ))}
      </div>
    );
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
            { id: 'dialer', label: 'Call Queue', count: dialerQueue.length },
            { id: 'deadlines', label: 'Meetings', count: meetingsList.length },
            { id: 'database', label: 'Directory', count: totalLeadsCount },
            { id: 'followups', label: 'Followups', count: totalFollowupsCount },
            { id: 'warm_leads', label: 'Warm Leads', count: totalWarmCount },
            { id: 'good_clients', label: 'Converted', count: totalGoodClientsCount },
            { id: 'lost', label: 'Lost', count: totalLostCount },
            ...(callerName === 'Hamid' ? [{ id: 'admin', label: 'Admin Panel', count: null }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-display text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
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
                  <div className="col-span-12 w-full bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
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
                    {/* LEFT COLUMN: Premium Command Center active Dialer Card */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm relative overflow-hidden">
                        
                        {/* Header Details row */}
                        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-body text-[10px] text-slate-400 tracking-widest uppercase font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                Target {currentQueueIndex + 1} of {dialerQueue.length} in dialer session
                              </span>
                              {skippedLeadNotice && (
                                <span className="font-body text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full animate-pulse">
                                  {skippedLeadNotice}
                                </span>
                              )}
                            </div>
                            
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

                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="font-display text-xl md:text-2xl font-black text-slate-900 tracking-wide uppercase">
                                {currentLead?.agency_name}
                              </h2>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-100`}>
                                P{currentLead?.priority} Priority
                              </span>
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold tracking-widest border border-emerald-100 flex items-center gap-1 animate-pulse">
                                <Lock className="w-2.5 h-2.5" />
                                Lease Secured
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
                        </div>

                        {/* Internal tabs for info vs social vs history */}
                        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl gap-1 self-start">
                          <button
                            onClick={() => setDialerCardTab('info')}
                            className={`px-4 py-2 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                              dialerCardTab === 'info'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Call & Info
                          </button>
                          <button
                            onClick={() => setDialerCardTab('pitch')}
                            className={`px-4 py-2 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                              dialerCardTab === 'pitch'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Outreach Pitch
                          </button>
                          <button
                            onClick={() => setDialerCardTab('history')}
                            className={`px-4 py-2 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                              dialerCardTab === 'history'
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Notes & History ({currentCallHistory.length})
                          </button>
                        </div>

                        {/* TAB CONTENT A: CALL & INFO */}
                        {dialerCardTab === 'info' && (
                          <div className="flex flex-col gap-5 animate-fadeIn">
                            
                            {/* Phones section */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Phones</span>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {/* Primary Phone */}
                                <div className={`bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${dialedNumber === currentLead?.phone ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
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
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                    >
                                      <Phone className="w-3 h-3 fill-current" />
                                      Dial
                                    </button>
                                  </div>
                                </div>

                                {/* Alternative Phone */}
                                {showSecondaryPhone || currentLead?.phone_2 ? (
                                  <div className={`bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${dialedNumber === currentLead?.phone_2 ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                      <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Alternative Phone</span>
                                      <input
                                        type="text"
                                        value={currentLead?.phone_2 || ''}
                                        onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'phone_2', e.target.value)}
                                        onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'phone_2', e.target.value)}
                                        placeholder="Add alternative phone"
                                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-lg px-2 py-1 font-body text-xs text-slate-800 focus:outline-none font-mono"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      <button
                                        disabled={!currentLead?.phone_2}
                                        onClick={() => copyToClipboard(currentLead.phone_2)}
                                        className="p-2 hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-lg cursor-pointer disabled:opacity-40"
                                        title="Copy Phone 2"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        disabled={!currentLead?.phone_2}
                                        onClick={() => {
                                          setDialedNumber(currentLead.phone_2);
                                          window.open(`tel:${currentLead.phone_2}`, '_self');
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-40"
                                      >
                                        <Phone className="w-3 h-3 fill-current" />
                                        Dial
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowSecondaryPhone(true)}
                                    className="bg-white border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/40 transition-all font-body text-xs font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add alternative phone
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Details grid list */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
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
                                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-blue-600 focus:outline-none transition-colors font-mono text-ellipsis"
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
                                    <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Primary Email</span>
                                    <input
                                      type="email"
                                      value={currentLead?.email || ''}
                                      onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'email', e.target.value)}
                                      onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'email', e.target.value)}
                                      placeholder="Email"
                                      className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                    />
                                  </div>
                                  {showSecondaryEmail || currentLead?.email_2 ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Alternative Email</span>
                                      <input
                                        type="email"
                                        value={currentLead?.email_2 || ''}
                                        onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'email_2', e.target.value)}
                                        onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'email_2', e.target.value)}
                                        placeholder="Alt Email"
                                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowSecondaryEmail(true)}
                                      className="mt-4.5 h-9 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/40 font-body text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add email
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-3.5">
                                <div className="flex flex-col gap-1">
                                  <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Website Quality</span>
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
                                      className="bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2 font-body text-xs text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                      <option value="None">None</option>
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                      {currentLead?.website_quality && !['None', 'Low', 'Medium', 'High'].includes(currentLead.website_quality) && (
                                        <option value={currentLead.website_quality}>{currentLead.website_quality}</option>
                                      )}
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
                                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                      <option value={1}>P1 (High Socials)</option>
                                      <option value={2}>P2 (High Reviews)</option>
                                      <option value={3}>P3 (Standard)</option>
                                      <option value={4}>P4 (Low)</option>
                                      <option value={5}>P5 (Minimal)</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Person</span>
                                    <input
                                      type="text"
                                      value={currentLead?.contact_person || ''}
                                      onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'contact_person', e.target.value)}
                                      onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'contact_person', e.target.value)}
                                      placeholder="Secretary / Owner"
                                      className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Rating Details</span>
                                  <div className="flex items-center gap-2 border border-slate-100 bg-slate-50/50 p-2 rounded-xl text-slate-600 font-semibold text-xs">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span>Google Rating: <strong>{currentLead?.google_rating || 'N/A'}</strong></span>
                                    <span className="text-slate-300">|</span>
                                    <span>Reviews count: <strong>{currentLead?.review_count || 0}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB CONTENT B: OUTREACH PITCH */}
                        {dialerCardTab === 'pitch' && (
                          <div className="flex flex-col gap-4 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Dynamic Pitch & Social Outreach
                              </span>
                            </div>
                            
                            {(() => {
                              const agencyName = currentLead?.agency_name || '';
                              const isNoWeb = !currentLead?.website || currentLead.website === 'Not found' || currentLead.website.toLowerCase() === 'none';
                              const pitch = isNoWeb 
                                ? `Salam ${agencyName}, this is ${callerName} from Web-OS. We noticed you have a great social media presence but don't have a website yet. We build premium, high-speed websites for Algerian travel agencies to get direct bookings. Let me know if we can discuss!`
                                : `Salam ${agencyName}, this is ${callerName} from Web-OS. We checked your website and noticed it could be optimized for mobile and speed. We help travel agencies increase their conversion rates by redesigning outdated portals. Would you like a free speed audit?`;

                              const whatsappPhone = formatWhatsappPhone(dialedNumber || currentLead?.phone);
                              
                              return (
                                <div className="flex flex-col gap-4">
                                  <textarea
                                    readOnly
                                    value={pitch}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-body text-xs text-slate-600 leading-relaxed resize-none h-[110px] outline-none shadow-inner"
                                  />
                                  
                                  {/* Social links row */}
                                  {currentLead && (
                                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                                      <span className="font-body text-[9px] text-slate-400 uppercase font-bold mr-1">Social Accounts:</span>
                                      <SocialProfileBadges lead={currentLead} />
                                      {(!currentLead.facebook && !currentLead.instagram && !currentLead.tiktok && !currentLead.linkedin && !currentLead.social_link) && (
                                        <span className="text-[10px] text-slate-400 italic">No social profiles found</span>
                                      )}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                    <button
                                      disabled={!whatsappPhone}
                                      onClick={() => {
                                        window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(pitch)}`, '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 font-body text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                    >
                                      WhatsApp Msg
                                    </button>

                                    <button
                                      disabled={!whatsappPhone}
                                      onClick={() => {
                                        window.open(`https://wa.me/${whatsappPhone}`, '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-100 font-body text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                    >
                                      WhatsApp Chat
                                    </button>

                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(pitch);
                                        alert('Pitch copied! Opening Instagram DMs...');
                                        window.open(normalizeInstagramDmUrl(currentLead?.instagram), '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white border border-pink-100 font-body text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      IG Direct DM
                                    </button>

                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(pitch);
                                        alert('Pitch copied! Opening Facebook Messenger...');
                                        window.open(normalizeMessengerUrl(currentLead?.facebook), '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 font-body text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      FB Messenger
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* TAB CONTENT C: NOTES & TIMELINE */}
                        {dialerCardTab === 'history' && (
                          <div className="flex flex-col gap-4 animate-fadeIn max-h-[350px] overflow-y-auto pr-1">
                            {/* Scraper notes */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Scraper Metadata & Notes</span>
                              <p className="font-body text-xs text-slate-600 bg-slate-50 border p-3 rounded-xl leading-relaxed italic">
                                {currentLead?.notes || 'No scraped notes found.'}
                              </p>
                            </div>

                            {/* Call history timeline */}
                            <div className="flex flex-col gap-2">
                              <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Call History Timeline</span>
                              {currentCallHistory.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No previous call attempts logged.</p>
                              ) : (
                                <div className="relative border-l border-slate-200 pl-4.5 flex flex-col gap-4.5 py-1">
                                  {currentCallHistory.map((hist) => (
                                    <div key={hist.id} className="relative flex flex-col gap-1">
                                      <div className="absolute -left-6.5 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center" />
                                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                        <span className="font-bold text-slate-800">{hist.caller_name || '-'}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getStatusStyle(hist.call_status)}`}>
                                          {hist.call_status}
                                        </span>
                                        <span className="text-slate-400 font-mono font-semibold">
                                          {new Date(hist.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="font-body text-[11px] text-slate-500 italic mt-0.5">
                                        "{hist.notes || 'No details'}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* OUTCOME LOGGER SECTION */}
                        <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                          <div className="flex items-center gap-2 pb-1">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-display text-[10px] tracking-widest text-slate-800 uppercase font-black">
                              Call Outcome Logger
                            </h3>
                          </div>

                          {/* Quick Outcome buttons */}
                          <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                            <span className="font-body text-[8px] text-slate-400 tracking-widest uppercase font-bold">
                              Quick log status
                            </span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <button
                                onClick={() => handleQuickOutcome('Interested')}
                                className="py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Smile className="w-3.5 h-3.5" />
                                Warm
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('Accepted')}
                                className="py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Accepted
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('Client Configured')}
                                className="py-2 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white border border-cyan-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Configured
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('Not Interested')}
                                className="py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
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
                                className="py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Callback
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('Busy')}
                                className="py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Busy
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('No Answer')}
                                className="py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-100 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                No Answer
                              </button>

                              <button
                                onClick={() => handleQuickOutcome('Wrong Number')}
                                className="py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white border border-slate-200 font-body text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Wrong No
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-1">
                            <span className="font-body text-[8px] text-slate-400 tracking-widest uppercase font-bold">
                              Or type call notes (AI will categorize status & parse meeting date)
                            </span>
                            <textarea
                              value={rawNotesInput}
                              onChange={(e) => setRawNotesInput(e.target.value)}
                              placeholder="Describe call details... e.g. Spoke with director Kamel, he requested a website demo on Friday at 3:00 PM."
                              className="w-full min-h-[90px] bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-2xl p-4 font-body text-xs text-slate-800 placeholder-slate-300 focus:outline-none transition-colors leading-relaxed"
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                              onClick={handleSkipLead}
                              disabled={dialerQueue.length <= 1}
                              className="py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-body text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center disabled:opacity-40"
                            >
                              Skip Target
                            </button>
                            <button
                              onClick={handleDeleteFalseLead}
                              className="py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-body text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Not Related
                            </button>
                            
                            <button
                              disabled={parsingAI || !rawNotesInput.trim()}
                              onClick={handleAIParse}
                              className="py-3 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/10"
                            >
                              {parsingAI ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Analyzing...
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
                                className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3 mt-2"
                              >
                                <div className="flex items-center gap-2 font-display text-[9px] font-bold tracking-widest text-blue-600 uppercase">
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                  AI EXTRACTED SUMMARY
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
                    </div>

                    {/* RIGHT COLUMN: Queue Preview Sidebar */}
                    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 h-[750px]">
                      <div>
                        <h3 className="font-display text-xs tracking-widest text-slate-800 uppercase font-black">
                          Next Up in Queue
                        </h3>
                        <p className="font-body text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                          Click any target to dial or jump queue
                        </p>
                      </div>

                      {/* Local Queue Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={sidebarSearch}
                          onChange={(e) => setSidebarSearch(e.target.value)}
                          placeholder="Search upcoming queue..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl py-2 pl-9 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Scrollable list */}
                      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 select-none">
                        {dialerQueue
                          .map((item, idx) => ({ item, originalIndex: idx }))
                          .filter(({ item }) => {
                            if (!sidebarSearch) return true;
                            return (
                              item.agency_name?.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                              item.area?.toLowerCase().includes(sidebarSearch.toLowerCase())
                            );
                          })
                          .map(({ item, originalIndex }) => {
                            const isActive = originalIndex === currentQueueIndex;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setCurrentQueueIndex(originalIndex)}
                                className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col gap-1 cursor-pointer hover:bg-slate-50/50 ${
                                  isActive
                                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-50/20'
                                    : 'border-slate-100 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 w-full">
                                  <span className={`font-display text-[10px] font-bold tracking-wide uppercase truncate ${
                                    isActive ? 'text-blue-700' : 'text-slate-800'
                                  }`}>
                                    {originalIndex + 1}. {item.agency_name}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${
                                    item.priority === 1
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                      : item.priority === 2
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}>
                                    P{item.priority}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                                  <span>{item.area}</span>
                                  <span className="font-mono">{item.phone}</span>
                                </div>
                              </button>
                            );
                          })}
                        {dialerQueue.length === 0 && (
                          <div className="text-center text-slate-300 py-10 text-xs">
                            Queue is empty
                          </div>
                        )}
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
                              {m.caller_name || '-'}
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

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Physical Address</label>
                          <textarea
                            value={editingLead.address || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, address: e.target.value })}
                            placeholder="Full physical address..."
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none h-16 resize-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Google Maps Link</label>
                          <input
                            type="text"
                            value={editingLead.maps_link || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, maps_link: e.target.value })}
                            placeholder="Google Maps URL..."
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none text-blue-600 font-semibold"
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

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Website Link</label>
                            <input
                              type="text"
                              value={editingLead.website || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, website: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-semibold text-blue-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Website Quality</label>
                            <select
                              value={editingLead.website_quality || 'None'}
                              onChange={(e) => setEditingLead({ ...editingLead, website_quality: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none cursor-pointer font-semibold text-slate-700"
                            >
                              <option value="None">None</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              {editingLead.website_quality && !['None', 'Low', 'Medium', 'High'].includes(editingLead.website_quality) && (
                                <option value={editingLead.website_quality}>{editingLead.website_quality}</option>
                              )}
                            </select>
                          </div>
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
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">TikTok</label>
                            <input
                              type="text"
                              value={editingLead.tiktok || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, tiktok: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">LinkedIn</label>
                            <input
                              type="text"
                              value={editingLead.linkedin || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, linkedin: e.target.value })}
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Other Social Link</label>
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

                {/* Tab Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4.5 rounded-2xl border border-slate-100/80">
                  <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search lost leads..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-300 rounded-xl py-2 pl-9 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold font-body cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
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
                              {lead.caller_name || '-'}
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

                                  restoreLeadToQueue(lead.id).then((res) => {
                                    if (!res.success && dbConfigured) {
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

                {/* Tab Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4.5 rounded-2xl border border-slate-100/80">
                  <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search followups..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-300 rounded-xl py-2 pl-9 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold font-body cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
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
                              {lead.caller_name || '-'}
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
                                onClick={async () => {
                                  const res = await recallLead(lead.id, callerName);
                                  if (res.success || !dbConfigured) {
                                    const updatedLead = {
                                      ...lead,
                                      call_status: 'Callback',
                                      assigned_to: callerName,
                                    };
                                    setDialerQueue(prev => [updatedLead, ...prev.filter(x => x.id !== lead.id)]);
                                    setCurrentQueueIndex(0);
                                    setActiveTab('dialer');
                                    setLeadsList(prev => prev.filter(x => x.id !== lead.id));
                                    setTotalFollowupsCount(prev => Math.max(0, prev - 1));
                                  } else {
                                    alert('Failed to recall lead: ' + res.error);
                                  }
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

                {/* Tab Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4.5 rounded-2xl border border-slate-100/80">
                  <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search warm leads..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-300 rounded-xl py-2 pl-9 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold font-body cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
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
                              {lead.caller_name || '-'}
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

                {/* Tab Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4.5 rounded-2xl border border-slate-100/80">
                  <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search converted clients..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-300 rounded-xl py-2 pl-9 pr-4 font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold font-body cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
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
                            <SocialProfileBadges lead={lead} compact />
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border text-[10px] self-start">
                                Logged: {lead.caller_name || '-'}
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

                {/* Data Safety / Import Controls */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">Data Safety & Lead Imports</h3>
                      <p className="font-body text-xs text-slate-400 mt-1">Backup first, preview duplicates, then import only clean new leads.</p>
                    </div>
                    <span className={`font-body text-[10px] font-bold px-3 py-1 rounded-full border self-start ${dataSafetySchema?.ready ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {dataSafetySchema?.ready ? 'Batch safety ready' : 'Migration needed for import/undo'}
                    </span>
                  </div>

                  {!dataSafetySchema?.ready && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800 font-body text-xs leading-relaxed">
                      Run <span className="font-mono font-bold">scripts/data_safety_migration.sql</span> in Supabase SQL Editor to enable import batches, undo import, and soft-delete safety columns. Backup download works now.
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <button
                      onClick={handleDownloadBackup}
                      disabled={isDataSafetyBusy}
                      className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 p-4 font-body text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Database className="w-4 h-4" />
                      Download Full Backup
                    </button>

                    <label className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 p-4 font-body text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      Preview CSV Import
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => handleImportFileSelected(e.target.files?.[0])}
                      />
                    </label>

                    <button
                      onClick={handleUndoLastImport}
                      disabled={isDataSafetyBusy}
                      className="rounded-2xl border border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 p-4 font-body text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Undo Last Import
                    </button>
                  </div>

                  {isDataSafetyBusy && (
                    <div className="flex items-center gap-2 text-slate-500 font-body text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing data safety action...
                    </div>
                  )}

                  {importPreview && (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="font-body text-xs text-slate-600">
                          <span className="font-bold text-slate-900">{importFileName || 'CSV import'}</span>
                          <span className="ml-2">Rows: {importPreview.total_rows}</span>
                          <span className="ml-2 text-emerald-700 font-bold">Importable: {importPreview.importable_rows}</span>
                          <span className="ml-2 text-amber-700 font-bold">Skipped: {importPreview.skipped_rows}</span>
                        </div>
                        <button
                          onClick={handleConfirmImport}
                          disabled={isDataSafetyBusy || !importPreview.importable_rows}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-body text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          Confirm Import
                        </button>
                      </div>

                      <div className="max-h-64 overflow-auto">
                        <table className="w-full text-left font-body text-xs">
                          <thead className="bg-white sticky top-0 border-b border-slate-100 text-slate-400">
                            <tr>
                              <th className="p-3 text-[9px] uppercase tracking-wider">Row</th>
                              <th className="p-3 text-[9px] uppercase tracking-wider">Agency</th>
                              <th className="p-3 text-[9px] uppercase tracking-wider">Area</th>
                              <th className="p-3 text-[9px] uppercase tracking-wider">Phone</th>
                              <th className="p-3 text-[9px] uppercase tracking-wider">Decision</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importPreview.rows.slice(0, 50).map((row: any) => (
                              <tr key={row.row_number} className={row.importable ? 'bg-white' : 'bg-amber-50/40'}>
                                <td className="p-3 text-slate-400 font-mono">{row.row_number}</td>
                                <td className="p-3 text-slate-800 font-semibold">{row.agency_name || '-'}</td>
                                <td className="p-3 text-slate-500">{row.area || '-'}</td>
                                <td className="p-3 text-slate-500 font-mono">{row.phone || '-'}</td>
                                <td className="p-3">
                                  {row.importable ? (
                                    <span className="text-emerald-700 font-bold">Import</span>
                                  ) : (
                                    <span className="text-amber-700 font-bold">{row.duplicate_reasons.join(', ')}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

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
                          const forceReassign = data.get('forceReassign') === 'on';
                          if (!caller || isNaN(startId) || isNaN(endId)) return;
                          if (startId > endId) {
                            alert('Start ID must be lower than or equal to End ID.');
                            return;
                          }
                          const confirmMsg = forceReassign
                            ? `CRITICAL: Overwrite and assign all lead IDs #${startId} through #${endId} to ${caller}? Converted leads stay locked.`
                            : `Assign currently unassigned uncalled lead IDs #${startId} through #${endId} to ${caller}? Converted leads stay locked.`;
                          if (!confirm(confirmMsg)) return;

                          setIsAdminActionPending(true);
                          const res = await assignLeadsByRange(caller, startId, endId, forceReassign);
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

                        <div className="flex items-center gap-2 mt-1 select-none">
                          <input
                            type="checkbox"
                            name="forceReassign"
                            id="range-force-reassign"
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <label htmlFor="range-force-reassign" className="text-[10px] text-slate-500 font-semibold cursor-pointer">
                            Force overwrite existing allocations
                          </label>
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

                      {/* RESET CAMPAIGN TO ZERO */}
                      <button
                        onClick={async () => {
                          const pin = prompt("Enter Admin PIN to confirm complete campaign reset (wipe call logs, status, owner assignment, call history. Scraper metadata will be preserved):");
                          if (!pin) return;
                          if (pin !== '676869') {
                            alert("Incorrect PIN. Action aborted.");
                            return;
                          }
                          if (!confirm("CRITICAL WARNING: Are you absolutely sure you want to RESET THE ENTIRE CAMPAIGN? This will wipe all call statuses, caller assignments, and history for all 3,500 leads, setting them back to 'Not Called'. This action is irreversible.")) return;

                          setIsAdminActionPending(true);
                          const res = await resetCampaign();
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert("Success! The campaign has been reset to zero.");
                            fetchAllData(true);
                          } else {
                            alert(`Error resetting campaign: ${res.error}`);
                          }
                        }}
                        disabled={isAdminActionPending}
                        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-sm shadow-red-500/10"
                      >
                        <AlertCircle className="w-4 h-4" />
                        RESET CAMPAIGN TO ZERO
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
