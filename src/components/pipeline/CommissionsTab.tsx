'use client';

import React, { useEffect, useState } from 'react';
import { getCommissionsAction, approveCommissionAction, payCommissionAction } from '@/app/actions/commissions';
import { fileDisputeAction } from '@/app/actions/disputes';
import { DollarSign, CheckCircle2, CreditCard, Clock, FileWarning, ExternalLink, HelpCircle } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { toast } from '@/lib/toast';

type CommissionsTabProps = {
  callerName: string;
  callerRole: string;
};

export function CommissionsTab({ callerName, callerRole }: CommissionsTabProps) {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; commissionId: number | null; proofUrl: string }>({
    open: false,
    commissionId: null,
    proofUrl: ''
  });
  const [disputeModal, setDisputeModal] = useState<{ open: boolean; commissionId: number | null; explanation: string }>({
    open: false,
    commissionId: null,
    explanation: ''
  });

  const isAdminOrManager = callerRole === 'Admin' || callerRole === 'Manager';

  const loadCommissions = async () => {
    setLoading(true);
    const res = await getCommissionsAction();
    if (res.success && res.commissions) {
      setCommissions(res.commissions);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadCommissions();
  }, [callerName]);

  const handleApprove = async (id: number) => {
    const res = await approveCommissionAction(id);
    if (res.success) {
      toast.success('Commission approved successfully!');
      void loadCommissions();
    } else {
      toast.error('Failed to approve commission: ' + res.error);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModal.commissionId) return;

    const res = await payCommissionAction(payoutModal.commissionId, payoutModal.proofUrl);
    if (res.success) {
      toast.success('Commission payout registered!');
      setPayoutModal({ open: false, commissionId: null, proofUrl: '' });
      void loadCommissions();
    } else {
      toast.error('Failed to record payment: ' + res.error);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModal.commissionId) return;

    // Find the commission to grab its deal_id
    const targetComm = commissions.find(c => c.id === disputeModal.commissionId);
    if (!targetComm) return;

    const res = await fileDisputeAction({
      disputeType: 'commission',
      leadId: targetComm.deals?.lead_id,
      dealId: targetComm.deal_id,
      commissionId: targetComm.id,
      explanation: disputeModal.explanation
    });

    if (res.success) {
      toast.success('Commission dispute filed with compliance review!');
      setDisputeModal({ open: false, commissionId: null, explanation: '' });
      void loadCommissions();
    } else {
      toast.error('Failed to file dispute: ' + res.error);
    }
  };

  // Math aggregates
  const totalEarned = commissions.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'Paid').reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'Pending Approval' || c.status === 'Pending Payment').reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'Approved').reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);

  return (
    <div className="flex flex-col gap-6 font-body">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-750">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Total Generated</span>
            <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">{totalEarned.toLocaleString()} DZD</h4>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Total Paid Out</span>
            <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">{totalPaid.toLocaleString()} DZD</h4>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Pending Payout</span>
            <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">{totalPending.toLocaleString()} DZD</h4>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Approved & Ready</span>
            <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5">{totalApproved.toLocaleString()} DZD</h4>
          </div>
        </GlassCard>
      </div>

      {/* Commissions Ledger List */}
      <GlassCard className="p-5">
        <h3 className="font-display font-black text-xs text-slate-850 uppercase tracking-widest mb-4">
          COMMISSION LEDGER & OUTLOOK
        </h3>
        
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs">
            Fetching ledger history...
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold uppercase text-xs">
            No commission payout items recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-450 uppercase font-bold">
                  <th className="py-2.5">Deal Details</th>
                  <th className="py-2.5">Caller / Owner</th>
                  <th className="py-2.5">Rate</th>
                  <th className="py-2.5">Payment Received</th>
                  <th className="py-2.5">Commission Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{c.deals?.deal_name || 'Unnamed Deal'}</span>
                        <span className="text-[9.5px] text-slate-400">{c.deals?.package_type} Package</span>
                      </div>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-700">{c.caller_id}</td>
                    <td className="py-2.5 font-mono text-slate-600">{Number(c.commission_rate).toFixed(1)}%</td>
                    <td className="py-2.5 font-bold text-slate-750">{Number(c.payment_amount).toLocaleString()} DZD</td>
                    <td className="py-2.5 font-black text-indigo-750">{Number(c.commission_amount).toLocaleString()} DZD</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                        c.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'Approved' ? 'bg-sky-50 text-sky-700' :
                        c.status === 'Disputed' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                        c.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdminOrManager && c.status === 'Pending Approval' && (
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="px-2 py-1 rounded bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-[9px] uppercase cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {isAdminOrManager && c.status === 'Approved' && (
                          <button
                            onClick={() => setPayoutModal({ open: true, commissionId: c.id, proofUrl: '' })}
                            className="px-2 py-1 rounded bg-emerald-650 hover:bg-emerald-755 text-white font-bold text-[9px] uppercase cursor-pointer"
                          >
                            Pay Out
                          </button>
                        )}
                        {c.status !== 'Paid' && c.status !== 'Disputed' && (
                          <button
                            onClick={() => setDisputeModal({ open: true, commissionId: c.id, explanation: '' })}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-750 text-slate-500 font-bold text-[9px] uppercase cursor-pointer flex items-center gap-1"
                          >
                            <FileWarning className="w-3 h-3" /> Dispute
                          </button>
                        )}
                        {c.proof_url && (
                          <a
                            href={c.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-slate-50 border border-slate-200 text-indigo-650 hover:bg-indigo-50"
                            title="View Receipt"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Payout Confirmation Modal */}
      {payoutModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              CONFIRM COMMISSION PAYOUT
            </h3>
            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Payment Receipt / Proof URL (Optional)</span>
                <input
                  type="url"
                  placeholder="https://baridimob.dz/receipt.png"
                  value={payoutModal.proofUrl}
                  onChange={(e) => setPayoutModal({ ...payoutModal, proofUrl: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium"
                />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModal({ open: false, commissionId: null, proofUrl: '' })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-650 text-white font-bold text-[10px] uppercase hover:bg-emerald-700 cursor-pointer"
                >
                  Mark as Paid
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Dispute Claim Modal */}
      {disputeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              FILE Payout Dispute Claim
            </h3>
            <form onSubmit={handleDisputeSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Provide detailed explanation / proof</span>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain exactly why you are filing a dispute (e.g. rate mismatch, missing deposit split share, caller ownership overlap, etc.)"
                  value={disputeModal.explanation}
                  onChange={(e) => setDisputeModal({ ...disputeModal, explanation: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:border-indigo-300 font-medium resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModal({ open: false, commissionId: null, explanation: '' })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-650 text-white font-bold text-[10px] uppercase hover:bg-rose-700 cursor-pointer"
                >
                  File Dispute Claim
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
