import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, Globe, MapPin, Star, ExternalLink, Check, Loader2, 
  AlertCircle, Clock, Plus, Trash2, CheckSquare, Square
} from 'lucide-react';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { GlassCard } from '../ui/glass-card';
import { Input } from '../ui/input';
import { updateLeadDetails } from '@/app/actions/leads';
import { PitchGenerator } from './pitch-generator';
import { CallLogLedger } from './call-log-ledger';
import { toast } from '@/lib/toast';
import { 
  formatWhatsappPhone, 
  normalizeFacebookProfileUrl, 
  normalizeInstagramProfileUrl, 
  normalizeTikTokProfileUrl, 
  normalizeLinkedInProfileUrl, 
  normalizeInstagramDmUrl, 
  normalizeMessengerUrl 
} from '@/lib/social-utils';

const isValidSocialLink = (link?: string | null) => {
  if (!link) return false;
  const l = link.toLowerCase().trim();
  return l !== 'not found' && l !== 'none' && l !== '' && l !== 'null';
};

type LeadInfoCardProps = {
  lead: any;
  callerName: string;
  onDial: (phoneNumber: string) => void;
  onLeadUpdated?: (leadId: number, updatedFields: any) => void;
};

export function LeadInfoCard({
  lead,
  callerName,
  onDial,
  onLeadUpdated,
}: LeadInfoCardProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'pitch' | 'history'>('info');
  const [fields, setFields] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'failed'>>({});
  
  // Alternate inputs list
  const [altPhones, setAltPhones] = useState<string[]>([]);
  const [altEmails, setAltEmails] = useState<string[]>([]);
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    calledPhone1: false,
    calledPhone2: false,
    sentWhatsapp: false,
    sentEmail: false,
    messagedSocial: false,
  });

  // Lock lease countdown
  const [lockTimeRemaining, setLockTimeRemaining] = useState<string>('10:00');
  
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIPhone(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (lead) {
      setFields({
        contact_person: lead.contact_person || '',
        notes: lead.notes || '',
        email: lead.email || '',
        website: lead.website || '',
        website_quality: lead.website_quality || 'None',
        google_rating: lead.google_rating ?? 0,
        review_count: lead.review_count ?? 0,
        work_hours: lead.work_hours || '',
        facebook: lead.facebook || '',
        instagram: lead.instagram || '',
        tiktok: lead.tiktok || '',
        linkedin: lead.linkedin || '',
        social_link: lead.social_link || '',
        followers_if_visible: lead.followers_if_visible || '',
        facebook_followers: lead.facebook_followers || '',
        instagram_followers: lead.instagram_followers || '',
        running_ads: lead.running_ads || 'No',
        services: lead.services || '',
      });
      setSaveStatus({});
      
      // Parse alternate contacts
      const parseDelimited = (val?: string | null) => {
        if (!val) return [];
        return val.split(',').map(s => s.trim()).filter(Boolean);
      };
      setAltPhones(parseDelimited(lead.phone_2));
      setAltEmails(parseDelimited(lead.email_2));

      // Parse Checklist
      const cachedChecklist = localStorage.getItem(`checklist_${lead.id}`);
      if (cachedChecklist) {
        try {
          setChecklist(JSON.parse(cachedChecklist));
        } catch {
          resetChecklist();
        }
      } else {
        resetChecklist();
      }
    }
  }, [lead]);

  // Countdown timer effect
  useEffect(() => {
    if (!lead || !lead.last_updated) return;
    
    const interval = setInterval(() => {
      const lastUpdated = new Date(lead.last_updated).getTime();
      const elapsed = Date.now() - lastUpdated;
      const remainingMs = Math.max(0, 10 * 60 * 1000 - elapsed);
      
      if (remainingMs <= 0) {
        setLockTimeRemaining('Expired');
        clearInterval(interval);
        return;
      }
      
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setLockTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lead]);

  const resetChecklist = () => {
    setChecklist({
      calledPhone1: false,
      calledPhone2: false,
      sentWhatsapp: false,
      sentEmail: false,
      messagedSocial: false,
    });
  };

  const handleChecklistChange = (key: keyof typeof checklist) => {
    if (!lead) return;
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    localStorage.setItem(`checklist_${lead.id}`, JSON.stringify(updated));
  };

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-body text-xs">
        <span>No lead selected</span>
      </div>
    );
  }

  // Handle auto-save on input blur or immediate dropdown change
  const handleBlurSave = async (fieldName: string, value: any) => {
    if (lead[fieldName] === value) return; // No change

    setSaveStatus(prev => ({ ...prev, [fieldName]: 'saving' }));
    try {
      const res = await updateLeadDetails(lead.id, { [fieldName]: value });
      if (res.success) {
        setSaveStatus(prev => ({ ...prev, [fieldName]: 'saved' }));
        if (onLeadUpdated) {
          onLeadUpdated(lead.id, { [fieldName]: value });
        }
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      console.error(`[Auto-save Error - ${fieldName}]`, err);
      setSaveStatus(prev => ({ ...prev, [fieldName]: 'failed' }));
    }
  };

  const renderStatusIndicator = (fieldName: string) => {
    const status = saveStatus[fieldName];
    if (!status) return null;
    if (status === 'saving') {
      return <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />;
    }
    if (status === 'saved') {
      return <Check className="w-3 h-3 text-emerald-600 animate-fade-in" />;
    }
    return <AlertCircle className="w-3 h-3 text-rose-500" />;
  };

  // WhatsApp Pre-filled redirect url constructor
  const getWhatsappUrl = (phoneVal: string, isPrefilled: boolean) => {
    const formatted = formatWhatsappPhone(phoneVal);
    if (!formatted) return '';
    if (!isPrefilled) return `https://wa.me/${formatted}`;
    
    // Retrieve cached pitch
    const pitch = localStorage.getItem(`pitch_draft_${lead.id}`) || 
      `Bonjour, je suis ${callerName} de Web-OS. Nous aimerions collaborer avec vous pour optimiser la présence en ligne de ${lead.agency_name}.`;
    
    return `https://wa.me/${formatted}?text=${encodeURIComponent(pitch)}`;
  };

  const getMailtoUrl = (emailVal: string) => {
    const pitch = localStorage.getItem(`pitch_draft_${lead.id}`) || '';
    const subject = `Proposition de collaboration Web-OS - ${lead.agency_name}`;
    
    let emailBody = pitch;
    if (!emailBody) {
      const isNoWeb = !lead.website || lead.website === 'Not found' || lead.website.toLowerCase() === 'none';
      const webSection = isNoWeb
        ? `- Création d'un site internet professionnel : J'ai remarqué votre excellente visibilité sur les réseaux sociaux, mais l'absence d'un site web dédié vous fait perdre des réservations directes au quotidien.`
        : `- Optimisation de votre site internet (${lead.website}) : J'ai analysé les performances et identifié quelques opportunités d'amélioration pour fluidifier le parcours client et accélérer la vitesse de chargement.`;
        
      const reviewSection = lead.google_rating > 0
        ? `\n- Valorisation de votre réputation Google : Votre note de ${Number(lead.google_rating).toFixed(1)}/5 (${lead.review_count} avis) est un atout exceptionnel que nous pouvons encore mieux rentabiliser.`
        : '';
        
      const adsSection = lead.running_ads === 'Yes'
        ? `\n- Optimisation publicitaire : En reliant vos campagnes à des landing pages optimisées, nous pouvons maximiser l'efficacité de vos publicités actuelles.`
        : '';

      emailBody = `Bonjour l'équipe de ${lead.agency_name},

Je m'appelle hamid de Web-OS. Je me permets de vous contacter car j'aide les agences de voyages en Algérie à booster leurs réservations directes grâce à des outils web sur-mesure.

En analysant la présence digitale de ${lead.agency_name} à ${lead.area || 'votre région'}, j'ai relevé des points clés :

${webSection}${reviewSection}${adsSection}

Nous avons récemment aidé des agences similaires à capter plus de clients et à automatiser la gestion de leurs circuits/vols. Vous pouvez découvrir nos réalisations et notre portfolio ici : https://castarokio.github.io/

Seriez-vous disponibles pour un court appel de 5 à 10 minutes ce [Jour] ou [Jour] pour un échange rapide ? Je serais ravi de vous offrir un audit complet gratuit de votre présence en ligne.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

Cordialement,

hamid — Web-OS
Tél/WhatsApp : +213 540 21 12 50
Email : castarokibusiness@gmail.com
Portfolio : https://castarokio.github.io/`;
    }
    
    let mailtoUrl = `mailto:${emailVal}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // If sending to primary email, and there are alternate emails, add them in CC
    if (emailVal === lead.email && lead.email_2) {
      const altEmailsList = lead.email_2.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (altEmailsList.length > 0) {
        mailtoUrl += `&cc=${encodeURIComponent(altEmailsList.join(','))}`;
      }
    }
    
    return mailtoUrl;
  };

  const getDmPitch = () => {
    const draft = localStorage.getItem(`pitch_draft_${lead.id}`);
    if (draft) return draft;

    const agency = lead.agency_name || "l'agence";
    const area = lead.area || "votre région";
    const isNoWeb = !lead.website || lead.website === 'Not found' || lead.website.toLowerCase() === 'none';
    
    if (isNoWeb) {
      return `Salam! J'espère que vous allez bien. Je m'appelle hamid de Web-OS. J'adore votre contenu sur Instagram, votre visibilité est top! Par contre, c'est dommage de ne pas avoir de site web pour recevoir des réservations directes 24h/7d et crédibiliser votre agence auprès des clients. On a créé des sites super fluides pour des agences en Algérie, jetez un œil ici : https://castarokio.github.io/. Dispo pour en discuter rapidement ?`;
    }
    
    return `Salam! J'espère que vous allez bien. Je m'appelle hamid de Web-OS. J'ai visité le site de ${agency} et j'ai relevé 2-3 détails techniques (notamment sur mobile) qui ralentissent les chargements et vous font perdre des clients. On est spécialisé dans l'optimisation pour les agences de voyages en Algérie (notre portfolio : https://castarokio.github.io/). Dispo pour un court échange ?`;
  };

  const handleSocialDmClick = (e: React.MouseEvent, platform: 'Instagram' | 'Facebook Messenger', handle: string) => {
    e.preventDefault();
    const pitch = getDmPitch();
    void navigator.clipboard.writeText(pitch);
    toast.success(`${platform} pitch copied to clipboard!`);
    
    const url = platform === 'Instagram' 
      ? normalizeInstagramDmUrl(handle, isIPhone, pitch)
      : normalizeMessengerUrl(handle, isIPhone, pitch);
      
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Alternate Phones actions
  const addAltPhone = () => {
    setAltPhones(prev => [...prev, '']);
  };

  const removeAltPhone = (idx: number) => {
    const updated = altPhones.filter((_, i) => i !== idx);
    setAltPhones(updated);
    const joined = updated.filter(Boolean).join(', ');
    void handleBlurSave('phone_2', joined || null);
  };

  const handleAltPhoneChange = (idx: number, value: string) => {
    setAltPhones(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  // Alternate Emails actions
  const addAltEmail = () => {
    setAltEmails(prev => [...prev, '']);
  };

  const removeAltEmail = (idx: number) => {
    const updated = altEmails.filter((_, i) => i !== idx);
    setAltEmails(updated);
    const joined = updated.filter(Boolean).join(', ');
    void handleBlurSave('email_2', joined || null);
  };

  const handleAltEmailChange = (idx: number, value: string) => {
    setAltEmails(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  // Business Hours Open/Closed status helper
  const isBusinessOpen = (workHoursStr?: string | null): { open: boolean; label: string } => {
    if (!workHoursStr) return { open: true, label: 'OPEN' };
    try {
      const parts = workHoursStr.split('-');
      if (parts.length !== 2) return { open: true, label: 'OPEN' };
      const [startStr, endStr] = parts;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = startStr.trim().split(':').map(Number);
      const [endH, endM] = endStr.trim().split(':').map(Number);

      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      let open = false;
      if (startMinutes <= endMinutes) {
        open = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        open = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
      return { open, label: open ? 'OPEN' : 'CLOSED' };
    } catch {
      return { open: true, label: 'OPEN' };
    }
  };

  const openStatus = isBusinessOpen(fields.work_hours);

  return (
    <div className="flex flex-col gap-5">
      {/* Dynamic Sub-Tab Select Bar */}
      <div className="flex gap-4 border-b border-slate-100 pb-3 mb-1">
        <button
          onClick={() => setActiveTab('info')}
          className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'info'
              ? 'border-indigo-650 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-655'
          }`}
        >
          Lead Details
        </button>
        <button
          onClick={() => setActiveTab('pitch')}
          className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'pitch'
              ? 'border-indigo-650 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-655'
          }`}
        >
          Outreach Script
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 px-1 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-650 text-indigo-750 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-655'
          }`}
        >
          Call History
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO SUBTAB */}
      {activeTab === 'pitch' && <PitchGenerator lead={lead} callerName={callerName} />}
      {activeTab === 'history' && <CallLogLedger leadId={lead.id} />}

      {activeTab === 'info' && (
        <>
          {/* Main agency information & rating summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-slate-900 uppercase tracking-wide">
                  {lead.agency_name || 'Unnamed Agency'}
                </h2>
                
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${
                  openStatus.open 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                }`}>
                  {openStatus.label}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-body">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.area || 'Algeria'}
                </span>
                {lead.google_rating > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    {Number(lead.google_rating).toFixed(1)} ({lead.review_count} Reviews)
                  </span>
                )}
                {lead.maps_link && (
                  <a
                    href={lead.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-650 hover:text-indigo-850 hover:underline font-bold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Maps Location
                  </a>
                )}
              </div>
            </div>

            {/* Concurrency lock countdown */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center min-w-[90px]">
              <span className="text-[7.5px] text-slate-450 uppercase font-bold tracking-widest flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-slate-400" />
                Lease Time
              </span>
              <span className="text-sm font-extrabold text-slate-750 font-display mt-0.5">
                {lockTimeRemaining}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: CONTACT DETAILS & OUTBOX CHECKLIST */}
            <div className="flex flex-col gap-5">
              
              {/* Outreach Checklist */}
              <div className="p-4 bg-indigo-50/20 border border-indigo-150/50 rounded-2xl flex flex-col gap-3">
                <h4 className="text-[9.5px] text-indigo-750 uppercase font-bold tracking-widest flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span>OUTBOX CHECKLIST</span>
                  <button 
                    onClick={resetChecklist} 
                    className="text-[8px] font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    RESET
                  </button>
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-body text-xs font-semibold text-slate-650">
                  <button onClick={() => handleChecklistChange('calledPhone1')} className="flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors">
                    {checklist.calledPhone1 ? <CheckSquare className="w-4 h-4 text-indigo-650" /> : <Square className="w-4 h-4 text-slate-350" />}
                    <span>Called Phone 1</span>
                  </button>
                  <button onClick={() => handleChecklistChange('calledPhone2')} className="flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors">
                    {checklist.calledPhone2 ? <CheckSquare className="w-4 h-4 text-indigo-650" /> : <Square className="w-4 h-4 text-slate-350" />}
                    <span>Called Phone 2</span>
                  </button>
                  <button onClick={() => handleChecklistChange('sentWhatsapp')} className="flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors">
                    {checklist.sentWhatsapp ? <CheckSquare className="w-4 h-4 text-indigo-650" /> : <Square className="w-4 h-4 text-slate-350" />}
                    <span>Sent WhatsApp</span>
                  </button>
                  <button onClick={() => handleChecklistChange('sentEmail')} className="flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors">
                    {checklist.sentEmail ? <CheckSquare className="w-4 h-4 text-indigo-650" /> : <Square className="w-4 h-4 text-slate-350" />}
                    <span>Sent Email Pitch</span>
                  </button>
                  <button onClick={() => handleChecklistChange('messagedSocial')} className="col-span-2 flex items-center gap-2 text-left cursor-pointer hover:text-indigo-650 transition-colors">
                    {checklist.messagedSocial ? <CheckSquare className="w-4 h-4 text-indigo-650" /> : <Square className="w-4 h-4 text-slate-350" />}
                    <span>Messaged on Facebook/Instagram</span>
                  </button>
                </div>
              </div>

              {/* Direct Outreach Phone Numbers */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span>PHONE CALL CONTACTS</span>
                  <button 
                    onClick={addAltPhone}
                    className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-600 hover:text-indigo-850 uppercase cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> ADD PHONE
                  </button>
                </h4>

                {/* Phone 1 */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl gap-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Primary Phone</span>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-xs font-semibold text-slate-800 hover:text-indigo-600 underline">
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Missing</span>
                    )}
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={getWhatsappUrl(lead.phone, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-body text-[9px] font-bold uppercase tracking-wider transition-all"
                        title="Open WA Chat"
                      >
                        WA
                      </a>
                      <a
                        href={getWhatsappUrl(lead.phone, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-body text-[9px] font-bold uppercase tracking-wider transition-all"
                        title="Send WA Prefilled Pitch"
                      >
                        WA Pitch
                      </a>
                      <button
                        onClick={() => onDial(lead.phone)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100 animate-pulse"
                      >
                        <Phone className="w-3 h-3" />
                        Dial
                      </button>
                    </div>
                  )}
                </div>

                {/* Alternate phone lists */}
                {altPhones.map((phoneVal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl gap-2">
                    <div className="flex-1 flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase font-bold flex items-center justify-between">
                        <span>Alternate Phone #{i + 1}</span>
                        <button onClick={() => removeAltPhone(i)} className="text-[8px] text-rose-500 hover:text-rose-700 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        type="text"
                        value={phoneVal}
                        onChange={(e) => handleAltPhoneChange(i, e.target.value)}
                        onBlur={() => {
                          const joined = altPhones.filter(Boolean).join(', ');
                          void handleBlurSave('phone_2', joined || null);
                        }}
                        placeholder="Enter phone..."
                        className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none w-full p-0 h-5 focus:ring-0 placeholder-slate-350 mt-0.5"
                      />
                    </div>
                    {phoneVal && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getWhatsappUrl(phoneVal, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-body text-[9px] font-bold uppercase tracking-wider transition-all"
                        >
                          WA
                        </a>
                        <a
                          href={getWhatsappUrl(phoneVal, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-body text-[9px] font-bold uppercase tracking-wider transition-all"
                        >
                          WA Pitch
                        </a>
                        <button
                          onClick={() => onDial(phoneVal)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Phone className="w-3 h-3" />
                          Dial
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Direct Outreach Emails */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span>EMAIL CONTACTS</span>
                  <button 
                    onClick={addAltEmail}
                    className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-600 hover:text-indigo-850 uppercase cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> ADD EMAIL
                  </button>
                </h4>

                {/* Email 1 */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl gap-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Primary Email</span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                      {lead.email || 'Missing'}
                    </span>
                  </div>
                  {lead.email && (
                    <a
                      href={getMailtoUrl(lead.email)}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                </div>

                {/* Alternate Email Lists */}
                {altEmails.map((emailVal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl gap-2">
                    <div className="flex-1 flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase font-bold flex items-center justify-between">
                        <span>Alternate Email #{i + 1}</span>
                        <button onClick={() => removeAltEmail(i)} className="text-[8px] text-rose-500 hover:text-rose-700 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                      <input
                        type="text"
                        value={emailVal}
                        onChange={(e) => handleAltEmailChange(i, e.target.value)}
                        onBlur={() => {
                          const joined = altEmails.filter(Boolean).join(', ');
                          void handleBlurSave('email_2', joined || null);
                        }}
                        placeholder="Enter email..."
                        className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none w-full p-0 h-5 focus:ring-0 placeholder-slate-350 mt-0.5"
                      />
                    </div>
                    {emailVal && (
                      <a
                        href={getMailtoUrl(emailVal)}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: SOCIAL BADGES, DM CHATS & SPECIFICS EDITOR */}
            <div className="flex flex-col gap-4">
              
              {/* Social profile badges & direct DM redirection buttons */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
                  SOCIAL ENGAGEMENT HUBS
                </h3>
                
                {/* Social media links summary row */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Profiles:</span>
                  
                  {isValidSocialLink(lead.facebook) ? (
                    <a href={normalizeFacebookProfileUrl(lead.facebook)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Facebook">
                      <Facebook className="w-4 h-4" />
                    </a>
                  ) : <Facebook className="w-4 h-4 text-slate-350" />}

                  {isValidSocialLink(lead.instagram) ? (
                    <a href={normalizeInstagramProfileUrl(lead.instagram)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all" title="Instagram">
                      <Instagram className="w-4 h-4" />
                    </a>
                  ) : <Instagram className="w-4 h-4 text-slate-355" />}

                  {isValidSocialLink(lead.tiktok) ? (
                    <a href={normalizeTikTokProfileUrl(lead.tiktok)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-black text-white hover:bg-slate-800 transition-all font-display text-[9px] px-2 py-0.5 rounded font-extrabold uppercase" title="TikTok">
                      TT
                    </a>
                  ) : <span className="text-slate-350 text-xs font-bold font-display select-none">TT</span>}

                  {isValidSocialLink(lead.linkedin) ? (
                    <a href={normalizeLinkedInProfileUrl(lead.linkedin)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650 hover:bg-indigo-100 transition-all" title="LinkedIn">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  ) : <Linkedin className="w-4 h-4 text-slate-355" />}
                  
                  {isValidSocialLink(lead.social_link) && (
                    <a href={lead.social_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold text-[10px] ml-auto hover:text-indigo-850 truncate max-w-[120px]">
                      Other Link
                    </a>
                  )}
                </div>

                {/* Direct DM chat redirects */}
                <div className="grid grid-cols-2 gap-2">
                  {isValidSocialLink(lead.facebook) && (
                    <button
                      onClick={(e) => handleSocialDmClick(e, 'Facebook Messenger', lead.facebook)}
                      className="px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Facebook className="w-3.5 h-3.5 shrink-0" />
                      FB Messenger
                    </button>
                  )}
                  {isValidSocialLink(lead.instagram) && (
                    <button
                      onClick={(e) => handleSocialDmClick(e, 'Instagram', lead.instagram)}
                      className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Instagram className="w-3.5 h-3.5 shrink-0" />
                      IG Direct DM
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic specifics inputs fields editor */}
              <div className="flex flex-col gap-3 mt-1">
                <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
                  DIALER ATTRIBUTES & SPECIFICS
                </h3>
                
                <div className="grid grid-cols-2 gap-3.5 font-body text-[10px]">
                  
                  {/* Google Rating */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">Google Rating</label>
                      {renderStatusIndicator('google_rating')}
                    </div>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={fields.google_rating}
                      onChange={(e) => setFields({ ...fields, google_rating: e.target.value })}
                      onBlur={(e) => handleBlurSave('google_rating', parseFloat(e.target.value) || 0)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  {/* Review Count */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">Review Count</label>
                      {renderStatusIndicator('review_count')}
                    </div>
                    <input
                      type="number"
                      value={fields.review_count}
                      onChange={(e) => setFields({ ...fields, review_count: e.target.value })}
                      onBlur={(e) => handleBlurSave('review_count', parseInt(e.target.value, 10) || 0)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div className="flex flex-col col-span-2 gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">Contact Person Name</label>
                      {renderStatusIndicator('contact_person')}
                    </div>
                    <input
                      type="text"
                      value={fields.contact_person}
                      onChange={(e) => setFields({ ...fields, contact_person: e.target.value })}
                      onBlur={(e) => handleBlurSave('contact_person', e.target.value)}
                      placeholder="e.g. Oussama (Directeur)"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  {/* Work hours */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">Work Hours</label>
                      {renderStatusIndicator('work_hours')}
                    </div>
                    <input
                      type="text"
                      value={fields.work_hours}
                      onChange={(e) => setFields({ ...fields, work_hours: e.target.value })}
                      onBlur={(e) => handleBlurSave('work_hours', e.target.value)}
                      placeholder="e.g. 08:30-17:00"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  {/* Running ads */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">Running Ads</label>
                      {renderStatusIndicator('running_ads')}
                    </div>
                    <select
                      value={fields.running_ads || 'No'}
                      onChange={(e) => {
                        setFields({ ...fields, running_ads: e.target.value });
                        void handleBlurSave('running_ads', e.target.value);
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Social Followers counts indicators */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">FB Followers</label>
                      {renderStatusIndicator('facebook_followers')}
                    </div>
                    <input
                      type="text"
                      value={fields.facebook_followers}
                      onChange={(e) => setFields({ ...fields, facebook_followers: e.target.value })}
                      onBlur={(e) => handleBlurSave('facebook_followers', e.target.value)}
                      placeholder="e.g. 15k"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">IG Followers</label>
                      {renderStatusIndicator('instagram_followers')}
                    </div>
                    <input
                      type="text"
                      value={fields.instagram_followers}
                      onChange={(e) => setFields({ ...fields, instagram_followers: e.target.value })}
                      onBlur={(e) => handleBlurSave('instagram_followers', e.target.value)}
                      placeholder="e.g. 24k"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  {/* General notes */}
                  <div className="flex flex-col col-span-2 gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 uppercase font-bold font-body text-[8px]">General Scraper Notes</label>
                      {renderStatusIndicator('notes')}
                    </div>
                    <textarea
                      rows={2}
                      value={fields.notes}
                      onChange={(e) => setFields({ ...fields, notes: e.target.value })}
                      onBlur={(e) => handleBlurSave('notes', e.target.value)}
                      placeholder="Enter scraped details..."
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:border-indigo-500 font-medium resize-none text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
