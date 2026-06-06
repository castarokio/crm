import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, CheckCircle, RefreshCw, AlertCircle, Sparkles, Loader2, Calendar, UserPlus, BarChart3, Award } from 'lucide-react';
import { DialerQueue } from './dialer-queue';
import { LeadInfoCard } from './lead-info-card';
import { GlassCard } from '../ui/glass-card';
import { Input, Textarea } from '../ui/input';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { useOfflineEdits } from '@/hooks/use-offline-edits';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { SchedulerModal } from './scheduler-modal';
import { toast, confirm } from '@/lib/toast';
import { 
  getDialerQueue, 
  updateCallStatus, 
  lockLead, 
  unlockLead, 
  deleteLeadPermanently,
  createLeadAction,
  recallAllUnansweredAction,
  getSingleLeadAction,
  getNextLeadAction,
  skipLeadAction,
  getTeamLeaderboardAction
} from '@/app/actions/leads';

type DialerTabProps = {
  callerName: string;
  callerRole: string;
  activeLeadId?: number | null;
  onClearActiveLeadId?: () => void;
  selectedNiche?: string | null;
};

export function DialerTab({ callerName, callerRole, activeLeadId, onClearActiveLeadId, selectedNiche }: DialerTabProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingOutcome, setSavingOutcome] = useState<boolean>(false);

  // Outcome Form State
  const [outcomeStatus, setOutcomeStatus] = useState<string>('');
  const [outcomeNotes, setOutcomeNotes] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState<boolean>(false);


  const [mobileView, setMobileView] = useState<'queue' | 'call'>('call');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await getTeamLeaderboardAction();
      if (res.success && res.leaderboard) {
        setLeaderboard(res.leaderboard);
      }
    } catch (err) {
      console.error('[Load Leaderboard Error]', err);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  // Add Lead Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newAgencyName, setNewAgencyName] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newWebsite, setNewWebsite] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  // Skip Lead State
  const [isSkipOpen, setIsSkipOpen] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('');
  const [skipping, setSkipping] = useState<boolean>(false);

  const handleSkipLead = async () => {
    if (!activeLead) return;
    if (callerRole === 'Admin') {
      const ok = await confirm('Are you sure you want to skip this lead?');
      if (!ok) return;
      setSkipping(true);
      const res = await skipLeadAction(activeLead.id, callerName, callerRole);
      setSkipping(false);
      if (res.success) {
        toast.success('Lead skipped.');
        setQueue(prev => prev.filter(l => l.id !== activeLead.id));
        if (currentIndex >= queue.length - 1) {
          setCurrentIndex(prev => Math.max(0, prev - 1));
        }
      } else {
        toast.error(res.error || 'Failed to skip lead.');
      }
    } else {
      setIsSkipOpen(true);
    }
  };

  // Offline Hook
  const { isOffline, queueEdit } = useOfflineEdits();

  // Load Dialer Queue from DB
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDialerQueue(selectedNiche);
      if (res.success && res.queue) {
        setQueue(res.queue);
        if (res.queue.length > 0) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(-1);
        }
      }
    } catch (err) {
      console.error('[Load Queue Error]', err);
    } finally {
      setLoading(false);
    }
  }, [selectedNiche]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // Load target lead if activeLeadId changes
  useEffect(() => {
    if (activeLeadId) {
      const idx = queue.findIndex(l => l.id === activeLeadId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setMobileView('call');
        if (onClearActiveLeadId) onClearActiveLeadId();
      } else {
        const fetchAndPrepend = async () => {
          setLoading(true);
          const res = await getSingleLeadAction(activeLeadId);
          if (res.success && res.lead) {
            setQueue(prev => [res.lead, ...prev.filter(l => l.id !== activeLeadId)]);
            setCurrentIndex(0);
            setMobileView('call');
          }
          setLoading(false);
          if (onClearActiveLeadId) onClearActiveLeadId();
        };
        void fetchAndPrepend();
      }
    }
  }, [activeLeadId, queue, onClearActiveLeadId]);

  // Wire Real-time SSE updates for queue synchronization
  useRealtimeSync({
    onLockAcquired: (leadId, user) => {
      if (user !== callerName) {
        setQueue(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to: user } : l));
      }
    },
    onLockReleased: (leadId, user) => {
      if (user !== callerName) {
        setQueue(prev => prev.map(l => l.id === leadId ? (l.assigned_to === user ? { ...l, assigned_to: null } : l) : l));
      }
    },
    onStatusChanged: (leadId, status, user) => {
      if (user !== callerName) {
        // If someone else handled the lead, remove it from current list
        if (!['Not Called', 'Recalled'].includes(status)) {
          setQueue(prev => {
            const updated = prev.filter(l => l.id !== leadId);
            // Re-adjust current index if current item is deleted
            return updated;
          });
        } else {
          setQueue(prev => prev.map(l => l.id === leadId ? { ...l, call_status: status } : l));
        }
      }
    }
  });

  const activeLead = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Manage Concurrency locks on active lead changes
  const prevLeadIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeLead && prevLeadIdRef.current !== activeLead.id) {
      // Unlock previous lead if any
      if (prevLeadIdRef.current !== null) {
        void unlockLead(prevLeadIdRef.current, callerName);
      }
      
      const attemptLock = async () => {
        const res = await lockLead(activeLead.id, callerName);
        if (!res.success) {
          toast.error(res.error === 'LEAD_LOCKED_BY_OTHER' 
            ? 'This lead is currently locked by another caller.'
            : 'This lead has already been dealt with by another caller.');
          // Remove from local queue so it disappears from this caller's screen
          setQueue(prev => prev.filter(l => l.id !== activeLead.id));
          if (currentIndex >= queue.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }
        } else {
          prevLeadIdRef.current = activeLead.id;
        }
      };
      void attemptLock();

      // Reset outcome state
      setOutcomeStatus(activeLead.call_status && activeLead.call_status !== 'Not Called' ? activeLead.call_status : '');
      setOutcomeNotes(activeLead.call_notes || '');
      setMeetingDate(activeLead.meeting_date || '');
      setContactPerson(activeLead.contact_person || '');
      setLeadEmail(activeLead.email || '');
    }

    return () => {
      // Unlock lead on unmount
      if (activeLead && prevLeadIdRef.current === activeLead.id) {
        void unlockLead(activeLead.id, callerName);
      }
    };
  }, [activeLead, callerName, currentIndex, queue.length]);

  const handleGetNextLead = async () => {
    setLoading(true);
    try {
      const res = await getNextLeadAction(callerName, selectedNiche);
      if (res.success && res.lead) {
        setQueue([res.lead]);
        setCurrentIndex(0);
        setMobileView('call');
        toast.success(`Acquired lock on ${res.lead.agency_name || 'lead'} for 10 minutes.`);
      } else {
        toast.warning(res.error === 'NO_AVAILABLE_LEADS' 
          ? 'No unassigned or available leads found in the system right now.'
          : res.error || 'Failed to fetch next lead.');
      }
    } catch (err: any) {
      toast.error('An error occurred while fetching the next lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIndex = (idx: number) => {
    setCurrentIndex(idx);
    setMobileView('call');
  };

  const handleDial = (phoneNumber: string) => {
    // Append dialing note to outcomes
    const logText = `[Dialed: ${phoneNumber}]`;
    setOutcomeNotes(prev => (prev ? `${logText} ${prev}` : logText));
  };

  const handleSaveOutcome = async (overrideStatus?: string) => {
    if (!activeLead) return;
    const status = overrideStatus || outcomeStatus;
    if (!status) {
      toast.warning('Please select a call outcome status.');
      return;
    }

    setSavingOutcome(true);

    try {
      if (isOffline) {
        // Queue edit offline
        const success = queueEdit(
          activeLead.id,
          status,
          activeLead.notes || '',
          outcomeNotes,
          callerName,
          meetingDate
        );
        if (success) {
          toast.info('Offline mode: Call saved locally — will sync when back online.');
          // Remove from local queue index optimistically
          setQueue(prev => prev.filter(l => l.id !== activeLead.id));
          if (currentIndex >= queue.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        const res = await updateCallStatus(
          activeLead.id,
          status,
          activeLead.notes || '',
          outcomeNotes,
          callerName,
          meetingDate,
          contactPerson || null,
          leadEmail || null
        );
        if (res.success) {
          // Release lock and remove lead from queue list upon status update
          setQueue(prev => prev.filter(l => l.id !== activeLead.id));
          if (currentIndex >= queue.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }
        } else {
          toast.error(res.error || 'Failed to save outcome status.');
        }
      }
    } catch (err) {
      console.error('[Save Outcome Error]', err);
    } finally {
      setSavingOutcome(false);
    }
  };



  const handleDeleteFalseLead = async () => {
    if (!activeLead) return;
    const ok = await confirm('This lead and its full call history will be permanently erased. This cannot be undone.', {
      title: 'Delete Lead Permanently',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    
    setSavingOutcome(true);
    const res = await deleteLeadPermanently(activeLead.id);
    setSavingOutcome(false);
    
    if (res.success) {
      toast.success('Lead permanently deleted.');
      setQueue(prev => prev.filter(l => l.id !== activeLead.id));
      if (currentIndex >= queue.length - 1) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    } else {
      toast.error(`Delete failed: ${res.error}`);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName || !newArea || !newPhone) return;

    setSavingOutcome(true);
    const res = await createLeadAction({
      agency_name: newAgencyName,
      area: newArea,
      phone: newPhone,
      website: newWebsite,
      email: newEmail,
      niche: selectedNiche || null,
    });
    setSavingOutcome(false);

    if (res.success && res.lead) {
      setQueue(prev => [res.lead, ...prev]);
      setCurrentIndex(0);
      setIsCreateOpen(false);
      // Reset
      setNewAgencyName('');
      setNewArea('');
      setNewPhone('');
      setNewWebsite('');
      setNewEmail('');
    } else {
      toast.error(`Failed to add new contact: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Low Queue Warning Banner */}
      {queue.length < 80 && queue.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 rounded-xl flex items-center justify-between font-body text-xs font-semibold shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Outbound queue is depleting ({queue.length} leads remaining). Request new lists.</span>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              const res = await recallAllUnansweredAction(callerName);
              if (res.success && res.count) {
                toast.success(`Recalled ${res.count} unanswered leads back into queue.`);
                await loadQueue();
              } else {
                toast.warning('No busy/unanswered leads found to recall.');
              }
              setLoading(false);
            }}
            className="text-[9px] font-bold text-indigo-700 hover:text-indigo-850 underline uppercase cursor-pointer"
          >
            Quick Recall
          </button>
        </div>
      )}

      {/* Main Grid View */}      {queue.length === 0 ? (
        callerRole === 'Caller' ? (
          /* Caller Empty State - Get Next Lead Cursor Button */
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto shadow-sm gap-4 mt-10 font-body text-xs">
            <Phone className="w-8 h-8 text-indigo-650 shrink-0 animate-pulse" />
            <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wide">Dialer Cursor Offline</h3>
            <p className="text-slate-455 text-center font-medium leading-relaxed max-w-sm">
              Press the button below to retrieve your next locked calling lead from the campaign queue. Your lock lease is active for 10 minutes.
            </p>
            <Button 
              onClick={handleGetNextLead} 
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold uppercase text-[10px] px-6 py-3 rounded-xl shadow cursor-pointer"
            >
              Get Next Lead Card
            </Button>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto shadow-sm gap-4 mt-10">
            <AlertCircle className="w-8 h-8 text-amber-500 animate-bounce" />
            <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wide">Dialer Queue Depleted</h3>
            <p className="text-xs text-slate-455 text-center font-medium leading-relaxed max-w-sm">
              There are no active or uncalled leads left in your dialer queue. Please contact the administrator to assign more lead ranges, or click below to recall unanswered attempts.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  setLoading(true);
                  const res = await recallAllUnansweredAction(callerName);
                  if (res.success && res.count) {
                    toast.success(`Recalled ${res.count} unanswered leads back into queue!`);
                    await loadQueue();
                  } else {
                    toast.warning('No unanswered leads to recall right now.');
                  }
                  setLoading(false);
                }}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase text-[10px]"
              >
                Recall Unanswered Leads
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px]">
                + ADD NEW CONTACT
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4 h-full">
          {/* Top Actions Row */}
          <div className="flex justify-between items-center w-full px-1">
            <div className="flex items-center gap-2">
              {leaderboard.length > 0 && (callerRole !== 'Developer' && callerRole !== 'Auditor') && (
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold uppercase text-[9px] py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-all active:scale-95"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-650" />
                  {showLeaderboard ? 'Hide Call List Progress' : 'Show Call List Progress'}
                </button>
              )}
              <span className="text-[10px] text-slate-550 font-bold font-display uppercase bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/50">
                LEAD {currentIndex + 1} of {queue.length} IN QUEUE
              </span>
            </div>
            
            {callerRole !== 'Caller' && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[9px] py-1.5 h-auto px-4 rounded-xl cursor-pointer"
              >
                + Add Contact
              </Button>
            )}
          </div>

          {/* Animated Team Scorecard Leaderboard */}
          {showLeaderboard && leaderboard.length > 0 && (callerRole !== 'Developer' && callerRole !== 'Auditor') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 animate-in fade-in slide-in-from-top-3 duration-500 mt-1">
              {leaderboard.slice(0, 3).map((item, idx) => {
                const formatPercentage = (numerator: number, denominator: number) => {
                  if (!denominator) return 0;
                  return Math.min(100, Math.round((numerator / denominator) * 100));
                };
                const progress = formatPercentage(item.calls_today, item.daily_target);
                
                const borderColors = [
                  'border-indigo-500/30 shadow-indigo-100/50 bg-indigo-50/5',
                  'border-blue-500/25 shadow-blue-100/40 bg-blue-50/5',
                  'border-slate-200 shadow-slate-100/40 bg-slate-50/5'
                ];
                
                const badges = [
                  '🏆 Rank 1',
                  '🥈 Rank 2',
                  '🥉 Rank 3'
                ];

                return (
                  <div 
                    key={item.name} 
                    className={`p-4 bg-white rounded-2xl border ${borderColors[idx] || 'border-slate-200'} shadow-sm flex flex-col gap-2.5 transition-all hover:scale-[1.01] duration-300 relative overflow-hidden`}
                  >
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs border border-slate-200 uppercase">
                          {item.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display font-extrabold text-slate-900 uppercase tracking-wide text-[11px] flex items-center gap-1">
                            {item.name}
                            {item.status === 'Disabled' && (
                              <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded uppercase">SUSP</span>
                            )}
                          </span>
                          <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider">{badges[idx]}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[9.5px] text-slate-455 uppercase font-black tracking-widest block leading-none">Calls Made</span>
                        <h4 className="text-sm font-black text-slate-800 font-display mt-1">{item.calls_today} <span className="text-[10px] text-slate-455 font-normal">/ {item.daily_target}</span></h4>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-655">
                        <span>Daily Progress</span>
                        <span className="text-indigo-650 font-black">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            idx === 0 ? 'bg-indigo-600' :
                            idx === 1 ? 'bg-blue-500' :
                            'bg-slate-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-455 font-bold uppercase tracking-wider border-t border-slate-100 pt-2 mt-1">
                      <span>Appts This Week:</span>
                      <span className="font-extrabold text-slate-800 font-display">{item.appointments_this_week} / {item.weekly_target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
            
            {/* Main Dial Card (Left Column) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              
              <GlassCard className="border border-slate-200/80 shadow-md p-6">
                <LeadInfoCard
                  key={activeLead?.id ?? 'empty'}
                  lead={activeLead}
                  callerName={callerName}
                  onDial={handleDial}
                  onLeadUpdated={(leadId, fields) => {
                    setQueue(prev => prev.map(l => l.id === leadId ? { ...l, ...fields } : l));
                  }}
                />
              </GlassCard>
            </div>

              {/* Outcome & AI Panel (Right Column) */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {activeLead && (
                  <>
                {/* Standard Outcome card */}
                <GlassCard className="border border-slate-200/80 shadow-md flex flex-col gap-4 p-5">
                  <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
                    Call Outcome Form
                  </h3>

                  <div className="flex flex-col gap-3 font-body text-xs">
                    {/* Quick-Log Buttons */}
                    <div className="flex flex-col gap-1.5 mb-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Quick Log Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Interested', value: 'Interested', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80 hover:border-indigo-300' },
                          { label: 'Callback', value: 'Callback', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 hover:border-amber-300' },
                          { label: 'Busy', value: 'Busy', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80 hover:border-blue-300' },
                          { label: 'No Answer', value: 'No Answer', color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/85 hover:border-slate-300' },
                          { label: 'Not Interested', value: 'Not Interested', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 hover:border-rose-300' },
                          { label: 'Wrong Number', value: 'Wrong Number', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80 hover:border-purple-300' },
                          { label: 'Accepted', value: 'Accepted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300' },
                          { label: 'Configured', value: 'Client Configured', color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/80 hover:border-teal-300' },
                        ].map((btn) => (
                          <button
                            key={btn.value}
                            type="button"
                            onClick={() => {
                              setOutcomeStatus(btn.value);
                              if (['Callback', 'Interested', 'Accepted'].includes(btn.value)) {
                                toast.info(`Status set to "${btn.label}" — enter a meeting date below and click Save Call Log.`);
                              } else {
                                void handleSaveOutcome(btn.value);
                              }
                            }}
                            className={`px-2.5 py-1.5 border rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm ${btn.color}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Select Call Status</label>
                      <select
                        value={outcomeStatus}
                        onChange={(e) => setOutcomeStatus(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer font-bold"
                      >
                        <option value="">-- Choose Status --</option>
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

                    {/* Conditional Callback schedule picker (Shows for Callback, Interested, and Accepted) */}
                    {['Callback', 'Interested', 'Accepted'].includes(outcomeStatus) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Callback / Meeting Date</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            placeholder="e.g. 2026-06-05 14:00"
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-400 text-slate-700 font-bold"
                          />
                          <button
                            onClick={() => setShowScheduler(true)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 cursor-pointer transition-all"
                            title="Pick Date"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Outcome notes */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Outcome Notes</label>
                      <textarea
                        rows={4}
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        placeholder="Enter call notes summary..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-semibold text-slate-800"
                      />
                    </div>

                    {/* Contact Person Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Contact Person Name</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="e.g. Oussama (Directeur)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Lead Email Address */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Lead Email Address</label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="e.g. contact@agency.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Save button */}
                    <Button
                      onClick={() => handleSaveOutcome()}
                      loading={savingOutcome}
                      variant="primary"
                      className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 font-bold uppercase"
                    >
                      Save Call Log
                    </Button>
                    
                    {/* Skip Lead button */}
                    <Button
                      onClick={handleSkipLead}
                      loading={skipping}
                      variant="secondary"
                      className="w-full mt-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-bold uppercase cursor-pointer"
                    >
                      Skip Lead
                    </Button>
                    
                    {/* Delete if not related button */}
                    {callerRole !== 'Caller' && (
                      <Button
                        onClick={handleDeleteFalseLead}
                        variant="secondary"
                        className="w-full text-rose-600 hover:text-rose-800 hover:bg-rose-50/50 border border-rose-200 font-bold uppercase text-[9px] mt-1"
                      >
                        Disqualify / Delete Lead
                      </Button>
                    )}
                  </div>
                </GlassCard>


              </>
            )}
          </div>
        </div>
      </div>
  )}

      {/* Skip Reason Modal */}
      {isSkipOpen && (
        <Modal
          isOpen={isSkipOpen}
          onClose={() => { setIsSkipOpen(false); setSkipReason(''); }}
          title="Reason for Skip"
          subtitle={`Please explain why you are skipping ${activeLead?.agency_name || 'this lead'}`}
        >
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!activeLead) return;
              if (skipReason.trim().length < 5) {
                toast.warning('Please enter a descriptive reason (minimum 5 characters).');
                return;
              }
              setSkipping(true);
              const res = await skipLeadAction(activeLead.id, callerName, callerRole, skipReason);
              setSkipping(false);
              if (res.success) {
                toast.success('Lead skipped.');
                setIsSkipOpen(false);
                setSkipReason('');
                setQueue(prev => prev.filter(l => l.id !== activeLead.id));
                if (currentIndex >= queue.length - 1) {
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }
              } else {
                toast.error(res.error || 'Failed to skip lead.');
              }
            }}
            className="flex flex-col gap-4 font-body text-xs"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-450 font-bold uppercase">Skip Reason *</label>
              <textarea
                required
                rows={3}
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="e.g. Agency has permanently closed, wrong business type, invalid phone number, etc."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-semibold text-slate-800"
              />
            </div>
            
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => { setIsSkipOpen(false); setSkipReason(''); }}
              >
                CANCEL
              </Button>
              <Button 
                type="submit" 
                loading={skipping} 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold"
                disabled={skipReason.trim().length < 5}
              >
                CONFIRM SKIP
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DateTime Calendar Picker Scheduler Modal */}
      <SchedulerModal
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSelect={(dt) => setMeetingDate(dt)}
        currentValue={meetingDate}
      />

      {/* Manual Create Lead Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Outbound Contact"
          subtitle="Manually insert a travel agency lead directly into the caller's queue"
        >
          <form onSubmit={handleCreateLead} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-450 font-bold uppercase">Agency / Company Name *</label>
              <Input
                type="text"
                required
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
                placeholder="e.g. Travel & Tours Algeria"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-450 font-bold uppercase">Area / City *</label>
              <Input
                type="text"
                required
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="e.g. Algiers"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-455 font-bold uppercase">Phone Number *</label>
              <Input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. 0555123456"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-455 font-bold uppercase">Website Link (Optional)</label>
              <Input
                type="text"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="e.g. traveltours.dz"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-455 font-bold uppercase">Email Address (Optional)</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. contact@traveltours.dz"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" loading={savingOutcome} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                CREATE CONTACT
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
