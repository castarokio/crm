'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileSpreadsheet, Send, ShieldAlert, FileDown, Trash2, Key, CheckCircle, RefreshCcw, Loader2, ArrowRight, ClipboardList, Database, UserPlus } from 'lucide-react';
import { CsvImporter } from './csv-importer';
import { getCallerProfiles } from '@/app/actions/auth';
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
  updateProfilePinAction
} from '@/app/actions/admin';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';

type AdminTabProps = {
  callerName: string;
};

type AdminSubTab = 'allocation' | 'csv' | 'callers' | 'maintenance';

export function AdminTab({ callerName }: AdminTabProps) {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('allocation');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Maintenance Form
  const [resetPinInput, setResetPinInput] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'callers') {
        const pRes = await getCallerProfiles();
        const aRes = await getTeamApplications();
        if (pRes.success) setProfiles(pRes.profiles || []);
        if (aRes.success) setApplications(aRes.applications || []);
      } else if (activeTab === 'maintenance') {
        const lRes = await getAuditLogs();
        if (lRes.success) setAuditLogs(lRes.logs || []);
      } else if (activeTab === 'allocation') {
        // Fetch profiles to get target callers names dropdown
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
    if (!confirm('Are you sure you want to clear ALL caller assignments for uncalled leads? This does not alter leads already called.')) return;
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
      alert(`Targets update failed: ${res.error}`);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaller) return;
    if (editPin.length !== 6 || isNaN(Number(editPin))) {
      alert('PIN must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    const res = await updateProfilePinAction(editingCaller.name, editPin);
    setLoading(false);
    if (res.success) {
      setIsPinOpen(false);
      setEditingCaller(null);
      setEditPin('');
      alert(`Successfully updated PIN for ${editingCaller.name}`);
    } else {
      alert(`Failed to update PIN: ${res.error}`);
    }
  };

  const handleDeleteProfile = async (name: string) => {
    if (name === 'Hamid') {
      alert('Administrator Hamid cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete profile for ${name}? All associated locks will be released.`)) return;
    setLoading(true);
    const res = await deleteCallerProfile(name);
    setLoading(false);
    if (res.success) {
      void loadData();
    } else {
      alert(`Deletion failed: ${res.error}`);
    }
  };

  const handleApplicationDecisionSubmit = async (appId: number, status: 'Accepted' | 'Rejected') => {
    if (status === 'Accepted') {
      if (appPin.length !== 6 || isNaN(Number(appPin))) {
        alert('PIN must be exactly 6 digits.');
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
        alert(`Failed to accept applicant: ${res.error}`);
      }
    } else {
      if (!confirm('Reject and delete this registration application?')) return;
      setLoading(true);
      const res = await handleApplicationDecision(appId, status);
      setLoading(false);
      if (res.success) {
        void loadData();
      } else {
        alert(`Rejection failed: ${res.error}`);
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
      alert(`Backup download failed: ${res.error}`);
    }
  };

  const handleResetCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinInput) return;
    if (!confirm('CRITICAL WARNING: This resets the entire outbound dialing campaign. All lead calls status, meeting schedules, notes, and call history logs will be PERMANENTLY deleted. Are you absolutely sure?')) return;

    setResetLoading(true);
    const res = await resetCampaign(resetPinInput, callerName);
    setResetLoading(false);

    if (res.success) {
      alert('Campaign database has been completely reset to fresh status.');
      setResetPinInput('');
      void loadData();
    } else {
      alert(`Reset failed: ${res.error}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-1">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'allocation'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" />
            Lead Allocation
          </div>
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'csv'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV Batch Importer
          </div>
        </button>
        <button
          onClick={() => setActiveTab('callers')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'callers'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Callers & Registrations
          </div>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'maintenance'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-slate-450 hover:text-slate-700'
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
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
            : 'bg-rose-50 text-rose-800 border-rose-250'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Tab Render Views */}
      <div className="flex-1">
        {loading && activeTab !== 'csv' ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-450">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
              <span className="text-[10px] uppercase font-bold tracking-widest font-display">Syncing Database Settings...</span>
            </div>
          </div>
        ) : (
          <div>
            {/* VIEW 1: LEAD ALLOCATION */}
            {activeTab === 'allocation' && (
              <div className="flex flex-col gap-6 max-w-4xl">
                {/* Equal Split & Clear Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div>
                      <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">Equal Leads Split</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Split unassigned fresh leads equally among all active callers</p>
                    </div>
                    <Button onClick={handleSplitEqually} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl self-start text-xs cursor-pointer">
                      SPLIT LEADS EQUALLY
                    </Button>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div>
                      <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">Clear Allocations</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Remove allocations for uncalled leads (unlocks leads back to general queue)</p>
                    </div>
                    <Button onClick={handleClearAssignments} variant="secondary" className="text-rose-600 border-rose-100 hover:bg-rose-50 font-bold py-2 px-4 rounded-xl self-start text-xs cursor-pointer">
                      CLEAR ALL ASSIGNMENTS
                    </Button>
                  </div>
                </div>

                {/* Bulk assign forms */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                  <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Bulk Lead Allocators</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Range Allocator Form */}
                    <form onSubmit={handleAssignRange} className="flex flex-col gap-3 font-body text-xs">
                      <h5 className="font-bold text-slate-700 border-l-2 border-indigo-600 pl-2 uppercase text-[10px] tracking-wide">ID Range Allocator</h5>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Assign to Caller</label>
                        <select
                          value={allocCaller}
                          onChange={(e) => setAllocCaller(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Start ID</label>
                          <Input
                            type="number"
                            required
                            placeholder="e.g. 1"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value !== '' ? Number(e.target.value) : '')}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">End ID</label>
                          <Input
                            type="number"
                            required
                            placeholder="e.g. 100"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value !== '' ? Number(e.target.value) : '')}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id="rangeForce"
                          checked={rangeForce}
                          onChange={(e) => setRangeForce(e.target.checked)}
                          className="rounded text-indigo-600 border-slate-200"
                        />
                        <label htmlFor="rangeForce" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none">
                          Force reassign already locked/assigned leads
                        </label>
                      </div>
                      <Button type="submit" className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2 mt-1 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5">
                        ALLOCATE RANGE <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </form>

                    {/* Regional & Priority Allocation Form */}
                    <div className="flex flex-col gap-5">
                      <form onSubmit={handleAssignRegion} className="flex flex-col gap-3 font-body text-xs">
                        <h5 className="font-bold text-slate-700 border-l-2 border-indigo-600 pl-2 uppercase text-[10px] tracking-wide">Regional Allocator</h5>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Region Name</label>
                            <Input
                              type="text"
                              required
                              placeholder="e.g. Alger, Oran..."
                              value={allocRegion}
                              onChange={(e) => setAllocRegion(e.target.value)}
                            />
                          </div>
                          <Button type="submit" className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
                            ALLOCATE
                          </Button>
                        </div>
                      </form>

                      <form onSubmit={handleAssignPriority} className="flex flex-col gap-3 font-body text-xs">
                        <h5 className="font-bold text-slate-700 border-l-2 border-indigo-600 pl-2 uppercase text-[10px] tracking-wide">Priority Allocator</h5>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Leads Priority</label>
                            <select
                              value={allocPriority}
                              onChange={(e) => setAllocPriority(e.target.value !== '' ? Number(e.target.value) : '')}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs"
                            >
                              <option value="">Select Priority</option>
                              <option value="1">P1 (No Web, High Socials)</option>
                              <option value="2">P2 (High Reviews)</option>
                              <option value="3">P3 (Medium)</option>
                              <option value="4">P4 (Low)</option>
                              <option value="5">P5 (Lowest)</option>
                            </select>
                          </div>
                          <Button type="submit" className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
                            ALLOCATE
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: CSV IMPORTER */}
            {activeTab === 'csv' && (
              <CsvImporter adminName={callerName} onImportComplete={() => {}} />
            )}

            {/* VIEW 3: CALLERS & REGISTRATIONS */}
            {activeTab === 'callers' && (
              <div className="flex flex-col gap-6 max-w-5xl">
                {/* Caller targets profiles grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Caller Accounts & Targets</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-body text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-display text-[9px] text-slate-450 uppercase font-bold tracking-wider">
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">System Role</th>
                          <th className="px-4 py-2.5">Daily Target</th>
                          <th className="px-4 py-2.5">Weekly Target</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                            <td className="px-4 py-3 font-bold uppercase text-slate-800">{p.name}</td>
                            <td className="px-4 py-3 text-[10px] font-bold text-indigo-700 uppercase">{p.role}</td>
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

                {/* Team applications */}
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
                                      className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
                                    >
                                      APPROVE
                                    </button>
                                    <button
                                      onClick={() => handleApplicationDecisionSubmit(app.id, 'Rejected')}
                                      className="p-1 rounded bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition-all cursor-pointer font-bold text-[9px] uppercase px-2 py-1"
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

            {/* VIEW 4: AUDITS & MAINTENANCE */}
            {activeTab === 'maintenance' && (
              <div className="flex flex-col gap-6 max-w-5xl">
                {/* Backup & reset cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div>
                      <h4 className="font-display font-bold text-slate-800 uppercase tracking-wide text-xs">JSON System Backup</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Export a full backup file containing all leads, history, and metadata</p>
                    </div>
                    <Button onClick={handleExportBackup} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl self-start text-xs cursor-pointer flex items-center gap-1.5">
                      <FileDown className="w-4 h-4" />
                      DOWNLOAD JSON BACKUP
                    </Button>
                  </div>

                  <div className="p-5 bg-rose-50/20 border border-rose-250/70 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div>
                      <h4 className="font-display font-bold text-rose-800 uppercase tracking-wide text-xs flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        Campaign Danger Zone
                      </h4>
                      <p className="text-[10px] text-rose-900/60 mt-0.5 font-semibold uppercase tracking-wider">Reset entire dialing status parameters. Clears call records.</p>
                    </div>
                    <form onSubmit={handleResetCampaign} className="flex gap-2 items-center">
                      <Input
                        type="password"
                        required
                        placeholder="Admin Reset PIN..."
                        value={resetPinInput}
                        onChange={(e) => setResetPinInput(e.target.value)}
                        className="bg-white max-w-[180px] border-rose-200 text-rose-800 focus:border-rose-500"
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
                          <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2 text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-indigo-650">{log.caller_name}</td>
                            <td className="px-4 py-2 font-extrabold uppercase text-[9px] text-slate-500">{log.action_type}</td>
                            <td className="px-4 py-2 font-medium">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
