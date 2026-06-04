'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '../ui/button';

type SchedulerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (datetimeStr: string) => void;
  currentValue?: string;
};

export function SchedulerModal({
  isOpen,
  onClose,
  onSelect,
  currentValue = '',
}: SchedulerModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (currentValue) {
      const parsed = new Date(currentValue.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    if (currentValue) {
      const parsed = new Date(currentValue.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) return parsed.getDate();
    }
    return new Date().getDate();
  });

  const [hour, setHour] = useState<number>(() => {
    if (currentValue) {
      const parsed = new Date(currentValue.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) return parsed.getHours();
    }
    return 10; // Default: 10 AM
  });

  const [minute, setMinute] = useState<number>(() => {
    if (currentValue) {
      const parsed = new Date(currentValue.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) return parsed.getMinutes();
    }
    return 0;
  });

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to get total days in current month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // Helper to get first weekday of current month (0: Sunday, 1: Monday...)
  const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    if (selectedDay === null) return;
    
    const selectedDate = new Date(year, month, selectedDay, hour, minute);
    
    // Format: YYYY-MM-DD HH:MM
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const hh = String(selectedDate.getHours()).padStart(2, '0');
    const min = String(selectedDate.getMinutes()).padStart(2, '0');
    
    onSelect(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
    onClose();
  };

  // Generate blank calendar squares for padding first weekday
  const calendarGrid: (number | null)[] = [];
  for (let i = 0; i < firstDay; i += 1) {
    calendarGrid.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    calendarGrid.push(day);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-sm w-full overflow-hidden flex flex-col animate-fade-in font-body text-xs text-slate-800">
        
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider">Schedule Call Booking</h3>
            <p className="text-[10px] text-slate-450 mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              Set callback alerts
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-450 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-5 flex flex-col gap-4">
          
          {/* Month selector */}
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-slate-800 uppercase tracking-wider">
              {monthNames[month]} {year}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={prevMonth}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday letters */}
          <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[11px]">
            {calendarGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const selected = selectedDay === day;
              const current = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                    selected
                      ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-150'
                      : current
                      ? 'bg-indigo-50 border-indigo-150 text-indigo-700 font-extrabold'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Slider/Dropdown Selector */}
          <div className="border-t border-slate-100 pt-4 mt-1 flex flex-col gap-3">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Select Time</span>
            <div className="flex gap-4 items-center justify-center">
              {/* Hours selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="bg-transparent focus:outline-none text-xs font-black text-slate-800 border-none pr-5 py-0"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={`hour-${i}`} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 font-bold uppercase">hr</span>
              </div>

              <span className="text-slate-400 font-bold text-sm">:</span>

              {/* Minutes selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="bg-transparent focus:outline-none text-xs font-black text-slate-800 border-none pr-5 py-0"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const minVal = i * 5;
                    return (
                      <option key={`min-${minVal}`} value={minVal}>
                        {minVal.toString().padStart(2, '0')}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 font-bold uppercase">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="text-[10px]"
          >
            CANCEL
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedDay === null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px]"
          >
            CONFIRM SCHEDULE
          </Button>
        </div>
      </div>
    </div>
  );
}
