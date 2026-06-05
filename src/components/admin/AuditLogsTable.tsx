'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, ShieldAlert, Eye, X, Building, Phone, Mail, Calendar, User, Tag 
} from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { getCallActivityLogs } from '@/app/actions/leads';

export function AuditLogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getCallActivityLogs();
      if (!res.success) throw new Error(res.error || 'Failed to fetch logs');
      setLogs(res.logs || []);
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
      log.agency_name?.toLowerCase().includes(term) ||
      (log.lead_id?.toString() || '').includes(term)
    );
  });

  // Action status badge helper
  const getActionBadge = (actionType: string) => {
    const isSkip = actionType === 'SKIP_LEAD';
    const isInterested = actionType.includes('Interested') || actionType.includes('Won') || actionType.includes('Accepted') || actionType.includes('Configured');
    const isNoAnswer = actionType.includes('No Answer') || actionType.includes('Busy');
    
    if (isSkip) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          {actionType}
        </span>
      );
    } else if (isInterested) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {actionType}
        </span>
      );
    } else if (isNoAnswer) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          {actionType}
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          {actionType}
        </span>
      );
    }
  };

  // Parser for detail notes/metrics
  const formatDetails = (details: string) => {
    if (!details) return null;
    
    if (details.includes('Followers:') || details.includes('Reviews:')) {
      const parts = details.split('|').map(p => p.trim());
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {parts.map((part, index) => {
            let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200/60";
            if (part.toLowerCase().includes('fb:')) {
              badgeStyle = "bg-blue-50 text-blue-700 border-blue-150/70 shadow-sm shadow-blue-50/20";
            } else if (part.toLowerCase().includes('ig:')) {
              badgeStyle = "bg-pink-50 text-pink-750 border-pink-150/70 shadow-sm shadow-pink-50/20";
            } else if (part.toLowerCase().includes('reviews:')) {
              badgeStyle = "bg-amber-50 text-amber-750 border-amber-150/70 shadow-sm shadow-amber-50/20";
            }
            return (
              <span key={index} className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border ${badgeStyle} tracking-wide`}>
                {part}
              </span>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="border-l-4 border-indigo-500 bg-indigo-50/30 p-3.5 rounded-r-2xl text-[11px] font-medium text-slate-700 leading-relaxed font-body italic">
        {details}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Panel */}
      <GlassCard className="p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity logs by business, caller, action..."
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
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    Loading call activity...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    No call activities found.
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-[11px] leading-tight truncate max-w-[180px]" title={log.agency_name}>
                        {log.agency_name}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-mono font-medium mt-0.5">
                        {log.lead_id ? `#${log.lead_id}` : '-'}
                      </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] max-w-lg w-full p-6 shadow-[0_25px_60px_rgba(99,102,241,0.18)] flex flex-col gap-5 border border-indigo-50/50 animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-650 shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest leading-none">
                    Call Activity Log
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    System Ledger Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="flex flex-col gap-4 font-body">
              {/* Event Metadata (User, Timestamp) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                  <div className="bg-white p-2 rounded-xl text-slate-500 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Triggered By</div>
                    <div className="font-extrabold text-[11.5px] text-slate-800 mt-0.5">{selectedLog.caller_name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                  <div className="bg-white p-2 rounded-xl text-slate-500 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</div>
                    <div className="font-bold text-[10.5px] text-slate-700 mt-0.5">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Code */}
              <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-slate-500 shadow-sm">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Action / Status</span>
                </div>
                {getActionBadge(selectedLog.action_type)}
              </div>

              {/* Lead Details Card */}
              <div className="bg-indigo-50/35 border border-indigo-100/40 rounded-3xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-indigo-100/30 pb-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                    Associated Lead Details
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase">Business Name</span>
                    <span className="font-extrabold text-[12px] text-slate-850 text-right max-w-[200px] truncate" title={selectedLog.agency_name}>
                      {selectedLog.agency_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase">Lead ID</span>
                    <span className="font-mono font-bold text-[10.5px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {selectedLog.lead_id ? `#${selectedLog.lead_id}` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/60 pt-2 mt-1">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Phone
                    </span>
                    <span className="font-mono font-bold text-[11px] text-slate-700">
                      {selectedLog.lead_phone || 'Missing Phone'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> Email
                    </span>
                    <span className="font-mono font-semibold text-[11px] text-slate-700 max-w-[200px] truncate" title={selectedLog.lead_email}>
                      {selectedLog.lead_email || 'Missing Email'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Details Block */}
              {selectedLog.details && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">
                      Activity Notes / Scraper Metrics
                    </span>
                  </div>
                  {formatDetails(selectedLog.details)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
