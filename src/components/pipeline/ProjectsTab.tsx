'use client';

import React, { useEffect, useState } from 'react';
import { getProjectsAction, assignDeveloperAction, updateProjectChecklistAction, updateProjectStageAction } from '@/app/actions/projects';
import { getSupabase } from '@/lib/supabase';
import { Layers, User, CheckSquare, Calendar, Globe, ListTodo, Edit3, DollarSign } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { toast } from '@/lib/toast';
import { PaymentModal } from './PaymentModal';

type ProjectsTabProps = {
  callerName: string;
  callerRole: string;
};

const PROJECT_STAGES = [
  'Waiting Deposit',
  'Deposit Paid',
  'Waiting Content',
  'Content Received',
  'Design Started',
  'Development Started',
  'First Preview Ready',
  'Revision Round 1',
  'Revision Round 2',
  'Final Approval',
  'Waiting Final Payment',
  'Delivered',
  'Archived'
];

export function ProjectsTab({ callerName, callerRole }: ProjectsTabProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPreview, setEditingPreview] = useState<{ open: boolean; projectId: number | null; previewUrl: string }>({
    open: false,
    projectId: null,
    previewUrl: ''
  });
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    dealId: number | null;
    dealName: string;
    setupValue: number;
    paymentType: 'deposit' | 'final';
  }>({ open: false, dealId: null, dealName: '', setupValue: 0, paymentType: 'deposit' });

  const isManagement = ['Admin', 'Manager', 'Supervisor'].includes(callerRole);

  const loadProjects = async () => {
    setLoading(true);
    const res = await getProjectsAction();
    if (res.success && res.projects) {
      setProjects(res.projects);
    }
    setLoading(false);
  };

  const loadDevelopers = async () => {
    try {
      const db = getSupabase();
      const { data } = await db.from('caller_profiles').select('name').eq('role', 'Developer');
      setDevelopers(data || []);
    } catch (err) {
      console.error('[loadDevelopers] failed:', err);
    }
  };

  useEffect(() => {
    void loadProjects();
    if (isManagement) {
      void loadDevelopers();
    }
  }, [callerName, callerRole]);

  const handleAssignDeveloper = async (projectId: number, devName: string) => {
    if (!devName) return;
    const res = await assignDeveloperAction(projectId, devName);
    if (res.success) {
      toast.success(`Project assigned to developer ${devName}!`);
      void loadProjects();
    } else {
      toast.error('Failed to assign developer: ' + res.error);
    }
  };

  const handleStageChange = async (projectId: number, nextStage: string) => {
    const res = await updateProjectStageAction(projectId, nextStage);
    if (res.success) {
      toast.success(`Project stage updated to ${nextStage}!`);
      void loadProjects();
    } else {
      toast.error('Failed to update stage: ' + res.error);
    }
  };

  const handleChecklistToggle = async (projectId: number, key: string, currentVal: boolean) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Construct next checklist payload
    const nextChecklist = {
      ...(project.client_content_status || {}),
      [key]: !currentVal
    };

    const res = await updateProjectChecklistAction(projectId, nextChecklist);
    if (res.success) {
      toast.success('Checklist updated!');
      void loadProjects();
    } else {
      toast.error('Failed to update checklist: ' + res.error);
    }
  };

  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreview.projectId) return;

    // Read current stage of the project to preserve it
    const proj = projects.find(p => p.id === editingPreview.projectId);
    const currentStage = proj?.current_stage || 'Development Started';

    const res = await updateProjectStageAction(editingPreview.projectId, currentStage, editingPreview.previewUrl);
    if (res.success) {
      toast.success('Preview URL updated!');
      setEditingPreview({ open: false, projectId: null, previewUrl: '' });
      void loadProjects();
    } else {
      toast.error('Failed to update preview link: ' + res.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-body">
      <h3 className="font-display font-black text-xs text-slate-850 uppercase tracking-widest border-b border-slate-100 pb-3">
        ACTIVE PROJECTS HUBS & DEPLOYMENTS
      </h3>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs">
          Loading project workloads...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs">
          No project records found in pipeline.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((p) => {
            const checklist = p.client_content_status || {};
            const checklistItems = [
              { key: 'logo', label: 'Company Logo' },
              { key: 'agency_name', label: 'Agency Branding Name' },
              { key: 'phone', label: 'Phone Details' },
              { key: 'email', label: 'Email Outbox' },
              { key: 'social_links', label: 'Social Networks' },
              { key: 'images', label: 'Destination Images' },
            ];

            return (
              <GlassCard key={p.id} className="p-5 flex flex-col gap-4 relative overflow-hidden">
                {/* Background Decorator */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-2xl pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">
                      Deal: {p.deals?.deal_name || 'Unnamed Project'}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">
                      {p.package_type} Website Edition
                    </h4>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    p.current_stage === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    p.current_stage.includes('Started') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {p.current_stage}
                  </span>
                </div>

                {/* Developer assignment details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 border-y border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">Developer:</span>
                    <span className="text-indigo-650 font-bold">{p.assigned_developer_id || 'Unassigned'}</span>
                  </div>

                  {isManagement && (
                    <select
                      value={p.assigned_developer_id || ''}
                      onChange={(e) => handleAssignDeveloper(p.id, e.target.value)}
                      className="ml-auto bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 cursor-pointer focus:outline-none p-1"
                    >
                      <option value="">Assign Dev...</option>
                      {developers.map((d: any) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Stage switcher and Staging link for Developer */}
                <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-150/40">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-slate-400" /> Phase Stage</span>
                    <select
                      value={p.current_stage}
                      onChange={(e) => handleStageChange(p.id, e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 cursor-pointer focus:outline-none p-1"
                    >
                      {PROJECT_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-t border-slate-100 pt-2 mt-1">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" /> Staging Preview</span>
                    {p.preview_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={p.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-650 hover:underline font-bold"
                        >
                          View Site
                        </a>
                        <button
                          onClick={() => setEditingPreview({ open: true, projectId: p.id, previewUrl: p.preview_url || '' })}
                          className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPreview({ open: true, projectId: p.id, previewUrl: '' })}
                        className="text-[9.5px] font-bold text-indigo-650 hover:text-indigo-850 cursor-pointer uppercase"
                      >
                        Set Preview Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Content guidelines checklist */}
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-indigo-500" /> CONTENT GUIDELINES CHECKLIST
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-650 font-body">
                    {checklistItems.map(item => {
                      const value = Boolean(checklist[item.key]);
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleChecklistToggle(p.id, item.key, value)}
                          className="flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            readOnly
                            className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Actions — Admin/Manager only */}
                {isManagement && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" /> PAYMENTS
                    </span>
                    <div className="flex gap-2 ml-auto">
                      {(p.current_stage === 'Waiting Deposit' || p.current_stage === 'Deposit Paid') && (
                        <button
                          onClick={() => setPaymentModal({
                            open: true,
                            dealId: p.deal_id,
                            dealName: p.deals?.deal_name || 'Unnamed Deal',
                            setupValue: Number(p.deals?.setup_value || 0),
                            paymentType: 'deposit'
                          })}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wide cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <DollarSign className="w-3 h-3" /> Deposit
                        </button>
                      )}
                      {(p.current_stage === 'Waiting Final Payment' || p.current_stage === 'Final Approval') && (
                        <button
                          onClick={() => setPaymentModal({
                            open: true,
                            dealId: p.deal_id,
                            dealName: p.deals?.deal_name || 'Unnamed Deal',
                            setupValue: Number(p.deals?.setup_value || 0),
                            paymentType: 'final'
                          })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wide cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <DollarSign className="w-3 h-3" /> Final Payment
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates display */}
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold uppercase mt-1.5 border-t border-slate-100 pt-2.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Start: {new Date(p.created_at).toLocaleDateString()}</span>
                  {p.delivered_at && (
                    <span className="ml-auto text-emerald-650 font-bold">Delivered: {new Date(p.delivered_at).toLocaleDateString()}</span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* URL Submission Modal */}
      {editingPreview.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Submit Live Preview Link
            </h3>
            <form onSubmit={handlePreviewSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Staging Preview URL</span>
                <input
                  type="url"
                  required
                  placeholder="https://travelagency-staging.vercel.app/"
                  value={editingPreview.previewUrl}
                  onChange={(e) => setEditingPreview({ ...editingPreview, previewUrl: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium"
                />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setEditingPreview({ open: false, projectId: null, previewUrl: '' })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-650 text-white font-bold text-[10px] uppercase hover:bg-indigo-700 cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.dealId && (
        <PaymentModal
          dealId={paymentModal.dealId}
          dealName={paymentModal.dealName}
          setupValue={paymentModal.setupValue}
          paymentType={paymentModal.paymentType}
          onClose={() => setPaymentModal({ open: false, dealId: null, dealName: '', setupValue: 0, paymentType: 'deposit' })}
          onSuccess={() => void loadProjects()}
        />
      )}
    </div>
  );
}
