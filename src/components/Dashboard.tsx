'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Folder, Shield, LogOut, Loader2, Award, CheckCircle, BarChart3, ArrowRight } from 'lucide-react';
import { DialerTab } from './dialer/dialer-tab';
import { PipelineTab } from './pipeline/pipeline-tab';
import { DirectoryTab } from './directory/directory-tab';
import { AdminTab } from './admin/admin-tab';
import { getCallerTarget } from '@/app/actions/pipeline';
import { getTargetInventoryCounts, getUpcomingCallbacksAction } from '@/app/actions/leads';
import { GlassCard } from './ui/glass-card';

type DashboardProps = {
  callerName: string;
  callerRole: string;
  onLogoutCaller: () => Promise<void>;
};

type ActiveTab = 'dialer' | 'pipeline' | 'directory' | 'admin';

export default function Dashboard({
  callerName,
  callerRole,
  onLogoutCaller,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dialer');
  const [loadingTargets, setLoadingTargets] = useState<boolean>(true);
  const [targets, setTargets] = useState<{
    daily_call_target: number;
    weekly_appointment_target: number;
    calls_today: number;
    appointments_this_week: number;
  }>({ daily_call_target: 80, weekly_appointment_target: 15, calls_today: 0, appointments_this_week: 0 });

  const [counts, setCounts] = useState<{
    total: number;
    warm: number;
    converted: number;
    followups: number;
    lost: number;
    treated: number;
  }>({ total: 0, warm: 0, converted: 0, followups: 0, lost: 0, treated: 0 });

  // Callback alarms notifications state
  const [callbackAlarms, setCallbackAlarms] = useState<any[]>([]);
  // Callback selected lead to load in Dialer Tab
  const [activeLeadId, setActiveLeadId] = useState<number | null>(null);
  // Source lead query to load in Directory Tab
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>('');

  useEffect(() => {
    void loadCallerMetrics();
    // Refresh count values every 30 seconds for live updates
    const interval = setInterval(() => {
      void loadCallerMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [callerName]);

  // Check Callback reminders periodically (every 60s)
  useEffect(() => {
    const playAlarmBeep = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 pitch beep
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (err) {
        console.warn('Synth Web Audio beep error:', err);
      }
    };

    const checkCallbacks = async () => {
      const res = await getUpcomingCallbacksAction(callerName);
      if (res.success && res.callbacks) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const dueCallbacks = res.callbacks.filter((cb: any) => {
          if (!cb.meeting_date) return false;
          try {
            // Expected format: YYYY-MM-DD HH:MM
            const [datePart, timePart] = cb.meeting_date.split(' ');
            if (datePart !== todayStr) return false;
            
            const [h, m] = timePart.split(':').map(Number);
            return h === currentHour && m === currentMin;
          } catch {
            return false;
          }
        });

        if (dueCallbacks.length > 0) {
          playAlarmBeep();
          setCallbackAlarms(prev => {
            // Append only if not already displayed
            const toAdd = dueCallbacks.filter((due: any) => !prev.some((p: any) => p.id === due.id));
            return [...prev, ...toAdd];
          });
        }
      }
    };

    void checkCallbacks();
    const alertInterval = setInterval(() => {
      void checkCallbacks();
    }, 60000); // Polling checks every minute

    return () => clearInterval(alertInterval);
  }, [callerName]);

  const loadCallerMetrics = async () => {
    setLoadingTargets(true);
    const targetRes = await getCallerTarget(callerName);
    const countRes = await getTargetInventoryCounts();
    if (targetRes.success) {
      setTargets({
        daily_call_target: targetRes.daily_call_target,
        weekly_appointment_target: targetRes.weekly_appointment_target,
        calls_today: targetRes.calls_today,
        appointments_this_week: targetRes.appointments_this_week ?? 0,
      });
    }
    if (countRes.success && countRes.counts) {
      setCounts(countRes.counts);
    }
    setLoadingTargets(false);
  };

  const isAdminOrSupervisor = callerRole === 'Admin' || callerRole === 'Supervisor';

  const formatPercentage = (numerator: number, denominator: number) => {
    if (!denominator) return 0;
    return Math.min(100, Math.round((numerator / denominator) * 100));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col relative overflow-hidden select-none font-body">
      {/* Background Gradients (Light theme) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-50/80 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden z-10">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white/70 border-r border-slate-200/80 p-5 flex flex-col gap-6 backdrop-blur-md shrink-0">
          
          {/* Logo Brand Header */}
          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-display font-extrabold text-sm tracking-tighter">
                OS
              </div>
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-slate-850">
                Call-OS CRM
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                Caller: <strong className="text-slate-800">{callerName}</strong> ({callerRole})
              </span>
            </div>
          </div>

          {/* Sidebar Nav Buttons */}
          <nav className="flex-1 flex flex-col gap-2 font-body text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dialer')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dialer'
                  ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/50'
              }`}
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>Outbound Dialer</span>
              {counts.total > 0 && (
                <span className="ml-auto text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  {counts.total}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Deal Pipeline</span>
              {counts.converted > 0 && (
                <span className="ml-auto text-[9px] bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  {counts.converted}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/50'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span>Directory Grid</span>
            </button>

            {isAdminOrSupervisor && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/50'
              }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin Settings</span>
              </button>
            )}
          </nav>

          {/* Caller Performance Targets Tracker */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider font-body">
              <Award className="w-4 h-4 text-indigo-650 shrink-0" />
              <span>Goals Dashboard</span>
            </div>
            
            <div className="flex flex-col gap-2.5 font-body text-[10px]">
              {/* Daily Target Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold text-slate-655">
                  <span>Calls Today</span>
                  <span>
                    {targets.calls_today} / {targets.daily_call_target}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-indigo-650 rounded-full transition-all duration-500"
                    style={{ width: `${formatPercentage(targets.calls_today, targets.daily_call_target)}%` }}
                  />
                </div>
              </div>

              {/* Weekly Appointments Target Progress */}
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex justify-between font-bold text-slate-655">
                  <span>Weekly Appts</span>
                  <span>
                    {targets.appointments_this_week} / {targets.weekly_appointment_target}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${formatPercentage(targets.appointments_this_week, targets.weekly_appointment_target)}%` }}
                  />
                </div>
              </div>

              {/* Status information */}
              {targets.calls_today >= targets.daily_call_target && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wide mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Daily Target Achieved!
                </div>
              )}
            </div>

            <button
              onClick={onLogoutCaller}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 text-slate-550 hover:text-rose-700 hover:bg-rose-50/30 transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              LOGOUT SESSION
            </button>
          </div>
        </aside>

        {/* Dynamic View Box */}
        <main className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'dialer' && (
              <DialerTab 
                callerName={callerName} 
                activeLeadId={activeLeadId}
                onClearActiveLeadId={() => setActiveLeadId(null)}
              />
            )}
            
            {activeTab === 'pipeline' && (
              <PipelineTab 
                callerName={callerName} 
                onViewSourceLead={(companyName: string) => {
                  setDirectorySearchQuery(companyName);
                  setActiveTab('directory');
                }}
              />
            )}
            
            {activeTab === 'directory' && (
              <DirectoryTab 
                callerName={callerName} 
                callerRole={callerRole} 
                searchQuery={directorySearchQuery}
                onClearSearchQuery={() => setDirectorySearchQuery('')}
              />
            )}

            {activeTab === 'admin' && isAdminOrSupervisor && (
              <AdminTab callerName={callerName} />
            )}
          </div>
        </main>

      </div>

      {/* Floating Callback Alarm Alerts cards list */}
      {callbackAlarms.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 animate-fade-in max-w-sm w-full font-body text-xs">
          {callbackAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className="bg-amber-600 border border-amber-500 text-white rounded-2xl p-4 shadow-xl flex flex-col gap-2 relative cursor-pointer hover:bg-amber-700 transition-all active:scale-95"
              onClick={() => {
                setActiveLeadId(alarm.id);
                setActiveTab('dialer');
                setCallbackAlarms(prev => prev.filter(a => a.id !== alarm.id));
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="text-[10px] uppercase font-black tracking-wider">Scheduled Callback Due!</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCallbackAlarms(prev => prev.filter(a => a.id !== alarm.id));
                  }}
                  className="text-white/80 hover:text-white font-extrabold text-[10px] uppercase cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
              <div>
                <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">{alarm.agency_name}</h4>
                <p className="text-[10px] text-white/90 font-medium font-body mt-0.5">
                  Scheduled time: <span className="font-bold">{alarm.meeting_date.split(' ')[1]}</span>
                </p>
                {alarm.call_notes && (
                  <p className="text-[9.5px] italic text-amber-100 font-body mt-1 border-l border-amber-400 pl-1.5 truncate">
                    "{alarm.call_notes}"
                  </p>
                )}
              </div>
              <div className="text-[8px] font-black tracking-widest text-indigo-100 uppercase self-end flex items-center gap-1 mt-1">
                JUMP TO DIALER <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
