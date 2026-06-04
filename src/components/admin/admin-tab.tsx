'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, FileSpreadsheet, Send, ShieldAlert, FileDown, Trash2, Key, CheckCircle, 
  RefreshCcw, Loader2, ArrowRight, ClipboardList, Database, UserPlus, BarChart3, TrendingUp
} from 'lucide-react';
import { CsvImporter } from './csv-importer';
import { getCallerProfiles } from '@/app/actions/auth';
import { getAnalytics } from '@/app/actions/leads';
import {
  updateCallerTargets,
  deleteCallerProfile,
  getAuditLogs,
  assignLeadsByRange,
  assignLeadsByRegion,
  assignLeadsByPriority,
  clearAssignments,
  splitLeadsEqually,
  downloadFullBackup,
  resetCampaign,
  getTeamApplications,
  handleApplicationDecision,
  updateProfilePinAction,
  createCallerDirectlyAction,
  updateCallerRoleAction,
  undoLastImport
} from '@/app/actions/admin';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { toast, confirm } from '@/lib/toast';

type AdminTabProps = {
  callerName: string;
};

type AdminSubTab = 'analytics' | 'allocation' | 'csv' | 'callers' | 'maintenance';

export function AdminTab({ callerName }: AdminTabProps) {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('analytics');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Callers lists
  const [profiles, setProfiles] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Allocation Forms
  const [allocCaller, setAllocCaller] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<number | ''>('');
  const [rangeEnd, setRangeEnd] = useState<number | ''>('');
  const [rangeForce, setRangeForce] = useState<boolean>(false);
  const [allocRegion, setAllocRegion] = useState<string>('');
  const [allocPriority, setAllocPriority] = useState<number | ''>('');

  // Profile Edit Forms
  const [editingCaller, setEditingCaller] = useState<any | null>(null);
  const [editDaily, setEditDaily] = useState<number>(80);
  const [editWeekly, setEditWeekly] = useState<number>(15);
  const [editPin, setEditPin] = useState<string>('');
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState<boolean>(false);

  // Application Accept Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appPin, setAppPin] = useState<string>('');

  // Direct Caller Creation Form State
  const [isCreateCallerOpen, setIsCreateCallerOpen] = useState<boolean>(false);
  const [newCallerName, setNewCallerName] = useState<string>('');
  const [newCallerGender, setNewCallerGender] = useState<string>('male');
  const [newCallerRole, setNewCallerRole] = useState<string>('Caller');
  const [newCallerPin, setNewCallerPin] = useState<string>('');
  const [newCallerDaily, setNewCallerDaily] = useState<number>(80);
  const [newCallerWeekly, setNewCallerWeekly] = useState<number>(15);

  // Portal master PIN update form state
  const [portalPinInput, setPortalPinInput] = useState<string>('');

  // Maintenance Form
  const [resetPinInput, setResetPinInput] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await getAnalytics();
        if (res.success && res.stats) {
          setAnalytics(res.stats);
        }
      } else if (activeTab === 'callers') {
        const pRes = await getCallerProfiles();
        const aRes = await getTeamApplications();
        if (pRes.success) setProfiles(pRes.profiles || []);
        if (aRes.success) setApplications(aRes.applications || []);
      } else if (activeTab === 'maintenance') {
        const lRes = await getAuditLogs();
        if (lRes.success) setAuditLogs(lRes.logs || []);
      } else if (activeTab === 'allocation') {
        const pRes = await getCallerProfiles();
        if (pRes.success) {
          setProfiles(pRes.profiles || []);
          if (pRes.profiles?.length > 0 && !allocCaller) {
            setAllocCaller(pRes.profiles[0].name);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSplitEqually = async () => {
    setLoading(true);
    setStatusMessage(null);
    const res = await splitLeadsEqually(callerName);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Successfully split unassigned leads! Assigned ${res.totalAssigned} leads equally to callers.` });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to split leads.' });
    }
  };

  const handleClearAssignments = async () => {
    const ok = await confirm('Clear ALL caller assignments for uncalled leads? This does not alter leads already called.', {
      title: 'Clear Assignments',
      confirmLabel: 'Clear All',
      danger: true,
    });
    if (!ok) return;
    setLoading(true);
    setStatusMessage(null);
    const res = await clearAssignments(callerName);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Cleared all caller allocations for uncalled leads successfully.' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to clear assignments.' });
    }
  };

  const handleAssignRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocCaller || !rangeStart || !rangeEnd) return;
    setLoading(true);
    setStatusMessage(null);
    const res = await assignLeadsByRange(callerName, allocCaller, Number(rangeStart), Number(rangeEnd), rangeForce);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Successfully assigned ID range #${rangeStart} to #${rangeEnd} to ${allocCaller}!` });
      setRangeStart('');
      setRangeEnd('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Range assignment failed.' });
    }
  };

  const handleAssignRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocCaller || !allocRegion) return;
    setLoading(true);
    setStatusMessage(null);
    const res = await assignLeadsByRegion(callerName, allocCaller, allocRegion);
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Successfully allocated region matches "${allocRegion}" to ${allocCaller}!` });
      setAllocRegion('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Regional assignment failed.' });
    }
  };

  const handleAssignPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocCaller || !allocPriority) return;
    setLoading(true);
    setStatusMessage(null);
    const res = await assignLeadsByPriority(callerName, allocCaller, Number(allocPriority));
    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Successfully allocated priority ${allocPriority} leads to ${allocCaller}!` });
      setAllocPriority('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Priority assignment failed.' });
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaller) return;
    setLoading(true);
    const res = await updateCallerTargets(editingCaller.name, editDaily, editWeekly);
    setLoading(false);
    if (res.success) {
      setIsTargetsOpen(false);
      setEditingCaller(null);
      void loadData();
    } else {
      toast.error(`Targets update failed: ${res.error}`);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaller) return;
    if (editPin.length !== 6 || isNaN(Number(editPin))) {
      toast.warning('PIN must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    const res = await updateProfilePinAction(editingCaller.name, editPin);
    setLoading(false);
    if (res.success) {
      setIsPinOpen(false);
      setEditingCaller(null);
      setEditPin('');
      toast.success(`PIN updated for ${editingCaller.name}.`);
    } else {
      toast.error(`Failed to update PIN: ${res.error}`);
    }
  };

  const handleUpdatePortalPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalPinInput.length !== 6 || isNaN(Number(portalPinInput))) {
      toast.warning('Portal PIN must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    const res = await updateProfilePinAction('PORTAL', portalPinInput);
    setLoading(false);
    if (res.success) {
      setPortalPinInput('');
      toast.success('Master Portal PIN updated successfully!');
    } else {
      toast.error(`Failed to update Master PIN: ${res.error}`);
    }
  };

  const handleCreateCallerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCallerName || !newCallerPin) return;
    if (newCallerPin.length !== 6 || isNaN(Number(newCallerPin))) {
      toast.warning('PIN must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    const res = await createCallerDirectlyAction({
      name: newCallerName,
      gender: newCallerGender,
      pin: newCallerPin,
      role: newCallerRole,
      daily_call_target: newCallerDaily,
      weekly_appointment_target: newCallerWeekly
    });
    setLoading(false);

    if (res.success) {
      setIsCreateCallerOpen(false);
      setNewCallerName('');
      setNewCallerPin('');
      setNewCallerDaily(80);
      setNewCallerWeekly(15);
      void loadData();
      toast.success(`Caller profile created: ${newCallerName}.`);
    } else {
      toast.error(`Failed to create caller: ${res.error}`);
    }
  };

  const handleUndoImportSubmit = async () => {
    const ok = await confirm('Permanently delete all leads from the last imported CSV batch? This cannot be undone.', {
      title: 'Undo Last CSV Import',
      danger: true,
      confirmLabel: 'Undo Import',
    });
    if (!ok) return;
    
    setLoading(true);
    const res = await undoLastImport(callerName);
    setLoading(false);

    if (res.success) {
      toast.success('Last CSV import batch successfully reverted.');
    } else {
      toast.error(`Undo failed: ${res.error}`);
    }
  };

  const handleDeleteProfile = async (name: string) => {
    if (name === 'Hamid') {
      toast.warning('Administrator Hamid cannot be deleted.');
      return;
    }
    const ok = await confirm(`Permanently delete profile for ${name}? All associated locks will be released.`, {
      title: 'Delete Caller Profile',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setLoading(true);
    const res = await deleteCallerProfile(name);
    setLoading(false);
    if (res.success) {
      toast.success(`Profile for ${name} deleted.`);
      void loadData();
    } else {
      toast.error(`Deletion failed: ${res.error}`);
    }
  };

  const handleApplicationDecisionSubmit = async (appId: number, status: 'Accepted' | 'Rejected') => {
    if (status === 'Accepted') {
      if (appPin.length !== 6 || isNaN(Number(appPin))) {
        toast.warning('PIN must be exactly 6 digits.');
        return;
      }
      setLoading(true);
      const res = await handleApplicationDecision(appId, status, appPin);
      setLoading(false);
      if (res.success) {
        setSelectedApp(null);
        setAppPin('');
        void loadData();
      } else {
        toast.error(`Failed to accept applicant: ${res.error}`);
      }
    } else {
      const ok = await confirm('Reject and permanently delete this registration application?', {
        title: 'Reject Application',
        danger: true,
        confirmLabel: 'Reject',
      });
      if (!ok) return;
      setLoading(true);
      const res = await handleApplicationDecision(appId, status);
      setLoading(false);
      if (res.success) {
        void loadData();
      } else {
        toast.error(`Rejection failed: ${res.error}`);
      }
    }
  };

  const handleExportBackup = async () => {
    setLoading(true);
    const res = await downloadFullBackup(callerName);
    setLoading(false);
    if (res.success && res.backup) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `call_os_backup_${new Date().toISOString().substring(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      toast.error(`Backup download failed: ${res.error}`);
    }
  };

  const handleResetCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinInput) return;
    const ok = await confirm('This resets the ENTIRE outbound campaign. All call statuses, meeting dates, notes, and call history will be PERMANENTLY deleted. This cannot be undone.', {
      title: 'CRITICAL: Reset Campaign',
      danger: true,
      confirmLabel: 'Yes, Reset Everything',
    });
    if (!ok) return;

    setResetLoading(true);
    const res = await resetCampaign(resetPinInput, callerName);
    setResetLoading(false);

    if (res.success) {
      toast.success('Campaign database completely reset to fresh status.');
      setResetPinInput('');
      void loadData();
    } else {
      toast.error(`Reset failed: ${res.error}`);
    }
  };

  const formatPercentage = (num: number, den: number) => {
    if (!den) return 0;
    return Math.min(100, Math.round((num / den) * 100));
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-1 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeTab === 'analytics' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Campaign Analytics
          </div>
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeTab === 'allocation' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" />
            Lead Allocation
          </div>
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeTab === 'csv' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV Batch Importer
          </div>
        </button>
        <button
          onClick={() => setActiveTab('callers')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeTab === 'callers' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Callers & Registrations
          </div>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 ${
            activeTab === 'maintenance' ? 'border-indigo-650 text-indigo-700' : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Audits & Maintenance
          </div>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 font-body text-xs ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-rose-50 text-rose-800 border-rose-250'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* RENDER VIEWS */}
      {loading && !analytics && !profiles.length && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && activeTab === 'analytics' && analytics && (
        <div className="flex flex-col gap-6 max-w-5xl">
          {/* Main KPI scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Available database</span>
                <h3 className="text-xl font-black text-slate-800 font-display mt-0.5">{analytics.totalLeads}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Database className="w-5 h-5" />
              </div>
            </div>
            
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Handled outreach</span>
                <h3 className="text-xl font-black text-slate-800 font-display mt-0.5">{analytics.totalCalled}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Outbound calls today</span>
                <h3 className="text-xl font-black text-slate-800 font-display mt-0.5">{analytics.callsToday}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 animate-pulse">
                <RefreshCcw className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Rates conversion grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Campaign Performance Rates
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              
              {/* Coverage rate */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Coverage Rate</span>
                <div className="text-lg font-black text-indigo-750">{formatPercentage(analytics.totalCalled, analytics.totalLeads)}%</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-650" style={{ width: `${formatPercentage(analytics.totalCalled, analytics.totalLeads)}%` }} />
                </div>
              </div>

              {/* Conversion rate */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Conversion Rate</span>
                <div className="text-lg font-black text-emerald-600">{formatPercentage(analytics.statuses.converted, analytics.totalCalled)}%</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${formatPercentage(analytics.statuses.converted, analytics.totalCalled)}%` }} />
                </div>
              </div>

              {/* Positive outcome rate */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Positive Outcome</span>
                <div className="text-lg font-black text-blue-600">{formatPercentage(analytics.statuses.interested + analytics.statuses.converted, analytics.totalCalled)}%</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${formatPercentage(analytics.statuses.interested + analytics.statuses.converted, analytics.totalCalled)}%` }} />
                </div>
              </div>

              {/* Unreachable rate */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Unreachable Rate</span>
                <div className="text-lg font-black text-slate-500">{formatPercentage(analytics.statuses.noAnswer, analytics.totalCalled)}%</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${formatPercentage(analytics.statuses.noAnswer, analytics.totalCalled)}%` }} />
                </div>
              </div>

              {/* Refusal rate */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Refusal Rate</span>
                <div className="text-lg font-black text-rose-600">{formatPercentage(analytics.statuses.notInterested + analytics.statuses.wrongNumber, analytics.totalCalled)}%</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${formatPercentage(analytics.statuses.notInterested + analytics.statuses.wrongNumber, analytics.totalCalled)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown Horizontal List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Status Distribution Breakdown</h4>
            
            <div className="flex flex-col gap-3 font-body text-xs text-slate-650">
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold">
                  <span>Fresh Active Leads (Not Called)</span>
                  <span>{analytics.statuses.notCalled} / {analytics.totalLeads}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-650" style={{ width: `${formatPercentage(analytics.statuses.notCalled, analytics.totalLeads)}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold">
                  <span>Interested Clients</span>
                  <span>{analytics.statuses.interested}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${formatPercentage(analytics.statuses.interested, analytics.totalCalled)}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold">
                  <span>Callbacks / Appointments Scheduled</span>
                  <span>{analytics.statuses.callback}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${formatPercentage(analytics.statuses.callback, analytics.totalCalled)}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Converted Deals / Closed Clients</span>
                  <span>{analytics.statuses.converted}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${formatPercentage(analytics.statuses.converted, analytics.totalCalled)}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold">
                  <span>Unreachable (Busy / No Answer)</span>
                  <span>{analytics.statuses.noAnswer}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${formatPercentage(analytics.statuses.noAnswer, analytics.totalCalled)}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-bold text-rose-800">
                  <span>Refused (Not Interested)</span>
                  <span>{analytics.statuses.notInterested}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-450" style={{ width: `${formatPercentage(analytics.statuses.notInterested, analytics.totalCalled)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="flex flex-col gap-6 max-w-5xl">
          {/* Quick splitter buttons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div>
                <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">Equal Range Split</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Split all unassigned active database leads equally among available callers</p>
              </div>
              <Button onClick={handleSplitEqually} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl self-start text-xs cursor-pointer">
                SPLIT ACTIVE LEADS EQUALLY
              </Button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div>
                <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">Clear Assignments</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Remove caller allocations locks on all active uncalled leads</p>
              </div>
              <Button onClick={handleClearAssignments} disabled={loading} variant="secondary" className="border-rose-200 text-rose-700 hover:bg-rose-50/50 py-2 px-4 rounded-xl self-start text-xs cursor-pointer">
                CLEAR ALL ACTIVE ALLOCATIONS
              </Button>
            </div>
          </div>

          {/* Core allocation forms grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* By ID Range */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Allocate by ID Range</h4>
              <form onSubmit={handleAssignRange} className="flex flex-col gap-4 font-body text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Assign To Caller</label>
                  <select
                    value={allocCaller}
                    onChange={(e) => setAllocCaller(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    {profiles.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Start ID</label>
                    <Input
                      type="number"
                      required
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">End ID</label>
                    <Input
                      type="number"
                      required
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[9.5px] text-slate-500 font-bold uppercase cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rangeForce}
                    onChange={(e) => setRangeForce(e.target.checked)}
                    className="rounded border-slate-350 text-indigo-650"
                  />
                  <span>Overwrite existing allocations</span>
                </label>

                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                  ASSIGN RANGE
                </Button>
              </form>
            </div>

            {/* By Region */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Allocate by Region</h4>
              <form onSubmit={handleAssignRegion} className="flex flex-col gap-4 font-body text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Assign To Caller</label>
                  <select
                    value={allocCaller}
                    onChange={(e) => setAllocCaller(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    {profiles.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Region Matches (e.g. Algiers)</label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter area region query..."
                    value={allocRegion}
                    onChange={(e) => setAllocRegion(e.target.value)}
                  />
                </div>

                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-3">
                  ASSIGN REGION
                </Button>
              </form>
            </div>

            {/* By Priority */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Allocate by Priority</h4>
              <form onSubmit={handleAssignPriority} className="flex flex-col gap-4 font-body text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Assign To Caller</label>
                  <select
                    value={allocCaller}
                    onChange={(e) => setAllocCaller(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    {profiles.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase">Priority Tier</label>
                  <select
                    value={allocPriority}
                    onChange={(e) => setAllocPriority(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <option value="">Select Priority...</option>
                    <option value="1">Priority 1 (High Socials, No Web)</option>
                    <option value="2">Priority 2 (High Reviews, Low Web)</option>
                    <option value="3">Priority 3 (Medium Standard)</option>
                    <option value="4">Priority 4 (Low)</option>
                    <option value="5">Priority 5 (Lowest)</option>
                  </select>
                </div>

                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-3">
                  ASSIGN PRIORITY
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="max-w-5xl flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              onClick={handleUndoImportSubmit}
              disabled={loading}
              variant="secondary"
              className="border-rose-250 text-rose-700 hover:bg-rose-50 font-bold uppercase text-[10px]"
            >
              Undo Last Import
            </Button>
          </div>
          <CsvImporter adminName={callerName} onImportComplete={() => {}} />
        </div>
      )}

      {activeTab === 'callers' && (
        <div className="flex flex-col gap-6 max-w-5xl">
          {/* Caller Targets Profiles Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider">Caller Accounts & Targets</h4>
              <Button
                onClick={() => setIsCreateCallerOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg"
              >
                + Create Caller
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-body text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-display text-[9px] text-slate-450 uppercase font-bold tracking-wider">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">System Role (Change Inline)</th>
                    <th className="px-4 py-2.5">Daily Target</th>
                    <th className="px-4 py-2.5">Weekly Target</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-bold uppercase text-slate-800">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.name === 'Hamid' ? (
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">{p.role}</span>
                        ) : (
                          <select
                            value={p.role}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              setProfiles(prev => prev.map(prof => prof.name === p.name ? { ...prof, role: newRole } : prof));
                              const res = await updateCallerRoleAction(p.name, newRole);
                              if (!res.success) {
                                toast.error(`Failed to update role: ${res.error}`);
                                void loadData();
                              }
                            }}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-705 cursor-pointer outline-none"
                          >
                            <option value="Caller">Caller</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{p.daily_call_target} calls</td>
                      <td className="px-4 py-3 font-semibold">{p.weekly_appointment_target} appointments</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCaller(p);
                              setEditDaily(p.daily_call_target);
                              setEditWeekly(p.weekly_appointment_target);
                              setIsTargetsOpen(true);
                            }}
                            className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-150 transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
                          >
                            TARGETS
                          </button>
                          <button
                            onClick={() => {
                              setEditingCaller(p);
                              setEditPin('');
                              setIsPinOpen(true);
                            }}
                            className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-150 transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
                          >
                            SET PIN
                          </button>
                          {p.name !== 'Hamid' && (
                            <button
                              onClick={() => handleDeleteProfile(p.name)}
                              className="p-1.5 rounded bg-slate-50 border border-transparent text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Pending Caller Registrations</h4>
            
            {applications.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                <UserPlus className="w-6 h-6 text-slate-350 mx-auto mb-1.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">No pending registrations found</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-body text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-display text-[9px] text-slate-450 uppercase font-bold tracking-wider">
                      <th className="px-4 py-2.5">Candidate Name</th>
                      <th className="px-4 py-2.5">Gender</th>
                      <th className="px-4 py-2.5">Submitted Date</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                        <td className="px-4 py-3 font-bold uppercase text-slate-800">{app.name}</td>
                        <td className="px-4 py-3 capitalize">{app.gender}</td>
                        <td className="px-4 py-3 text-slate-400 text-[10px]">{new Date(app.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            app.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : app.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {app.status === 'Pending' && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setAppPin('');
                                }}
                                className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-650 hover:text-white transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => handleApplicationDecisionSubmit(app.id, 'Rejected')}
                                className="p-1 rounded bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-650 hover:text-white transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
                              >
                                REJECT
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="flex flex-col gap-6 max-w-5xl">
          {/* Backup & reset cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div>
                <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">JSON System Backup</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider font-body">Export a full backup file containing all leads, history, and metadata</p>
              </div>
              <Button onClick={handleExportBackup} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl self-start text-xs cursor-pointer flex items-center gap-1.5">
                <FileDown className="w-4 h-4" />
                DOWNLOAD JSON BACKUP
              </Button>
            </div>

            {/* Portal Master PIN form */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div>
                <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">Update Portal Master PIN</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider font-body font-normal">Set the 6-digit numeric passcode to access the CRM portal</p>
              </div>
              <form onSubmit={handleUpdatePortalPin} className="flex gap-2 items-center">
                <Input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="New passcode..."
                  value={portalPinInput}
                  onChange={(e) => setPortalPinInput(e.target.value.replace(/\D/g, ''))}
                  className="bg-white max-w-[150px]"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2"
                >
                  CHANGE PIN
                </Button>
              </form>
            </div>

            <div className="p-5 bg-rose-50/20 border border-rose-250/70 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div>
                <h4 className="font-display font-bold text-rose-800 uppercase tracking-wide text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Campaign Danger Zone
                </h4>
                <p className="text-[10px] text-rose-900/60 mt-0.5 font-semibold uppercase tracking-wider font-body font-normal">Reset entire dialing status parameters. Clears call records.</p>
              </div>
              <form onSubmit={handleResetCampaign} className="flex gap-2 items-center">
                <Input
                  type="password"
                  required
                  placeholder="Admin Reset PIN..."
                  value={resetPinInput}
                  onChange={(e) => setResetPinInput(e.target.value)}
                  className="bg-white max-w-[160px] border-rose-200 text-rose-850 focus:border-rose-550"
                />
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2"
                >
                  {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'RESET DATABASE'}
                </Button>
              </form>
            </div>
          </div>

          {/* Audit Logs list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-650" />
              Security & Actions Audit Logs
            </h4>
            
            <div className="overflow-y-auto max-h-[350px] border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse font-body text-[11px] text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-display text-[9px] text-slate-450 uppercase font-bold tracking-wider sticky top-0">
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">Actor</th>
                    <th className="px-4 py-2">Event Action</th>
                    <th className="px-4 py-2">Event Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-55 hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-indigo-650">{log.caller_name}</td>
                      <td className="px-4 py-2 font-extrabold uppercase text-[9px] text-slate-50">{log.action_type}</td>
                      <td className="px-4 py-2 font-medium">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Targets Edit Modal */}
      {isTargetsOpen && editingCaller && (
        <Modal
          isOpen={isTargetsOpen}
          onClose={() => { setIsTargetsOpen(false); setEditingCaller(null); }}
          title={`Edit Targets: ${editingCaller.name}`}
          subtitle="Configure outbound calls and scheduled booking targets"
        >
          <form onSubmit={handleSaveTargets} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Daily Call Volume Target</label>
              <Input
                type="number"
                required
                value={editDaily}
                onChange={(e) => setEditDaily(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Weekly Appointments Target</label>
              <Input
                type="number"
                required
                value={editWeekly}
                onChange={(e) => setEditWeekly(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => { setIsTargetsOpen(false); setEditingCaller(null); }}>
                CANCEL
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                SAVE TARGETS
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PIN Edit Modal */}
      {isPinOpen && editingCaller && (
        <Modal
          isOpen={isPinOpen}
          onClose={() => { setIsPinOpen(false); setEditingCaller(null); setEditPin(''); }}
          title={`Change PIN: ${editingCaller.name}`}
          subtitle="Enter a new 6-digit numeric access PIN"
        >
          <form onSubmit={handleSavePin} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">New Numeric PIN (6 Digits)</label>
              <Input
                type="password"
                required
                maxLength={6}
                placeholder="••••••"
                value={editPin}
                onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => { setIsPinOpen(false); setEditingCaller(null); setEditPin(''); }}>
                CANCEL
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                UPDATE PIN
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Application Approve Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => { setSelectedApp(null); setAppPin(''); }}
          title="Approve Candidate Application"
          subtitle={`Assign a new secure passcode PIN for candidate: ${selectedApp.name}`}
        >
          <div className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Secure Numeric PIN (6 Digits)</label>
              <Input
                type="password"
                required
                maxLength={6}
                placeholder="••••••"
                value={appPin}
                onChange={(e) => setAppPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => { setSelectedApp(null); setAppPin(''); }}>
                CANCEL
              </Button>
              <Button
                type="button"
                onClick={() => handleApplicationDecisionSubmit(selectedApp.id, 'Accepted')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                CONFIRM APPROVAL
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Direct Create Caller Modal */}
      {isCreateCallerOpen && (
        <Modal
          isOpen={isCreateCallerOpen}
          onClose={() => setIsCreateCallerOpen(false)}
          title="Create Caller Profile Directly"
          subtitle="Manually create a new team profile with targets and PIN passcode"
        >
          <form onSubmit={handleCreateCallerSubmit} className="flex flex-col gap-4 font-body text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Caller Name *</label>
              <Input
                type="text"
                required
                value={newCallerName}
                onChange={(e) => setNewCallerName(e.target.value)}
                placeholder="e.g. Oussama"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Gender *</label>
                <select
                  value={newCallerGender}
                  onChange={(e) => setNewCallerGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">System Role *</label>
                <select
                  value={newCallerRole}
                  onChange={(e) => setNewCallerRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <option value="Caller">Caller</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">6-Digit Access PIN *</label>
              <Input
                type="password"
                required
                maxLength={6}
                placeholder="••••••"
                value={newCallerPin}
                onChange={(e) => setNewCallerPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Daily Call Target</label>
                <Input
                  type="number"
                  required
                  value={newCallerDaily}
                  onChange={(e) => setNewCallerDaily(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase">Weekly Appointments Target</label>
                <Input
                  type="number"
                  required
                  value={newCallerWeekly}
                  onChange={(e) => setNewCallerWeekly(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateCallerOpen(false)}>
                CANCEL
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                CREATE CALLER
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
