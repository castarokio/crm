import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, CheckCircle, RefreshCw, AlertCircle, Sparkles, Loader2, Calendar, UserPlus } from 'lucide-react';
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
  updateCallStatusWithAI,
  deleteLeadPermanently,
  createLeadAction,
  recallAllUnansweredAction,
  getSingleLeadAction,
  processCallSummaryWithAI
} from '@/app/actions/leads';

type DialerTabProps = {
  callerName: string;
  activeLeadId?: number | null;
  onClearActiveLeadId?: () => void;
};

export function DialerTab({ callerName, activeLeadId, onClearActiveLeadId }: DialerTabProps) {
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

  // AI note parsing state
  const [aiNotesInput, setAiNotesInput] = useState<string>('');
  const [parsingAI, setParsingAI] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'queue' | 'call'>('call');

  // Add Lead Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newAgencyName, setNewAgencyName] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newWebsite, setNewWebsite] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  // Offline Hook
  const { isOffline, queueEdit } = useOfflineEdits();

  // Load Dialer Queue from DB
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDialerQueue();
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
  }, []);

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
      // Lock new lead
      void lockLead(activeLead.id, callerName);
      prevLeadIdRef.current = activeLead.id;

      // Reset outcome state
      setOutcomeStatus(activeLead.call_status && activeLead.call_status !== 'Not Called' ? activeLead.call_status : '');
      setOutcomeNotes(activeLead.call_notes || '');
      setMeetingDate(activeLead.meeting_date || '');
      setContactPerson(activeLead.contact_person || '');
      setLeadEmail(activeLead.email || '');
      setAiNotesInput('');
    }

    return () => {
      // Unlock lead on unmount
      if (activeLead) {
        void unlockLead(activeLead.id, callerName);
      }
    };
  }, [activeLead, callerName]);

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

  const handleSaveOutcomeAI = async () => {
    if (!activeLead || !aiNotesInput.trim()) return;

    setParsingAI(true);
    try {
      const res = await processCallSummaryWithAI(aiNotesInput);
      if (res.success && res.extractedData) {
        const data = res.extractedData;
        
        // Pre-fill form state variables
        if (data.call_status) setOutcomeStatus(data.call_status);
        if (data.summary) setOutcomeNotes(data.summary);
        if (data.meeting_date) setMeetingDate(data.meeting_date);
        if (data.contact_person) setContactPerson(data.contact_person);
        if (data.updated_email) setLeadEmail(data.updated_email);
        
        toast.success('AI analysis done — form pre-filled. Review and click Save Call Log.');
      } else {
        toast.error(res.error || 'AI parsing failed. Check your Gemini API key.');
      }
    } catch (err: any) {
      console.error('[AI notes save error]', err);
      toast.error('Unexpected error while parsing notes with AI.');
    } finally {
      setParsingAI(false);
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

      {/* Main Grid View */}
      {queue.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto shadow-sm gap-4 mt-10">
          <AlertCircle className="w-8 h-8 text-amber-500 animate-bounce" />
          <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wide">Dialer Queue Depleted</h3>
          <p className="text-xs text-slate-450 text-center font-medium leading-relaxed max-w-sm">
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
      ) : (
        <div className="flex flex-col gap-4 h-full">
          {/* Mobile Tab Select Bar */}
          <div className="flex lg:hidden bg-white border border-slate-250/70 rounded-2xl p-1 shadow-sm font-display text-xs font-bold w-full">
            <button
              type="button"
              onClick={() => setMobileView('queue')}
              className={`flex-1 py-2 text-center rounded-xl cursor-pointer transition-all ${
                mobileView === 'queue' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Queue ({queue.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileView('call')}
              className={`flex-1 py-2 text-center rounded-xl cursor-pointer transition-all ${
                mobileView === 'call' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Call ({activeLead?.agency_name ? (activeLead.agency_name.substring(0, 15) + (activeLead.agency_name.length > 15 ? '...' : '')) : 'None'})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-full">
            
            {/* Dialer Queue (Left Column) */}
            <div className={`lg:col-span-1 h-full ${mobileView === 'queue' ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-2">
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  icon={<UserPlus className="w-4.5 h-4.5" />}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] shadow"
                >
                  Add New Contact
                </Button>
              </div>
              <DialerQueue
                queue={queue}
                currentIndex={currentIndex}
                onSelectIndex={handleSelectIndex}
                callerName={callerName}
              />
            </div>

            {/* Active Call View (Center + Right Columns) */}
            <div className={`col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start ${mobileView === 'call' ? 'grid' : 'hidden lg:grid'}`}>
              
              {/* Main Dial Card (Center Column) */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                
                {/* Position indicator */}
                <div className="px-4 py-2 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Selected Position</span>
                  <span className="text-[10px] text-slate-800 font-extrabold font-display uppercase">
                    LEAD {currentIndex + 1} of {queue.length} in queue
                  </span>
                </div>

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
                    
                    {/* Delete if not related button */}
                    <Button
                      onClick={handleDeleteFalseLead}
                      variant="secondary"
                      className="w-full text-rose-600 hover:text-rose-800 hover:bg-rose-50/50 border border-rose-200 font-bold uppercase text-[9px] mt-1"
                    >
                      Disqualify / Delete Lead
                    </Button>
                  </div>
                </GlassCard>

                {/* AI Post Call Parser Card */}
                <GlassCard className="border border-slate-200/80 shadow-md flex flex-col gap-4 p-5">
                  <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    Gemini AI Summary Parser
                  </h3>

                  <div className="flex flex-col gap-3 font-body text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Paste Raw Notes / Transcript</label>
                      <textarea
                        rows={3}
                        value={aiNotesInput}
                        onChange={(e) => setAiNotesInput(e.target.value)}
                        placeholder="Paste call notes (AI will auto extract status, date, and details)..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-medium text-slate-850"
                      />
                    </div>

                    <Button
                      onClick={handleSaveOutcomeAI}
                      loading={parsingAI}
                      variant="secondary"
                      icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                      className="w-full text-indigo-700 hover:text-indigo-850 border border-indigo-200 bg-indigo-50/50"
                    >
                      Analyze & Save
                    </Button>
                  </div>
                </GlassCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
