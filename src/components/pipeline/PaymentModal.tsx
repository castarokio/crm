'use client';

import React, { useState } from 'react';
import { createPaymentRecord, confirmPaymentStatus } from '@/app/actions/payments';
import { GlassCard } from '../ui/glass-card';
import { toast } from '@/lib/toast';
import { DollarSign, Loader2, X } from 'lucide-react';

type PaymentModalProps = {
  dealId: number;
  dealName: string;
  setupValue: number;
  paymentType: 'deposit' | 'final';
  onClose: () => void;
  onSuccess: () => void;
};

const PAYMENT_METHODS = ['Bank Transfer', 'CCP (Postal)', 'Baridimob', 'Cash', 'BaridiPay', 'Other'];

export function PaymentModal({ dealId, dealName, setupValue, paymentType, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'record' | 'confirm'>('record');
  const [paymentId, setPaymentId] = useState<number | null>(null);

  // Record step
  const [amountExpected, setAmountExpected] = useState<string>(
    paymentType === 'deposit' ? String(Math.round(setupValue * 0.5)) : String(Math.round(setupValue * 0.5))
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Confirm step
  const [amountReceived, setAmountReceived] = useState<string>('');

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const expected = Number(amountExpected);
    if (!expected || expected <= 0) {
      toast.error('Enter a valid expected amount in DZD.');
      return;
    }
    setSubmitting(true);
    const res = await createPaymentRecord({
      dealId,
      amountExpected: expected,
      paymentType,
      paymentMethod,
      proofUrl: proofUrl || undefined,
    });
    setSubmitting(false);
    if (res.success && res.payment) {
      setPaymentId(res.payment.id);
      setAmountReceived(amountExpected);
      setStep('confirm');
    } else {
      toast.error('Failed to create payment record: ' + res.error);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId) return;
    const received = Number(amountReceived);
    if (!received || received <= 0) {
      toast.error('Enter the amount physically received in DZD.');
      return;
    }
    setSubmitting(true);
    const res = await confirmPaymentStatus(paymentId, received);
    setSubmitting(false);
    if (res.success) {
      toast.success(
        paymentType === 'deposit'
          ? '✅ Deposit confirmed! Project has been automatically created.'
          : '✅ Final payment confirmed! Deal fully paid.'
      );
      onSuccess();
      onClose();
    } else {
      toast.error('Failed to confirm payment: ' + res.error);
    }
  };

  const title = paymentType === 'deposit' ? 'Record Deposit Payment' : 'Record Final Payment';
  const labelColor = paymentType === 'deposit' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[240px]">{dealName}</p>
          </div>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${labelColor}`}>
            {paymentType}
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
          <span className={`px-2 py-0.5 rounded ${step === 'record' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            1 · Log Expected
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2 py-0.5 rounded ${step === 'confirm' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            2 · Confirm Received
          </span>
        </div>

        {/* STEP 1 — Record Expected Payment */}
        {step === 'record' && (
          <form onSubmit={handleRecord} className="flex flex-col gap-4 text-xs font-body">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">
                Expected Amount (DZD) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={amountExpected}
                  onChange={(e) => setAmountExpected(e.target.value)}
                  className="w-full p-3 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm font-bold text-slate-800"
                  placeholder="e.g. 22500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">DZD</span>
              </div>
              <span className="text-[9px] text-slate-400">
                Setup value: {Number(setupValue).toLocaleString()} DZD → Deposit (50%): {Math.round(setupValue * 0.5).toLocaleString()} DZD
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Receipt / Proof URL (Optional)</label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://bank-receipt.dz/..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs text-slate-700"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase hover:bg-indigo-700 cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Next: Confirm Receipt →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 — Confirm Amount Physically Received */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="flex flex-col gap-4 text-xs font-body">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 font-semibold">
              ⚠️ Only confirm once the money has physically arrived in the company account. Commission is calculated from this amount.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">
                Amount Actually Received (DZD) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full p-3 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm font-bold text-slate-800"
                  placeholder="e.g. 22500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">DZD</span>
              </div>
              <span className="text-[9px] text-slate-400">
                Expected: {Number(amountExpected).toLocaleString()} DZD — adjust if partial payment received.
              </span>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col gap-1 text-[10px]">
              <span className="text-indigo-700 font-bold uppercase tracking-wider">Auto-actions on confirm:</span>
              <span className="text-indigo-600">• Commission calculated at 20% of amount received</span>
              {paymentType === 'deposit' && (
                <span className="text-indigo-600">• Project record created automatically → "Deposit Paid" stage</span>
              )}
              <span className="text-indigo-600">• Deal stage set to "Won"</span>
            </div>

            <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-[10px] uppercase cursor-pointer hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[10px] uppercase hover:bg-emerald-700 cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                ✅ Confirm Receipt
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
