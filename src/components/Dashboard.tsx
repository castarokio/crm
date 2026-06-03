'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
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
  X,
} from 'lucide-react';
import {
  getLeads,
  getDialerQueue,
  updateLeadDetails,
  getAnalytics,
  getTargetInventoryCounts,
  updateCallStatusWithAI,
  getTeamLeaderboard,
  getMeetingsList,
  getLeadAreas,
  updateCallStatus,
  assignLeadsByRegion,
  assignLeadsByPriority,
  clearAssignments,
  splitLeadsEqually,
  getCallHistory,
  getAssignmentStats,
  assignLeadsByRange,
  deleteLeadPermanently,
  generatePitchWithAI,
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
  getTeamApplications,
  handleApplicationDecision,
  deleteCallerProfile,
  getCallerProfiles,
  updateProfilePinAction,
  // Phase 2
  extractCsvHeaders,
  previewLeadImportWithMapping,
  getDeals,
  createDeal,
  updateDealStage,
  updateDeal,
  deleteDeal,
  getCallerTarget,
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

function useFocusTrap(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!ref.current) return;

        const focusableElements = ref.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    const focusTimer = setTimeout(() => {
      if (ref.current) {
        if (!ref.current.contains(document.activeElement)) {
          const focusableElements = ref.current.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          }
        }
      }
    }, 50);

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return ref;
}

interface DashboardProps {
  callerName: string;
  callerRole?: string;
  onLogoutCaller: () => void;
}

