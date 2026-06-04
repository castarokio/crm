import React, { useRef, useEffect } from 'react';
import { DealCard } from './deal-card';
import { AnimatePresence } from 'framer-motion';

type PipelineColumnProps = {
  stage: string;
  deals: any[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: string) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDealClick: (deal: any) => void;
  onViewSourceLead?: (companyName: string) => void;
};

export function PipelineColumn({
  stage,
  deals,
  onDragOver,
  onDrop,
  onDragStart,
  onDealClick,
  onViewSourceLead,
}: PipelineColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const dragYRef = useRef<number | null>(null);

  const startVerticalScroll = () => {
    if (scrollIntervalRef.current) return;
    
    const scrollLoop = () => {
      if (!listRef.current || dragYRef.current === null) {
        scrollIntervalRef.current = null;
        return;
      }
      
      const list = listRef.current;
      const rect = list.getBoundingClientRect();
      const y = dragYRef.current - rect.top;
      
      const maxSpeed = 15;
      const edgeSize = 60;
      let speed = 0;
      
      if (y < edgeSize && y >= 0) {
        speed = -maxSpeed * (1 - y / edgeSize);
      } else if (y > rect.height - edgeSize && y <= rect.height) {
        speed = maxSpeed * ((y - (rect.height - edgeSize)) / edgeSize);
      }
      
      if (speed !== 0) {
        list.scrollTop += speed;
        scrollIntervalRef.current = requestAnimationFrame(scrollLoop);
      } else {
        scrollIntervalRef.current = null;
      }
    };
    
    scrollIntervalRef.current = requestAnimationFrame(scrollLoop);
  };

  const stopVerticalScroll = () => {
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    dragYRef.current = null;
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragYRef.current = e.clientY;
    if (!scrollIntervalRef.current) {
      startVerticalScroll();
    }
    
    if (onDragOver) onDragOver(e);
  };

  useEffect(() => {
    const handleDragEnd = () => {
      stopVerticalScroll();
    };
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);
    return () => {
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const totalRecurring = deals.reduce((sum, d) => sum + (Number(d.recurring_value) || 0), 0);
  const totalSetup = deals.reduce((sum, d) => sum + (Number(d.setup_value) || 0), 0);

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, stage);
  };

  const getStageHeaderColor = (s: string) => {
    switch (s) {
      case 'New':
        return 'text-slate-800 bg-slate-50 border-slate-200';
      case 'Contacted':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Interested':
        return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'Appointment Booked':
        return 'text-amber-850 bg-amber-50 border-amber-200';
      case 'Proposal Sent':
        return 'text-violet-800 bg-violet-50 border-violet-200';
      case 'Negotiation':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'Won':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'Lost':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={handleDrop}
      className="flex flex-col gap-3 min-w-[250px] w-[280px] bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 min-h-[500px]"
    >
      {/* Column header metrics */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${getStageHeaderColor(stage)}`}>
        <div className="flex justify-between items-center">
          <span className="font-display text-xs font-bold uppercase tracking-wider">{stage}</span>
          <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full border border-black/5">
            {deals.length}
          </span>
        </div>
        <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">
          <span>Set: {formatCurrency(totalSetup)}</span>
          <span>•</span>
          <span>Rec: {formatCurrency(totalRecurring)}/m</span>
        </div>
      </div>

      {/* Cards list */}
      <div 
        ref={listRef}
        onDragOver={handleColumnDragOver}
        className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[calc(100vh-320px)] pr-1"
      >
        {deals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 border border-dashed border-slate-200 rounded-xl">
            <span className="font-body text-[10px] text-slate-350 uppercase tracking-widest font-semibold">Drop Deal Here</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {deals.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                onDragStart={onDragStart}
                onClick={onDealClick}
                onViewSourceLead={onViewSourceLead}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
