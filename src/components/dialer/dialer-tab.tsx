import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, CheckCircle, RefreshCw, AlertCircle, Sparkles, Loader2, Calendar } from 'lucide-react';
import { DialerQueue } from './dialer-queue';
import { LeadInfoCard } from './lead-info-card';
import { CallLogLedger } from './call-log-ledger';
import { PitchGenerator } from './pitch-generator';
import { GlassCard } from '../ui/glass-card';
import { Input, Textarea } from '../ui/input';
import { Button } from '../ui/button';
import { useOfflineEdits } from '@/hooks/use-offline-edits';
import { getDialerQueue, updateCallStatus, lockLead, unlockLead, updateCallStatusWithAI } from '@/app/actions/leads';

type DialerTabProps = {
  callerName: string;
};

export function DialerTab({ callerName }: DialerTabProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingOutcome, setSavingOutcome] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pitch' | 'history'>('info');

  // Outcome Form State
  const [outcomeStatus, setOutcomeStatus] = useState<string>('');
  const [outcomeNotes, setOutcomeNotes] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState<boolean>(false);

  // AI note parsing state
  const [aiNotesInput, setAiNotesInput] = useState<string>('');
  const [parsingAI, setParsingAI] = useState<boolean>(false);

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
  };

  const handleDial = (phoneNumber: string) => {
    // Append dialing note to outcomes
    const logText = `[Dialed: ${phoneNumber}]`;
    setOutcomeNotes(prev => (prev ? `${logText} ${prev}` : logText));
  };

  const handleSaveOutcome = async () => {
    if (!activeLead) return;
    if (!outcomeStatus) {
      alert('Please select a call outcome status.');
      return;
    }

    setSavingOutcome(true);

    try {
      if (isOffline) {
        // Queue edit offline
        const success = queueEdit(
          activeLead.id,
          outcomeStatus,
          activeLead.notes || '',
          outcomeNotes,
          callerName,
          meetingDate
        );
        if (success) {
          alert('Offline mode: Outbound call saved locally. Updates will sync when online.');
          // Remove from local queue index optimistically
          setQueue(prev => prev.filter(l => l.id !== activeLead.id));
          if (currentIndex >= queue.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        const res = await updateCallStatus(
          activeLead.id,
          outcomeStatus,
          activeLead.notes || '',
          outcomeNotes,
          callerName,
          meetingDate
        );
        if (res.success) {
          // Release lock and remove lead from queue list upon status update
          setQueue(prev => prev.filter(l => l.id !== activeLead.id));
          if (currentIndex >= queue.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }
        } else {
          alert(res.error || 'Failed to save outcome status.');
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
      const res = await updateCallStatusWithAI(activeLead.id, callerName, aiNotesInput);
      if (res.success) {
        setQueue(prev => prev.filter(l => l.id !== activeLead.id));
        if (currentIndex >= queue.length - 1) {
          setCurrentIndex(prev => Math.max(0, prev - 1));
        }
      } else {
        alert(res.error || 'AI note parsing failed. Please input notes manually.');
      }
    } catch (err) {
      console.error('[AI notes save error]', err);
    } finally {
      setParsingAI(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-full">
      {/* Dialer Queue (Left Column) */}
      <div className="lg:col-span-1 h-full">
        <DialerQueue
          queue={queue}
          currentIndex={currentIndex}
          onSelectIndex={handleSelectIndex}
          callerName={callerName}
        />
      </div>

      {/* Main Dial Card (Center Column) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <GlassCard className="border border-slate-200/80 shadow-md">
          {/* Sub-tabs header */}
          <div className="flex gap-4 border-b border-slate-100 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
                activeTab === 'info'
                  ? 'border-indigo-650 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Lead Details
            </button>
            <button
              onClick={() => setActiveTab('pitch')}
              className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
                activeTab === 'pitch'
                  ? 'border-indigo-650 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Outreach Script
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
                activeTab === 'history'
                  ? 'border-indigo-650 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Call History
            </button>
          </div>

          {/* Sub-tab view renderer */}
          {activeTab === 'info' && (
            <LeadInfoCard
              lead={activeLead}
              callerName={callerName}
              onDial={handleDial}
              onLeadUpdated={(leadId, fields) => {
                setQueue(prev => prev.map(l => l.id === leadId ? { ...l, ...fields } : l));
              }}
            />
          )}
          {activeTab === 'pitch' && <PitchGenerator lead={activeLead} callerName={callerName} />}
          {activeTab === 'history' && activeLead && <CallLogLedger leadId={activeLead.id} />}
        </GlassCard>
      </div>

      {/* Outcome & AI Panel (Right Column) */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        {activeLead && (
          <>
            {/* Standard Outcome card */}
            <GlassCard className="border border-slate-200/80 shadow-md flex flex-col gap-4">
              <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
                Call Outcome Form
              </h3>

              <div className="flex flex-col gap-3 font-body text-xs">
                {/* Status Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Select Call Status</label>
                  <select
                    value={outcomeStatus}
                    onChange={(e) => setOutcomeStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
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

                {/* Conditional Callback schedule picker */}
                {outcomeStatus === 'Callback' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 uppercase font-bold">Callback Date & Time</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        placeholder="e.g. 2026-06-05 14:00"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-400 text-slate-700"
                      />
                      <button
                        onClick={() => setShowScheduler(!showScheduler)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 cursor-pointer transition-all"
                        title="Pick Date"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                    {showScheduler && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl mt-1 shadow-md">
                        {/* Basic inline calendar mockup */}
                        <div className="flex flex-col gap-2">
                          <input
                            type="datetime-local"
                            onChange={(e) => {
                              const date = e.target.value.replace('T', ' ');
                              setMeetingDate(date);
                              setShowScheduler(false);
                            }}
                            className="w-full text-xs p-1 border border-slate-200 rounded outline-none"
                          />
                        </div>
                      </div>
                    )}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-350 resize-none font-medium text-slate-800"
                  />
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSaveOutcome}
                  loading={savingOutcome}
                  variant="primary"
                  className="w-full mt-2"
                >
                  Save Call Log
                </Button>
              </div>
            </GlassCard>

            {/* AI Post Call Parser Card */}
            <GlassCard className="border border-slate-200/80 shadow-md flex flex-col gap-4">
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
  );
}