export default function Dashboard({ callerName, callerRole, onLogoutCaller }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dialer' | 'deadlines' | 'database' | 'lost' | 'admin' | 'followups' | 'warm_leads' | 'good_clients' | 'treated' | 'pipeline'>('dialer');
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [dbConfigured, setDbConfigured] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assignmentStats, setAssignmentStats] = useState<{ stats: any[]; unassigned: number }>({ stats: [], unassigned: 0 });
  const [isAdminActionPending, setIsAdminActionPending] = useState<boolean>(false);

  // Phase 2: Dialer Daily Target
  const [dailyCallTarget, setDailyCallTarget] = useState<number>(80);
  const [callsToday, setCallsToday] = useState<number>(0);

  // Phase 2: Deal Pipeline State
  const [deals, setDeals] = useState<any[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState<boolean>(false);
  const [dealModalOpen, setDealModalOpen] = useState<boolean>(false);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null);
  const [linkableLeads, setLinkableLeads] = useState<any[]>([]);
  const [isLinkableLeadsLoading, setIsLinkableLeadsLoading] = useState<boolean>(false);
  const [lostReasonModalDealId, setLostReasonModalDealId] = useState<number | null>(null);
  const [dealForm, setDealForm] = useState<{
    deal_name: string;
    company_name: string;
    setup_value: number;
    recurring_value: number;
    expected_close_date: string;
    notes: string;
    lead_id?: number;
  }>({
    deal_name: '',
    company_name: '',
    setup_value: 0,
    recurring_value: 0,
    expected_close_date: '',
    notes: '',
  });

  // Phase 2: CSV Column Mapper State
  const [csvMapperOpen, setCsvMapperOpen] = useState<boolean>(false);
  const [csvRawHeaders, setCsvRawHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvFileText, setCsvFileText] = useState<string>('');

  // Dialer Session State
  const [dialerQueue, setDialerQueue] = useState<any[]>([]);
  const [freshTargetCount, setFreshTargetCount] = useState<number>(0);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  // Post-Call Notes Parser State
  const [rawNotesInput, setRawNotesInput] = useState<string>('');
  const [parsingAI, setParsingAI] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  
  // Deadlines & Meetings
  const [meetingsList, setMeetingsList] = useState<any[]>([]);

  // Team Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Dynamic Caller Profiles for admin management
  const [callerProfiles, setCallerProfiles] = useState<any[]>([]);
  const [pinChangeInputs, setPinChangeInputs] = useState<Record<string, string>>({});

  // Database Tab State
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [isLeadsListLoading, setIsLeadsListLoading] = useState<boolean>(false);
  const [inventoryCountsReady, setInventoryCountsReady] = useState<boolean>(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const [totalLostCount, setTotalLostCount] = useState<number>(0);
  const [totalTreatedCount, setTotalTreatedCount] = useState<number>(0);
  const [totalFollowupsCount, setTotalFollowupsCount] = useState<number>(0);
  const [totalWarmCount, setTotalWarmCount] = useState<number>(0);
  const [totalGoodClientsCount, setTotalGoodClientsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('');
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

  // Edit details overlay drawer
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  // Copy Feedback
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [skippedLeadNotice, setSkippedLeadNotice] = useState<string>('');

  // Toast Notification States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time Throttling & Status States
  const [realtimeStatus, setRealtimeStatus] = useState<string>('CONNECTING');
  const updatesBufferRef = useRef<any[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Field Save Statuses for auto-blur inputs (Weakness 14)
  const [fieldSaveStatuses, setFieldSaveStatuses] = useState<Record<string, 'saving' | 'saved' | 'failed'>>({});

  // AI Clicks Ref Locks (Weakness 15)
  const isParsingAIRef = useRef<boolean>(false);
  const isGeneratingPitchRef = useRef<boolean>(false);

  // Clear field save statuses on lead changes
  useEffect(() => {
    setFieldSaveStatuses({});
  }, [currentQueueIndex]);

  const renderFieldSaveStatus = (field: string) => {
    const status = fieldSaveStatuses[field];
    if (!status) return null;
    if (status === 'saving') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] text-blue-500 font-body font-semibold animate-pulse">
          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
        </span>
      );
    }
    if (status === 'saved') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] text-green-600 font-body font-semibold">
          <Check className="w-2.5 h-2.5" /> Saved
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] text-rose-500 font-body font-semibold">
          <X className="w-2.5 h-2.5" /> Failed
        </span>
      );
    }
    return null;
  };

  // ValueInputModal States
  const [valueModalOpen, setValueModalOpen] = useState<boolean>(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>('');
  const [valueModalInput, setValueModalInput] = useState<string>('');
  const [valueModalPlaceholder, setValueModalPlaceholder] = useState<string>('');
  const [valueModalCallback, setValueModalCallback] = useState<((val: string) => Promise<void> | void) | null>(null);

  // Custom Scheduler Date/Time Picker States
  const [schedulerOpen, setSchedulerOpen] = useState<boolean>(false);
  const [schedulerTitle, setSchedulerTitle] = useState<string>('Schedule Event');
  const [schedulerDate, setSchedulerDate] = useState<Date>(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [schedulerHour, setSchedulerHour] = useState<string>('09');
  const [schedulerMinute, setSchedulerMinute] = useState<string>('00');
  const [schedulerCallback, setSchedulerCallback] = useState<((val: string) => void) | null>(null);

  // Deadlines View Mode (Calendar vs List)
  const [deadlinesViewMode, setDeadlinesViewMode] = useState<'list' | 'calendar'>('calendar');
  const [deadlinesMonth, setDeadlinesMonth] = useState<Date>(new Date());

  // Offline Synchronization States
  const [pendingEdits, setPendingEdits] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_pending_edits');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Focus Trap Refs
  const editDetailsTrapRef = useFocusTrap(!!editingLead, () => setEditingLead(null));
  const schedulerTrapRef = useFocusTrap(schedulerOpen, () => setSchedulerOpen(false));
  const valueModalTrapRef = useFocusTrap(valueModalOpen, () => setValueModalOpen(false));
  const csvMapperTrapRef = useFocusTrap(csvMapperOpen, () => setCsvMapperOpen(false));
  const dealModalTrapRef = useFocusTrap(dealModalOpen, () => setDealModalOpen(false));

  // Helper to add an edit to offline cache
  const bufferOfflineEdit = (leadId: number, field: string, value: any) => {
    setPendingEdits(prev => {
      const filtered = prev.filter(item => !(item.leadId === leadId && item.field === field));
      const next = [...filtered, { leadId, field, value, timestamp: Date.now() }];
      localStorage.setItem('crm_pending_edits', JSON.stringify(next));
      return next;
    });
  };

  // Offline listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Sync edits when back online
  useEffect(() => {
    const syncOfflineEdits = async () => {
      if (!isOnline || pendingEdits.length === 0 || isSyncing) return;
      setIsSyncing(true);

      const editsToSync = [...pendingEdits];
      let successCount = 0;
      const syncedIds = new Set<string>();

      for (const edit of editsToSync) {
        try {
          const res = await updateLeadDetails(edit.leadId, { [edit.field]: edit.value });
          if (res.success) {
            successCount++;
            syncedIds.add(`${edit.leadId}:${edit.field}:${edit.timestamp}`);
          } else {
            console.error('[Sync] Failed to upload offline edit:', edit, res.error);
          }
        } catch (err) {
          console.error('[Sync] Error processing edit:', edit, err);
        }
      }

      setPendingEdits(prev => {
        // Keep only edits that were NOT successfully synced (identified by leadId:field:timestamp key).
        // This correctly handles cases where early edits fail and later ones succeed.
        const remaining = prev.filter(e => !syncedIds.has(`${e.leadId}:${e.field}:${e.timestamp}`));
        if (remaining.length === 0) {
          localStorage.removeItem('crm_pending_edits');
        } else {
          try { localStorage.setItem('crm_pending_edits', JSON.stringify(remaining)); } catch { /* quota */ }
        }
        return remaining;
      });

      setIsSyncing(false);

      if (successCount > 0) {
        alert(`Connection restored! ${successCount} offline edits synced successfully.`);
        refreshDashboardMetrics().catch(e => console.error(e));
      }
    };

    syncOfflineEdits();
  }, [isOnline, pendingEdits, isSyncing]);

  // Apply batch updates from buffer to prevent browser re-render locks
  const applyBatchUpdates = useCallback(() => {
    if (updatesBufferRef.current.length === 0) return;
    const updates = [...updatesBufferRef.current];
    updatesBufferRef.current = [];

    // Process all updates in the batch for dialer queue
    setDialerQueue(prev => {
      let next = [...prev];
      for (const payload of updates) {
        const { eventType, new: newLead, old: oldLead } = payload;
        if (eventType === 'UPDATE' && newLead) {
          const shouldBeInQueue = newLead.call_status !== 'Treated' && 
            (newLead.assigned_to === callerName || !newLead.assigned_to);
          const exists = next.some(item => item.id === newLead.id);
          if (exists) {
            if (!shouldBeInQueue) {
              next = next.filter(item => item.id !== newLead.id);
            } else {
              next = next.map(item => item.id === newLead.id ? { ...item, ...newLead } : item);
            }
          }
        } else if (eventType === 'DELETE' && oldLead) {
          next = next.filter(item => item.id !== oldLead.id);
        }
      }
      return next;
    });

    // Process leads list
    setLeadsList(prev => {
      let next = [...prev];
      for (const payload of updates) {
        const { eventType, new: newLead, old: oldLead } = payload;
        if (eventType === 'UPDATE' && newLead) {
          next = next.map(item => item.id === newLead.id ? { ...item, ...newLead } : item);
        } else if (eventType === 'DELETE' && oldLead) {
          next = next.filter(item => item.id !== oldLead.id);
        }
      }
      return next;
    });

    // Process meetings list
    setMeetingsList(prev => {
      let next = [...prev];
      for (const payload of updates) {
        const { eventType, new: newLead, old: oldLead } = payload;
        if (eventType === 'UPDATE' && newLead) {
          const hasMeeting = !!newLead.meeting_date;
          const alreadyIn = next.some(item => item.id === newLead.id);
          if (hasMeeting) {
            if (alreadyIn) {
              next = next.map(item => item.id === newLead.id ? { ...item, ...newLead } : item);
            } else {
              next = [newLead, ...next];
            }
          } else {
            next = next.filter(item => item.id !== newLead.id);
          }
        } else if (eventType === 'DELETE' && oldLead) {
          next = next.filter(item => item.id !== oldLead.id);
        }
      }
      return next;
    });
  }, [callerName]);

  // Server-Mediated SSE Realtime Stream (replaces direct Supabase client subscription
  // which no longer works after database hardening revoked public anon read access).
  useEffect(() => {
    if (!dbConfigured) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      es = new EventSource('/api/realtime');

      es.onopen = () => setRealtimeStatus('SUBSCRIBED');

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status === 'connected') return; // initial handshake ping
          updatesBufferRef.current.push(payload);
          if (!batchTimeoutRef.current) {
            batchTimeoutRef.current = setTimeout(() => {
              applyBatchUpdates();
              batchTimeoutRef.current = null;
            }, 600);
          }
        } catch { /* ignore malformed SSE frames */ }
      };

      es.onerror = () => {
        setRealtimeStatus('CLOSED');
        es?.close();
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [dbConfigured, applyBatchUpdates]);

  // Helper to parse existing meeting date strings
  const parseInitialDateTime = (val: string) => {
    const defaultDate = new Date();
    let parsedDate = defaultDate;
    let parsedHour = '09';
    let parsedMinute = '00';

    if (!val) {
      return { date: parsedDate, hour: parsedHour, minute: parsedMinute };
    }

    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
    if (match) {
      const [_, y, m, d, hr, min] = match;
      const year = parseInt(y, 10);
      const month = parseInt(m, 10) - 1;
      const day = parseInt(d, 10);
      const dateObj = new Date(year, month, day);
      if (!isNaN(dateObj.getTime())) {
        parsedDate = dateObj;
      }
      if (hr) parsedHour = hr;
      if (min) parsedMinute = min;
    } else {
      const dateObj = new Date(val);
      if (!isNaN(dateObj.getTime())) {
        parsedDate = dateObj;
        parsedHour = String(dateObj.getHours()).padStart(2, '0');
        parsedMinute = String(dateObj.getMinutes()).padStart(2, '0');
      }
    }
    return { date: parsedDate, hour: parsedHour, minute: parsedMinute };
  };

  const openSchedulerForLead = (
    initialVal: string,
    onSave: (val: string) => void,
    title: string = 'Schedule Meeting Date & Time'
  ) => {
    const { date, hour, minute } = parseInitialDateTime(initialVal);
    setSchedulerDate(date);
    setCalendarViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSchedulerHour(hour);
    setSchedulerMinute(minute);
    setSchedulerCallback(() => onSave);
    setSchedulerTitle(title);
    setSchedulerOpen(true);
  };

  // New States for Dialed Number Tracking & Admin Analytics
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [showSecondaryPhone, setShowSecondaryPhone] = useState<boolean>(false);
  const [showSecondaryEmail, setShowSecondaryEmail] = useState<boolean>(false);
  const [dataSafetySchema, setDataSafetySchema] = useState<any | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isDataSafetyBusy, setIsDataSafetyBusy] = useState<boolean>(false);
  const activeTabRef = useRef(activeTab);
  const leadsListRequestRef = useRef(0);
  const skipNextListEffectRef = useRef(false);
  const [teamApplications, setTeamApplications] = useState<any[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState<boolean>(false);
  const lastLoadedTabRef = useRef<string>('');

  // Added States for visual improvements and locking system
  const [dialerCardTab, setDialerCardTab] = useState<'info' | 'pitch' | 'history'>('info');
  const [isSavingChecklist, setIsSavingChecklist] = useState<boolean>(false);
  const [checklistSavedAlert, setChecklistSavedAlert] = useState<boolean>(false);
  // lockedLeadId removed — locking uses lockedLeadIdRef (a ref, not state) to avoid re-renders on lock acquisition.
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [currentCallHistory, setCurrentCallHistory] = useState<any[]>([]);

  // Dynamic French Outreach Pitch States & Effects
  const [customPitchText, setCustomPitchText] = useState<string>('');
  const [customInstructionInput, setCustomInstructionInput] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);

  useEffect(() => {
    const activeLead = dialerQueue[currentQueueIndex];
    if (activeLead) {
      // Check if a draft exists in localStorage first — with quota safety
      let draft: string | null = null;
      try {
        draft = localStorage.getItem(`pitch_draft_${activeLead.id}`);
      } catch {
        // localStorage may be unavailable in private browsing or if quota exceeded
      }
      if (draft) {
        setCustomPitchText(draft);
        setCustomInstructionInput('');
        return;
      }

      const agencyName = activeLead.agency_name || '';
      const isNoWeb = !activeLead.website || activeLead.website === 'Not found' || activeLead.website.toLowerCase() === 'none';
      const defaultPitch = isNoWeb
        ? `Salam ${agencyName}, c'est ${callerName} de Web-OS. Nous avons remarqué que vous aviez une excellente présence sur les réseaux sociaux mais pas encore de site internet. Nous concevons des sites web premium et ultra-rapides pour les agences de voyages algériennes afin de générer des réservations directes. Dites-moi si nous pouvons en discuter !`
        : `Salam ${agencyName}, c'est ${callerName} de Web-OS. Nous avons analysé votre site web et avons constaté qu'il pourrait être optimisé pour le mobile et la vitesse de chargement. Nous aidons les agences de voyages à augmenter leurs ventes en modernisant leur portail. Seriez-vous intéressé par un audit gratuit de votre site ?`;
      setCustomPitchText(defaultPitch);
      setCustomInstructionInput('');
    } else {
      setCustomPitchText('');
      setCustomInstructionInput('');
    }
  }, [dialerQueue, currentQueueIndex, callerName]);

  const lockedLeadIdRef = React.useRef<number | null>(null);
  // Track selected lead by ID so queue reorders/updates don't lose the selection.
  const selectedLeadIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Tab-switching transitions using GSAP
  useEffect(() => {
    if (!initialLoadDone || !workspaceRef.current) return;
    
    gsap.fromTo(workspaceRef.current,
      { opacity: 0.35, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, [activeTab, initialLoadDone]);

  // Leaderboard cards staggered load animation using GSAP
  // Scoped to workspaceRef container to prevent global selector collisions.
  useEffect(() => {
    if (initialLoadDone && workspaceRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.gsap-leaderboard-card',
          { opacity: 0, scale: 0.95, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }
        );
      }, workspaceRef);
      return () => ctx.revert();
    }
  }, [initialLoadDone]);

  // Sync dialedNumber with active lead
  useEffect(() => {
    const activeLead = dialerQueue[currentQueueIndex];
    if (activeLead) {
      setDialedNumber(activeLead.phone || '');
    } else {
      setDialedNumber('');
    }
  }, [dialerQueue, currentQueueIndex]);

  // Concurrency locking lease effect with 2-minute heartbeat interval.
  // Depends only on the active lead ID (not the full dialerQueue array) so that
  // SSE realtime updates to the queue do NOT re-trigger locking and cause snap-back.
  const activeLeadId = dialerQueue[currentQueueIndex]?.id ?? null;

  useEffect(() => {
    if (!dbConfigured || !callerName) return;

    // Find the active lead by ID to get the current snapshot
    const activeLead = activeLeadId != null
      ? dialerQueue.find((l: any) => l.id === activeLeadId) ?? dialerQueue[currentQueueIndex]
      : null;

    if (!activeLead) {
      if (lockedLeadIdRef.current) {
        const toUnlock = lockedLeadIdRef.current;
        lockedLeadIdRef.current = null;
        unlockLead(toUnlock, callerName);
      }
      return;
    }

    // Don't re-lock if we already hold the lock for this lead
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
        // Clear the selected ID so next lead in queue gets focus
        selectedLeadIdRef.current = null;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeadId, callerName, dbConfigured]);

  // Release lock on unmount or tab close.
  // Uses navigator.sendBeacon for reliable fire-and-forget unlocking on tab close.
  // Also listens to visibilitychange/focus to renew locks when the tab regains focus.
  useEffect(() => {
    const sendUnlock = (leadId: number) => {
      try {
        const payload = JSON.stringify({ leadId });
        // sendBeacon survives page unload; fetch does not
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/unlock-lead', new Blob([payload], { type: 'application/json' }));
        }
      } catch { /* ignore */ }
    };

    const handleBeforeUnload = () => {
      if (lockedLeadIdRef.current && callerName && dbConfigured) {
        sendUnlock(lockedLeadIdRef.current);
      }
    };

    // Renew lock when tab regains visibility (handles background tab throttling)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lockedLeadIdRef.current && callerName && dbConfigured) {
        lockLead(lockedLeadIdRef.current, callerName).catch(() => {});
      }
    };

    const handleWindowFocus = () => {
      if (lockedLeadIdRef.current && callerName && dbConfigured) {
        lockLead(lockedLeadIdRef.current, callerName).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      // Also release lock on React unmount (e.g. logout)
      if (lockedLeadIdRef.current && callerName && dbConfigured) {
        sendUnlock(lockedLeadIdRef.current);
        unlockLead(lockedLeadIdRef.current, callerName).catch(() => {});
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

  // NOTE: page and search resets on tab change are handled directly in handleMainTabChange below.

  // Fetch Team Scores
  const fetchLeaderboardData = useCallback(async () => {
    const res = await getTeamLeaderboard();
    if (res.success && res.leaderboard) {
      setLeaderboard(res.leaderboard);
    }
  }, []);

  // Fetch Meetings checklist
  const fetchMeetingsData = useCallback(async () => {
    const res = await getMeetingsList();
    if (res.success && res.meetings) {
      setMeetingsList(res.meetings);
    }
  }, []);

  // Fetch Deals (Phase 2)
  const fetchDeals = useCallback(async () => {
    setIsDealsLoading(true);
    const res = await getDeals();
    if (res.success) {
      setDeals(res.deals || []);
    } else {
      console.error('[fetchDeals] Error:', res.error);
    }
    setIsDealsLoading(false);
  }, []);

  // Fetch Linkable Leads for Deals (Warm / followups) (Phase 2)
  const fetchLinkableLeads = useCallback(async () => {
    setIsLinkableLeadsLoading(true);
    const res = await getLeads({ limit: 200 });
    if (res.success) {
      const linkable = res.leads.filter((l: any) => 
        ['Interested', 'Callback', 'Treated', 'Accepted', 'Client Configured'].includes(l.call_status)
      );
      setLinkableLeads(linkable);
    } else {
      console.error('[fetchLinkableLeads] Error:', res.error);
    }
    setIsLinkableLeadsLoading(false);
  }, []);

  // Fetch Team Join Applications
  const fetchApplications = useCallback(async () => {
    setIsAppsLoading(true);
    const res = await getTeamApplications();
    if (res.success && res.applications) {
      setTeamApplications(res.applications);
    }
    setIsAppsLoading(false);
  }, []);

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

  const applyOutcomeToLocalCounts = useCallback((status: string, direction: 1 | -1 = 1) => {
    setFreshTargetCount(prev => Math.max(0, prev - direction));
    if (['Interested'].includes(status)) {
      setTotalWarmCount(prev => Math.max(0, prev + direction));
    } else if (['Accepted', 'Client Configured'].includes(status)) {
      setTotalGoodClientsCount(prev => Math.max(0, prev + direction));
    } else if (['Callback', 'Busy', 'No Answer'].includes(status)) {
      setTotalFollowupsCount(prev => Math.max(0, prev + direction));
    } else if (['Not Interested', 'Wrong Number'].includes(status)) {
      setTotalLostCount(prev => Math.max(0, prev + direction));
    } else if (status === 'Treated') {
      setTotalTreatedCount(prev => Math.max(0, prev + direction));
    }
  }, []);

  const refreshInventoryCounts = useCallback(async () => {
    const res = await getTargetInventoryCounts();
    if (res.success && res.counts) {
      setTotalLeadsCount(res.counts.total);
      setTotalWarmCount(res.counts.warm);
      setTotalGoodClientsCount(res.counts.converted);
      setTotalFollowupsCount(res.counts.followups);
      setTotalLostCount(res.counts.lost);
      setTotalTreatedCount(res.counts.treated || 0);
      setInventoryCountsReady(true);
    }
  }, []);

  const refreshAreaOptions = useCallback(async () => {
    const res = await getLeadAreas();
    if (res.success && res.areas) {
      setAreaOptions(res.areas);
    }
  }, []);

  const refreshDashboardMetrics = useCallback(async () => {
    refreshInventoryCounts().catch(err => console.error('[refreshInventoryCounts]', err));

    const promises = [
      getTeamLeaderboard(),
      getMeetingsList(),
      getAnalytics(),
      getLeadAreas(),
    ] as any[];

    if (callerName === 'Hamid') {
      promises.push(getAssignmentStats(), checkDataSafetySchema(), getCallerProfiles());
    }

    const results = await Promise.all(promises);
    const leaderboardRes = results[0];
    const meetingsRes = results[1];
    const analyticsRes = results[2];
    const areasRes = results[3];

    if (leaderboardRes.success && leaderboardRes.leaderboard) {
      setLeaderboard(leaderboardRes.leaderboard);
    }
    if (meetingsRes.success && meetingsRes.meetings) {
      setMeetingsList(meetingsRes.meetings);
    }
    if (analyticsRes.success && analyticsRes.stats) {
      const stats = analyticsRes.stats;
      setAnalyticsData(stats);
    }
    if (areasRes?.success && areasRes.areas) {
      setAreaOptions(areasRes.areas);
    }

    if (callerName === 'Hamid') {
      const assignmentRes = results[4];
      const schemaRes = results[5];
      const profilesRes = results[6];
      if (assignmentRes?.success) {
        setAssignmentStats({ stats: assignmentRes.stats || [], unassigned: assignmentRes.unassigned || 0 });
      }
      if (schemaRes?.success) {
        setDataSafetySchema(schemaRes);
      }
      if (profilesRes?.success) {
        setCallerProfiles(profilesRes.profiles || []);
      }
    }
  }, [callerName, refreshInventoryCounts]);

  // Load active Dialer
  const loadDialer = useCallback(async () => {
    const res = await getDialerQueue(callerName);
    if (!res.success) {
      setDbConfigured(false);
      setDialerQueue(MOCK_LEADS);
      setFreshTargetCount(MOCK_LEADS.length);
      setCurrentQueueIndex(0);
      selectedLeadIdRef.current = null;
    } else {
      setDbConfigured(true);
      setDialerQueue(res.queue);
      setFreshTargetCount(res.total ?? res.queue.length);
      // Restore selection: if the previously selected lead is still in the
      // refreshed queue, stay on it. Only reset to 0 on a fresh load.
      const prevId = selectedLeadIdRef.current;
      const restoredIndex = prevId != null
        ? (res.queue as any[]).findIndex((l: any) => l.id === prevId)
        : -1;
      if (restoredIndex >= 0) {
        setCurrentQueueIndex(restoredIndex);
      } else {
        setCurrentQueueIndex(0);
        selectedLeadIdRef.current = (res.queue as any[])[0]?.id ?? null;
      }
    }
  }, [callerName]);

  const setSectionTotal = useCallback((tab: string, total: number) => {
    if (tab === 'database') {
      setTotalLeadsCount(total);
    } else if (tab === 'lost') {
      setTotalLostCount(total);
    } else if (tab === 'treated') {
      setTotalTreatedCount(total);
    } else if (tab === 'followups') {
      setTotalFollowupsCount(total);
    } else if (tab === 'warm_leads') {
      setTotalWarmCount(total);
    } else if (tab === 'good_clients') {
      setTotalGoodClientsCount(total);
    }
  }, []);

  // Fetch leads for directory-like sections with stale-response protection.
  const fetchDatabaseLeads = useCallback((
    tab: string,
    excludeLost: boolean,
    statusOverride?: string,
    overrides?: { page?: number; search?: string; priority?: string; area?: string }
  ) => {
    const statusForQuery = statusOverride !== undefined ? statusOverride : filterStatus;
    const pageForQuery = overrides?.page ?? currentPage;
    const searchForQuery = overrides?.search ?? debouncedSearchQuery;
    const priorityForQuery = overrides?.priority ?? filterPriority;
    const areaForQuery = overrides?.area ?? filterArea;

    const requestId = leadsListRequestRef.current + 1;
    leadsListRequestRef.current = requestId;

    setIsLeadsListLoading(true);
    if (lastLoadedTabRef.current !== tab) {
      setLeadsList([]);
      lastLoadedTabRef.current = tab;
    }

    void (async () => {
      try {
        const res = await getLeads({
          search: searchForQuery,
          status: statusForQuery,
          priority: priorityForQuery,
          area: areaForQuery,
          page: pageForQuery,
          limit: 12,
          excludeLost,
        });

        if (requestId !== leadsListRequestRef.current || tab !== activeTabRef.current) return;

        if (res.success) {
          setLeadsList(res.leads);
          setSectionTotal(tab, res.total);
          setDbConfigured(true);
        } else {
          setLeadsList(tab === 'database' ? MOCK_LEADS : []);
          setSectionTotal(tab, tab === 'database' ? MOCK_LEADS.length : 0);
          setDbConfigured(false);
        }
      } catch (err) {
        if (requestId === leadsListRequestRef.current && tab === activeTabRef.current) {
          console.error('[fetchDatabaseLeads] Error:', err);
          setLeadsList(tab === 'database' ? MOCK_LEADS : []);
          setSectionTotal(tab, tab === 'database' ? MOCK_LEADS.length : 0);
          setDbConfigured(false);
        }
      } finally {
        if (requestId === leadsListRequestRef.current && tab === activeTabRef.current) {
          setIsLeadsListLoading(false);
        }
      }
    })();
  }, [currentPage, debouncedSearchQuery, filterArea, filterPriority, filterStatus, setSectionTotal]);

  const fetchListTab = useCallback((tabId: string, overrides?: { page?: number; search?: string }) => {
    if (tabId === 'database') {
      fetchDatabaseLeads('database', true, undefined, overrides);
    } else if (tabId === 'lost') {
      fetchDatabaseLeads('lost', false, 'Lost', overrides);
    } else if (tabId === 'followups') {
      fetchDatabaseLeads('followups', false, 'Followups', overrides);
    } else if (tabId === 'warm_leads') {
      fetchDatabaseLeads('warm_leads', false, 'WarmLeads', overrides);
    } else if (tabId === 'good_clients') {
      fetchDatabaseLeads('good_clients', false, 'GoodClients', overrides);
    } else if (tabId === 'treated') {
      fetchDatabaseLeads('treated', false, 'Treated', overrides);
    }
  }, [fetchDatabaseLeads]);

  // Initial load all data in parallel on mount
  const fetchAllData = useCallback(async (showBlockingLoader = true) => {
    if (showBlockingLoader) setIsLoading(true);
    try {
      refreshAreaOptions().catch(err => console.error('[refreshAreaOptions]', err));
      const [queueRes, targetRes, dealsRes] = await Promise.all([
        getDialerQueue(callerName),
        getCallerTarget(callerName),
        getDeals()
      ]);
      if (queueRes.success) {
        setDbConfigured(true);
        setDialerQueue(queueRes.queue);
        setFreshTargetCount(queueRes.total ?? queueRes.queue.length);
      } else {
        setDbConfigured(false);
        setDialerQueue(MOCK_LEADS);
        setFreshTargetCount(MOCK_LEADS.length);
      }
      if (targetRes.success) {
        setDailyCallTarget(targetRes.daily_call_target);
        setCallsToday(targetRes.calls_today);
      }
      if (dealsRes.success) {
        setDeals(dealsRes.deals || []);
      }
      // On initial mount always start at index 0
      setCurrentQueueIndex(0);
      selectedLeadIdRef.current = (queueRes.success ? (queueRes.queue as any[]) : MOCK_LEADS)[0]?.id ?? null;
      refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
    } catch (err) {
      console.error("[fetchAllData] Error:", err)
    } finally {
      setIsLoading(false);
      setInitialLoadDone(true);
    }
  }, [callerName, refreshAreaOptions, refreshDashboardMetrics]);

  // Run initial fetch
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Only reset page if not already on page 1 to avoid same-value re-renders on every keystroke
      if (currentPage !== 1) setCurrentPage(1);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Trigger directory search on params change (background transition)
  useEffect(() => {
    if (!initialLoadDone) return;
    if (['database', 'lost', 'followups', 'warm_leads', 'good_clients', 'treated'].includes(activeTab)) {
      if (skipNextListEffectRef.current) {
        skipNextListEffectRef.current = false;
        return;
      }
      fetchListTab(activeTab);
    }
  }, [currentPage, debouncedSearchQuery, filterPriority, filterArea, filterStatus, fetchListTab, activeTab, initialLoadDone]);

  // Handle Tab Switch (silent refreshes, instant transitions)
  // Split into separate effects to prevent dependencies from other tabs/filters
  // from triggering dialer queue re-fetches and causing index snapback.
  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'dialer') {
      loadDialer();
    }
  }, [activeTab, initialLoadDone, loadDialer]);

  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'deadlines') {
      fetchMeetingsData();
    }
  }, [activeTab, initialLoadDone, fetchMeetingsData]);

  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'admin') {
      fetchAssignmentStats();
      fetchApplications();
    }
  }, [activeTab, initialLoadDone, fetchAssignmentStats, fetchApplications]);

  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'pipeline') {
      fetchDeals();
      fetchLinkableLeads();
    }
  }, [activeTab, initialLoadDone, fetchDeals, fetchLinkableLeads]);

  useEffect(() => {
    if (!initialLoadDone) return;
    if (activeTab === 'database') {
      if (['Lost', 'Followups', 'WarmLeads', 'GoodClients', 'Treated'].includes(filterStatus)) {
        setFilterStatus('');
      }
    }
  }, [activeTab, initialLoadDone, filterStatus]);

  const currentLead = dialerQueue[currentQueueIndex];
  const activeCallers = leaderboard.length > 0 ? leaderboard.map(x => x.name) : ['Hamid', 'Oussama', 'Kamel'];
  const displayCount = (count: number) => inventoryCountsReady ? count : '...';

  const handleMainTabChange = (tabId: typeof activeTab) => {
    activeTabRef.current = tabId;
    setActiveTab(tabId);
    if (['database', 'lost', 'followups', 'warm_leads', 'good_clients', 'treated'].includes(tabId)) {
      skipNextListEffectRef.current = true;
      setCurrentPage(1);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      fetchListTab(tabId, { page: 1, search: '' });
    } else if (tabId === 'pipeline') {
      fetchDeals();
      fetchLinkableLeads();
    }
  };

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
    const trackedFields = ['website', 'address', 'maps_link', 'email', 'contact_person', 'social_link'];
    const shouldTrack = trackedFields.includes(field);

    if (shouldTrack) {
      setFieldSaveStatuses(prev => ({ ...prev, [field]: 'saving' }));
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      bufferOfflineEdit(leadId, field, value);
      if (shouldTrack) {
        setFieldSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
        setTimeout(() => {
          setFieldSaveStatuses(prev => {
            if (prev[field] === 'saved') {
              const copy = { ...prev };
              delete copy[field];
              return copy;
            }
            return prev;
          });
        }, 3000);
      }
      return true;
    }

    const res = await updateLeadDetails(leadId, { [field]: value });
    if (!res.success) {
      if (dbConfigured) {
        console.error('Failed to auto-save field:', field, res.error);
        if (res.error?.includes('fetch') || res.error?.includes('Network') || res.error?.includes('Failed to fetch')) {
          bufferOfflineEdit(leadId, field, value);
          if (shouldTrack) {
            setFieldSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
            setTimeout(() => {
              setFieldSaveStatuses(prev => {
                if (prev[field] === 'saved') {
                  const copy = { ...prev };
                  delete copy[field];
                  return copy;
                }
                return prev;
              });
            }, 3000);
          }
          return true;
        }
        if (shouldTrack) {
          setFieldSaveStatuses(prev => ({ ...prev, [field]: 'failed' }));
        }
        alert(`Failed to auto-save field '${field}': ${res.error || 'Unknown error'}`);
      } else {
        if (shouldTrack) {
          setFieldSaveStatuses(prev => ({ ...prev, [field]: 'failed' }));
        }
      }
      return false;
    }

    if (shouldTrack) {
      setFieldSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
      setTimeout(() => {
        setFieldSaveStatuses(prev => {
          if (prev[field] === 'saved') {
            const copy = { ...prev };
            delete copy[field];
            return copy;
          }
          return prev;
        });
      }, 3000);
    }
    return true;
  };

  const splitMultiValue = (value?: string | null) =>
    (value || '')
      .split(/\r?\n|[,;]/)
      .map(item => item.trim())
      .filter(item => item && !['not found', 'none', 'n/a'].includes(item.toLowerCase()));

  const joinMultiValue = (items: string[]) =>
    items.map(item => item.trim()).filter(Boolean).join('\n');

  const updateMultiValueField = (leadId: number, field: string, index: number, value: string) => {
    const lead = dialerQueue.find(item => item.id === leadId) || leadsList.find(item => item.id === leadId) || editingLead;
    const values = splitMultiValue(lead?.[field]);
    values[index] = value;
    updateLeadFieldInQueue(leadId, field, joinMultiValue(values));
  };

  const saveMultiValueField = async (leadId: number, field: string) => {
    const lead = dialerQueue.find(item => item.id === leadId) || leadsList.find(item => item.id === leadId) || editingLead;
    await saveLeadFieldToServer(leadId, field, joinMultiValue(splitMultiValue(lead?.[field])));
  };

  const addMultiValueField = async (leadId: number, field: string, placeholder = '') => {
    const lead = dialerQueue.find(item => item.id === leadId) || leadsList.find(item => item.id === leadId) || editingLead;
    const values = splitMultiValue(lead?.[field]);
    values.push(placeholder);
    updateLeadFieldInQueue(leadId, field, values.join('\n'));
  };

  const promptAddMultiValue = (lead: any, field: string, label: string) => {
    setValueModalTitle(`Add ${label}`);
    setValueModalPlaceholder(`Enter ${label.toLowerCase()}...`);
    setValueModalInput('');
    setValueModalCallback(() => async (val: string) => {
      if (!val.trim()) return;
      const currentLead = dialerQueue.find(item => item.id === lead.id) || leadsList.find(item => item.id === lead.id) || editingLead || lead;
      const originalValue = currentLead?.[field] ?? '';
      const values = [...splitMultiValue(originalValue), val.trim()];
      const nextValue = joinMultiValue(values);
      updateLeadFieldInQueue(lead.id, field, nextValue);
      const success = await saveLeadFieldToServer(lead.id, field, nextValue);
      if (!success) {
        updateLeadFieldInQueue(lead.id, field, originalValue);
      }
    });
    setValueModalOpen(true);
  };

  const handleValueModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valueModalCallback) {
      await valueModalCallback(valueModalInput);
    }
    setValueModalOpen(false);
    setValueModalInput('');
  };

  const removeMultiValueField = async (leadId: number, field: string, index: number) => {
    const lead = dialerQueue.find(item => item.id === leadId) || leadsList.find(item => item.id === leadId) || editingLead;
    const originalValue = lead?.[field] ?? '';
    const values = splitMultiValue(originalValue).filter((_, itemIndex) => itemIndex !== index);
    const nextValue = joinMultiValue(values);
    updateLeadFieldInQueue(leadId, field, nextValue);
    const success = await saveLeadFieldToServer(leadId, field, nextValue);
    if (!success) {
      updateLeadFieldInQueue(leadId, field, originalValue);
    }
  };

  const setLeadTreated = async (lead: any, checked: boolean, meetingDate?: string) => {
    const nextStatus = checked ? 'Treated' : 'Not Called';
    const nextLead = {
      ...lead,
      call_status: nextStatus,
      caller_name: checked ? callerName : lead.caller_name,
      assigned_to: checked ? callerName : lead.assigned_to,
      meeting_date: meetingDate !== undefined ? meetingDate : lead.meeting_date,
    };
    updateLeadFieldInQueue(lead.id, 'call_status', nextStatus);
    if (meetingDate !== undefined) updateLeadFieldInQueue(lead.id, 'meeting_date', meetingDate);
    setDialerQueue(prev => checked ? prev.filter(item => item.id !== lead.id) : prev);
    setLeadsList(prev => prev.map(item => item.id === lead.id ? nextLead : item));
    setMeetingsList(prev => {
      const withoutLead = prev.filter(item => item.id !== lead.id);
      return nextLead.meeting_date ? [nextLead, ...withoutLead] : withoutLead;
    });
    applyOutcomeToLocalCounts(nextStatus, checked ? 1 : -1);

    const res = await updateLeadDetails(lead.id, {
      call_status: nextStatus,
      caller_name: checked ? callerName : lead.caller_name,
      assigned_to: checked ? callerName : lead.assigned_to,
      meeting_date: nextLead.meeting_date || '',
    });

    if (!res.success) {
      alert('Failed to mark treated: ' + res.error);
      refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
      if (['database', 'treated'].includes(activeTab)) fetchListTab(activeTab);
    } else {
      setCallsToday(prev => prev + 1);
      refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
    }
  };

  const handleSkipLead = () => {
    if (!currentLead || dialerQueue.length <= 1) return;
    setDialerQueue(prev => {
      const skipped = prev.find(lead => lead.id === currentLead.id);
      if (!skipped) return prev;
      const next = [...prev.filter(lead => lead.id !== currentLead.id), skipped];
      // Sync the ref to the new front-of-queue lead
      selectedLeadIdRef.current = next[0]?.id ?? null;
      return next;
    });
    setCurrentQueueIndex(0);
  };

  const handleDeleteFalseLead = async () => {
    if (!currentLead) return;
    const label = currentLead.agency_name || `Lead #${currentLead.id}`;
    if (!confirm(`Permanently remove "${label}" from the database because it is not a travel agency? This cannot be undone.`)) return;

    const prevQueue = [...dialerQueue];
    const prevLeadsList = [...leadsList];
    const prevMeetingsList = [...meetingsList];
    const prevIndex = currentQueueIndex;
    const prevTotalLeads = totalLeadsCount;

    setDialerQueue(prev => prev.filter(lead => lead.id !== currentLead.id));
    setLeadsList(prev => prev.filter(lead => lead.id !== currentLead.id));
    setMeetingsList(prev => prev.filter(lead => lead.id !== currentLead.id));
    setFreshTargetCount(prev => Math.max(0, prev - 1));
    setTotalLeadsCount(prev => Math.max(0, prev - 1));
    setCurrentQueueIndex(index => Math.max(0, Math.min(index, dialerQueue.length - 2)));

    const res = await deleteLeadPermanently(callerName, currentLead.id);
    if (!res.success) {
      setDialerQueue(prevQueue);
      setLeadsList(prevLeadsList);
      setMeetingsList(prevMeetingsList);
      setFreshTargetCount(prev => prev + 1);
      setCurrentQueueIndex(prevIndex);
      setTotalLeadsCount(prevTotalLeads);
      alert('Failed to remove lead: ' + res.error);
    } else {
      fetchAssignmentStats();
    }
  };

  const handleDeleteLeadFromDrawer = async () => {
    if (!editingLead) return;
    const label = editingLead.agency_name || `Lead #${editingLead.id}`;
    if (!confirm(`Permanently remove "${label}" from the database because it is not a travel agency? This cannot be undone.`)) return;

    const prevQueue = [...dialerQueue];
    const prevLeadsList = [...leadsList];
    const prevMeetingsList = [...meetingsList];
    const prevTotalLeads = totalLeadsCount;

    setDialerQueue(prev => prev.filter(lead => lead.id !== editingLead.id));
    setLeadsList(prev => prev.filter(lead => lead.id !== editingLead.id));
    setMeetingsList(prev => prev.filter(lead => lead.id !== editingLead.id));
    setFreshTargetCount(prev => Math.max(0, prev - 1));
    setTotalLeadsCount(prev => Math.max(0, prev - 1));
    setEditingLead(null);

    const res = await deleteLeadPermanently(callerName, editingLead.id);
    if (!res.success) {
      setDialerQueue(prevQueue);
      setLeadsList(prevLeadsList);
      setMeetingsList(prevMeetingsList);
      setFreshTargetCount(prev => prev + 1);
      setTotalLeadsCount(prevTotalLeads);
      setEditingLead(editingLead);
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
    setImportFileName(file.name);
    setImportPreview(null);
    setIsDataSafetyBusy(true);
    
    try {
      const text = await file.text();
      setCsvFileText(text);
      
      const res = await extractCsvHeaders(text);
      if (res.success && res.headers && res.headers.length > 0) {
        setCsvRawHeaders(res.headers);
        
        // Initialize mapping guesses
        const mappings: Record<string, string> = {};
        res.headers.forEach(h => {
          const l = h.toLowerCase().trim();
          if (l.includes('name') || l.includes('agency') || l.includes('entreprise') || l.includes('business') || l.includes('nom')) {
            mappings[h] = 'agency_name';
          } else if (l.includes('phone 2') || l.includes('téléphone 2') || l.includes('phone2') || l.includes('mobile 2')) {
            mappings[h] = 'phone_2';
          } else if (l.includes('phone') || l.includes('téléphone') || l.includes('mobile') || l.includes('tel') || l.includes('gsm')) {
            mappings[h] = 'phone';
          } else if (l.includes('area') || l.includes('city') || l.includes('wilaya') || l.includes('ville') || l.includes('region')) {
            mappings[h] = 'area';
          } else if (l.includes('website') || l.includes('site') || l.includes('web') || l.includes('url')) {
            mappings[h] = 'website';
          } else if (l.includes('rating') || l.includes('note')) {
            mappings[h] = 'google_rating';
          } else if (l.includes('reviews') || l.includes('avis')) {
            mappings[h] = 'review_count';
          } else if (l.includes('map') || l.includes('maps') || l.includes('gps') || l.includes('link')) {
            mappings[h] = 'maps_link';
          } else if (l.includes('address') || l.includes('adresse') || l.includes('location')) {
            mappings[h] = 'address';
          } else if (l.includes('email') || l.includes('mail') || l.includes('courriel')) {
            mappings[h] = 'email';
          } else if (l.includes('contact') || l.includes('person') || l.includes('manager') || l.includes('contact_person')) {
            mappings[h] = 'contact_person';
          } else if (l.includes('social') || l.includes('instagram') || l.includes('facebook') || l.includes('social_link')) {
            mappings[h] = 'social_link';
          } else if (l.includes('notes') || l.includes('note') || l.includes('remarque') || l.includes('comment')) {
            mappings[h] = 'notes';
          } else if (l.includes('priority') || l.includes('priorité')) {
            mappings[h] = 'priority';
          } else {
            mappings[h] = 'skip';
          }
        });
        
        setColumnMapping(mappings);
        setCsvMapperOpen(true);
      } else {
        alert('Failed to parse CSV headers. Make sure it is a valid CSV file.');
      }
    } catch (err: any) {
      alert('Error reading CSV file: ' + err.message);
    } finally {
      setIsDataSafetyBusy(false);
    }
  };

  const handleCsvMapperConfirm = async () => {
    setCsvMapperOpen(false);
    setIsDataSafetyBusy(true);
    
    const res = await previewLeadImportWithMapping(csvFileText, columnMapping);
    setIsDataSafetyBusy(false);
    if (!res.success || !res.preview) {
      alert('Preview import mapping failed: ' + (res.error || 'Unknown error'));
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
    loadDialer();
    refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
  };

  const handleUndoLastImport = async () => {
    if (!dataSafetySchema?.ready) {
      alert('Run scripts/data_safety_migration.sql in Supabase SQL Editor first, then refresh this admin tab.');
      return;
    }
    if (!confirm('Undo the most recent import batch? This removes only leads from that import batch.')) return;

    setIsDataSafetyBusy(true);
    const res = await undoLastImport(callerName);
    setIsDataSafetyBusy(false);
    if (!res.success) {
      alert('Undo failed: ' + res.error);
      return;
    }

    alert(`Removed ${res.removed} leads from batch ${res.batchId}.`);
    loadDialer();
    refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
  };

  // Phase 2: Deal Pipeline Helpers
  const handleMoveDeal = async (dealId: number, newStage: string) => {
    if (newStage === 'Lost') {
      setLostReasonModalDealId(dealId);
      return;
    }
    
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, lost_reason: null } : d));
    
    const res = await updateDealStage(dealId, newStage, callerName);
    if (!res.success) {
      alert('Failed to update deal stage: ' + res.error);
      fetchDeals();
    }
  };

  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.deal_name.trim()) return;
    
    setIsDealsLoading(true);
    setDealModalOpen(false);
    
    const res = await createDeal({
      deal_name: dealForm.deal_name,
      company_name: dealForm.company_name,
      caller_name: callerName,
      lead_id: dealForm.lead_id,
      setup_value: dealForm.setup_value,
      recurring_value: dealForm.recurring_value,
      expected_close_date: dealForm.expected_close_date,
      notes: dealForm.notes,
    });
    
    if (res.success) {
      fetchDeals();
      setDealForm({ deal_name: '', company_name: '', setup_value: 0, recurring_value: 0, expected_close_date: '', notes: '' });
    } else {
      alert('Failed to create deal: ' + res.error);
    }
    setIsDealsLoading(false);
  };

  const handleUpdateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !dealForm.deal_name.trim()) return;
    
    setIsDealsLoading(true);
    setDealModalOpen(false);
    
    const res = await updateDeal(selectedDeal.id, callerName, {
      deal_name: dealForm.deal_name,
      company_name: dealForm.company_name,
      setup_value: dealForm.setup_value,
      recurring_value: dealForm.recurring_value,
      expected_close_date: dealForm.expected_close_date,
      notes: dealForm.notes,
    });
    
    if (res.success) {
      fetchDeals();
      setSelectedDeal(null);
      setDealForm({ deal_name: '', company_name: '', setup_value: 0, recurring_value: 0, expected_close_date: '', notes: '' });
    } else {
      alert('Failed to update deal: ' + res.error);
    }
    setIsDealsLoading(false);
  };

  const handleDeleteDeal = async (dealId: number) => {
    if (!confirm('Are you sure you want to permanently delete this deal?')) return;
    
    setIsDealsLoading(true);
    const res = await deleteDeal(dealId, callerName);
    if (res.success) {
      fetchDeals();
    } else {
      alert('Failed to delete deal: ' + res.error);
    }
    setIsDealsLoading(false);
  };

  // Auto-create a pipeline deal when status changes to Accepted or Client Configured
  const triggerAutoDealCreation = async (leadId: number, leadName: string, status: string, notes?: string) => {
    if (!['Accepted', 'Client Configured'].includes(status)) return;
    
    // Check if a deal already exists for this lead
    const hasExistingDeal = deals.some((deal: any) => deal.lead_id === leadId);
    if (hasExistingDeal) return;
    
    try {
      const res = await createDeal({
        deal_name: `${leadName} - ${status} Package`,
        company_name: leadName,
        caller_name: callerName,
        lead_id: leadId,
        notes: notes || `Auto-created from Call Outcome: ${status}`
      });
      if (res.success) {
        fetchDeals();
      } else {
        console.error('Failed to auto-create deal:', res.error);
      }
    } catch (err: any) {
      console.error('Failed to auto-create deal:', err.message);
    }
  };

  // Quick Outcome status button handler
  const handleQuickOutcome = async (status: string, meetingDate?: string) => {
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

    // Advance and filter queue instantly
    setDialerQueue(prev => prev.filter(lead => lead.id !== currentLead.id));
    applyOutcomeToLocalCounts(status);
    setCurrentQueueIndex(index => Math.max(0, Math.min(index, dialerQueue.length - 2)));

    // Call server action to update status directly (saving AI API cost)
    const res = await updateCallStatus(
      currentLead.id,
      status,
      `Outcome logged via quick buttons. Dialed: ${dialedNumber || currentLead.phone}`,
      `Outcome logged via quick buttons. Status is ${status}. Dialed: ${dialedNumber || currentLead.phone}`,
      callerName,
      meetingDate
    );

    if (!res.success) {
      // Rollback on failure
      setDialerQueue(prevQueue);
      setCurrentQueueIndex(prevQueueIndex);
      applyOutcomeToLocalCounts(status, -1);
      alert('Failed to log outcome: ' + res.error);
    } else {
      setCallsToday(prev => prev + 1);
      triggerAutoDealCreation(currentLead.id, currentLead.agency_name || '', status, `Created via quick buttons. Outcome: ${status}`);
      refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
    }
  };

  // Handle running raw notes summary through Gemini (Weakness 15: AI Click locks)
  const handleAIParse = async () => {
    if (!currentLead) return;
    if (isParsingAIRef.current) return;
    if (!rawNotesInput.trim()) {
      alert('Please type or dictate call details in the note field first!');
      return;
    }

    isParsingAIRef.current = true;
    setParsingAI(true);
    try {
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
    } finally {
      isParsingAIRef.current = false;
      setParsingAI(false);
    }
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

    // 2. Filter queue instantly
    setDialerQueue(prev => prev.filter(lead => lead.id !== currentLead.id));
    applyOutcomeToLocalCounts(extractedData.call_status);
    setCurrentQueueIndex(index => Math.max(0, Math.min(index, dialerQueue.length - 2)));
    setExtractedData(null);
    setRawNotesInput('');
    setCallsToday(prev => prev + 1);
    triggerAutoDealCreation(currentLead.id, currentLead.agency_name || '', extractedData.call_status, extractedData.summary);
    refreshDashboardMetrics().catch(err => console.error('[refreshDashboardMetrics]', err));
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
      call_status: editingLead.call_status,
      called: editingLead.called,
      message_whatsapp: editingLead.message_whatsapp,
      message_facebook: editingLead.message_facebook,
      message_instagram: editingLead.message_instagram,
      message_tiktok: editingLead.message_tiktok,
      message_email: editingLead.message_email,
    }).then(res => {
      if (!res.success && dbConfigured) {
        // Rollback on failure
        setLeadsList(prevLeadsList);
        setMeetingsList(prevMeetingsList);
        setDialerQueue(prevDialerQueue);
        alert('Failed to save changes to the database: ' + res.error);
      } else if (res.success && editingLead.call_status) {
        triggerAutoDealCreation(editingLead.id, editingLead.agency_name || '', editingLead.call_status, editingLead.notes);
      }
    });
  };

  const writeClipboardText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.warn('Clipboard API failed, using fallback:', error);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (error) {
      console.warn('Clipboard fallback failed:', error);
      return false;
    }
  };

  const copyToClipboard = async (text: string) => {
    await writeClipboardText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const dialPhone = useCallback((phone: string) => {
    if (!phone || phone === 'Not found') return;
    copyToClipboard(phone);

    let isDesktop = true;
    if (typeof window !== 'undefined' && window.navigator?.userAgent) {
      const ua = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      isDesktop = !isMobileDevice;
    }

    if (isDesktop) {
      showToast("Number copied! Dial on your handset.");
    } else {
      showToast("Opening dialer...");
    }

    window.open(`tel:${phone}`, '_self');
  }, [showToast]);

  const normalizeExternalUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    return `https://${raw}`;
  };

  const normalizeInstagramUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) {
      return 'https://instagram.com/direct/inbox/';
    }
    const handle = extractSocialHandle(raw, /(^|\.)instagram\.com$/i);
    if (handle) return `https://instagram.com/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeInstagramProfileUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)instagram\.com$/i);
    if (handle) return `https://instagram.com/${encodeURIComponent(handle)}`;
    return '';
  };

  const extractSocialHandle = (value?: string | null, hostPattern?: RegExp) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
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
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)facebook\.com$/i);
    if (handle) return `https://facebook.com/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeMessengerUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return 'https://m.me/';
    const facebookHandle = extractSocialHandle(raw, /(^|\.)facebook\.com$/i);
    if (facebookHandle) return `https://m.me/${encodeURIComponent(facebookHandle)}`;
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://m.me/${handle}`;
    return normalizeExternalUrl(handle);
  };

  const normalizeTikTokUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    const handle = extractSocialHandle(raw, /(^|\.)tiktok\.com$/i).replace(/^@/, '');
    if (handle) return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(raw.replace(/^@/, ''));
  };

  const normalizeLinkedInUrl = (value?: string | null) => {
    const raw = splitMultiValue(value)[0] || value?.trim();
    if (!raw || ['not found', 'none', 'n/a'].includes(raw.toLowerCase())) return '';
    if (/linkedin\.com/i.test(raw)) return normalizeExternalUrl(raw);
    const handle = raw.replace(/^@/, '');
    if (!handle.includes('/') && !handle.includes('.')) return `https://www.linkedin.com/company/${encodeURIComponent(handle)}`;
    return normalizeExternalUrl(handle);
  };

  const SocialProfileBadges = ({ lead, compact = false }: { lead?: Record<string, any> | null; compact?: boolean }) => {
    const links = [
      ...splitMultiValue(lead?.website).map((value, index) => ({
        key: `website-${index}`,
        label: index ? `Website ${index + 1}` : 'Website',
        href: normalizeExternalUrl(value),
        icon: <Globe className="w-3.5 h-3.5" />,
        className: 'hover:bg-slate-900 hover:text-white',
      })),
      ...splitMultiValue(lead?.facebook).map((value, index) => ({
        key: `facebook-${index}`,
        label: index ? `Facebook ${index + 1}` : 'Facebook',
        href: normalizeFacebookProfileUrl(value),
        icon: <FacebookIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-blue-600 hover:text-white',
      })),
      ...splitMultiValue(lead?.instagram).map((value, index) => ({
        key: `instagram-${index}`,
        label: index ? `Instagram ${index + 1}` : 'Instagram',
        href: normalizeInstagramProfileUrl(value),
        icon: <InstagramIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-pink-600 hover:text-white',
      })),
      ...splitMultiValue(lead?.tiktok).map((value, index) => ({
        key: `tiktok-${index}`,
        label: index ? `TikTok ${index + 1}` : 'TikTok',
        href: normalizeTikTokUrl(value),
        icon: <TikTokIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-black hover:text-white',
      })),
      ...splitMultiValue(lead?.linkedin).map((value, index) => ({
        key: `linkedin-${index}`,
        label: index ? `LinkedIn ${index + 1}` : 'LinkedIn',
        href: normalizeLinkedInUrl(value),
        icon: <LinkedinIcon className="w-3.5 h-3.5" />,
        className: 'hover:bg-sky-700 hover:text-white',
      })),
      ...splitMultiValue(lead?.social_link).map((value, index) => ({
        key: `social-${index}`,
        label: index ? `Other Link ${index + 1}` : 'Other Link',
        href: normalizeExternalUrl(value),
        icon: <Globe className="w-3.5 h-3.5" />,
        className: 'hover:bg-violet-600 hover:text-white',
      })),
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
      case 'working':
      case 'high':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'beautiful':
        return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'outdated':
      case 'low':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'not working':
      case 'broken':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
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
      case 'Treated':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-400 border border-slate-100';
    }
  };

  const fols = currentLead?.followers_if_visible || currentLead?.facebook_followers || currentLead?.instagram_followers || 'Not visible';

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-8 flex flex-col gap-4 md:gap-6 select-none text-slate-800 bg-slate-50">
      
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
        <div className="w-full bg-rose-50 border border-rose-200 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="font-body text-xs font-bold text-rose-800 tracking-wider">DATABASE CONNECTION FAILED — LOCAL SIMULATION MODE ACTIVE</p>
              <p className="font-body text-[11px] text-rose-600 font-semibold mt-0.5">
                PostgreSQL database connection is currently unavailable. Running in local simulation mode — changes will not be saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-black text-slate-900 tracking-wide uppercase">CALL-OS CRM</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-bold tracking-widest uppercase">ACTIVE</span>
            </div>
            <p className="font-body text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
              Campaign: {activeCallers.join(' • ')}
            </p>
          </div>
        </div>

        {/* Navigation Selector Tabs */}
        <div className="w-full md:w-auto flex bg-slate-100 border border-slate-200/50 p-1 rounded-2xl flex-wrap justify-start gap-1">
          {[
            { id: 'dialer', label: 'Call Queue', count: freshTargetCount || dialerQueue.length },
            { id: 'deadlines', label: 'Meetings', count: meetingsList.length },
            { id: 'pipeline', label: 'Pipeline', count: deals.length },
            { id: 'database', label: 'Directory', count: displayCount(totalLeadsCount) },
            { id: 'followups', label: 'Followups', count: displayCount(totalFollowupsCount) },
            { id: 'warm_leads', label: 'Warm Leads', count: displayCount(totalWarmCount) },
            { id: 'good_clients', label: 'Converted', count: displayCount(totalGoodClientsCount) },
            { id: 'treated', label: 'Treated', count: displayCount(totalTreatedCount) },
            { id: 'lost', label: 'Lost', count: displayCount(totalLostCount) },
            ...(callerName === 'Hamid' ? [{ id: 'admin', label: 'Admin Panel', count: null }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleMainTabChange(tab.id as typeof activeTab)}
              className={`min-h-9 flex-1 sm:flex-none px-2.5 md:px-3 py-2 rounded-xl font-display text-[9px] md:text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
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

        {/* Connection & Sync Status Indicator */}
        <div className="flex items-center gap-2 pr-3 hidden md:flex font-body text-[9px] uppercase tracking-wider font-bold">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Offline ({pendingEdits.length} Unsaved)</span>
            </div>
          ) : isSyncing ? (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Syncing edits...</span>
            </div>
          ) : (realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'CLOSED') ? (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full animate-pulse shadow-sm" title={`Realtime Status: ${realtimeStatus}`}>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Live Sync Lost (Retrying...)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Online synced</span>
            </div>
          )}
        </div>

        {/* Active Caller details */}
        <div className="flex items-center gap-3 md:border-l border-slate-200 md:pl-6">
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
        {activeCallers.map((name) => {
          const stats = leaderboard.find(x => x.name === name) || { total_calls: 0, warm_deals: 0, lost_deals: 0, success_rate: 0.0, gender: 'Male' };
          const isActive = callerName === name;
          const style = stats.gender === 'Female'
            ? 'bg-rose-50 text-rose-600'
            : name === 'Hamid'
            ? 'bg-blue-50 text-blue-600'
            : name === 'Oussama'
            ? 'bg-indigo-50 text-indigo-600'
            : name === 'Kamel'
            ? 'bg-cyan-50 text-cyan-600'
            : 'bg-slate-50 text-slate-600';
          return (
            <div
              key={name}
              className={`gsap-leaderboard-card bg-white border rounded-3xl p-5 shadow-sm flex items-center justify-between transition-all duration-300 relative overflow-hidden ${
                isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-xl">
                  Active
                </div>
              )}
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${style}`}>
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
      <div ref={workspaceRef} className="w-full min-h-[500px]">
        {isLoading && activeTab === 'dialer' ? (
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/80 rounded-3xl p-10">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="font-body text-[11px] text-slate-400 tracking-wider uppercase font-semibold">Loading campaign leads...</p>
          </div>
        ) : (
          <>
                     {/* TAB: DEAL PIPELINE (Phase 2) */}
            {activeTab === 'pipeline' && (
              <motion.div
                key="pipeline-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
                  <div>
                    <h2 className="font-display text-base font-black text-slate-800 uppercase tracking-wide">Deal Pipeline</h2>
                    <p className="font-body text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">
                      {deals.length} deals total &middot; {deals.filter((d: any) => d.stage !== 'Won' && d.stage !== 'Lost').length} active &middot;{' '}
                      <span className="text-emerald-600 font-bold">
                        {deals.filter((d: any) => d.stage === 'Won').reduce((sum: number, d: any) => sum + (d.setup_value || 0) + (d.recurring_value || 0) * 12, 0).toLocaleString()} DZD closings (annualized)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchDeals()}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 cursor-pointer transition-all border border-slate-200/20"
                      title="Rafraîchir"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDealsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDeal(null);
                        setDealForm({ deal_name: '', company_name: '', setup_value: 0, recurring_value: 0, expected_close_date: '', notes: '' });
                        setDealModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-body text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Créer un Deal
                    </button>
                  </div>
                </div>

                {/* Columns Kanban Board Container */}
                <div className="w-full overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-[1200px] h-[650px] items-stretch">
                    {['New', 'Contacted', 'Interested', 'Appointment Booked', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map((stage) => {
                      const stageDeals = deals.filter((d: any) => d.stage === stage);
                      
                      let colHeaderColor = 'text-slate-700';
                      let colBg = 'bg-slate-50/50 border-slate-200/80';
                      if (stage === 'Won') {
                        colHeaderColor = 'text-emerald-700';
                        colBg = 'bg-emerald-50/15 border-emerald-200/40';
                      } else if (stage === 'Lost') {
                        colHeaderColor = 'text-rose-700';
                        colBg = 'bg-rose-50/15 border-rose-200/40';
                      } else if (stage === 'Interested') {
                        colHeaderColor = 'text-indigo-700';
                        colBg = 'bg-indigo-50/15 border-indigo-200/40';
                      }

                      return (
                        <div
                          key={stage}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedDealId !== null) {
                              handleMoveDeal(draggedDealId, stage);
                            }
                          }}
                          className={`w-80 border-2 rounded-3xl p-4 flex flex-col gap-3 shadow-sm select-none ${colBg}`}
                        >
                          {/* Column Title */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className={`font-display text-[11px] font-black uppercase tracking-wider ${colHeaderColor}`}>
                              {stage}
                            </span>
                            <span className="bg-slate-100 text-slate-500 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {stageDeals.length}
                            </span>
                          </div>

                          {/* Cards List */}
                          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                            {stageDeals.map((deal: any) => (
                              <div
                                key={deal.id}
                                draggable
                                onDragStart={() => setDraggedDealId(deal.id)}
                                onDragEnd={() => setDraggedDealId(null)}
                                className={`bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all duration-300 transform active:scale-95 cursor-grab flex flex-col gap-2 relative group`}
                              >
                                {/* Edit / Delete Overlay Trigger */}
                                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 rounded-lg p-0.5 shadow-sm border border-slate-100">
                                  <button
                                    onClick={() => {
                                      setSelectedDeal(deal);
                                      setDealForm({
                                        deal_name: deal.deal_name,
                                        company_name: deal.company_name,
                                        setup_value: deal.setup_value,
                                        recurring_value: deal.recurring_value,
                                        expected_close_date: deal.expected_close_date || '',
                                        notes: deal.notes || '',
                                        lead_id: deal.lead_id || undefined,
                                      });
                                      setDealModalOpen(true);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="pr-8">
                                  <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wide leading-snug">
                                    {deal.deal_name}
                                  </h4>
                                  {deal.company_name && (
                                    <p className="font-body text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider truncate">
                                      {deal.company_name}
                                    </p>
                                  )}
                                </div>

                                {/* Value Badges */}
                                <div className="flex gap-2 mt-1">
                                  {deal.setup_value > 0 && (
                                    <span className="bg-slate-50 border border-slate-100 text-slate-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded-lg">
                                      Setup: {deal.setup_value.toLocaleString()} DZD
                                    </span>
                                  )}
                                  {deal.recurring_value > 0 && (
                                    <span className="bg-blue-50 border border-blue-100 text-blue-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-lg">
                                      MRR: {deal.recurring_value.toLocaleString()} DZD
                                    </span>
                                  )}
                                </div>

                                {deal.expected_close_date && (
                                  <p className="font-body text-[9px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    Close: {deal.expected_close_date}
                                  </p>
                                )}

                                {deal.notes && (
                                  <p className="font-body text-[9px] text-slate-400 line-clamp-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 leading-relaxed">
                                    {deal.notes}
                                  </p>
                                )}

                                {stage === 'Lost' && deal.lost_reason && (
                                  <div className="mt-1 bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider text-center">
                                    Raison: {deal.lost_reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lost Reason Dialog Modal */}
                {lostReasonModalDealId !== null && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                      <div>
                        <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">Pourquoi le Deal est-il Perdu ?</h3>
                        <p className="font-body text-[9px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">Spécifier le motif de perte commerciale</p>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                        {['Budget trop limité', 'Déjà équipé', 'Pas intéressé', 'Trop cher', 'Mauvais timing', 'Choix concurrent', 'Profil inadapté', 'Autre raison'].map(reason => (
                          <button 
                            key={reason} 
                            onClick={async () => {
                              const id = lostReasonModalDealId!;
                              setDeals((prev: any[]) => prev.map((d: any) => d.id === id ? { ...d, stage: 'Lost', lost_reason: reason } : d));
                              setLostReasonModalDealId(null);
                              await updateDealStage(id, 'Lost', callerName, reason);
                            }} 
                            className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer border border-transparent hover:border-rose-100 text-slate-700"
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => setLostReasonModalDealId(null)} 
                        className="w-full mt-2 py-3 rounded-xl border border-slate-200 text-slate-500 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 1: CALL QUEUE */}
            {activeTab === 'dialer' && (
              <motion.div
                key="dialer-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {dialerQueue.length === 0 ? (
                  <div className="col-span-12 w-full bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
                    <Database className="w-16 h-16 text-slate-200" />
                    <div>
                      <h3 className="font-display text-base tracking-widest text-slate-800 uppercase font-black mb-1">Queue Completed</h3>
                      <p className="font-body text-xs text-slate-400 max-w-sm mx-auto">
                        Amazing job {activeCallers.join(', ')}! There are no remaining uncalled targets matching active priorities.
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
                                onClick={() => {
                                  const newIdx = currentQueueIndex - 1;
                                  setCurrentQueueIndex(newIdx);
                                  selectedLeadIdRef.current = dialerQueue[newIdx]?.id ?? null;
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                disabled={currentQueueIndex === dialerQueue.length - 1}
                                onClick={() => {
                                  const newIdx = currentQueueIndex + 1;
                                  setCurrentQueueIndex(newIdx);
                                  selectedLeadIdRef.current = dialerQueue[newIdx]?.id ?? null;
                                }}
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

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentLead?.call_status === 'Treated'}
                              onChange={(e) => currentLead && setLeadTreated(currentLead, e.target.checked, currentLead.meeting_date)}
                              className="h-5 w-5 appearance-none rounded-full border border-indigo-300 bg-white checked:bg-indigo-600 checked:border-indigo-600 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                            />
                            <span className="font-body text-xs font-bold text-indigo-900 tracking-wide uppercase">
                              Mark agency as treated
                            </span>
                          </label>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 md:max-w-xl">
                            <div className="relative flex-1">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                              <input
                                type="text"
                                readOnly
                                value={currentLead?.meeting_date || ''}
                                onClick={() => currentLead && openSchedulerForLead(
                                  currentLead.meeting_date || '',
                                  (val) => {
                                    updateLeadFieldInQueue(currentLead.id, 'meeting_date', val);
                                    saveLeadFieldToServer(currentLead.id, 'meeting_date', val);
                                  },
                                  "Schedule Meeting"
                                )}
                                placeholder="Select date & time..."
                                className="w-full bg-white border border-indigo-100 focus:border-indigo-300 rounded-xl py-2.5 pl-9 pr-3 font-body text-xs text-slate-800 focus:outline-none cursor-pointer"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={!currentLead?.meeting_date}
                              onClick={() => currentLead && setLeadTreated(currentLead, true, currentLead.meeting_date)}
                              className="px-3 py-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 font-body text-[10px] font-bold uppercase tracking-wide"
                            >
                              Save meeting
                            </button>
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
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Phones</span>
                                <button
                                  type="button"
                                  onClick={() => currentLead && promptAddMultiValue(currentLead, 'phone_2', 'phone number')}
                                  className="h-8 px-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 font-body text-[10px] font-bold flex items-center gap-1.5"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add phone
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {/* Primary Phone */}
                                <div className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm transition-all ${dialedNumber === currentLead?.phone ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Primary Phone</span>
                                    <span className="font-display text-sm font-bold text-slate-800 tracking-wide font-mono">
                                      {currentLead?.phone || 'No phone number'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
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
                                        dialPhone(currentLead.phone);
                                      }}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                    >
                                      <Phone className="w-3 h-3 fill-current" />
                                      Dial
                                    </button>
                                    <button
                                      disabled={!formatWhatsappPhone(currentLead?.phone)}
                                      onClick={() => window.open(`https://wa.me/${formatWhatsappPhone(currentLead?.phone)}`, '_blank')}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 text-emerald-700 rounded-lg cursor-pointer disabled:opacity-40"
                                      title="Open WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {splitMultiValue(currentLead?.phone_2).map((phoneValue, phoneIndex) => (
                                  <div key={`phone-${phoneIndex}`} className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm transition-all ${dialedNumber === phoneValue ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                      <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Phone {phoneIndex + 2}</span>
                                      <input
                                        type="text"
                                        value={phoneValue}
                                        onChange={(e) => updateMultiValueField(currentLead.id, 'phone_2', phoneIndex, e.target.value)}
                                        onBlur={() => saveMultiValueField(currentLead.id, 'phone_2')}
                                        placeholder="Add alternative phone"
                                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-lg px-2 py-1 font-body text-xs text-slate-800 focus:outline-none font-mono"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 flex-wrap justify-end">
                                      <button
                                        onClick={() => copyToClipboard(phoneValue)}
                                        className="p-2 hover:bg-slate-50 border border-slate-100 text-slate-500 rounded-lg cursor-pointer disabled:opacity-40"
                                        title="Copy Phone 2"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDialedNumber(phoneValue);
                                          dialPhone(phoneValue);
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-body text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-40"
                                      >
                                        <Phone className="w-3 h-3 fill-current" />
                                        Dial
                                      </button>
                                      <button
                                        disabled={!formatWhatsappPhone(phoneValue)}
                                        onClick={() => window.open(`https://wa.me/${formatWhatsappPhone(phoneValue)}`, '_blank')}
                                        className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 text-emerald-700 rounded-lg cursor-pointer disabled:opacity-40"
                                        title="Open WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeMultiValueField(currentLead.id, 'phone_2', phoneIndex)}
                                        className="p-2 hover:bg-rose-50 border border-rose-100 text-rose-500 rounded-lg cursor-pointer"
                                        title="Remove phone"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {!splitMultiValue(currentLead?.phone_2).length && (
                                  <button
                                    onClick={() => currentLead && promptAddMultiValue(currentLead, 'phone_2', 'phone number')}
                                    className="bg-white border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/40 transition-all font-body text-xs font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add new phone
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Outreach Checklist section */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4">
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Outreach Checklist</span>
                                  <span className="text-[10px] text-slate-500">Track contacted channels for this lead</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!currentLead) return;
                                    setIsSavingChecklist(true);
                                    const res = await updateLeadDetails(currentLead.id, {
                                      called: !!currentLead.called,
                                      message_whatsapp: !!currentLead.message_whatsapp,
                                      message_facebook: !!currentLead.message_facebook,
                                      message_instagram: !!currentLead.message_instagram,
                                      message_tiktok: !!currentLead.message_tiktok,
                                      message_email: !!currentLead.message_email,
                                    });
                                    setIsSavingChecklist(false);
                                    if (res.success) {
                                      setChecklistSavedAlert(true);
                                      setTimeout(() => setChecklistSavedAlert(false), 2000);
                                    } else {
                                      alert("Failed to save checklist: " + res.error);
                                    }
                                  }}
                                  disabled={isSavingChecklist}
                                  className="h-8 px-4 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-body text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                >
                                  {isSavingChecklist ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : checklistSavedAlert ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Database className="w-3.5 h-3.5" />
                                  )}
                                  {checklistSavedAlert ? 'Saved!' : 'Save Outreach'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* Called Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.called}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'called', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">Called</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Voice Call</span>
                                  </div>
                                </label>

                                {/* WhatsApp Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.message_whatsapp}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'message_whatsapp', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">WhatsApp</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Messaged</span>
                                  </div>
                                </label>

                                {/* Facebook Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.message_facebook}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'message_facebook', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">Facebook</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Messaged</span>
                                  </div>
                                </label>

                                {/* Instagram Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.message_instagram}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'message_instagram', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">Instagram</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Messaged</span>
                                  </div>
                                </label>

                                {/* TikTok Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.message_tiktok}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'message_tiktok', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">TikTok</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Messaged</span>
                                  </div>
                                </label>

                                {/* Email Checkbox */}
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100/85 hover:border-slate-200 transition-all cursor-pointer shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!currentLead?.message_email}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'message_email', e.target.checked)}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-body text-xs font-bold text-slate-700">Email</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Messaged</span>
                                  </div>
                                </label>
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

                                <div className="flex flex-col gap-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Emails</span>
                                      {renderFieldSaveStatus('email')}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => currentLead && promptAddMultiValue(currentLead, 'email_2', 'email')}
                                      className="h-7 px-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 font-body text-[9px] font-bold flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add email
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="email"
                                      value={currentLead?.email || ''}
                                      onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'email', e.target.value)}
                                      onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'email', e.target.value)}
                                      placeholder="Primary email"
                                      className="flex-1 min-w-0 bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                    />
                                    {currentLead?.email && (
                                      <a href={`mailto:${currentLead.email}`} className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 inline-flex items-center justify-center" title="Send email">
                                        <Mail className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>

                                  {splitMultiValue(currentLead?.email_2).map((emailValue, emailIndex) => (
                                    <div key={`email-${emailIndex}`} className="flex items-center gap-2">
                                      <input
                                        type="email"
                                        value={emailValue}
                                        onChange={(e) => updateMultiValueField(currentLead.id, 'email_2', emailIndex, e.target.value)}
                                        onBlur={() => saveMultiValueField(currentLead.id, 'email_2')}
                                        placeholder={`Email ${emailIndex + 2}`}
                                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none transition-colors"
                                      />
                                      <a href={`mailto:${emailValue}`} className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 inline-flex items-center justify-center" title="Send email">
                                        <Mail className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        onClick={() => removeMultiValueField(currentLead.id, 'email_2', emailIndex)}
                                        className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 inline-flex items-center justify-center"
                                        title="Remove email"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col gap-3.5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Website links & status</span>
                                      {renderFieldSaveStatus('website')}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => currentLead && promptAddMultiValue(currentLead, 'website', 'website link')}
                                      className="h-7 px-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 font-body text-[9px] font-bold flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add website
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <input
                                      type="text"
                                      value={currentLead?.website || ''}
                                      onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'website', e.target.value)}
                                      onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'website', e.target.value)}
                                      placeholder="Website link, one per line"
                                      className="flex-1 bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-blue-600 focus:outline-none transition-colors font-semibold"
                                      />
                                      {normalizeExternalUrl(currentLead?.website) && (
                                        <a href={normalizeExternalUrl(currentLead?.website)} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center justify-center" title="Open website">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                    <select
                                      value={currentLead?.website_quality || 'None'}
                                      onChange={(e) => {
                                        updateLeadFieldInQueue(currentLead.id, 'website_quality', e.target.value);
                                        saveLeadFieldToServer(currentLead.id, 'website_quality', e.target.value);
                                      }}
                                      className="bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2 font-body text-xs text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                      <option value="None">None</option>
                                      <option value="Working">Working</option>
                                      <option value="Beautiful">Beautiful</option>
                                      <option value="Outdated">Outdated</option>
                                      <option value="Not Working">Not Working</option>
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                      {currentLead?.website_quality && !['None', 'Working', 'Beautiful', 'Outdated', 'Not Working', 'Low', 'Medium', 'High'].includes(currentLead.website_quality) && (
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
                                      onChange={async (e) => {
                                        const val = parseInt(e.target.value, 10);
                                        const oldVal = currentLead?.priority;
                                        updateLeadFieldInQueue(currentLead.id, 'priority', val);
                                        const success = await saveLeadFieldToServer(currentLead.id, 'priority', val);
                                        if (!success && oldVal !== undefined) {
                                          updateLeadFieldInQueue(currentLead.id, 'priority', oldVal);
                                        }
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
                                    <div className="flex items-center justify-between">
                                      <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Contact Person</span>
                                      {renderFieldSaveStatus('contact_person')}
                                    </div>
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

                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-body text-[9px] text-slate-400 tracking-widest uppercase font-bold">Profile links</span>
                                      {renderFieldSaveStatus('social_link')}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => currentLead && promptAddMultiValue(currentLead, 'social_link', 'profile link')}
                                      className="h-7 px-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 font-body text-[9px] font-bold flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add link
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                    <SocialProfileBadges lead={currentLead} compact />
                                    {![
                                      ...splitMultiValue(currentLead?.website),
                                      ...splitMultiValue(currentLead?.facebook),
                                      ...splitMultiValue(currentLead?.instagram),
                                      ...splitMultiValue(currentLead?.tiktok),
                                      ...splitMultiValue(currentLead?.linkedin),
                                      ...splitMultiValue(currentLead?.social_link),
                                    ].length && (
                                      <span className="text-[10px] text-slate-400 italic">No profile links</span>
                                    )}
                                  </div>
                                  <textarea
                                    value={currentLead?.social_link || ''}
                                    onChange={(e) => updateLeadFieldInQueue(currentLead.id, 'social_link', e.target.value)}
                                    onBlur={(e) => saveLeadFieldToServer(currentLead.id, 'social_link', e.target.value)}
                                    placeholder="Extra profile links, one per line"
                                    className="w-full min-h-[64px] bg-slate-50 border border-slate-200/60 focus:border-blue-300 rounded-xl px-3 py-2 font-body text-xs text-slate-800 focus:outline-none resize-y"
                                  />
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
                                Script & Pitch de Prospection (IA & Français)
                              </span>
                            </div>
                            
                            {(() => {
                              const whatsappPhone = formatWhatsappPhone(dialedNumber || currentLead?.phone);
                              
                              return (
                                <div className="flex flex-col gap-4">
                                  {/* Editable Pitch Area */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[8px] text-slate-400 uppercase font-bold">Message à envoyer (Modifiable manuellement)</label>
                                    <textarea
                                      value={customPitchText}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        setCustomPitchText(newVal);
                                        if (currentLead) {
                                          localStorage.setItem(`pitch_draft_${currentLead.id}`, newVal);
                                        }
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-300 focus:bg-white rounded-2xl p-4 font-body text-xs text-slate-700 leading-relaxed h-[110px] outline-none shadow-inner transition-all"
                                      placeholder="Le script s'affichera ici..."
                                    />
                                  </div>

                                  {/* Quick Outreach Templates Selector */}
                                  <div className="flex flex-col gap-1.5 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                                    <span className="font-body text-[8px] text-slate-400 uppercase font-black tracking-widest block">
                                      Quick Templates (Click to apply)
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (currentLead) {
                                            const date = currentLead.meeting_date || "[Date]";
                                            const txt = `Bonjour, je vous confirme notre rendez-vous téléphonique le ${date} avec l'équipe de Call-OS. Cordialement, ${callerName}.`;
                                            setCustomPitchText(txt);
                                            localStorage.setItem(`pitch_draft_${currentLead.id}`, txt);
                                          }
                                        }}
                                        className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-[9px] font-bold font-body transition-colors cursor-pointer text-center truncate"
                                        title="Confirm Meeting (French)"
                                      >
                                        Meeting Confirmation
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (currentLead) {
                                            const site = currentLead.website || 'https://call-os.com';
                                            const contact = currentLead.contact_person || 'Madame, Monsieur';
                                            const txt = `Bonjour ${contact}, suite à notre appel, voici le lien pour configurer vos services : ${site}. À votre entière disposition.`;
                                            setCustomPitchText(txt);
                                            localStorage.setItem(`pitch_draft_${currentLead.id}`, txt);
                                          }
                                        }}
                                        className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-[9px] font-bold font-body transition-colors cursor-pointer text-center truncate"
                                        title="Config Link (French)"
                                      >
                                        Config Link / Pitch
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (currentLead) {
                                            const date = currentLead.meeting_date || "[Date]";
                                            const txt = `Hello, following our discussion, I am locking in our session on ${date}. Best, ${callerName}.`;
                                            setCustomPitchText(txt);
                                            localStorage.setItem(`pitch_draft_${currentLead.id}`, txt);
                                          }
                                        }}
                                        className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-[9px] font-bold font-body transition-colors cursor-pointer text-center truncate"
                                        title="Referral Pitch (English)"
                                      >
                                        English Referral
                                      </button>
                                    </div>
                                  </div>

                                  {/* AI Customization Prompt Bar */}
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                                    <input
                                      type="text"
                                      value={customInstructionInput}
                                      onChange={(e) => setCustomInstructionInput(e.target.value)}
                                      placeholder="Ex: insister sur le mobile, ton amical, mentionner les avis..."
                                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-300 font-body placeholder-slate-300"
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && !isGeneratingPitch && customInstructionInput.trim()) {
                                          if (isGeneratingPitchRef.current) return;
                                          isGeneratingPitchRef.current = true;
                                          e.preventDefault();
                                          setIsGeneratingPitch(true);
                                          try {
                                            const res = await generatePitchWithAI({
                                              agencyName: currentLead?.agency_name || '',
                                              website: currentLead?.website,
                                              websiteQuality: currentLead?.website_quality,
                                              area: currentLead?.area,
                                              callerName: callerName,
                                              customInstruction: customInstructionInput
                                            });
                                            if (res.success && res.pitch) {
                                              setCustomPitchText(res.pitch);
                                              if (currentLead) {
                                                localStorage.setItem(`pitch_draft_${currentLead.id}`, res.pitch);
                                              }
                                            } else {
                                              alert("Erreur de personnalisation: " + (res.error || "inconnue"));
                                            }
                                          } finally {
                                            isGeneratingPitchRef.current = false;
                                            setIsGeneratingPitch(false);
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      disabled={isGeneratingPitch}
                                      onClick={async () => {
                                        if (isGeneratingPitchRef.current) return;
                                        isGeneratingPitchRef.current = true;
                                        setIsGeneratingPitch(true);
                                        try {
                                          const res = await generatePitchWithAI({
                                            agencyName: currentLead?.agency_name || '',
                                            website: currentLead?.website,
                                            websiteQuality: currentLead?.website_quality,
                                            area: currentLead?.area,
                                            callerName: callerName,
                                            customInstruction: customInstructionInput
                                          });
                                          if (res.success && res.pitch) {
                                            setCustomPitchText(res.pitch);
                                            if (currentLead) {
                                              localStorage.setItem(`pitch_draft_${currentLead.id}`, res.pitch);
                                            }
                                          } else {
                                            alert("Erreur de personnalisation: " + (res.error || "inconnue"));
                                          }
                                        } finally {
                                          isGeneratingPitchRef.current = false;
                                          setIsGeneratingPitch(false);
                                        }
                                      }}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                      {isGeneratingPitch ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          IA...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          Ajuster
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  
                                  {/* Social links row */}
                                  {currentLead && (
                                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                                      <span className="font-body text-[9px] text-slate-400 uppercase font-bold mr-1">Réseaux Sociaux:</span>
                                      <SocialProfileBadges lead={currentLead} />
                                      {(!currentLead.facebook && !currentLead.instagram && !currentLead.tiktok && !currentLead.linkedin && !currentLead.social_link) && (
                                        <span className="text-[10px] text-slate-400 italic">Aucun profil trouvé</span>
                                      )}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 font-body">
                                    <button
                                      disabled={!whatsappPhone}
                                      onClick={() => {
                                        window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(customPitchText)}`, '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                    >
                                      WhatsApp Msg
                                    </button>

                                    <button
                                      disabled={!whatsappPhone}
                                      onClick={() => {
                                        window.open(`https://wa.me/${whatsappPhone}`, '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-100 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                                    >
                                      WhatsApp Chat
                                    </button>

                                    <button
                                      onClick={() => {
                                        writeClipboardText(customPitchText);
                                        showToast('Pitch copié dans le presse-papier ! Ouverture de Instagram DMs...');
                                        window.open(normalizeInstagramDmUrl(currentLead?.instagram), '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white border border-pink-100 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      IG Direct DM
                                    </button>

                                    <button
                                      onClick={() => {
                                        writeClipboardText(customPitchText);
                                        showToast('Pitch copié dans le presse-papier ! Ouverture de Facebook Messenger...');
                                        window.open(normalizeMessengerUrl(currentLead?.facebook), '_blank');
                                      }}
                                      className="px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer"
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
                                onClick={() => {
                                  if (currentLead) {
                                    openSchedulerForLead(
                                      currentLead.meeting_date || '',
                                      (val) => handleQuickOutcome('Accepted', val),
                                      "Schedule Meeting (Accepted)"
                                    );
                                  }
                                }}
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
                                  if (currentLead) {
                                    openSchedulerForLead(
                                      currentLead.meeting_date || '',
                                      (val) => handleQuickOutcome('Callback', val),
                                      "Schedule Callback"
                                    );
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
                            const isLockedByOther = item.locked_by && item.locked_by !== callerName;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setCurrentQueueIndex(originalIndex);
                                  selectedLeadIdRef.current = item.id;
                                }}
                                className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col gap-1 cursor-pointer hover:bg-slate-50/50 ${
                                  isActive
                                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-50/20'
                                    : 'border-slate-100 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 w-full">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className={`font-display text-[10px] font-bold tracking-wide uppercase truncate ${
                                      isActive ? 'text-blue-700' : 'text-slate-800'
                                    }`}>
                                      {originalIndex + 1}. {item.agency_name}
                                    </span>
                                    {isLockedByOther && (
                                      <span title={`Locked by ${item.locked_by}`} className="flex-shrink-0">
                                        <Lock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                                      </span>
                                    )}
                                  </div>
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
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
 
                {/* View Mode Toggle Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-2xl gap-3">
                  <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setDeadlinesViewMode('calendar')}
                      className={`px-4 py-1.5 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        deadlinesViewMode === 'calendar'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Calendar View
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlinesViewMode('list')}
                      className={`px-4 py-1.5 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        deadlinesViewMode === 'list'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      List Table
                    </button>
                  </div>
 
                  {deadlinesViewMode === 'calendar' && (
                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        {deadlinesMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setDeadlinesMonth(new Date(deadlinesMonth.getFullYear(), deadlinesMonth.getMonth() - 1, 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shadow-sm"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadlinesMonth(new Date(deadlinesMonth.getFullYear(), deadlinesMonth.getMonth() + 1, 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shadow-sm"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
 
                {deadlinesViewMode === 'calendar' ? (
                  <div className="w-full flex flex-col gap-3 select-none animate-fadeIn">
                    {/* Calendar grid headers */}
                    <div className="grid grid-cols-7 text-center font-display text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                      <div>Su</div>
                    </div>
 
                    {/* Calendar month grid */}
                    <div className="grid grid-cols-7 gap-2 bg-slate-50/20 p-2 border border-slate-100 rounded-3xl min-h-[500px]">
                      {(() => {
                        const days = [];
                        const year = deadlinesMonth.getFullYear();
                        const month = deadlinesMonth.getMonth();
                        const totalDays = new Date(year, month + 1, 0).getDate();
                        let startDay = new Date(year, month, 1).getDay();
                        startDay = startDay === 0 ? 6 : startDay - 1;
 
                        for (let i = 0; i < startDay; i++) {
                          days.push(<div key={`deadlines-empty-${i}`} className="bg-slate-50/5 border border-dashed border-slate-200/40 rounded-2xl min-h-[100px]" />);
                        }
 
                        for (let d = 1; d <= totalDays; d++) {
                          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
                          const dayMeetings = meetingsList.filter(m => m.meeting_date && m.meeting_date.startsWith(dateKey));
 
                          days.push(
                            <div 
                              key={`deadlines-day-${d}`} 
                              className={`bg-white border rounded-2xl p-2.5 min-h-[110px] flex flex-col gap-1.5 transition-all hover:shadow-md ${
                                isToday ? 'border-blue-300 ring-2 ring-blue-50/30' : 'border-slate-200/70'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-mono text-[10px] font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                  {d}
                                </span>
                                {dayMeetings.length > 0 && (
                                  <span className="w-4.5 h-4.5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-mono text-[8px] text-blue-600 font-bold">
                                    {dayMeetings.length}
                                  </span>
                                )}
                              </div>
 
                              <div className="flex-1 overflow-y-auto max-h-[85px] flex flex-col gap-1.5 scrollbar-thin">
                                {dayMeetings.map(m => {
                                  const timeMatch = m.meeting_date.match(/\s+(\d{2}):(\d{2})/);
                                  const timeStr = timeMatch ? timeMatch[0].trim() : 'All day';
                                  const isCallback = m.call_status === 'Callback';
 
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => setEditingLead({ ...m })}
                                      className={`w-full text-left p-1.5 rounded-lg border text-[8px] font-bold tracking-wide uppercase transition-all hover:scale-[1.02] flex flex-col gap-0.5 cursor-pointer ${
                                        isCallback 
                                          ? 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100 hover:border-amber-200' 
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
                                      }`}
                                    >
                                      <span className="font-mono text-[7px] text-slate-400 font-extrabold">{timeStr}</span>
                                      <span className="truncate block font-display leading-tight">{m.agency_name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto animate-fadeIn">
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
                                  type="button"
                                  onClick={() => dialPhone(m.phone)}
                                  className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all cursor-pointer"
                                  title="Call Now"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
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
                )}
              </motion.div>
            )}

            {/* TAB 3: LEADS DIRECTORY */}
            {activeTab === 'database' && (
              <motion.div
                key="database-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                        <option value="Treated">Treated Only</option>
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
                        <option value="4">Priority 4 (Low)</option>
                        <option value="5">Priority 5 (Minimal)</option>
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
                        {areaOptions.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
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
                    
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[980px] border-collapse text-left text-xs font-body">
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
                        <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {leadsList.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900">{lead.agency_name}</span>
                                  {normalizeExternalUrl(lead.maps_link) ? (
                                    <a href={normalizeExternalUrl(lead.maps_link)} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline truncate max-w-[220px] inline-flex items-center gap-1">
                                      {lead.address || 'Open map'}
                                      <MapPin className="w-2.5 h-2.5" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 truncate max-w-[220px]">{lead.address}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-600">{lead.area}</td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  {[lead.phone, ...splitMultiValue(lead.phone_2)].filter(Boolean).slice(0, 3).map((phoneValue: string, phoneIndex: number) => (
                                    <div key={`${lead.id}-phone-${phoneIndex}`} className="flex items-center gap-1.5">
                                      <a href={`tel:${phoneValue}`} className="font-semibold text-slate-700 font-mono hover:text-blue-700">{phoneValue}</a>
                                      <button onClick={() => copyToClipboard(phoneValue)} className="h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 inline-flex items-center justify-center" title="Copy phone">
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <a href={`https://wa.me/${formatWhatsappPhone(phoneValue)}`} target="_blank" rel="noreferrer" className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 inline-flex items-center justify-center" title="Open WhatsApp">
                                        <MessageCircle className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))}
                                  {[lead.email, ...splitMultiValue(lead.email_2)].filter(Boolean).slice(0, 2).map((emailValue: string, emailIndex: number) => (
                                    <a key={`${lead.id}-email-${emailIndex}`} href={`mailto:${emailValue}`} className="text-[10px] text-blue-500 hover:underline truncate max-w-[180px] inline-flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {emailValue}
                                    </a>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4">
                                {lead.website && lead.website !== 'Not found' ? (
                                  <div className="flex flex-col gap-2">
                                    <a href={normalizeExternalUrl(lead.website)} target="_blank" rel="noreferrer" className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase inline-flex items-center gap-1 self-start ${getWebQualityStyles(lead.website_quality)}`}>
                                      {lead.website_quality || 'Website'}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                    <SocialProfileBadges lead={lead} compact />
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[9px] text-slate-300">No Website</span>
                                    <SocialProfileBadges lead={lead} compact />
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <select
                                  value={lead.priority || 3}
                                  onChange={async (e) => {
                                    const val = parseInt(e.target.value, 10);
                                    const oldVal = lead.priority;
                                    // Sync change across all lists optimistically
                                    updateLeadFieldInQueue(lead.id, 'priority', val);
                                    const success = await saveLeadFieldToServer(lead.id, 'priority', val);
                                    if (!success && oldVal !== undefined) {
                                      // Revert on database write failure
                                      updateLeadFieldInQueue(lead.id, 'priority', oldVal);
                                    }
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
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={lead.call_status === 'Treated'}
                                    onChange={(e) => setLeadTreated(lead, e.target.checked, lead.meeting_date)}
                                    className="h-4 w-4 appearance-none rounded-full border border-indigo-300 bg-white checked:bg-indigo-600 checked:border-indigo-600"
                                    title="Mark treated"
                                  />
                                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${getStatusStyle(lead.call_status)}`}>
                                    {lead.call_status}
                                  </span>
                                </div>
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
                                      const needRecall = ![!lead.call_status, lead.call_status === 'Not Called', lead.call_status === 'Recalled'].some(Boolean);
                                      if (needRecall) {
                                        const res = await recallLead(lead.id, callerName);
                                        if (res.success || !dbConfigured) {
                                          const updatedLead = {
                                            ...lead,
                                            call_status: 'Recalled',
                                            assigned_to: callerName,
                                          };
                                          setDialerQueue(prev => [updatedLead, ...prev.filter(q => q.id !== lead.id)]);
                                          selectedLeadIdRef.current = updatedLead.id;
                                          setCurrentQueueIndex(0);
                                          setActiveTab('dialer');
                                        } else {
                                          alert('Failed to send to dialer: ' + res.error);
                                        }
                                      } else {
                                        const foundIndex = dialerQueue.findIndex(q => q.id === lead.id);
                                        if (foundIndex !== -1) {
                                          setCurrentQueueIndex(foundIndex);
                                        } else {
                                          setDialerQueue([lead, ...dialerQueue]);
                                          selectedLeadIdRef.current = lead.id;
                                          setCurrentQueueIndex(0);
                                        }
                                        setActiveTab('dialer');
                                      }
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
                          {isLeadsListLoading && leadsList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400 font-body text-xs">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                                Loading section records...
                              </td>
                            </tr>
                          ) : leadsList.length === 0 && !isLeadsListLoading && (
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
                        {isLeadsListLoading ? 'Loading records...' : `Showing ${leadsList.length} of ${totalLeadsCount} total leads`}
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
                          Page {currentPage} of {inventoryCountsReady ? (Math.ceil(totalLeadsCount / 12) || 1) : '...'}
                        </span>
                        <button
                          disabled={!inventoryCountsReady || currentPage >= Math.ceil(totalLeadsCount / 12)}
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
                    <div ref={editDetailsTrapRef} className="xl:col-span-4 w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
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
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Additional Phones / WhatsApp</label>
                            <textarea
                              value={editingLead.phone_2 || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, phone_2: e.target.value })}
                              placeholder="One number per line"
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-mono min-h-[72px] resize-y"
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
                              readOnly
                              value={editingLead.meeting_date || ''}
                              onClick={() => openSchedulerForLead(
                                editingLead.meeting_date || '',
                                (val) => setEditingLead({ ...editingLead, meeting_date: val }),
                                "Set Meeting Date & Time"
                              )}
                              placeholder="Select date & time..."
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <label className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingLead.call_status === 'Treated'}
                            onChange={(e) => setEditingLead({ ...editingLead, call_status: e.target.checked ? 'Treated' : 'Not Called' })}
                            className="h-5 w-5 appearance-none rounded-full border border-indigo-300 bg-white checked:bg-indigo-600 checked:border-indigo-600"
                          />
                          <span className="font-body text-xs font-bold text-indigo-900 uppercase tracking-wide">
                            Mark as treated
                          </span>
                        </label>

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
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Additional Emails</label>
                            <textarea
                              value={editingLead.email_2 || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, email_2: e.target.value })}
                              placeholder="One email per line"
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none min-h-[72px] resize-y"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Website Links</label>
                            <textarea
                              value={editingLead.website || ''}
                              onChange={(e) => setEditingLead({ ...editingLead, website: e.target.value })}
                              placeholder="One website per line"
                              className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none font-semibold text-blue-600 min-h-[72px] resize-y"
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
                              <option value="Working">Working</option>
                              <option value="Beautiful">Beautiful</option>
                              <option value="Outdated">Outdated</option>
                              <option value="Not Working">Not Working</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              {editingLead.website_quality && !['None', 'Working', 'Beautiful', 'Outdated', 'Not Working', 'Low', 'Medium', 'High'].includes(editingLead.website_quality) && (
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
                          <label className="text-[9px] text-slate-400 tracking-wider uppercase font-bold">Other Social/Profile Links</label>
                          <textarea
                            value={editingLead.social_link || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, social_link: e.target.value })}
                            placeholder="One link per line"
                            className="bg-slate-50 border border-slate-200 focus:border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none min-h-[72px] resize-y"
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

                        <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          <span className="font-body text-[9px] text-slate-400 tracking-wider uppercase font-bold mb-1">Outreach Status</span>
                          <div className="grid grid-cols-2 gap-3.5">
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.called}
                                onChange={(e) => setEditingLead({ ...editingLead, called: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              Called
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.message_whatsapp}
                                onChange={(e) => setEditingLead({ ...editingLead, message_whatsapp: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              WhatsApp
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.message_facebook}
                                onChange={(e) => setEditingLead({ ...editingLead, message_facebook: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                              />
                              Facebook
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.message_instagram}
                                onChange={(e) => setEditingLead({ ...editingLead, message_instagram: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                              />
                              Instagram
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.message_tiktok}
                                onChange={(e) => setEditingLead({ ...editingLead, message_tiktok: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                              />
                              TikTok
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingLead.message_email}
                                onChange={(e) => setEditingLead({ ...editingLead, message_email: e.target.checked })}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              Email
                            </label>
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

                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <button
                            type="submit"
                            disabled={isSavingDetails}
                            className="col-span-2 py-3.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold tracking-wider hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/10"
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
                          
                          <button
                            type="button"
                            onClick={handleDeleteLeadFromDrawer}
                            className="py-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>

              </motion.div>
            )}

            {activeTab === 'treated' && (
              <motion.div
                key="treated-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
                className="w-full bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-display text-sm tracking-widest text-slate-800 uppercase font-black">
                      Treated Agencies
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search treated agency or caller..."
                        className="w-full sm:w-72 bg-slate-50 border border-slate-200 focus:border-indigo-300 rounded-xl py-2.5 pl-9 pr-3 font-body text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <span className="font-body text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-full">
                      {displayCount(totalTreatedCount)} Treated
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-body min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Agency</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Caller</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Contact</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Meeting</th>
                        <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {leadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-900">{lead.agency_name}</span>
                              <span className="text-[10px] text-slate-400">{lead.area || 'No region'}</span>
                              <SocialProfileBadges lead={lead} compact />
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-bold">{lead.caller_name || lead.assigned_to || 'Unassigned'}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {[lead.phone, ...splitMultiValue(lead.phone_2)].filter(Boolean).slice(0, 2).map((phoneValue: string, index: number) => (
                                <a key={index} href={`tel:${phoneValue}`} className="font-mono font-semibold text-blue-700 hover:underline">{phoneValue}</a>
                              ))}
                              {[lead.email, ...splitMultiValue(lead.email_2)].filter(Boolean).slice(0, 1).map((emailValue: string, index: number) => (
                                <a key={index} href={`mailto:${emailValue}`} className="text-[10px] text-blue-500 hover:underline">{emailValue}</a>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              readOnly
                              value={lead.meeting_date || ''}
                              onClick={() => openSchedulerForLead(
                                lead.meeting_date || '',
                                (val) => {
                                  updateLeadFieldInQueue(lead.id, 'meeting_date', val);
                                  saveLeadFieldToServer(lead.id, 'meeting_date', val);
                                },
                                "Set Meeting Date & Time"
                              )}
                              placeholder="No meeting"
                              className="w-full min-w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-300 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingLead({ ...lead })}
                                className="p-2 bg-slate-50 hover:bg-slate-100 border rounded-lg text-slate-600 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setLeadTreated(lead, false, '')}
                                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-body text-[10px] font-bold uppercase"
                              >
                                Return fresh
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {isLeadsListLoading && leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto mb-2" />
                            Loading treated agencies...
                          </td>
                        </tr>
                      ) : leadsList.length === 0 && !isLeadsListLoading && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-300 text-xs">
                            No treated agencies found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB 4: LOST DEALS */}
            {activeTab === 'lost' && (
              <motion.div
                key="lost-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                    {displayCount(totalLostCount)} Refused / Disconnected Leads
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
                    <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                      {isLeadsListLoading && leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-rose-500 mx-auto mb-2" />
                            Loading lost leads...
                          </td>
                        </tr>
                      ) : leadsList.length === 0 && !isLeadsListLoading && (
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
                    {isLeadsListLoading ? 'Loading records...' : `Showing ${leadsList.length} of ${totalLostCount} total records`}
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
                      Page {currentPage} of {inventoryCountsReady ? (Math.ceil(totalLostCount / 12) || 1) : '...'}
                    </span>
                    <button
                      disabled={!inventoryCountsReady || currentPage >= Math.ceil(totalLostCount / 12)}
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
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                    {displayCount(totalFollowupsCount)} Followup Leads
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
                    <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                      call_status: 'Recalled',
                                      assigned_to: callerName,
                                    };
                                    setDialerQueue(prev => [updatedLead, ...prev.filter(x => x.id !== lead.id)]);
                                    selectedLeadIdRef.current = updatedLead.id;
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
                      {isLeadsListLoading && leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                            Loading followups...
                          </td>
                        </tr>
                      ) : leadsList.length === 0 && !isLeadsListLoading && (
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
                    {isLeadsListLoading ? 'Loading records...' : `Showing ${leadsList.length} of ${totalFollowupsCount} total followups`}
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
                      Page {currentPage} of {inventoryCountsReady ? (Math.ceil(totalFollowupsCount / 12) || 1) : '...'}
                    </span>
                    <button
                      disabled={!inventoryCountsReady || currentPage >= Math.ceil(totalFollowupsCount / 12)}
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
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                    {displayCount(totalWarmCount)} Interested Leads
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
                    <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                onClick={async () => {
                                  const res = await recallLead(lead.id, callerName);
                                  if (res.success || !dbConfigured) {
                                    const updatedLead = {
                                      ...lead,
                                      call_status: 'Recalled',
                                      assigned_to: callerName,
                                    };
                                    setDialerQueue(prev => [updatedLead, ...prev.filter(q => q.id !== lead.id)]);
                                    selectedLeadIdRef.current = updatedLead.id;
                                    setCurrentQueueIndex(0);
                                    setActiveTab('dialer');
                                  } else {
                                    alert('Failed to send to dialer: ' + res.error);
                                  }
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
                      {isLeadsListLoading && leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-2" />
                            Loading warm leads...
                          </td>
                        </tr>
                      ) : leadsList.length === 0 && !isLeadsListLoading && (
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
                    {isLeadsListLoading ? 'Loading records...' : `Showing ${leadsList.length} of ${totalWarmCount} total warm leads`}
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
                      Page {currentPage} of {inventoryCountsReady ? (Math.ceil(totalWarmCount / 12) || 1) : '...'}
                    </span>
                    <button
                      disabled={!inventoryCountsReady || currentPage >= Math.ceil(totalWarmCount / 12)}
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
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                    {displayCount(totalGoodClientsCount)} Converted Leads
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
                    <tbody className={`divide-y divide-slate-100 transition-opacity duration-200 ${isLeadsListLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                      {isLeadsListLoading && leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-2" />
                            Loading converted clients...
                          </td>
                        </tr>
                      ) : leadsList.length === 0 && !isLeadsListLoading && (
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
                    {isLeadsListLoading ? 'Loading records...' : `Showing ${leadsList.length} of ${totalGoodClientsCount} total converted clients`}
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
                      Page {currentPage} of {inventoryCountsReady ? (Math.ceil(totalGoodClientsCount / 12) || 1) : '...'}
                    </span>
                    <button
                      disabled={!inventoryCountsReady || currentPage >= Math.ceil(totalGoodClientsCount / 12)}
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
                exit={{ opacity: 0, y: 0, transition: { duration: 0 } }}
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
                  {activeCallers.map((name) => {
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
                {analyticsData && (() => {
                  const total = analyticsData.totalLeads || 0;
                  const called = analyticsData.totalCalled || 0;
                  const today = analyticsData.callsToday || 0;
                  const warm = analyticsData.statuses.interested || 0;
                  const converted = analyticsData.statuses.converted || 0;
                  const callback = analyticsData.statuses.callback || 0;
                  const noAnswer = analyticsData.statuses.noAnswer || 0;
                  const wrongNumber = analyticsData.statuses.wrongNumber || 0;
                  const notInterested = analyticsData.statuses.notInterested || 0;

                  const coverageRate = total > 0 ? ((called / total) * 100).toFixed(1) : '0.0';
                  const positiveOutcomeRate = called > 0 ? (((warm + converted) / called) * 100).toFixed(1) : '0.0';
                  const conversionRate = called > 0 ? ((converted / called) * 100).toFixed(1) : '0.0';
                  const unreachableRate = called > 0 ? (((noAnswer + wrongNumber) / called) * 100).toFixed(1) : '0.0';
                  const refusalRate = called > 0 ? ((notInterested / called) * 100).toFixed(1) : '0.0';

                  return (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                          Campaign Outreach Analytics & Detailed Efficiency
                        </h3>
                      </div>

                      {/* Main counters */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Total Leads</span>
                          <span className="font-display text-lg font-bold text-slate-800 mt-1">{total}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Total Called</span>
                          <span className="font-display text-lg font-bold text-blue-600 mt-1">{called}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Calls Today</span>
                          <span className="font-display text-lg font-bold text-indigo-600 mt-1">{today}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Warm Leads</span>
                          <span className="font-display text-lg font-bold text-emerald-600 mt-1">{warm}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Converted</span>
                          <span className="font-display text-lg font-bold text-indigo-600 mt-1">{converted}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Busy / No Ans</span>
                          <span className="font-display text-lg font-bold text-amber-600 mt-1">{noAnswer}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                          <span className="font-body text-[8px] text-slate-400 uppercase font-bold">Not Interested</span>
                          <span className="font-display text-lg font-bold text-rose-600 mt-1">{notInterested}</span>
                        </div>
                      </div>

                      {/* Detailed Percentages & Progress Indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-slate-100 pt-6">
                        
                        {/* 1. Coverage Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between font-body text-xs font-semibold">
                            <span className="text-slate-500 uppercase tracking-wide">Outreach Coverage</span>
                            <span className="text-slate-800 font-bold">{coverageRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(coverageRate))}%` }} />
                          </div>
                          <p className="font-body text-[9px] text-slate-400 mt-0.5 leading-normal">
                            Ratio of leads contacted out of the total campaign databases.
                          </p>
                        </div>

                        {/* 2. Positive Outcome Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between font-body text-xs font-semibold">
                            <span className="text-slate-500 uppercase tracking-wide">Outreach Success</span>
                            <span className="text-slate-800 font-bold">{positiveOutcomeRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(positiveOutcomeRate))}%` }} />
                          </div>
                          <p className="font-body text-[9px] text-slate-400 mt-0.5 leading-normal">
                            Percentage of calls resulting in Warm Leads or fully Converted clients.
                          </p>
                        </div>

                        {/* 3. Conversion Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between font-body text-xs font-semibold">
                            <span className="text-slate-500 uppercase tracking-wide">Client Conversion</span>
                            <span className="text-slate-800 font-bold">{conversionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(conversionRate))}%` }} />
                          </div>
                          <p className="font-body text-[9px] text-slate-400 mt-0.5 leading-normal">
                            Percentage of called targets successfully closed and configured.
                          </p>
                        </div>

                        {/* 4. Unreachable Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between font-body text-xs font-semibold">
                            <span className="text-slate-500 uppercase tracking-wide">Unreachable / Busy</span>
                            <span className="text-slate-800 font-bold">{unreachableRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(unreachableRate))}%` }} />
                          </div>
                          <p className="font-body text-[9px] text-slate-400 mt-0.5 leading-normal">
                            Ratio of calls encountering busy lines, wrong numbers, or no answer.
                          </p>
                        </div>

                        {/* 5. Refusal Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between font-body text-xs font-semibold">
                            <span className="text-slate-500 uppercase tracking-wide">Refusal Rate</span>
                            <span className="text-slate-800 font-bold">{refusalRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, parseFloat(refusalRate))}%` }} />
                          </div>
                          <p className="font-body text-[9px] text-slate-400 mt-0.5 leading-normal">
                            Percentage of contacted leads declaring no interest in outreach services.
                          </p>
                        </div>

                      </div>

                      {/* Visual Funnel and Distribution Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                        
                        {/* 1. Status Distribution Bar Chart */}
                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="font-display text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                              Call Status Distribution
                            </span>
                            <span className="font-body text-[9px] text-slate-400 mt-0.5 block uppercase tracking-wider">
                              Visual representation of call outcomes
                            </span>
                          </div>
                          
                          <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 flex items-end justify-between h-48 gap-3 pt-8">
                            {[
                              { label: 'Warm', value: warm, color: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-emerald-600' },
                              { label: 'Converted', value: converted, color: 'bg-indigo-600 hover:bg-indigo-700', text: 'text-indigo-600' },
                              { label: 'Callback', value: callback, color: 'bg-blue-500 hover:bg-blue-600', text: 'text-blue-600' },
                              { label: 'No Ans', value: noAnswer, color: 'bg-amber-500 hover:bg-amber-600', text: 'text-amber-600' },
                              { label: 'Busy', value: today, labelText: 'Today', color: 'bg-slate-400 hover:bg-slate-500', text: 'text-slate-500' },
                              { label: 'Rejected', value: notInterested, color: 'bg-rose-500 hover:bg-rose-600', text: 'text-rose-600' },
                            ].map((item, index) => {
                              const maxVal = Math.max(1, warm, converted, callback, noAnswer, today, notInterested);
                              const heightPct = (item.value / maxVal) * 100;
                              return (
                                <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
                                  <div className="relative w-full flex justify-center">
                                    <span className="absolute -top-6 bg-slate-800 text-white font-mono text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none z-10">
                                      {item.value}
                                    </span>
                                  </div>
                                  <div 
                                    className={`w-full rounded-t-lg transition-all duration-500 shadow-sm ${item.color}`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                  <span className={`font-mono text-[9px] font-bold mt-1.5 ${item.text}`}>{item.value}</span>
                                  <span className="font-body text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-1 text-center truncate w-full">
                                    {item.labelText || item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Pipeline Conversion Funnel */}
                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="font-display text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                              Outreach Conversion Funnel
                            </span>
                            <span className="font-body text-[9px] text-slate-400 mt-0.5 block uppercase tracking-wider">
                              Lead progression efficiency layers
                            </span>
                          </div>
                          
                          <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 flex flex-col gap-2.5 justify-center h-48">
                            {[
                              { stage: 'Total Database', count: total, pct: 100, color: 'bg-slate-200 text-slate-700' },
                              { stage: 'Outreach Attempted', count: called, pct: total > 0 ? Math.round((called / total) * 100) : 0, color: 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' },
                              { stage: 'Warm Deals', count: warm, pct: called > 0 ? Math.round((warm / called) * 100) : 0, color: 'bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500' },
                              { stage: 'Converted Clients', count: converted, pct: warm > 0 ? Math.round((converted / warm) * 100) : 0, color: 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500' },
                            ].map((row, rIndex) => (
                              <div key={rIndex} className="flex items-center justify-between text-[10px] font-semibold font-body">
                                <span className="text-slate-500 w-28 uppercase text-[9px] font-bold">{row.stage}</span>
                                <div className="flex-1 mx-3 relative">
                                  <div className="w-full bg-slate-100 h-5 rounded-lg overflow-hidden flex items-center pl-2 border border-slate-200/40">
                                    <div 
                                      className={`h-full rounded-l-lg absolute left-0 top-0 transition-all duration-500 opacity-60 ${row.color}`}
                                      style={{ width: `${row.pct}%` }}
                                    />
                                    <span className="z-10 font-mono text-[9px] font-bold text-slate-700 pl-1">{row.pct}% efficiency</span>
                                  </div>
                                </div>
                                <span className="font-mono text-slate-800 font-bold w-12 text-right">{row.count} leads</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

                {/* Team Member Management Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Users className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Team Member Management
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leaderboard.map((caller) => {
                      const isSelf = caller.name === 'Hamid';
                      return (
                        <div key={caller.name} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              caller.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {caller.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-display text-xs font-bold text-slate-800 uppercase tracking-wide">{caller.name}</p>
                              <p className="font-body text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                                {isSelf ? 'Administrator' : 'Caller Agent'}
                              </p>
                            </div>
                          </div>
                          {!isSelf && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Are you absolutely sure you want to remove ${caller.name} from the team? This will delete their profile and unassign all their uncalled leads. This action cannot be undone.`)) return;
                                setIsAdminActionPending(true);
                                const res = await deleteCallerProfile(caller.name);
                                setIsAdminActionPending(false);
                                if (res.success) {
                                  alert(`Successfully removed ${caller.name} from the team.`);
                                  refreshDashboardMetrics().catch(e => console.error(e));
                                } else {
                                  alert(`Failed to remove caller: ${res.error}`);
                                }
                              }}
                              disabled={isAdminActionPending}
                              className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40"
                              title={`Remove ${caller.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                          const res = await assignLeadsByRegion(callerName, caller, region);
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
                            {activeCallers.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">Region Name</label>
                          <select name="region" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none" required>
                            {areaOptions.length > 0 ? (
                              areaOptions.map(area => (
                                <option key={area} value={area}>{area}</option>
                              ))
                            ) : (
                              <>
                                <option value="Algiers">Algiers</option>
                                <option value="Oran">Oran</option>
                                <option value="Constantine">Constantine</option>
                                <option value="Sétif">Sétif</option>
                                <option value="Tlemcen">Tlemcen</option>
                                <option value="Blida">Blida</option>
                              </>
                            )}
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
                          const res = await assignLeadsByPriority(callerName, caller, parseInt(priorityVal, 10));
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
                            {activeCallers.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
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
                          const res = await assignLeadsByRange(callerName, caller, startId, endId, forceReassign);
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
                            {activeCallers.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
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
                          if (!confirm("Divide all unassigned uncalled targets equally among " + activeCallers.join(', ') + "? Warm and converted leads will stay locked.")) return;
                          setIsAdminActionPending(true);
                          const res = await splitLeadsEqually(callerName);
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
                          const res = await clearAssignments(callerName);
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
                          if (!confirm("CRITICAL WARNING: Are you absolutely sure you want to RESET THE ENTIRE CAMPAIGN? This will wipe all call statuses, caller assignments, and history for all 3,500 leads, setting them back to 'Not Called'. This action is irreversible.")) return;

                          setIsAdminActionPending(true);
                          const res = await resetCampaign(pin);
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert("Success! The campaign has been reset to zero.");
                            fetchAllData(true);
                          } else {
                            if (res.error === 'INVALID_ADMIN_PIN') {
                              alert("Incorrect PIN. Action aborted.");
                            } else {
                              alert(`Error resetting campaign: ${res.error}`);
                            }
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

                {/* Team Join Applications Section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-blue-600" />
                      <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                        Team Join Applications ({teamApplications.filter(a => a.status === 'Pending').length} Pending)
                      </h3>
                    </div>
                    <button
                      onClick={fetchApplications}
                      disabled={isAppsLoading}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border text-slate-500 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAppsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="w-full overflow-x-auto text-xs font-body">
                    <table className="w-full border-collapse text-left min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400">
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Name</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Email</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Phone</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Gender</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Submitted</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase">Status</th>
                          <th className="p-4 font-display text-[9px] font-bold tracking-widest uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-semibold text-slate-900">{app.name}</td>
                            <td className="p-4 text-slate-600">{app.email}</td>
                            <td className="p-4 text-slate-500 font-mono">{app.phone}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${
                                app.gender === 'Female' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {app.gender}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 text-[10px]">
                              {app.created_at ? new Date(app.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${
                                app.status === 'Accepted'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : app.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {app.status === 'Pending' && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={async () => {
                                      const pin = prompt(`Enter 6-digit access PIN for ${app.name}:`, "123456");
                                      if (!pin) return;
                                      if (pin.length !== 6 || isNaN(Number(pin))) {
                                        alert("PIN must be exactly 6 numeric digits.");
                                        return;
                                      }
                                      setIsAdminActionPending(true);
                                      const res = await handleApplicationDecision(app.id, 'Accepted', pin);
                                      setIsAdminActionPending(false);
                                      if (res.success) {
                                        alert(`${app.name} has been approved as a caller!`);
                                        fetchApplications();
                                        refreshDashboardMetrics().catch(e => console.error(e));
                                      } else {
                                        alert(`Error accepting application: ${res.error}`);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 hover:text-white text-emerald-700 font-bold uppercase rounded text-[9px] transition-all cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Are you sure you want to reject ${app.name}'s application?`)) return;
                                      setIsAdminActionPending(true);
                                      const res = await handleApplicationDecision(app.id, 'Rejected');
                                      setIsAdminActionPending(false);
                                      if (res.success) {
                                        fetchApplications();
                                      } else {
                                        alert(`Error rejecting application: ${res.error}`);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:text-white text-rose-700 font-bold uppercase rounded text-[9px] transition-all cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {teamApplications.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-slate-300 text-xs">
                              No team join applications logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Security & Password Gates Management */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                  <div>
                    <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wide">
                      Security & Access PIN Management
                    </h3>
                    <p className="font-body text-xs text-slate-400 mt-1">
                      Modify secure login PINs for the main portal gate and individual caller profiles. PINs must be exactly 6 numeric digits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-100 pt-6">
                    {/* Portal PIN Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4.5 h-4.5 text-blue-600" />
                        <span className="font-display text-xs font-bold text-slate-800 uppercase">Portal Gate PIN</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">New 6-Digit PIN</label>
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="******"
                          value={pinChangeInputs['PORTAL'] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPinChangeInputs(prev => ({ ...prev, PORTAL: val }));
                          }}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-300 font-mono"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const newPin = pinChangeInputs['PORTAL'];
                          if (!newPin || newPin.length !== 6) {
                            alert("PIN must be exactly 6 numeric digits.");
                            return;
                          }
                          if (!confirm("Are you sure you want to change the Portal Gate access PIN?")) return;
                          
                          setIsAdminActionPending(true);
                          const res = await updateProfilePinAction('PORTAL', newPin);
                          setIsAdminActionPending(false);

                          if (res.success) {
                            alert("Portal Gate PIN updated successfully!");
                            setPinChangeInputs(prev => ({ ...prev, PORTAL: '' }));
                          } else {
                            alert(`Error updating PIN: ${res.error}`);
                          }
                        }}
                        disabled={isAdminActionPending}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        Update Portal PIN
                      </button>
                    </div>

                    {/* Caller Profiles PINs */}
                    {callerProfiles.map(profile => (
                      <div key={profile.name} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4.5 h-4.5 text-indigo-600" />
                          <span className="font-display text-xs font-bold text-slate-800 uppercase">{profile.name}'s Login PIN</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold">New 6-Digit PIN</label>
                          <input
                            type="password"
                            maxLength={6}
                            placeholder="******"
                            value={pinChangeInputs[profile.name] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setPinChangeInputs(prev => ({ ...prev, [profile.name]: val }));
                            }}
                            className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-300 font-mono"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            const newPin = pinChangeInputs[profile.name];
                            if (!newPin || newPin.length !== 6) {
                              alert("PIN must be exactly 6 numeric digits.");
                              return;
                            }
                            if (!confirm(`Are you sure you want to change the login PIN for caller ${profile.name}?`)) return;

                            setIsAdminActionPending(true);
                            const res = await updateProfilePinAction(profile.name, newPin);
                            setIsAdminActionPending(false);

                            if (res.success) {
                              alert(`PIN for ${profile.name} updated successfully!`);
                              setPinChangeInputs(prev => ({ ...prev, [profile.name]: '' }));
                            } else {
                              alert(`Error updating PIN: ${res.error}`);
                            }
                          }}
                          disabled={isAdminActionPending}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-body text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          Update {profile.name} PIN
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </>
        )}
      </div>

      {/* Visual Scheduler (Date & Time Picker) Modal */}
      {schedulerOpen && (
        <div ref={schedulerTrapRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">
                  {schedulerTitle}
                </h3>
                <p className="font-body text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">
                  Select a date & time
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSchedulerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content: Scrollable */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              
              {/* Calendar Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-display text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <span>{calendarViewDate.toLocaleString('default', { month: 'long' })}</span>
                    <select
                      value={calendarViewDate.getFullYear()}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value, 10);
                        setCalendarViewDate(new Date(newYear, calendarViewDate.getMonth(), 1));
                      }}
                      className="bg-transparent border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const yr = new Date().getFullYear() - 1 + idx;
                        return (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        );
                      })}
                    </select>
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                      className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
                      className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Calendar Grid */}
                <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-3 flex flex-col gap-1.5">
                  {/* Days headers */}
                  <div className="grid grid-cols-7 text-center font-display text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                    <div>Su</div>
                  </div>
                  
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center font-body text-xs font-semibold">
                    {(() => {
                      const days = [];
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const totalDays = new Date(year, month + 1, 0).getDate();
                      let startDay = new Date(year, month, 1).getDay(); // Sun = 0, Mon = 1, etc.
                      // Adjust startDay to align with Monday as 0
                      startDay = startDay === 0 ? 6 : startDay - 1;

                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} className="p-2" />);
                      }

                      for (let d = 1; d <= totalDays; d++) {
                        const cellDate = new Date(year, month, d);
                        const isSelected = schedulerDate && 
                          schedulerDate.getDate() === d && 
                          schedulerDate.getMonth() === month && 
                          schedulerDate.getFullYear() === year;
                        const isToday = new Date().getDate() === d && 
                          new Date().getMonth() === month && 
                          new Date().getFullYear() === year;

                        days.push(
                          <button
                            key={`day-${d}`}
                            type="button"
                            onClick={() => setSchedulerDate(cellDate)}
                            className={`p-2 rounded-xl text-center transition-all cursor-pointer font-mono font-bold hover:bg-indigo-50 hover:text-indigo-900 ${
                              isSelected 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-md shadow-indigo-500/20' 
                                : isToday 
                                ? 'border border-indigo-200 text-indigo-700 bg-indigo-50/20' 
                                : 'text-slate-700'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Twin scroll columns time picker */}
              <div className="flex flex-col gap-2">
                <span className="font-display text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">
                  Time Picker (Scroll & Select)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {/* Hours scroll */}
                  <div className="flex flex-col gap-1 border border-slate-100 rounded-2xl bg-slate-50/40 p-2.5">
                    <span className="font-display text-[8px] font-black text-slate-400 uppercase tracking-wider text-center border-b border-slate-100 pb-1">
                      Hour
                    </span>
                    <div className="overflow-y-auto max-h-36 flex flex-col gap-1 pr-1 font-mono font-bold text-xs scrollbar-thin">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const hrStr = String(h).padStart(2, '0');
                        const isSelected = schedulerHour === hrStr;
                        return (
                          <button
                            key={`hr-${hrStr}`}
                            type="button"
                            onClick={() => setSchedulerHour(hrStr)}
                            className={`w-full py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white shadow-sm font-bold scale-[1.03]' 
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {hrStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Minutes scroll */}
                  <div className="flex flex-col gap-1 border border-slate-100 rounded-2xl bg-slate-50/40 p-2.5">
                    <span className="font-display text-[8px] font-black text-slate-400 uppercase tracking-wider text-center border-b border-slate-100 pb-1">
                      Minute
                    </span>
                    <div className="overflow-y-auto max-h-36 flex flex-col gap-1 pr-1 font-mono font-bold text-xs scrollbar-thin">
                      {Array.from({ length: 60 }).map((_, m) => {
                        const minStr = String(m).padStart(2, '0');
                        const isSelected = schedulerMinute === minStr;
                        return (
                          <button
                            key={`min-${minStr}`}
                            type="button"
                            onClick={() => setSchedulerMinute(minStr)}
                            className={`w-full py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white shadow-sm font-bold scale-[1.03]' 
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {minStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Footer buttons */}
            <div className="px-6 py-4.5 border-t border-slate-100 flex gap-3 bg-slate-50/50 justify-between">
              <button
                type="button"
                onClick={() => {
                  if (schedulerCallback) {
                    schedulerCallback('');
                  }
                  setSchedulerOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
              >
                Clear Date
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulerOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const formattedDate = schedulerDate
                      ? `${schedulerDate.getFullYear()}-${String(schedulerDate.getMonth() + 1).padStart(2, '0')}-${String(schedulerDate.getDate()).padStart(2, '0')}`
                      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const finalVal = `${formattedDate} ${schedulerHour}:${schedulerMinute}`;
                    if (schedulerCallback) {
                      schedulerCallback(finalVal);
                    }
                    setSchedulerOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-body text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Custom elegant Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 font-body text-xs"
          >
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-semibold tracking-wide leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom ValueInputModal prompt replacement */}
      {valueModalOpen && (
        <div ref={valueModalTrapRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
              <div>
                <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">
                  {valueModalTitle}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setValueModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleValueModalSubmit} className="p-6 flex flex-col gap-4 font-body text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">
                  Value Input
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={valueModalInput}
                  onChange={(e) => setValueModalInput(e.target.value)}
                  placeholder={valueModalPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none transition-all placeholder-slate-300"
                />
              </div>
              
              {/* Footer buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setValueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Column Mapping Modal (Phase 2) */}
      {csvMapperOpen && (
        <div ref={csvMapperTrapRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
              <div>
                <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">
                  Map CSV Columns
                </h3>
                <p className="font-body text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">
                  Assign columns from your file to system fields
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setCsvMapperOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields List */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-[9px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-2">
                <span>CSV Column Header</span>
                <span>System Field Destination</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {csvRawHeaders.map((header) => {
                  const DB_FIELDS = [
                    { value: 'agency_name', label: "Nom de l'agence" },
                    { value: 'phone', label: 'Téléphone Principal' },
                                      { value: 'area', label: 'Region / State' },
                    { value: 'website', label: 'Website' },
                    { value: 'google_rating', label: 'Google Rating' },
                    { value: 'review_count', label: 'Review Count' },
                    { value: 'maps_link', label: 'Google Maps Link' },
                    { value: 'address', label: 'Physical Address' },
                    { value: 'email', label: 'Email Address' },
                    { value: 'contact_person', label: 'Contact Person' },
                    { value: 'social_link', label: 'Instagram / Social Link' },
                    { value: 'notes', label: 'Notes / Comments' },
                    { value: 'priority', label: 'Priority (1-5)' },
                  ];
 
                  return (
                    <div key={header} className="grid grid-cols-2 gap-4 items-center border-b border-slate-50 pb-2 last:border-0">
                      <span className="font-body text-xs font-semibold text-slate-700 truncate" title={header}>
                        {header}
                      </span>
                      <select
                        value={columnMapping[header] || 'skip'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumnMapping(prev => ({ ...prev, [header]: val }));
                        }}
                        className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="skip">-- Ignore this column --</option>
                        {DB_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
 
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setCsvMapperOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsvMapperConfirm}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Validate Mapping & Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Deal Modal (Phase 2) */}
      {dealModalOpen && (
        <div ref={dealModalTrapRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
              <div>
                <h3 className="font-display text-sm font-black text-slate-800 uppercase tracking-wider">
                  {selectedDeal ? 'Edit Deal' : 'Create Deal / Opportunity'}
                </h3>
                <p className="font-body text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">
                  {selectedDeal ? 'Update parameters for this active deal' : 'Add a new qualified deal to the pipeline'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setDealModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={selectedDeal ? handleUpdateDealSubmit : handleCreateDealSubmit} className="p-6 flex flex-col gap-4 font-body text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Deal Name *</label>
                <input
                  type="text"
                  required
                  value={dealForm.deal_name}
                  onChange={(e) => setDealForm(prev => ({ ...prev, deal_name: e.target.value }))}
                  placeholder="e.g. CRM Setup + Website"
                  className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Link to a Qualified Lead (Optional)</label>
                <select
                  value={dealForm.lead_id || ''}
                  onChange={(e) => {
                    const leadId = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    const lead = linkableLeads.find(l => l.id === leadId);
                    setDealForm(prev => ({ 
                      ...prev, 
                      lead_id: leadId,
                      company_name: lead ? lead.agency_name : prev.company_name
                    }));
                  }}
                  className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3 cursor-pointer text-slate-800 focus:outline-none"
                >
                  <option value="">-- No link (or type company name below) --</option>
                  {linkableLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.agency_name} ({l.area})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Company / Agency Name</label>
                <input
                  type="text"
                  value={dealForm.company_name}
                  onChange={(e) => setDealForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="e.g. El Hourria Travel"
                  className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Setup Fee (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    value={dealForm.setup_value}
                    onChange={(e) => setDealForm(prev => ({ ...prev, setup_value: parseInt(e.target.value, 10) || 0 }))}
                    className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Monthly Recurring (MRR DZD)</label>
                  <input
                    type="number"
                    min="0"
                    value={dealForm.recurring_value}
                    onChange={(e) => setDealForm(prev => ({ ...prev, recurring_value: parseInt(e.target.value, 10) || 0 }))}
                    className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Estimated Close Date</label>
                <input
                  type="date"
                  value={dealForm.expected_close_date}
                  onChange={(e) => setDealForm(prev => ({ ...prev, expected_close_date: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Opportunity Notes</label>
                <textarea
                  value={dealForm.notes}
                  onChange={(e) => setDealForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Interested in premium package, deciding end of week."
                  rows={3}
                  className="bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDealModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-body text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-body text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {selectedDeal ? 'Update' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
