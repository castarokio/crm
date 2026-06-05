'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  ShieldAlert,
  ArrowRight,
  Lock,
  AlertCircle,
  Laptop,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Briefcase,
  ShieldCheck,
  Users
} from 'lucide-react';
import {
  getCallerProfiles,
  getCurrentSessionAction,
  logoutAction,
  verifyCallerPinAction,
  submitTeamApplication,
  verifyPortalPinAction,
  startDemoSessionAction,
} from '@/app/actions/auth';
import { gsap } from 'gsap';

import { AgreementGate } from '@/components/auth/AgreementGate';
import { TermsOfUseModal } from '@/components/auth/TermsOfUseModal';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  // Authentication states
  const [portalUnlocked, setPortalUnlocked] = useState<boolean>(false);
  const [callerName, setCallerName] = useState<string>('');
  const [callerRole, setCallerRole] = useState<string>('Caller');
  const [agreementAcceptedVersion, setAgreementAcceptedVersion] = useState<string | null>(null);
  
  // Dynamic guidelines state
  const [latestGuidelinesVersion, setLatestGuidelinesVersion] = useState<string>('1.0');
  const [latestGuidelinesText, setLatestGuidelinesText] = useState<string>('');
  
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
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [appForm, setAppForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    telegram: '',
    experience: 'none',
    hours: '1-2h',
    termsAccepted: false
  });
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
      setAgreementAcceptedVersion(session.agreementAcceptedVersion || null);
      if (session.latestGuidelinesVersion) {
        setLatestGuidelinesVersion(session.latestGuidelinesVersion);
      }
      if (session.latestGuidelinesText) {
        setLatestGuidelinesText(session.latestGuidelinesText);
      }
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
      setAgreementAcceptedVersion(res.agreementAcceptedVersion || null);
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

  const handleStartDemoMode = useCallback(async () => {
    setVerifying(true);
    const res = await startDemoSessionAction();
    if (res.success) {
      setCallerName('Demo Caller');
      setCallerRole('Caller');
      setAgreementAcceptedVersion('1.0');
      setPromptPinFor('');
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
      <AgreementGate
        callerName={callerName}
        agreementAcceptedVersion={agreementAcceptedVersion}
        latestGuidelinesVersion={latestGuidelinesVersion}
        latestGuidelinesText={latestGuidelinesText}
        callerRole={callerRole}
        onAccepted={(updatedSession) => {
          setAgreementAcceptedVersion(updatedSession.agreementAcceptedVersion);
        }}
      >
        <Dashboard
          callerName={callerName}
          callerRole={callerRole}
          onLogoutCaller={handleLogoutCaller}
        />
      </AgreementGate>
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

              {/* Try Sandbox/Demo Mode Button */}
              <button
                type="button"
                onClick={handleStartDemoMode}
                className="w-full py-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-150/40 text-indigo-700 font-display text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md mt-2"
              >
                <Laptop className="w-4 h-4 text-indigo-650" />
                Launch Demo Sandbox (No Passcode)
              </button>

              {/* Exit system & lock button */}
              <button
                onClick={handleLockPortal}
                className="mt-4 font-body text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1.5 self-center"
              >
                <ShieldAlert className="w-4 h-4" />
                Exit & Lock Portal
              </button>
            </div>
          )}

          {/* Outreach Team Opportunities Card */}
          {!callerName && (
            <div className="gsap-login-footer w-full bg-white/40 border border-slate-200/50 rounded-3xl p-6 shadow-md flex flex-col gap-4 backdrop-blur-md mt-4 text-center">
              <div>
                <h3 className="font-display text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Outreach Team Opportunities
                </h3>
                <p className="font-body text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Are you an outbound caller or appointment setter looking to join our travel outreach campaign? Submit your application to request access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(true);
                  setAppSuccess('');
                  setAppError('');
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-body text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Submit Registration Application
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Team Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide">
                Outbound Team Registration
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
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="mt-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!appForm.termsAccepted) {
                    setAppError('You must read and accept the Terms of Use.');
                    return;
                  }
                  setIsSubmittingApp(true);
                  setAppError('');
                  const res = await submitTeamApplication(
                    appForm.name,
                    appForm.email,
                    appForm.phone,
                    appForm.gender,
                    appForm.telegram,
                    appForm.experience,
                    appForm.hours
                  );
                  setIsSubmittingApp(false);
                  if (res.success) {
                    setAppSuccess('Application submitted successfully!');
                    setAppForm({
                      name: '',
                      email: '',
                      phone: '',
                      gender: 'Male',
                      telegram: '',
                      experience: 'none',
                      hours: '1-2h',
                      termsAccepted: false
                    });
                  } else {
                    setAppError(res.error || 'Failed to submit application.');
                  }
                }}
                className="flex flex-col gap-4 font-body text-xs"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={appForm.name}
                      onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="e.g. Oussama Dz"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={appForm.email}
                        onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="name@domain.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={appForm.phone}
                        onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="e.g. 0550123456"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Telegram Username (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={appForm.telegram}
                        onChange={(e) => setAppForm({ ...appForm, telegram: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="e.g. oussama_dz"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Gender
                    </label>
                    <select
                      value={appForm.gender}
                      onChange={(e) => setAppForm({ ...appForm, gender: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" /> Calling Experience
                    </label>
                    <select
                      value={appForm.experience}
                      onChange={(e) => setAppForm({ ...appForm, experience: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="none">No Experience</option>
                      <option value="1-6m">1-6 Months</option>
                      <option value="6-12m">6-12 Months</option>
                      <option value="1y+">1+ Years</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Hours Available
                    </label>
                    <select
                      value={appForm.hours}
                      onChange={(e) => setAppForm({ ...appForm, hours: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-body focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="1-2h">1-2 hrs/day</option>
                      <option value="2-4h">2-4 hrs/day</option>
                      <option value="4-6h">4-6 hrs/day</option>
                      <option value="6h+">6+ hrs/day</option>
                    </select>
                  </div>
                </div>

                {/* Terms Acceptance Viewport */}
                <div className="flex items-start gap-2.5 bg-indigo-50/40 border border-indigo-100/30 rounded-xl p-3.5">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    required
                    checked={appForm.termsAccepted}
                    onChange={(e) => setAppForm({ ...appForm, termsAccepted: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="termsAccepted" className="font-body text-[10px] text-slate-650 leading-normal select-none">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-indigo-700 hover:text-indigo-950 font-bold underline cursor-pointer inline"
                    >
                      WEB-OS Caller Terms of Use
                    </button>{' '}
                    and understand that work is commission-based.
                  </label>
                </div>

                {/* GDPR Notice */}
                <div className="flex items-start gap-1.5 px-1 font-body text-[9px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Privacy Notice: Your registration details are logged securely and only used by WEB-OS coordinators for recruiting and session setups.
                  </span>
                </div>

                {appError && (
                  <p className="text-rose-700 font-bold text-[10px] uppercase tracking-wide">{appError}</p>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold uppercase transition-all border border-slate-200/50 cursor-pointer text-[10px] tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 text-[10px] tracking-wider"
                  >
                    {isSubmittingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Terms of Use Viewport Dialog */}
      <TermsOfUseModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </main>
  );
}
