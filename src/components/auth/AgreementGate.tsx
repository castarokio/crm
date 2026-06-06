import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { acceptCallerAgreementAction } from '@/app/actions/auth';

type AgreementGateProps = {
  children: React.ReactNode;
  callerName: string;
  agreementAcceptedVersion: string | null;
  latestGuidelinesVersion?: string;
  latestGuidelinesText?: string;
  callerRole: string;
  onAccepted: (updatedSession: { agreementAcceptedVersion: string }) => void;
};

export function AgreementGate({
  children,
  callerName,
  agreementAcceptedVersion,
  latestGuidelinesVersion = '1.0',
  latestGuidelinesText = '',
  callerRole,
  onAccepted,
}: AgreementGateProps) {
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [acceptString, setAcceptString] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const activeVersion = latestGuidelinesVersion || '1.0';
  const needsAcceptance = agreementAcceptedVersion !== activeVersion && callerRole !== 'Admin';

  if (!needsAcceptance) return <>{children}</>;

  const handleAgree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChecked || acceptString.trim() !== 'I ACCEPT') return;
    
    setSubmitting(true);
    setErrorMsg('');
    
    try {
      const res = await acceptCallerAgreementAction(callerName);
      if (res.success) {
        onAccepted({ agreementAcceptedVersion: activeVersion });
      } else {
        setErrorMsg(res.error || 'Failed to submit agreement.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-white/95 border border-slate-200 rounded-3xl max-w-xl w-full p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-tight">
              Guidelines & Commission Agreement
            </h2>
            <p className="font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              WEB-OS Outbound Operations — Version {activeVersion}
            </p>
          </div>
        </div>

        {/* Guidelines Box */}
        <div className="text-[11px] leading-relaxed text-slate-650 bg-slate-50 border border-slate-200/50 rounded-2xl p-5 overflow-y-auto h-72 flex flex-col gap-4 font-body select-text whitespace-pre-line">
          {latestGuidelinesText ? (
            <div>{latestGuidelinesText}</div>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">1. Role & Scope Boundaries</h4>
                <p>
                  As a Caller, you are responsible for appointment setting and lead qualification. 
                  You are strictly prohibited from promising final prices, discounts, delivery dates, 
                  or project features to clients without explicit Admin or Manager authorization.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">2. Lead Ownership protection</h4>
                <p>
                  When you mark a lead as 'Interested', 'Callback', or 'Meeting Booked', an ownership lock of 
                  <strong> 60 days</strong> is automatically granted to your account. However, this lock will expire 
                  and the lead will be reassigned if there are <strong>14 days of inactivity</strong> (no follow-up call outcomes or notes logged).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">3. Commission Payout Structures</h4>
                <p>
                  Commissions are generated solely from client funds actually received and confirmed by management. 
                  If the client pays in milestones (e.g. 50% deposit, 50% final), your commission is paid out in 
                  matching parts.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">4. Anti-Theft & Data Leak policies</h4>
                <p>
                  Copying lead phone numbers in bulk, scraping spreadsheets, or sharing client profiles is 
                  strictly monitored. Standard daily view limits are enforced (50 leads/day for new callers). 
                  Canary/trap leads are embedded in campaigns to identify data theft.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Acceptance Form */}
        <form onSubmit={handleAgree} className="flex flex-col gap-5">
          <label className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
            <input 
              type="checkbox" 
              checked={hasChecked} 
              onChange={(e) => setHasChecked(e.target.checked)} 
              className="mt-0.5 rounded text-indigo-650 focus:ring-indigo-500 border-slate-350 w-4 h-4 cursor-pointer" 
            />
            <span>I have carefully read, understood, and accept to work under all guidelines and terms listed above.</span>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Type 'I ACCEPT' in the box below to authorize signature:
            </span>
            <input 
              type="text" 
              value={acceptString} 
              onChange={(e) => setAcceptString(e.target.value)} 
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-300 font-mono tracking-wider" 
              placeholder="I ACCEPT" 
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {errorMsg && (
            <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wide">
              {errorMsg}
            </p>
          )}

          <button 
            type="submit" 
            disabled={!hasChecked || acceptString.trim() !== 'I ACCEPT' || submitting} 
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase transition-all shadow-sm hover:shadow active:scale-98 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing Agreement...
              </>
            ) : (
              'Confirm Signed Signature'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
