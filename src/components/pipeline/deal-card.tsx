import React from 'react';
import { DollarSign, User, Clock, Edit } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { motion } from 'framer-motion';

type DealCardProps = {
  deal: any;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onClick: (deal: any) => void;
  onViewSourceLead?: (companyName: string) => void;
};

export function DealCard({ deal, onDragStart, onClick, onViewSourceLead }: DealCardProps) {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0 DZD';
    return new Intl.NumberFormat('en-US').format(val) + ' DZD';
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(deal.id));
    onDragStart(e, deal.id);
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart as any}
      onClick={() => onClick(deal)}
      className="cursor-grab active:cursor-grabbing select-none"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <GlassCard
        padded={false}
        className="p-4 bg-white/90 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
      >
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wide truncate max-w-[130px]">
            {deal.deal_name || 'Unnamed Deal'}
          </h4>
          {Number(deal.recurring_value) > 0 && (
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
              {formatCurrency(deal.recurring_value)}/m
            </span>
          )}
        </div>

        {Number(deal.setup_value) > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Setup:</span>
            <span className="text-[11px] font-extrabold text-slate-700">{formatCurrency(deal.setup_value)}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-3 text-[10px] text-slate-500 font-body">
          {deal.company_name && (
            <span className="truncate text-slate-700 font-medium">{deal.company_name}</span>
          )}
          
          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wider">Caller: {deal.caller_name}</span>
          </div>

          {deal.expected_close_date && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Target: {deal.expected_close_date}</span>
            </div>
          )}

          {deal.lead_id && onViewSourceLead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSourceLead(deal.company_name);
              }}
              className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline mt-1.5 inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 text-left active:scale-95 transition-all"
            >
              View Source Lead
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
