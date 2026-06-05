'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Folder, Shield, LogOut, Loader2, Award, CheckCircle, BarChart3, ArrowRight, Menu, X, Scale, FileCheck2, ClipboardList, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { DialerTab } from './dialer/dialer-tab';
import { PipelineTab } from './pipeline/pipeline-tab';
import { DirectoryTab } from './directory/directory-tab';
import { AdminTab } from './admin/admin-tab';
import { AuditLogsTable } from './admin/AuditLogsTable';
import { CommissionsTab } from './pipeline/CommissionsTab';
import { ProjectsTab } from './pipeline/ProjectsTab';
import { DisputesTab } from './pipeline/DisputesTab';
import { getCallerTarget, getTeamLeaderboardAction } from '@/app/actions/pipeline';
import { getTargetInventoryCounts, getUpcomingCallbacksAction } from '@/app/actions/leads';
import { sweepExpiredLocksAction } from '@/app/actions/security';
import { GlassCard } from './ui/glass-card';
import { AppDialogs } from './ui/app-dialogs';

type DashboardProps = {
  callerName: string;
  callerRole: string;
  onLogoutCaller: () => Promise<void>;
};

type ActiveTab = 'dialer' | 'pipeline' | 'directory' | 'admin' | 'projects' | 'disputes' | 'commissions' | 'audit';

