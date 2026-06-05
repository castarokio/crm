'use client';

import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Search, ShieldAlert, Eye } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';

export function AuditLogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const db = getSupabase();
      const { data, error } = await db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('[fetchLogs] failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.caller_name?.toLowerCase().includes(term) ||
      log.action_type?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      (log.lead_id?.toString() || '').includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search Panel */}
      <GlassCard className="p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </GlassCard>

      {/* Main Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase font-extrabold font-display">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    Loading compliance logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    No compliance records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 px-4 text-slate-450 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {log.caller_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-750">
                      {log.action_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-bold">
                      {log.lead_id ? `#${log.lead_id}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-550 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-750 rounded-lg font-bold transition-all uppercase text-[9px] tracking-wider inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-650" />
                <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest">
                  Compliance Log Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[10px] font-black text-slate-400 hover:text-slate-700 uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-700 font-body">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9.5px]">Log Timestamp:</span>
                <span className="font-medium text-slate-800">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9.5px]">Triggered By:</span>
                <span className="font-bold text-slate-900">{selectedLog.caller_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9.5px]">Action Code:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9.5px]">Associated Lead:</span>
                <span className="font-medium text-slate-800">{selectedLog.lead_id ? `#${selectedLog.lead_id}` : 'None'}</span>
              </div>

              {selectedLog.details && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-slate-400 font-bold uppercase text-[9.5px]">Activity Details:</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-medium text-slate-700 leading-relaxed font-body">
                    {selectedLog.details}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
