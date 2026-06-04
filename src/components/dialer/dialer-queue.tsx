import React, { useState } from 'react';
import { Search, MapPin, Star, Lock, Clock, Filter, CheckCircle2 } from 'lucide-react';
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
  const [onlyOpen, setOnlyOpen] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const filteredQueue = queue.filter(lead => {
    // 1. Search Query Match
    const query = search.toLowerCase().trim();
    if (query) {
      const match = (lead.agency_name || '').toLowerCase().includes(query) ||
                    (lead.area || '').toLowerCase().includes(query) ||
                    (lead.phone || '').toLowerCase().includes(query);
      if (!match) return false;
    }

    // 2. Open Only Filter Match
    if (onlyOpen && !isLeadOpen(lead.work_hours)) {
      return false;
    }

    // 3. Priority Match
    if (priorityFilter && String(lead.priority) !== priorityFilter) {
      return false;
    }

    return true;
  });

  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-rose-50 border border-rose-200 text-rose-750';
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
      
      {/* Queue count header */}
      <div className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-slate-150 shadow-sm">
        <span className="text-[10px] text-slate-450 uppercase font-extrabold tracking-wider">Queue Standby</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-black text-slate-800 font-display">
            {filteredQueue.length}
          </span>
          <span className="text-[9px] text-slate-400 font-bold">
            / {queue.length} left
          </span>
        </div>
      </div>

      {/* Filters & Search Box */}
      <div className="flex flex-col gap-2 bg-white/70 p-3 rounded-xl border border-slate-150 shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, region, phone..."
            className="w-full pl-9 pr-4 py-2 bg-white/95 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-medium transition-all placeholder-slate-400 text-slate-700"
          />
        </div>
        
        {/* Advanced quick-filters row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Open only check */}
          <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-550 w-3 h-3 cursor-pointer"
            />
            <span>Open Only</span>
          </label>

          {/* Priority filter selector */}
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
            <Filter className="w-2.5 h-2.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-black border-none text-[9px] py-0 pr-5"
            >
              <option value="">Priority</option>
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3</option>
              <option value="4">P4</option>
              <option value="5">P5</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Scrolling List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[calc(100vh-290px)]">
        {filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-body text-xs">
            <span>No leads fit current filters</span>
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
                className={`p-3.5 border transition-all cursor-pointer relative ${
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
                    <Lock className="w-2.5 h-2.5 animate-pulse" />
                    {lead.assigned_to}
                  </div>
                )}

                {/* Card Header details */}
                <div className="flex items-start justify-between gap-3 pr-20">
                  <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                    {lead.agency_name || 'Unnamed Agency'}
                  </h4>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-[9.5px] text-slate-500 font-body">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {lead.area || 'Algeria'}
                  </span>
                  
                  {lead.google_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-slate-600 font-bold">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      {Number(lead.google_rating).toFixed(1)}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" title="Open Now" />
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