export default function Dashboard({
  callerName,
  callerRole,
  onLogoutCaller,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    callerRole === 'Developer' ? 'projects' : callerRole === 'Auditor' ? 'audit' : 'dialer'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('sidebar_collapsed') === 'true';
      setIsSidebarCollapsed(val);
    }
  }, []);
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

  // Leaderboard statistics state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Callback alarms notifications state
  const [callbackAlarms, setCallbackAlarms] = useState<any[]>([]);
  // Callback selected lead to load in Dialer Tab
  const [activeLeadId, setActiveLeadId] = useState<number | null>(null);
  // Source lead query to load in Directory Tab
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>('');

  useEffect(() => {
    void loadCallerMetrics();
    void sweepExpiredLocksAction();
    // Refresh count values every 30 seconds for live updates
    const interval = setInterval(() => {
      void loadCallerMetrics();
      void sweepExpiredLocksAction();
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
    const leaderRes = await getTeamLeaderboardAction();
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
    if (leaderRes.success && leaderRes.leaderboard) {
      setLeaderboard(leaderRes.leaderboard);
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
      {/* Global Toast & Confirm Dialog Layer */}
      <AppDialogs />

      {/* Background Gradients (Light theme) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-50/80 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Top Bar */}
      <header className="h-[60px] md:hidden bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm font-display">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xs font-black uppercase tracking-widest text-slate-850">
          Call-OS CRM
        </h1>
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase border border-indigo-100">
          {callerName[0]}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-screen overflow-hidden z-10">
        
        {/* Sidebar Backdrop Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/45 z-35 md:hidden transition-all duration-300 backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Navigation Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 bg-white p-5 flex flex-col gap-6 shadow-2xl transition-all duration-300 transform md:relative md:translate-x-0 md:shadow-none md:border-r md:border-slate-200/80 md:bg-white/70 md:backdrop-blur-md shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isSidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 md:p-5'}
        `}>
          
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end">
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo Brand Header */}
          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-display font-extrabold text-sm tracking-tighter shrink-0">
                  OS
                </div>
                {!isSidebarCollapsed && (
                  <h2 className="font-display text-xs font-black uppercase tracking-widest text-slate-850">
                    Call-OS CRM
                  </h2>
                )}
              </div>
              
              {/* Collapse/Expand Toggle Button for Desktop */}
              <button
                onClick={() => {
                  const newVal = !isSidebarCollapsed;
                  setIsSidebarCollapsed(newVal);
                  localStorage.setItem('sidebar_collapsed', String(newVal));
                }}
                className="hidden md:block p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-4.5 h-4.5" />
                ) : (
                  <ChevronLeft className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">
                  Caller: <strong className="text-slate-800">{callerName}</strong> ({callerRole})
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Nav Buttons */}
          <nav className="flex-1 flex flex-col gap-2 font-body text-xs font-semibold">
            {['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('dialer'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'dialer'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Outbound Dialer" : ""}
              >
                <Phone className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Outbound Dialer</span>}
                {!isSidebarCollapsed && counts.total > 0 && (
                  <span className="ml-auto text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {counts.total}
                  </span>
                )}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('pipeline'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'pipeline'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Deal Pipeline" : ""}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Deal Pipeline</span>}
                {!isSidebarCollapsed && counts.converted > 0 && (
                  <span className="ml-auto text-[9px] bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {counts.converted}
                  </span>
                )}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Auditor', 'Viewer'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('directory'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'directory'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Directory Grid" : ""}
              >
                <Folder className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Directory Grid</span>}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Developer'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('projects'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'projects'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Active Projects" : ""}
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Active Projects</span>}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer', 'Auditor'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('commissions'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'commissions'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Commissions Ledger" : ""}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Commissions Ledger</span>}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('disputes'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'disputes'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Dispute Center" : ""}
              >
                <Scale className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Dispute Center</span>}
              </button>
            )}

            {['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer', 'Auditor'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('audit'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'audit'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Call Activity Feed" : ""}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Call Activity Feed</span>}
              </button>
            )}

            {['Admin', 'Supervisor'].includes(callerRole) && (
              <button
                onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  activeTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-750 font-bold border-l-4 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-855 hover:bg-slate-50/50'
                }`}
                title={isSidebarCollapsed ? "Admin Settings" : ""}
              >
                <Shield className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Admin Settings</span>}
              </button>
            )}
          </nav>

          {/* Caller Performance Targets Tracker */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3.5">
            {!isSidebarCollapsed && (
              <>
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
              </>
            )}

            <button
              onClick={onLogoutCaller}
              className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 text-slate-550 hover:text-rose-700 hover:bg-rose-50/30 transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer ${
                isSidebarCollapsed ? 'px-0 border-none' : ''
              }`}
              title={isSidebarCollapsed ? "Logout Session" : ""}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>LOGOUT SESSION</span>}
            </button>
          </div>
        </aside>

        {/* Dynamic View Box */}
        <main className="flex-1 overflow-hidden p-3 md:p-6 flex flex-col gap-4 md:gap-6">
          


          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'dialer' && ['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller'].includes(callerRole) && (
              <DialerTab 
                callerName={callerName} 
                callerRole={callerRole}
                activeLeadId={activeLeadId}
                onClearActiveLeadId={() => setActiveLeadId(null)}
              />
            )}
            
            {activeTab === 'pipeline' && ['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer'].includes(callerRole) && (
              <PipelineTab 
                callerName={callerName} 
                onViewSourceLead={(companyName: string) => {
                  setDirectorySearchQuery(companyName);
                  setActiveTab('directory');
                }}
              />
            )}
            
            {activeTab === 'directory' && ['Admin', 'Manager', 'Supervisor', 'Auditor', 'Viewer'].includes(callerRole) && (
              <DirectoryTab 
                callerName={callerName} 
                callerRole={callerRole} 
                searchQuery={directorySearchQuery}
                onClearSearchQuery={() => setDirectorySearchQuery('')}
              />
            )}

            {activeTab === 'projects' && ['Admin', 'Manager', 'Supervisor', 'Developer'].includes(callerRole) && (
              <ProjectsTab callerName={callerName} callerRole={callerRole} />
            )}

            {activeTab === 'commissions' && ['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer', 'Auditor'].includes(callerRole) && (
              <CommissionsTab callerName={callerName} callerRole={callerRole} />
            )}

            {activeTab === 'disputes' && ['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller'].includes(callerRole) && (
              <DisputesTab callerName={callerName} callerRole={callerRole} />
            )}

            {activeTab === 'audit' && ['Admin', 'Manager', 'Supervisor', 'Closer', 'Caller', 'Viewer', 'Auditor'].includes(callerRole) && (
              <AuditLogsTable />
            )}

            {activeTab === 'admin' && isAdminOrSupervisor && (
              <AdminTab callerName={callerName} callerRole={callerRole} />
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
