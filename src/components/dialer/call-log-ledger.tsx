import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, PhoneCall, Loader2 } from 'lucide-react';
import { getCallHistory } from '@/app/actions/leads';

type CallLogLedgerProps = {
  leadId: number;
};

export function CallLogLedger({ leadId }: CallLogLedgerProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCallHistory(leadId);
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('[Fetch Call History Error]', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      void fetchHistory();
    }
  }, [leadId, fetchHistory]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Client Configured':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'Interested':
        return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
      case 'Callback':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'Busy':
      case 'No Answer':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Not Interested':
      case 'Wrong Number':
        return 'bg-rose-50 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-150';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
        Previous Attempt Ledger
      </h3>

      {history.length === 0 ? (
        <div className="text-center py-6 text-slate-400 font-body text-xs">
          <span>No call attempts recorded for this lead yet</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {history.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl flex flex-col gap-2 font-body text-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${getStatusBadgeStyle(log.call_status)}`}>
                  {log.call_status}
                </span>
                
                <span className="flex items-center gap-1 text-[9px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {formatTimestamp(log.created_at)}
                </span>
              </div>

              {log.notes && (
                <p className="text-slate-650 italic text-[11px] leading-relaxed pl-1.5 border-l-2 border-slate-250">
                  "{log.notes}"
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Logged by {log.caller_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
