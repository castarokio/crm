'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';

interface PasscodeGateProps {
  onSuccess: () => void;
}

export default function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    const cachedPin = localStorage.getItem('__portal_pin');
    const targetPin = process.env.NEXT_PUBLIC_PORTAL_PIN || '676869'; // Using user pin
    if (cachedPin === targetPin) {
      onSuccess();
    }
  }, [onSuccess]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = async (enteredPin: string) => {
    setChecking(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const targetPin = process.env.NEXT_PUBLIC_PORTAL_PIN || '676869';
    if (enteredPin === targetPin) {
      localStorage.setItem('__portal_pin', enteredPin);
      onSuccess();
    } else {
      setError(true);
      setPin('');
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
    setChecking(false);
  };

  useEffect(() => {
    if (pin.length === 6) {
      verifyPin(pin);
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 relative z-10"
      >
        {/* Lock Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
          error 
            ? 'bg-rose-500/10 border-rose-200 text-rose-600' 
            : checking 
            ? 'bg-blue-500/10 border-blue-200 text-blue-600 animate-pulse'
            : 'bg-slate-50 border-slate-100 text-slate-700'
        }`}>
          {error ? <ShieldAlert className="w-6 h-6 animate-bounce" /> : <Lock className="w-6 h-6" />}
        </div>

        {/* Header Text */}
        <div className="text-center flex flex-col gap-1.5">
          <h2 className="font-display text-sm tracking-widest text-slate-800 uppercase font-black">
            CALL-OS PORTAL
          </h2>
          <p className="font-body text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            Enter 6-digit access code to unlock workspace
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex gap-4.5 my-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                i < pin.length
                  ? error
                    ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                  : 'bg-transparent border-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Feedback Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="font-body text-[10px] text-rose-600 font-bold tracking-wider uppercase flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              ACCESS DENIED. INVALID PIN.
            </motion.p>
          )}
          {checking && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-[10px] text-blue-600 tracking-wider uppercase flex items-center gap-1.5 font-bold"
            >
              <KeyRound className="w-3.5 h-3.5 animate-spin" />
              VERIFYING ACCESS PIN...
            </motion.p>
          )}
          {!error && !checking && (
            <div className="h-[15px]" />
          )}
        </AnimatePresence>

        {/* Keypad Numeric Buttons */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              disabled={checking}
              onClick={() => handleKeyPress(num)}
              className="py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {num}
            </button>
          ))}
          <button
            disabled={checking}
            onClick={handleClear}
            className="py-4 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-700 active:scale-95 transition-all uppercase cursor-pointer disabled:opacity-40"
          >
            Clear
          </button>
          <button
            disabled={checking}
            onClick={() => handleKeyPress('0')}
            className="py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer disabled:opacity-40"
          >
            0
          </button>
          <button
            disabled={checking}
            onClick={handleDelete}
            className="py-4 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-700 active:scale-95 transition-all uppercase cursor-pointer disabled:opacity-40"
          >
            Del
          </button>
        </div>
      </motion.div>
    </div>
  );
}
