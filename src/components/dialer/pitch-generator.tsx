import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Loader2, Globe, Mail, Phone, Terminal, FileText, Send } from 'lucide-react';
import { generatePitchWithAI } from '@/app/actions/leads';
import { toast } from '@/lib/toast';

type PitchGeneratorProps = {
  lead: any;
  callerName: string;
  onDial?: (phoneNumber: string) => void;
};

export function PitchGenerator({ lead, callerName, onDial }: PitchGeneratorProps) {
  const [format, setFormat] = useState<'whatsapp' | 'email'>('whatsapp');
  const [whatsappPitch, setWhatsappPitch] = useState<string>('');
  const [emailPitch, setEmailPitch] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Load default pitches or cached drafts
  useEffect(() => {
    if (lead) {
      // 1. WhatsApp Draft
      const cachedWa = localStorage.getItem(`pitch_draft_wa_${lead.id}`);
      if (cachedWa) {
        setWhatsappPitch(cachedWa);
      } else {
        const isNoWeb = !lead.website || lead.website === 'Not found' || lead.website.toLowerCase() === 'none';
        const defaultWa = isNoWeb
          ? `Bonjour l'équipe de ${lead.agency_name || "l'agence"}, c'est hamid de Web-OS. J'ai remarqué votre forte présence sur les réseaux sociaux, mais l'absence de site web vous fait perdre des réservations directes. Vous pouvez voir nos réalisations sur https://castarokio.github.io/. Seriez-vous ouvert à un court échange de 5 minutes ?`
          : `Bonjour l'équipe de ${lead.agency_name || "l'agence"}, c'est hamid de Web-OS. J'ai jeté un coup d'œil à votre site ${lead.website} et noté quelques lenteurs sur mobile qui freinent vos conversions. Vous pouvez voir nos réalisations sur https://castarokio.github.io/. Seriez-vous intéressé par un court audit gratuit de 5 minutes ?`;
        setWhatsappPitch(defaultWa);
      }

      // 2. Email Draft
      const cachedEmail = localStorage.getItem(`pitch_draft_email_${lead.id}`);
      if (cachedEmail) {
        setEmailPitch(cachedEmail);
      } else {
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

        const defaultEmail = `Bonjour l'équipe de ${lead.agency_name || "l'agence"},

Je m'appelle hamid de Web-OS. Je me permets de vous contacter car j'aide les agences de voyages en Algérie à booster leurs réservations directes grâce à des outils web sur-mesure.

En analysant la présence digitale de ${lead.agency_name || "l'agence"} à ${lead.area || 'votre région'}, j'ai relevé des points clés :

${webSection}${reviewSection}${adsSection}

Nous avons récemment aidé des agences similaires à capter plus de clients et à automatiser la gestion de leurs circuits/vols. Vous pouvez découvrir nos réalisations et notre portfolio ici : https://castarokio.github.io/

Seriez-vous disponibles pour un court appel de 5 à 10 minutes ce [Jour] ou [Jour] pour un échange rapide ? Je serais ravi de vous offrir un audit complet gratuit de votre présence en ligne.

Dans l'attente de votre retour, je vous souhaite une excellente journée.

Cordialement,

hamid — Web-OS
Tél/WhatsApp : +213 540 21 12 50
Email : castarokibusiness@gmail.com
Portfolio : https://castarokio.github.io/`;

        setEmailPitch(defaultEmail);
      }

      setInstruction('');
    }
  }, [lead]);

  const activeText = format === 'whatsapp' ? whatsappPitch : emailPitch;

  const handleGenerate = async () => {
    if (!lead) return;
    setGenerating(true);
    try {
      const res = await generatePitchWithAI({
        agencyName: lead.agency_name,
        website: lead.website,
        websiteQuality: lead.website_quality,
        area: lead.area,
        callerName,
        customInstruction: instruction,
        facebook: lead.facebook,
        instagram: lead.instagram,
        tiktok: lead.tiktok,
        linkedin: lead.linkedin,
        socialLink: lead.social_link,
        followers: lead.followers_if_visible,
        facebookFollowers: lead.facebook_followers,
        instagramFollowers: lead.instagram_followers,
        runningAds: lead.running_ads,
        format,
      });

      if (res.success && res.pitch) {
        if (format === 'whatsapp') {
          setWhatsappPitch(res.pitch);
          localStorage.setItem(`pitch_draft_wa_${lead.id}`, res.pitch);
        } else {
          setEmailPitch(res.pitch);
          localStorage.setItem(`pitch_draft_email_${lead.id}`, res.pitch);
        }
        toast.success(`AI ${format === 'whatsapp' ? 'WhatsApp hook' : 'Email'} generated successfully!`);
      } else {
        toast.error(res.error || 'Failed to generate pitch. Check your Gemini API configuration.');
      }
    } catch (err) {
      console.error('[Generate Pitch Error]', err);
      toast.error('Unexpected error during AI generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!activeText) return;
    void navigator.clipboard.writeText(activeText);
    setCopied(true);
    toast.success('Script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (newVal: string) => {
    if (format === 'whatsapp') {
      setWhatsappPitch(newVal);
      if (lead) localStorage.setItem(`pitch_draft_wa_${lead.id}`, newVal);
    } else {
      setEmailPitch(newVal);
      if (lead) localStorage.setItem(`pitch_draft_email_${lead.id}`, newVal);
    }
  };

  // Live Interactive Parser function
  const renderInteractivePreview = (text: string) => {
    if (!text) {
      return <div className="text-slate-400 italic text-center py-10">No pitch content available. Click generate above.</div>;
    }

    // RegEx match patterns
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi;
    const phoneRegex = /(\+213\s?[567]\s?(?:\d{2}\s?){4}|0[567]\d{8}|\+213\s?\d{9})/gi;

    // Split text keeping matched items
    const unifiedRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|(\+213\s?[567]\s?(?:\d{2}\s?){4}|0[567]\d{8}|\+213\s?\d{9})/gi;
    const parts = text.split(unifiedRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Match URLs
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-150 font-bold transition-all transition-colors select-all"
            title="Open website link"
          >
            <Globe className="w-3 h-3 text-indigo-500 shrink-0" />
            {part.replace(/^https?:\/\//i, '').substring(0, 25)}{part.length > 25 ? '...' : ''}
          </a>
        );
      }

      // Match Email Addresses
      if (emailRegex.test(part)) {
        emailRegex.lastIndex = 0;
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-150 font-bold transition-all transition-colors select-all"
            title="Send Email"
          >
            <Mail className="w-3 h-3 text-blue-500 shrink-0" />
            {part}
          </a>
        );
      }

      // Match Algerian Phone Numbers
      if (phoneRegex.test(part)) {
        phoneRegex.lastIndex = 0;
        return (
          <span
            key={index}
            onClick={() => {
              // Copy to clipboard
              void navigator.clipboard.writeText(part);
              toast.success(`Phone: ${part} copied!`);
              // Trigger active call log dial
              if (onDial) onDial(part);
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-150 font-bold cursor-pointer transition-all transition-colors select-all"
            title="Dial this number & copy"
          >
            <Phone className="w-3 h-3 text-emerald-500 shrink-0 animate-pulse" />
            {part}
          </span>
        );
      }

      // Fallback plain text
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  if (!lead) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Format Selector Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
          AI Outreach Suite
        </h3>
        
        <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
          <button
            onClick={() => setFormat('whatsapp')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              format === 'whatsapp'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Send className="w-3 h-3 text-indigo-500" />
            WhatsApp Hook
          </button>
          <button
            onClick={() => setFormat('email')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              format === 'email'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-3 h-3 text-indigo-500" />
            Email Template
          </button>
        </div>
      </div>

      {/* Main Two-Column Suite */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: Input Configuration & Editor */}
        <div className="flex flex-col gap-3">
          {/* Custom Hook settings */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
              AI Hook / Override Instructions
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. mention direct booking discounts, friendly tone..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-400 text-slate-700 font-semibold shadow-inner"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 text-white font-extrabold text-[9px] uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-indigo-100"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 animate-pulse" />
                )}
                Generate
              </button>
            </div>
          </div>

          {/* Editable text container */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
              Draft Editor (Auto-saves changes)
            </label>
            <textarea
              rows={format === 'email' ? 14 : 6}
              value={activeText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 text-xs text-slate-800 leading-relaxed font-semibold shadow-inner"
              placeholder={`Edit your ${format} pitch here...`}
            />
            <button
              onClick={handleCopy}
              disabled={!activeText}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-white border border-slate-250 hover:bg-slate-50 text-slate-650 hover:text-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
              title="Copy to Clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Premium Rich Interactive Live Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
            Live Rich Interactive Preview
          </label>
          
          <div className="flex-1 flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[220px]">
            {/* Logo/Branding Header */}
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                {/* Sleek CSS Logo */}
                <div className="w-5 h-5 rounded bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-display text-[9px] font-black tracking-tighter shadow-lg shadow-indigo-500/20">
                  W
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-[9.5px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent leading-none">
                    WEB-OS
                  </span>
                  <span className="text-[6.5px] text-indigo-400 uppercase tracking-widest font-bold leading-none mt-0.5">
                    Digital Outreach
                  </span>
                </div>
              </div>
              <span className="text-[7.5px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-500/10">
                Interactive Preview
              </span>
            </div>

            {/* Preview content container */}
            <div className="flex-1 p-4 text-xs font-semibold text-slate-750 leading-relaxed font-body bg-gradient-to-b from-white to-slate-50/50 overflow-y-auto max-h-[350px]">
              {renderInteractivePreview(activeText)}
            </div>

            {/* Logo/Branding Footer */}
            <div className="bg-slate-50 border-t border-slate-150/80 px-4 py-2.5 flex items-center justify-between text-[8px] font-bold text-slate-450 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span>Signature Verified</span>
              </div>
              <span>Outreach Client v2.5</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
