import React, { useState } from 'react';
import { Search, MapPin, Star, Lock, Clock } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';

// Helper to check if agency is currently open based on work hours
const isLeadOpen = (workHoursStr?: string | null): boolean => {
  if (!workHoursStr) return true;
  try {
    const parts = workHoursStr.split('-');
    if (parts.length !== 2) return true;
    const [startStr, endStr] = parts;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.trim().split(':').map(Number);
    const [endH, endM] = endStr.trim().split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return true;
  }
};

type DialerQueueProps = {
  queue: any[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  callerName: string;
};

export function DialerQueue({
  queue,
  currentIndex,
  onSelectIndex,
  callerName,
}: DialerQueueProps) {
  const [search, setSearch] = useState<string>('');

  const filteredQueue = queue.filter(lead => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (lead.agency_name || '').toLowerCase().includes(query) ||
      (lead.area || '').toLowerCase().includes(query) ||
      (lead.phone || '').toLowerCase().includes(query)
    );
  });

  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-rose-50 border border-rose-200 text-rose-700';
      case 2:
        return 'bg-amber-50 border border-amber-250 text-amber-700';
      case 3:
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      case 4:
        return 'bg-slate-100 border border-slate-200 text-slate-600';
      default:
        return 'bg-slate-50 border border-slate-150 text-slate-500';
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search Header */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search calling queue..."
          className="w-full pl-9 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs transition-all placeholder-slate-400 text-slate-700 shadow-sm"
        />
      </div>

      {/* Queue Scrolling List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[calc(100vh-230px)]">
        {filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-body text-xs">
            <span>No leads found in queue</span>
          </div>
        ) : (
          filteredQueue.map((lead, idx) => {
            const queueIdx = queue.findIndex(l => l.id === lead.id);
            const isSelected = queueIdx === currentIndex;
            
            // Check concurrency lock: locked if assigned_to matches someone else
            const isLockedByOther = lead.assigned_to && lead.assigned_to !== callerName;
            const isOpen = isLeadOpen(lead.work_hours);

            return (
              <GlassCard
                key={lead.id}
                onClick={() => !isLockedByOther && onSelectIndex(queueIdx)}
                padded={false}
                className={`p-4 border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300/30'
                    : isLockedByOther
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
                }`}
              >
                {/* Active locked by another caller overlay */}
                {isLockedByOther && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-md font-body text-[9px] text-rose-700 font-bold uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    {lead.assigned_to} Dialing
                  </div>
                )}

                {/* Card Header details */}
                <div className="flex items-start justify-between gap-3 pr-20">
                  <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                    {lead.agency_name || 'Unnamed Agency'}
                  </h4>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-body">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {lead.area || 'Algeria'}
                  </span>
                  
                  {lead.google_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-slate-600 font-bold">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      {lead.google_rating.toFixed(1)} ({lead.review_count})
                    </span>
                  )}

                  {lead.work_hours && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {lead.work_hours}
                    </span>
                  )}
                </div>

                {/* Priority and Status Badges */}
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${getPriorityStyle(lead.priority)}`}>
                    Priority {lead.priority}
                  </span>
                  {lead.call_status && lead.call_status !== 'Not Called' && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-bold uppercase tracking-widest">
                      {lead.call_status}
                    </span>
                  )}
                  {isOpen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" title="Lead Business is Open" />
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
