'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ShieldAlert, ArrowRight, Lock, AlertCircle, Laptop, Loader2 } from 'lucide-react';
import {
  getCallerProfiles,
  getCurrentSessionAction,
  logoutAction,
  verifyCallerPinAction,
  submitTeamApplication,
  verifyPortalPinAction,
} from '@/app/actions/auth';
import { gsap } from 'gsap';

// Note: Dashboard tab module is imported dynamically or after auth verification to keep chunk sizes modular.
import Dashboard from '@/components/Dashboard';

export default function Home() {
  // Authentication states
  const [portalUnlocked, setPortalUnlocked] = useState<boolean>(false);
  const [callerName, setCallerName] = useState<string>('');
  const [callerRole, setCallerRole] = useState<string>('Caller');
  
  // PIN states
  const [enteredPortalPin, setEnteredPortalPin] = useState<string>('');
  const [enteredCallerPin, setEnteredCallerPin] = useState<string>('');
  const [promptPinFor, setPromptPinFor] = useState<string>(''); // Name of user being prompted for PIN

  // Verification feedback
  const [portalError, setPortalError] = useState<boolean>(false);
  const [callerError, setCallerError] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [dbOffline, setDbOffline] = useState<boolean>(false);

  // Dynamic profiles & applications
  const [callerProfiles, setCallerProfiles] = useState<any[]>([
    { name: 'Hamid', gender: 'Male' },
    { name: 'Oussama', gender: 'Male' },
    { name: 'Kamel', gender: 'Male' }
  ]);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [appForm, setAppForm] = useState({ name: '', email: '', phone: '', gender: 'Male' });
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [appSuccess, setAppSuccess] = useState<string>('');
  const [appError, setAppError] = useState<string>('');

  // Synchronous refs to avoid state closure capture race conditions
  const portalPinRef = useRef<string>('');
  const callerPinRef = useRef<string>('');

  const loadCallerProfiles = useCallback(async () => {
    const res = await getCallerProfiles();
    if (res && res.success) {
      setCallerProfiles(res.profiles);
      setDbOffline(false);
    } else if (res && res.error === 'DATABASE_NOT_CONFIGURED') {
      setDbOffline(true);
    }
  }, []);

  // Restore session on load
  useEffect(() => {
    void getCurrentSessionAction().then(session => {
      if (!session.success) return;
      setPortalUnlocked(session.portalUnlocked);
      setCallerName(session.callerName);
      setCallerRole(session.callerRole);
      if (session.portalUnlocked) loadCallerProfiles();
    });
  }, [loadCallerProfiles]);

  // GSAP animation for login elements on mount
  useEffect(() => {
    if (callerName) return;
    
    gsap.fromTo('.gsap-login-header',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
    gsap.fromTo('.gsap-login-card',
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 }
    );
    gsap.fromTo('.gsap-login-footer',
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.4 }
    );
  }, [callerName, portalUnlocked, promptPinFor]);

  // Verify Primary Portal PIN securely server-side
  const verifyPortalPin = useCallback(async (pin: string) => {
    setVerifying(true);
    const res = await verifyPortalPinAction(pin);
    if (res.success) {
      setPortalUnlocked(true);
      setEnteredPortalPin('');
      portalPinRef.current = '';
      setPortalError(false);
      loadCallerProfiles();
    } else {
      setPortalError(true);
      setEnteredPortalPin('');
      portalPinRef.current = '';
      if (navigator.vibrate) navigator.vibrate(200);
    }
    setVerifying(false);
  }, [loadCallerProfiles]);

  // Verify Caller Profile PIN securely
  const verifyCallerPin = useCallback(async (name: string, pin: string) => {
    setVerifying(true);
    const res = await verifyCallerPinAction(name, pin);

    if (res.success) {
      setCallerName(name);
      setCallerRole(res.role || 'Caller');
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

  const handleLogoutCaller = async () => {
    await logoutAction();
    setCallerName('');
    setCallerRole('Caller');
    setPromptPinFor('');
    portalPinRef.current = '';
    callerPinRef.current = '';
    setEnteredPortalPin('');
    setEnteredCallerPin('');
  };

  const handleLockPortal = async () => {
    await logoutAction();
    setCallerName('');
    setCallerRole('Caller');
    setPortalUnlocked(false);
    setPromptPinFor('');
    portalPinRef.current = '';
    callerPinRef.current = '';
    setEnteredPortalPin('');
    setEnteredCallerPin('');
  };

  if (callerName) {
    return (
      <Dashboard
        callerName={callerName}
        callerRole={callerRole}
        onLogoutCaller={handleLogoutCaller}
      />
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-start relative overflow-hidden select-none">
      {/* Premium Minimalist Background Grids */}
      <div className="light-cyber-grid absolute inset-0 opacity-[0.25] pointer-events-none z-0" />

      {/* Elegant, restrained blurred decorative blobs (Alabaster system) */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-slate-100/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-4xl mx-auto">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          {dbOffline && (
            <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm animate-pulse">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-display text-xs font-bold uppercase tracking-wider">Database Offline</span>
                <span className="font-body text-[10px] text-amber-600 font-semibold mt-0.5">LOCAL MODE ACTIVE — CHANGES WILL NOT BE SAVED TO CLOUD</span>
              </div>
            </div>
          )}
          
          {/* Header section */}
          <div className="text-center flex flex-col gap-2 gsap-login-header">
            <span className="font-body text-[9px] text-indigo-700 font-bold tracking-widest uppercase bg-indigo-50/80 border border-indigo-100 px-4 py-1.5 rounded-full inline-block mx-auto mb-1">
              Call-OS Client Console
            </span>
            
            <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none">
              {!portalUnlocked 
                ? 'Portal Code Required' 
                : promptPinFor 
                ? `${promptPinFor}'s Session` 
                : 'Choose Caller Profile'
              }
            </h1>
            
            <p className="font-body text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {!portalUnlocked 
                ? 'Type in your portal passcode. Physical keyboard number keys are enabled.'
                : promptPinFor 
                ? `Please enter the PIN code assigned to ${promptPinFor}.`
                : 'Select your team caller profile below to enter the outreach layout.'
              }
            </p>
          </div>

          {/* STATE 1: Primary Portal Lock */}
          {!portalUnlocked && (
            <div className="gsap-login-card w-full bg-white/80 border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100 flex flex-col items-center gap-6 backdrop-blur-lg">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                portalError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                <Lock className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-full font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                Keyboard input active
              </div>

              {/* PIN dot indicators */}
              <div className="flex gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                      i < enteredPortalPin.length
                        ? portalError
                          ? 'bg-rose-600 border-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.3)]'
                          : 'bg-indigo-700 border-indigo-600 shadow-[0_0_8px_rgba(30,58,138,0.3)]'
                        : 'bg-transparent border-slate-300'
                    }`}
                  />
                ))}
              </div>

              {portalError && (
                <p className="font-body text-[10px] text-rose-700 font-bold tracking-wider uppercase flex items-center gap-1 animate-bounce">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Passcode incorrect. Retry.
                </p>
              )}
              {verifying && (
                <p className="font-body text-[10px] text-indigo-700 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </p>
              )}

              {/* Keypad Numeric grid */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleDigitPress(num)}
                    className="py-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClearPress}
                  className="py-3 rounded-xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleDigitPress('0')}
                  className="py-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleDeletePress}
                  className="py-3 rounded-xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                >
                  Del
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: Caller Profile PIN lock */}
          {portalUnlocked && promptPinFor && (
            <div className="gsap-login-card w-full bg-white/80 border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100 flex flex-col items-center gap-6 backdrop-blur-lg">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                callerError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}>
                <Lock className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-full font-body text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                Keyboard input active
              </div>

              {/* PIN dot indicators */}
              <div className="flex gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                      i < enteredCallerPin.length
                        ? callerError
                          ? 'bg-rose-600 border-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.3)]'
                          : 'bg-indigo-700 border-indigo-600 shadow-[0_0_8px_rgba(30,58,138,0.3)]'
                        : 'bg-transparent border-slate-300'
                    }`}
                  />
                ))}
              </div>

              {callerError && (
                <p className="font-body text-[10px] text-rose-700 font-bold tracking-wider uppercase flex items-center gap-1 animate-bounce">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Incorrect Profile PIN.
                </p>
              )}
              {verifying && (
                <p className="font-body text-[10px] text-indigo-700 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Authorizing...
                </p>
              )}

              {/* Keypad Numeric grid */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleDigitPress(num)}
                    className="py-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
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
                  className="py-3 rounded-xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => handleDigitPress('0')}
                  className="py-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-slate-800 font-display text-base font-bold cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleDeletePress}
                  className="py-3 rounded-xl bg-transparent font-body text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase cursor-pointer"
                >
                  Del
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: Profile Selection Grid */}
          {portalUnlocked && !promptPinFor && (
            <div className="gsap-login-card flex flex-col gap-6 w-full max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {callerProfiles.map((user) => {
                  const genderStyle = user.gender === 'Female'
                    ? 'border-rose-100 hover:border-rose-400 hover:shadow-rose-100 text-rose-700'
                    : user.name === 'Hamid'
                    ? 'border-blue-100 hover:border-blue-400 hover:shadow-blue-100 text-blue-700'
                    : user.name === 'Oussama'
                    ? 'border-indigo-100 hover:border-indigo-400 hover:shadow-indigo-100 text-indigo-700'
                    : 'border-slate-100 hover:border-slate-400 hover:shadow-slate-100 text-slate-700';
                    
                  return (
                    <button
                      key={user.name}
                      onClick={() => handleSelectCaller(user.name)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-center group ${genderStyle}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/40 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-300 relative">
                        <User className="w-6 h-6" />
                        <div className="absolute -top-1 -right-1 bg-slate-100 border border-slate-200 text-slate-400 p-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider">
                          {user.name}
                        </h3>
                        <p className="font-body text-[9px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">
                          {user.role || 'Caller'}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300 mt-1" />
                    </button>
                  );
                })}
              </div>

              {/* Exit system & lock button */}
              <button
                onClick={handleLockPortal}
                className="mt-6 font-body text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1.5 self-center"
              >
                <ShieldAlert className="w-4 h-4" />
                Exit & Lock Portal
              </button>
            </div>
          )}

          {/* Apply to Join Team Button */}
          {!callerName && (
            <button
              onClick={() => {
                setShowJoinModal(true);
                setAppSuccess('');
                setAppError('');
              }}
              className="gsap-login-footer font-body text-[10px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1 border border-slate-200/60 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-sm mt-4 hover:shadow-md"
            >
              Apply to Join Team
            </button>
          )}

        </div>
      </div>

      {/* Team Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide">
                Apply to Join Team
              </h3>
              <p className="font-body text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                Submit details for coordinator review
              </p>
            </div>

            {appSuccess ? (
              <div className="flex flex-col gap-4 items-center text-center py-4">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold border border-emerald-100">✓</span>
                <p className="font-body text-xs text-slate-700 font-bold uppercase tracking-wider">Application Saved</p>
                <p className="font-body text-[10px] text-slate-400">Your profile details are pending admin review.</p>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="mt-2 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmittingApp(true);
                  setAppError('');
                  const res = await submitTeamApplication(appForm.name, appForm.email, appForm.phone, appForm.gender);
                  setIsSubmittingApp(false);
                  if (res.success) {
                    setAppSuccess('Application submitted successfully!');
                    setAppForm({ name: '', email: '', phone: '', gender: 'Male' });
                  } else {
                    setAppError(res.error || 'Failed to submit application.');
                  }
                }}
                className="flex flex-col gap-4 font-body text-xs"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={appForm.name}
                    onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-850 focus:outline-none focus:border-indigo-300"
                    placeholder="e.g. Oussama Dz"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={appForm.email}
                    onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-850 focus:outline-none focus:border-indigo-300"
                    placeholder="e.g. name@domain.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={appForm.phone}
                    onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-850 focus:outline-none focus:border-indigo-300"
                    placeholder="e.g. 0550123456"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Gender</label>
                  <select
                    value={appForm.gender}
                    onChange={(e) => setAppForm({ ...appForm, gender: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-850 focus:outline-none focus:border-indigo-300 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {appError && (
                  <p className="text-rose-700 font-bold text-[10px] uppercase tracking-wide">{appError}</p>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold uppercase transition-all border border-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
