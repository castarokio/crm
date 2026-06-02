'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from '@/components/Dashboard';
import { User, ShieldAlert, ArrowRight, Lock, KeyRound, AlertCircle, Laptop } from 'lucide-react';

export default function Home() {
  // Authentication states
  const [portalUnlocked, setPortalUnlocked] = useState<boolean>(false);
  const [callerName, setCallerName] = useState<string>('');
  
  // PIN states
  const [enteredPortalPin, setEnteredPortalPin] = useState<string>('');
  const [enteredCallerPin, setEnteredCallerPin] = useState<string>('');
  const [promptPinFor, setPromptPinFor] = useState<string>(''); // Name of user being prompted for PIN

  // Verification feedback
  const [portalError, setPortalError] = useState<boolean>(false);
  const [callerError, setCallerError] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Synchronous refs to avoid state closure capture race conditions
  const portalPinRef = useRef<string>('');
  const callerPinRef = useRef<string>('');

  // Restore session states on mount
  useEffect(() => {
    const cachedPortal = localStorage.getItem('__portal_unlocked');
    if (cachedPortal === 'true') {
      setPortalUnlocked(true);
      
      const cachedCaller = localStorage.getItem('__caller_name');
      if (cachedCaller && ['Hamid', 'Oussama', 'Kamel'].includes(cachedCaller)) {
        setCallerName(cachedCaller);
      }
    }
  }, []);

  // Verify Primary Portal PIN (676869)
  const verifyPortalPin = useCallback(async (pin: string) => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Tactile delay

    const expectedPortalPin = process.env.NEXT_PUBLIC_PORTAL_PIN || '676869';
    if (pin === expectedPortalPin) {
      localStorage.setItem('__portal_unlocked', 'true');
      setPortalUnlocked(true);
      setEnteredPortalPin('');
      portalPinRef.current = '';
      setPortalError(false);
    } else {
      setPortalError(true);
      setEnteredPortalPin('');
      portalPinRef.current = '';
      if (navigator.vibrate) navigator.vibrate(200);
    }
    setVerifying(false);
  }, []);

  // Verify Caller Profile PIN (Hamid: 343536, Oussama: 121314, Kamel: 232425)
  const verifyCallerPin = useCallback(async (name: string, pin: string) => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Tactile delay

    let expectedPin = '';
    if (name === 'Hamid') {
      expectedPin = process.env.NEXT_PUBLIC_HAMID_PIN || '343536';
    } else if (name === 'Oussama') {
      expectedPin = process.env.NEXT_PUBLIC_OUSSAMA_PIN || '121314';
    } else if (name === 'Kamel') {
      expectedPin = process.env.NEXT_PUBLIC_KAMEL_PIN || '232425';
    }

    if (pin === expectedPin && expectedPin !== '') {
      localStorage.setItem('__caller_name', name);
      setCallerName(name);
      setPromptPinFor('');
      setEnteredCallerPin('');
      callerPinRef.current = '';
      setCallerError(false);
    } else {
      setCallerError(true);
      setEnteredCallerPin('');
      callerPinRef.current = '';
      if (navigator.vibrate) navigator.vibrate(200);
    }
    setVerifying(false);
  }, []);

  // Sync state functions for Ref updates
  const handleDigitPress = useCallback((digit: string) => {
    if (!portalUnlocked) {
      if (portalPinRef.current.length < 6) {
        portalPinRef.current += digit;
        setEnteredPortalPin(portalPinRef.current);
        setPortalError(false);
        if (portalPinRef.current.length === 6) {
          verifyPortalPin(portalPinRef.current);
        }
      }
    } else if (promptPinFor) {
      if (callerPinRef.current.length < 6) {
        callerPinRef.current += digit;
        setEnteredCallerPin(callerPinRef.current);
        setCallerError(false);
        if (callerPinRef.current.length === 6) {
          verifyCallerPin(promptPinFor, callerPinRef.current);
        }
      }
    }
  }, [portalUnlocked, promptPinFor, verifyPortalPin, verifyCallerPin]);

  const handleDeletePress = useCallback(() => {
    if (!portalUnlocked) {
      portalPinRef.current = portalPinRef.current.slice(0, -1);
      setEnteredPortalPin(portalPinRef.current);
      setPortalError(false);
    } else if (promptPinFor) {
      callerPinRef.current = callerPinRef.current.slice(0, -1);
      setEnteredCallerPin(callerPinRef.current);
      setCallerError(false);
    }
  }, [portalUnlocked, promptPinFor]);

  const handleClearPress = useCallback(() => {
    if (!portalUnlocked) {
      portalPinRef.current = '';
      setEnteredPortalPin('');
      setPortalError(false);
    } else if (promptPinFor) {
      callerPinRef.current = '';
      setEnteredCallerPin('');
      setCallerError(false);
    }
  }, [portalUnlocked, promptPinFor]);

  // Core physical keyboard typing listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If fully logged in and inside dashboard, disable page auth inputs
      if (callerName) return;

      // Handle numbers 0-9
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      }

      // Handle Backspace deletion
      if (e.key === 'Backspace') {
        handleDeletePress();
      }

      // Escape to cancel/exit PIN prompt back to selection grid
      if (e.key === 'Escape' && promptPinFor) {
        setPromptPinFor('');
        callerPinRef.current = '';
        setEnteredCallerPin('');
        setCallerError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callerName, promptPinFor, handleDigitPress, handleDeletePress]);

  const handleSelectCaller = (name: string) => {
    setPromptPinFor(name);
    callerPinRef.current = '';
    setEnteredCallerPin('');
    setCallerError(false);
  };

  const handleLogoutCaller = () => {
    localStorage.removeItem('__caller_name');
    setCallerName('');
    setPromptPinFor('');
    portalPinRef.current = '';
    callerPinRef.current = '';
    setEnteredPortalPin('');
    setEnteredCallerPin('');
  };

  const handleLockPortal = () => {
    localStorage.removeItem('__caller_name');
    localStorage.removeItem('__portal_unlocked');
    setCallerName('');
    setPortalUnlocked(false);
    setPromptPinFor('');
    portalPinRef.current = '';
    callerPinRef.current = '';
    setEnteredPortalPin('');
    setEnteredCallerPin('');
  };

  return (
    <main className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-start">
      {callerName ? (
        <Dashboard callerName={callerName} onLogoutCaller={handleLogoutCaller} />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden select-none">
          {/* Decorative Blur Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-full max-w-xl flex flex-col items-center gap-8 relative z-10">
            
            {/* Header section */}
            <div className="text-center flex flex-col gap-2">
              <span className="font-body text-[10px] text-blue-600 font-bold tracking-widest uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full inline-block mx-auto mb-1">
                CALL-OS SECURE SYSTEM
              </span>
              
              <h1 className="font-display text-3xl font-black text-slate-900 tracking-wide uppercase">
                {!portalUnlocked 
                  ? 'Portal Access Required' 
                  : promptPinFor 
                  ? `${promptPinFor}'s Session` 
                  : 'Select Session Profile'
                }
              </h1>
              
              <p className="font-body text-xs text-slate-400 max-w-xs mx-auto">
                {!portalUnlocked 
                  ? 'Enter primary PIN using your physical keyboard or the keypad.'
                  : promptPinFor 
                  ? `Enter ${promptPinFor}'s unique PIN to unlock caller dashboard.`
                  : 'Welcome team. Choose your profile to begin cold-calling travel agencies.'
                }
              </p>
            </div>

            {/* STATE 1: Primary Portal Lock (PIN 676869) */}
            {!portalUnlocked && (
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                  portalError ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>

                {/* Keyboard Input Notification */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <Laptop className="w-3.5 h-3.5" />
                  Keyboard input active
                </div>

                {/* PIN dot indicators */}
                <div className="flex gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                        i < enteredPortalPin.length
                          ? portalError
                            ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                            : 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                          : 'bg-transparent border-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {portalError && (
                  <p className="font-body text-[10px] text-rose-600 font-bold tracking-wider uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    INCORRECT PIN. ACCESS DENIED.
                  </p>
                )}
                {verifying && (
                  <p className="font-body text-[10px] text-blue-600 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                    <KeyRound className="w-3.5 h-3.5 animate-spin" />
                    Verifying access...
                  </p>
                )}

                {/* Keypad Numeric grid */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handleDigitPress(num)}
                      className="py-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleClearPress}
                    className="py-3.5 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleDigitPress('0')}
                    className="py-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDeletePress}
                    className="py-3.5 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: Caller Profile PIN lock (Hamid, Oussama, Kamel) */}
            {portalUnlocked && promptPinFor && (
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                  callerError ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <Laptop className="w-3.5 h-3.5" />
                  Keyboard input active
                </div>

                {/* PIN dot indicators */}
                <div className="flex gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                        i < enteredCallerPin.length
                          ? callerError
                            ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                            : 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                          : 'bg-transparent border-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {callerError && (
                  <p className="font-body text-[10px] text-rose-600 font-bold tracking-wider uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    INCORRECT PIN. ACCESS REFUSED.
                  </p>
                )}
                {verifying && (
                  <p className="font-body text-[10px] text-blue-600 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                    <KeyRound className="w-3.5 h-3.5 animate-spin" />
                    Unlocking session...
                  </p>
                )}

                {/* Keypad Numeric grid */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handleDigitPress(num)}
                      className="py-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setPromptPinFor('');
                      callerPinRef.current = '';
                      setEnteredCallerPin('');
                      setCallerError(false);
                    }}
                    className="py-3.5 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleDigitPress('0')}
                    className="py-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDeletePress}
                    className="py-3.5 rounded-2xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: Profile Selection Grid (Hamid, Kamel, Oussama) */}
            {portalUnlocked && !promptPinFor && (
              <div className="flex flex-col gap-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { name: 'Hamid', desc: 'LOCKED PROFILE', style: 'border-blue-200 hover:border-blue-500 hover:shadow-blue-500/10 text-blue-600', isLocked: true },
                    { name: 'Oussama', desc: 'LOCKED PROFILE', style: 'border-indigo-200 hover:border-indigo-500 hover:shadow-indigo-500/10 text-indigo-600', isLocked: true },
                    { name: 'Kamel', desc: 'LOCKED PROFILE', style: 'border-cyan-200 hover:border-cyan-500 hover:shadow-cyan-500/10 text-cyan-600', isLocked: true }
                  ].map((user) => (
                    <button
                      key={user.name}
                      onClick={() => handleSelectCaller(user.name)}
                      className={`flex flex-col items-center gap-4 p-8 rounded-3xl border-2 bg-white shadow-sm transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer text-center group ${user.style}`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform duration-300 relative">
                        <User className="w-7 h-7" />
                        {user.isLocked && (
                          <div className="absolute -top-1 -right-1 bg-blue-100 border border-blue-200 text-blue-600 p-1 rounded-lg">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-800 uppercase tracking-wide">
                          {user.name}
                        </h3>
                        <p className="font-body text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                          {user.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all duration-300" />
                    </button>
                  ))}
                </div>

                {/* Exit system & lock button */}
                <button
                  onClick={handleLockPortal}
                  className="mt-6 font-body text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1.5 self-center"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Exit & Lock Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
