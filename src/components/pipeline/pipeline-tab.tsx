'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Loader2, DollarSign, Calendar, FileText, Trash2 } from 'lucide-react';
import { PipelineColumn } from './pipeline-column';
import { getDeals, createDeal, updateDealStage, updateDeal, deleteDeal } from '@/app/actions/pipeline';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ALLOWED_DEAL_STAGES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, confirm } from '@/lib/toast';

type PipelineTabProps = {
  callerName: string;
  onViewSourceLead?: (companyName: string) => void;
};

export function PipelineTab({ callerName, onViewSourceLead }: PipelineTabProps) {
  const [deals, setDeals] = useState<any[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const dragXRef = useRef<number | null>(null);

  const startHorizontalScroll = () => {
    if (scrollIntervalRef.current) return;
    
    const scrollLoop = () => {
      if (!boardRef.current || dragXRef.current === null) {
        scrollIntervalRef.current = null;
        return;
      }
      
      const board = boardRef.current;
      const rect = board.getBoundingClientRect();
      const x = dragXRef.current - rect.left;
      
      const maxSpeed = 25;
      const edgeSize = 120;
      let speed = 0;
      
      if (x < edgeSize && x >= 0) {
        speed = -maxSpeed * (1 - x / edgeSize);
      } else if (x > rect.width - edgeSize && x <= rect.width) {
        speed = maxSpeed * ((x - (rect.width - edgeSize)) / edgeSize);
      }
      
      if (speed !== 0) {
        board.scrollLeft += speed;
        scrollIntervalRef.current = requestAnimationFrame(scrollLoop);
      } else {
        scrollIntervalRef.current = null;
      }
    };
    
    scrollIntervalRef.current = requestAnimationFrame(scrollLoop);
  };

  const stopHorizontalScroll = () => {
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    dragXRef.current = null;
  };

  const handleBoardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragXRef.current = e.clientX;
    if (!scrollIntervalRef.current) {
      startHorizontalScroll();
    }
  };

  useEffect(() => {
    const handleDragEnd = () => {
      stopHorizontalScroll();
    };
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);
    return () => {
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, []);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCaller, setSelectedCaller] = useState<string>('All');
  const [callersList, setCallersList] = useState<string[]>([]);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  
  // Form states
  const [dealName, setDealName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [setupValue, setSetupValue] = useState<number>(0);
  const [recurringValue, setRecurringValue] = useState<number>(0);
  const [expectedCloseDate, setExpectedCloseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lostReason, setLostReason] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getDeals();
    if (res.success) {
      setDeals(res.deals || []);
      // Extract unique callers for filtering
      const uniqueCallers: string[] = Array.from(
        new Set((res.deals || []).map((d: any) => d.caller_name).filter(Boolean))
      );
      setCallersList(uniqueCallers);
    }
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', String(id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealIdStr = e.dataTransfer.getData('text/plain');
    if (!dealIdStr) return;
    const dealId = Number(dealIdStr);
    
    // Find deal
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistic Update
    const prevDeals = [...deals];
    setDeals(prevDeals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    if (newStage === 'Lost') {
      // If moving to Lost, open edit modal to specify lost reason
      setSelectedDeal({ ...deal, stage: newStage });
      setLostReason('');
      setIsEditOpen(true);
      return;
    }

    const res = await updateDealStage(dealId, newStage, callerName);
    if (!res.success) {
      toast.error(`Failed to update stage: ${res.error}`);
      setDeals(prevDeals); // rollback
    } else {
      void fetchData();
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName || !companyName) {
      toast.warning('Please fill out Deal Name and Company Name.');
      return;
    }
    setFormSubmitting(true);
    const res = await createDeal({
      deal_name: dealName,
      company_name: companyName,
      caller_name: callerName,
      setup_value: setupValue,
      recurring_value: recurringValue,
      expected_close_date: expectedCloseDate || undefined,
      notes: notes,
    });
    setFormSubmitting(false);
    if (res.success) {
      setIsCreateOpen(false);
      resetCreateForm();
      void fetchData();
    } else {
      toast.error(`Error creating deal: ${res.error}`);
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setFormSubmitting(true);

    const fields: any = {
      deal_name: dealName,
      company_name: companyName,
      setup_value: setupValue,
      recurring_value: recurringValue,
      expected_close_date: expectedCloseDate || null,
      notes: notes,
    };

    if (selectedDeal.stage === 'Lost' || lostReason) {
      fields.lost_reason = lostReason || 'No details provided';
    }

    const res = await updateDeal(selectedDeal.id, callerName, fields);
    
    // Also sync stage if stage was changed during drop
    if (res.success && selectedDeal.stage !== deals.find(d => d.id === selectedDeal.id)?.stage) {
      await updateDealStage(selectedDeal.id, selectedDeal.stage, callerName, lostReason || undefined);
    }

    setFormSubmitting(false);
    if (res.success) {
      setIsEditOpen(false);
      setSelectedDeal(null);
      void fetchData();
    } else {
      toast.error(`Error updating deal: ${res.error}`);
    }
  };

  const handleDeleteDeal = async (dealId?: number) => {
    const id = dealId ?? selectedDeal?.id;
    if (!id) return;
    const ok = await confirm('This deal and all its data will be permanently removed from the pipeline.', {
      title: 'Delete Deal',
      danger: true,
      confirmLabel: 'Delete Deal',
    });
    if (!ok) return;
    
    setFormSubmitting(true);
    const res = await deleteDeal(id, callerName);
    setFormSubmitting(false);
    
    if (res.success) {
      setIsEditOpen(false);
      setSelectedDeal(null);
      void fetchData();
    } else {
      toast.error(`Error deleting deal: ${res.error}`);
    }
  };

  const openEditModal = (deal: any) => {
    setSelectedDeal(deal);
    setDealName(deal.deal_name || '');
    setCompanyName(deal.company_name || '');
    setSetupValue(Number(deal.setup_value) || 0);
    setRecurringValue(Number(deal.recurring_value) || 0);
    setExpectedCloseDate(deal.expected_close_date || '');
    setNotes(deal.notes || '');
    setLostReason(deal.lost_reason || '');
    setIsEditOpen(true);
  };

  const resetCreateForm = () => {
    setDealName('');
    setCompanyName('');
    setSetupValue(0);
    setRecurringValue(0);
    setExpectedCloseDate('');
    setNotes('');
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      (deal.deal_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCaller = selectedCaller === 'All' || deal.caller_name === selectedCaller;
    return matchesSearch && matchesCaller;
  });

  const getStageDeals = (stage: string) => {
    return filteredDeals.filter(d => d.stage === stage);
  };

  // Pipeline metrics
  const totalValue = filteredDeals.reduce((sum, d) => sum + (Number(d.recurring_value) || 0) * 12 + (Number(d.setup_value) || 0), 0);

  return (
    <div className="flex flex-col gap-6 h-full flex-1">
      {/* Top Filter and Info Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals or agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400 text-slate-700"
            />
          </div>

          {/* Caller Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Caller:</span>
            <select
              value={selectedCaller}
              onChange={(e) => setSelectedCaller(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-bold border-none"
            >
              <option value="All">All Callers</option>
              {callersList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics and Add Button */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex flex-col text-right font-body">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Est. Contract Value</span>
            <span className="text-sm font-bold text-slate-800 font-display">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue)}
            </span>
          </div>

          <Button
            onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            NEW DEAL
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div 
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        className="flex-1 overflow-x-auto overflow-y-hidden pb-4"
      >
        {loading ? (
          <div className="h-[500px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs uppercase tracking-widest font-semibold font-display">Loading Pipeline...</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max px-1">
            {ALLOWED_DEAL_STAGES.map(stage => (
              <PipelineColumn
                key={stage}
                stage={stage}
                deals={getStageDeals(stage)}
                onDragOver={handleBoardDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDealClick={openEditModal}
                onViewSourceLead={onViewSourceLead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Deal Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Deal"
        subtitle="Initialize a new transaction pipeline record"
      >
        <form onSubmit={handleCreateDeal} className="flex flex-col gap-4 font-body text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Deal Name *</label>
            <Input
              type="text"
              required
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="e.g. Website Overhaul Package"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Company/Agency Name *</label>
            <Input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Travel Sahara Tour"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Setup Fee ($)</label>
              <Input
                type="number"
                value={setupValue || ''}
                onChange={(e) => setSetupValue(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Recurring Fee ($ / month)</label>
              <Input
                type="number"
                value={recurringValue || ''}
                onChange={(e) => setRecurringValue(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Expected Close Date</label>
            <Input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Deal Notes / Specifications</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
              placeholder="Add client requirements or priority hooks..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={formSubmitting}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={formSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {formSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'CREATE DEAL'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit/Update Deal Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedDeal(null); }}
        title={selectedDeal ? `Edit: ${selectedDeal.deal_name}` : 'Edit Deal'}
        subtitle="Modify or audit active transaction fields"
      >
        <form onSubmit={handleUpdateDeal} className="flex flex-col gap-4 font-body text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Deal Name *</label>
            <Input
              type="text"
              required
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Company Name *</label>
            <Input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Setup Fee ($)</label>
              <Input
                type="number"
                value={setupValue || ''}
                onChange={(e) => setSetupValue(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Recurring Fee ($ / month)</label>
              <Input
                type="number"
                value={recurringValue || ''}
                onChange={(e) => setRecurringValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Expected Close Date</label>
            <Input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          {selectedDeal?.stage === 'Lost' && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-rose-500 font-bold uppercase">Reason for Loss *</label>
              <textarea
                rows={2}
                required
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full p-3 bg-rose-50/30 border border-rose-200 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-rose-800 resize-none font-medium"
                placeholder="Specify why the deal fell through..."
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase">Deal Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-700 resize-none font-medium"
            />
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              onClick={() => handleDeleteDeal()}
              disabled={formSubmitting}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              DELETE
            </button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setIsEditOpen(false); setSelectedDeal(null); }}
                disabled={formSubmitting}
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {formSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SAVE CHANGES'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
