'use client';

import React, { useEffect, useState } from 'react';
import { getDisputesAction, fileDisputeAction, resolveDisputeAction } from '@/app/actions/disputes';
import { getSupabase } from '@/lib/supabase';
import { ShieldAlert, CheckCircle, Scale, Plus, ExternalLink, Calendar, User, MessageSquare } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { toast } from '@/lib/toast';

type DisputesTabProps = {
  callerName: string;
  callerRole: string;
};

export function DisputesTab({ callerName, callerRole }: DisputesTabProps) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / forms
  const [newDisputeModal, setNewDisputeModal] = useState({
    open: false,
    disputeType: 'ownership',
    leadId: '',
    explanation: '',
    proofUrl: ''
  });

  const [resolveModal, setResolveModal] = useState<{
    open: boolean;
    disputeId: number | null;
    decision: string;
    status: string;
  }>({
    open: false,
    disputeId: null,
    decision: '',
    status: 'Resolved'
  });

  const isAdminOrManager = callerRole === 'Admin' || callerRole === 'Manager';

  const loadDisputes = async () => {
    setLoading(true);
    const res = await getDisputesAction();
    if (res.success && res.disputes) {
      setDisputes(res.disputes);
    }
    setLoading(false);
  };

  const loadLeads = async () => {
    try {
      const db = getSupabase();
      // Fetch some recent leads for the dispute form dropdown
      const { data } = await db.from('leads').select('id, agency_name').order('created_at', { ascending: false }).limit(50);
      setLeads(data || []);
    } catch (err) {
      console.error('[loadLeads] failed:', err);
    }
  };

  useEffect(() => {
    void loadDisputes();
    void loadLeads();
  }, [callerName, callerRole]);

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisputeModal.leadId) {
      toast.error('Please select an associated lead.');
      return;
    }

    const res = await fileDisputeAction({
      disputeType: newDisputeModal.disputeType,
      leadId: parseInt(newDisputeModal.leadId, 10),
      explanation: newDisputeModal.explanation,
      proofUrl: newDisputeModal.proofUrl || undefined
    });

    if (res.success) {
      toast.success('Dispute filed successfully! Compliance auditing will review.');
      setNewDisputeModal({ open: false, disputeType: 'ownership', leadId: '', explanation: '', proofUrl: '' });
      void loadDisputes();
    } else {
      toast.error('Failed to submit dispute: ' + res.error);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModal.disputeId) return;

    const res = await resolveDisputeAction(resolveModal.disputeId, resolveModal.decision, resolveModal.status);
    if (res.success) {
      toast.success('Dispute resolution logged successfully!');
      setResolveModal({ open: false, disputeId: null, decision: '', status: 'Resolved' });
      void loadDisputes();
    } else {
      toast.error('Failed to resolve dispute: ' + res.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-body">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="font-display font-black text-xs text-slate-850 uppercase tracking-widest">
          DISPUTE CENTER & CLAIM RECONCILIATIONS
        </h3>
        <button
          onClick={() => setNewDisputeModal(prev => ({ ...prev, open: true }))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-[10px] uppercase cursor-pointer transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> File New Dispute
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs">
          Loading dispute cases...
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs bg-white rounded-3xl border border-slate-200/60">
          No dispute cases filed in system.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disputes.map((d) => (
            <GlassCard key={d.id} className="p-5 flex flex-col gap-3.5 border border-slate-200/50">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-widest">
                    Dispute ID #{d.id} | Type: {d.dispute_type.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">
                    Lead: {d.leads?.agency_name || 'Unnamed Company'}
                  </h4>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                  d.status === 'Resolved' || d.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  d.status === 'Open' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {d.status}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-650">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Explanation:</span>
                "{d.explanation}"
              </div>

              {/* Resolution outcome if available */}
              {d.decision && (
                <div className="bg-emerald-50/30 border border-emerald-150 rounded-xl p-3 text-xs leading-relaxed text-emerald-800">
                  <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide block mb-1">
                    Compliance Decision by {d.decided_by || 'Admin'}:
                  </span>
                  "{d.decision}"
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-2.5 text-[9px] text-slate-400 font-semibold uppercase border-t border-slate-100 pt-3 mt-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Opened by: {d.opened_by}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                <span>{new Date(d.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions panel */}
              <div className="flex items-center justify-end gap-2 mt-2">
                {d.proof_url && (
                  <a
                    href={d.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold border border-slate-200 transition-all uppercase text-[9px] tracking-wider inline-flex items-center gap-1.5"
                  >
                    View Proof <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {isAdminOrManager && d.status === 'Open' && (
                  <button
                    onClick={() => setResolveModal({ open: true, disputeId: d.id, decision: '', status: 'Resolved' })}
                    className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-bold transition-all uppercase text-[9px] tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" /> Resolve Claim
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* File Dispute Modal */}
      {newDisputeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Submit Guidelines / Payout Dispute
            </h3>
            <form onSubmit={handleOpenDispute} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Dispute Type</span>
                <select
                  value={newDisputeModal.disputeType}
                  onChange={(e) => setNewDisputeModal({ ...newDisputeModal, disputeType: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-semibold cursor-pointer"
                >
                  <option value="ownership">Lead Ownership Leases</option>
                  <option value="commission">Commission Payout Splitting</option>
                  <option value="payment_status">Client Payment Status</option>
                  <option value="duplicate_lead">Duplicate Lead Assignment</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Associated Lead / Account</span>
                <select
                  value={newDisputeModal.leadId}
                  onChange={(e) => setNewDisputeModal({ ...newDisputeModal, leadId: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-semibold cursor-pointer"
                >
                  <option value="">Select Lead...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.agency_name} (ID: {l.id})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Explanation of Dispute</span>
                <textarea
                  rows={4}
                  required
                  placeholder="Details of dispute. Include timelines, communication channels, and context."
                  value={newDisputeModal.explanation}
                  onChange={(e) => setNewDisputeModal({ ...newDisputeModal, explanation: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Screenshot Proof / Document Link (Optional)</span>
                <input
                  type="url"
                  placeholder="https://drive.google.com/proof.pdf"
                  value={newDisputeModal.proofUrl}
                  onChange={(e) => setNewDisputeModal({ ...newDisputeModal, proofUrl: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setNewDisputeModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-650 text-white font-bold text-[10px] uppercase hover:bg-indigo-700 cursor-pointer"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Resolve Dispute Claim
            </h3>
            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Resolution Decision Status</span>
                <select
                  value={resolveModal.status}
                  onChange={(e) => setResolveModal({ ...resolveModal, status: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-semibold cursor-pointer"
                >
                  <option value="Resolved">Resolved (No action)</option>
                  <option value="Accepted">Accepted (Owner updated / Payout approved)</option>
                  <option value="Rejected">Rejected (Claim dismissed)</option>
                  <option value="Split Decision">Split Decision (Split commissions)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Decision Notes & Logic</span>
                <textarea
                  rows={3}
                  required
                  placeholder="Record the official decision guidelines detail notes..."
                  value={resolveModal.decision}
                  onChange={(e) => setResolveModal({ ...resolveModal, decision: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal({ open: false, disputeId: null, decision: '', status: 'Resolved' })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-650 text-white font-bold text-[10px] uppercase hover:bg-indigo-700 cursor-pointer"
                >
                  Submit Resolution
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
