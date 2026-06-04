import React, { useState, useEffect } from 'react';
import { Copy, Check, Globe, Mail, Phone, Terminal, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from '@/lib/toast';
import { 
  formatWhatsappPhone, 
  normalizeInstagramDmUrl, 
  normalizeMessengerUrl 
} from '@/lib/social-utils';

type PitchGeneratorProps = {
  lead: any;
  callerName: string;
  onDial?: (phoneNumber: string) => void;
};

type AngleType = 'rating' | 'social' | 'technical';

export function PitchGenerator({ lead, callerName, onDial }: PitchGeneratorProps) {
  const [format, setFormat] = useState<'whatsapp' | 'email'>('whatsapp');
  const [angle, setAngle] = useState<AngleType>('rating');
  const [whatsappPitch, setWhatsappPitch] = useState<string>('');
  const [emailPitch, setEmailPitch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Helper function to generate copy based on templates
  const getStaticTemplate = (fmt: 'whatsapp' | 'email', currentAngle: AngleType): string => {
    if (!lead) return '';

    const isNoWeb = !lead.website || lead.website === 'Not found' || lead.website.toLowerCase() === 'none';
    const agencyName = lead.agency_name || "l'agence";
    const area = lead.area || 'votre région';
    const rating = lead.google_rating || 0;
    const reviews = lead.review_count || 0;
    const followers = lead.followers_if_visible || lead.instagram_followers || lead.facebook_followers || '';

    if (fmt === 'whatsapp') {
      if (currentAngle === 'rating') {
        if (rating > 0) {
          if (isNoWeb) {
            return `Bonjour l'équipe de ${agencyName}. C'est hamid de Web-OS. J'ai vu votre note Google de ${Number(rating).toFixed(1)}/5 sur ${reviews} avis : félicitations pour cette réputation ! C'est dommage de ne pas capitaliser dessus avec un site web moderne pour capter les réservations en direct. Notre portfolio : https://castarokio.github.io/. Dispo 5 min pour en parler ?`;
          } else {
            return `Bonjour l'équipe de ${agencyName}. C'est hamid de Web-OS. J'ai vu votre note Google de ${Number(rating).toFixed(1)}/5 sur ${reviews} avis, bravo ! J'ai regardé votre site ${lead.website}, on pourrait y intégrer vos avis Google de façon dynamique pour rassurer vos clients et doubler vos réservations. Notre portfolio : https://castarokio.github.io/. Dispo pour un court échange ?`;
          }
        } else {
          if (isNoWeb) {
            return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. Nous accompagnons les agences de voyages en Algérie à booster leurs réservations en créant des sites web professionnels. Jetez un œil à nos réalisations : https://castarokio.github.io/. Seriez-vous disponibles pour un court appel de 5 minutes ?`;
          } else {
            return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. J'ai visité votre site ${lead.website} et relevé quelques pistes simples pour améliorer vos conversions et votre visibilité sur Google. Notre portfolio : https://castarokio.github.io/. Dispo pour en parler rapidement ?`;
          }
        }
      } else if (currentAngle === 'social') {
        const followerText = followers ? ` (notamment avec vos ${followers} abonnés)` : '';
        if (isNoWeb) {
          return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. Votre page est super active${followerText}, mais l'absence de site internet pour réserver en direct nuit à votre taux de conversion. Jetez un œil à nos réalisations pour agences : https://castarokio.github.io/. Dispo pour un court appel ?`;
        } else {
          return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. Votre présence sur les réseaux sociaux est excellente. J'ai visité votre site ${lead.website} et j'ai relevé quelques lenteurs sur mobile qui réduisent l'impact de vos posts. Nos réalisations : https://castarokio.github.io/. Dispo 5 minutes pour en parler ?`;
        }
      } else { // technical
        if (isNoWeb) {
          return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. Nous créons des sites web ultra-fluides et optimisés pour le mobile, spécifiquement pour les agences de voyages en Algérie. Vous pouvez voir notre portfolio ici : https://castarokio.github.io/. Seriez-vous ouverts à un court échange cette semaine ?`;
        } else {
          return `Bonjour l'équipe de ${agencyName}, c'est hamid de Web-OS. J'ai visité votre site ${lead.website} et j'ai relevé des lenteurs de chargement sur mobile qui vous font perdre des clients. On a conçu des sites ultra-fluides pour des agences en Algérie. Portfolio : https://castarokio.github.io/. Dispo 5 minutes pour en parler ?`;
        }
      }
    } else { // email
      const emailIntro = `Bonjour l'équipe de ${agencyName},

Je m'appelle hamid de Web-OS. J'aide les agences de voyages en Algérie à booster leurs ventes directes.`;

      let emailBody = '';
      if (currentAngle === 'rating') {
        if (rating > 0) {
          emailBody = `En analysant la présence digitale de votre agence à ${area}, j'ai été impressionné par votre réputation Google : une excellente note de ${Number(rating).toFixed(1)}/5 basée sur ${reviews} avis clients. C'est un atout commercial exceptionnel.

${isNoWeb 
  ? `Cependant, il est dommage de ne pas valoriser ce capital de confiance en Algérie sur un site internet officiel. Sans site, vos clients intéressés par vos avis Google se tournent vers d'autres canaux de réservation et vous perdez des ventes en direct.`
  : `Cependant, en visitant votre site ${lead.website}, j'ai constaté que ces précieux avis ne sont pas intégrés de manière interactive et dynamique pour maximiser la conversion des internautes. Nous pouvons vous aider à rentabiliser encore mieux cette notoriété.`
}`;
        } else {
          emailBody = `En analysant la présence digitale de votre agence à ${area}, j'ai constaté que votre référencement Google pourrait être optimisé pour attirer davantage de voyageurs recherchant des séjours dans votre région.

${isNoWeb
  ? `L'absence d'un site web dédié vous prive d'une vitrine officielle pour capter ces prospects en recherche active et recevoir des réservations directes 24h/24.`
  : `Bien que vous ayez un site internet (${lead.website}), celui-ci n'est pas optimisé pour capter ce flux de recherche active et convertir les visiteurs en clients.`
}`;
        }
      } else if (currentAngle === 'social') {
        const followerText = followers ? ` (avec vos ${followers} abonnés)` : '';
        emailBody = isNoWeb
          ? `J'ai analysé la présence de votre agence sur les réseaux sociaux. Votre contenu est de grande qualité et votre communauté est engagée${followerText}.

Pourtant, rediriger cette audience vers de simples messages privés sans un site web professionnel pour réserver 24h/24 et 7j/7 limite grandement vos réservations en direct. Un site web officiel permettrait d'automatiser vos ventes de circuits et vols.`
          : `J'ai analysé votre présence sociale qui est très dynamique. Pourtant, en visitant votre site ${lead.website}, j'ai remarqué que le lien entre vos réseaux sociaux et vos pages de destination web n'est pas optimisé pour le mobile, ce qui génère une perte importante de prospects.`;
      } else { // technical
        emailBody = isNoWeb
          ? `En analysant le marché des agences de voyages à ${area}, j'ai constaté que l'absence de site internet fluide représente un manque à gagner majeur face à des concurrents de plus en plus numérisés. Nous concevons des plateformes rapides de réservation en direct (circuits, vols, hôtels).`
          : `En réalisant un audit technique de votre site internet ${lead.website}, j'ai relevé quelques points critiques, notamment sur mobile : un temps de chargement trop élevé et un parcours de réservation qui pourrait être fluidifié pour éviter les abandons de panier.`;
      }

      return `${emailIntro}

${emailBody}

Nous avons développé des solutions web fluides pour des agences partenaires en Algérie. Je vous invite à jeter un œil à nos réalisations : https://castarokio.github.io/

Seriez-vous disponibles pour un échange de 5 à 10 minutes ce [Jour] ou [Jour] ? Je serais ravi de vous proposer un mini-audit gratuit pour vous montrer comment valoriser vos atouts et booster vos ventes.

Bien cordialement,

hamid — Web-OS
Tél/WhatsApp : +213 540 21 12 50
Email : castarokibusiness@gmail.com
Portfolio : https://castarokio.github.io/`;
    }
  };

  // Synchronize component when lead, format, or angle changes
  useEffect(() => {
    if (lead) {
      // 1. WhatsApp Hook load
      const cachedWa = localStorage.getItem(`pitch_draft_wa_${lead.id}_${angle}`);
      if (cachedWa) {
        setWhatsappPitch(cachedWa);
      } else {
        setWhatsappPitch(getStaticTemplate('whatsapp', angle));
      }

      // 2. Email Hook load
      const cachedEmail = localStorage.getItem(`pitch_draft_email_${lead.id}_${angle}`);
      if (cachedEmail) {
        setEmailPitch(cachedEmail);
      } else {
        setEmailPitch(getStaticTemplate('email', angle));
      }
    }
  }, [lead, angle]);

  const activeText = format === 'whatsapp' ? whatsappPitch : emailPitch;

  const handleTextChange = (newVal: string) => {
    if (format === 'whatsapp') {
      setWhatsappPitch(newVal);
      if (lead) {
        localStorage.setItem(`pitch_draft_wa_${lead.id}_${angle}`, newVal);
        localStorage.setItem(`pitch_draft_wa_${lead.id}`, newVal); // Backup for general redirect keys
      }
    } else {
      setEmailPitch(newVal);
      if (lead) {
        localStorage.setItem(`pitch_draft_email_${lead.id}_${angle}`, newVal);
        localStorage.setItem(`pitch_draft_email_${lead.id}`, newVal); // Backup for general redirect keys
      }
    }
  };

  const handleResetToTemplate = () => {
    const defaultTemplate = getStaticTemplate(format, angle);
    handleTextChange(defaultTemplate);
    toast.success('Reset to professional template.');
  };

  const handleCopy = () => {
    if (!activeText) return;
    void navigator.clipboard.writeText(activeText);
    setCopied(true);
    toast.success('Script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Outreach quick redirect handlers (always copies to clipboard first)
  const handleWhatsappSend = () => {
    if (!lead || !lead.phone) return;
    const formatted = formatWhatsappPhone(lead.phone);
    if (!formatted) return;

    void navigator.clipboard.writeText(activeText);
    toast.success('WhatsApp copy placed in clipboard!');
    
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(activeText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleInstagramSend = () => {
    if (!lead || !lead.instagram) return;
    void navigator.clipboard.writeText(activeText);
    toast.success('Instagram copy placed in clipboard!');

    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = normalizeInstagramDmUrl(lead.instagram, isIPhone, activeText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMessengerSend = () => {
    if (!lead || !lead.facebook) return;
    void navigator.clipboard.writeText(activeText);
    toast.success('Messenger copy placed in clipboard!');

    const isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = normalizeMessengerUrl(lead.facebook, isIPhone, activeText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmailSend = () => {
    if (!lead || !lead.email) return;
    void navigator.clipboard.writeText(activeText);
    toast.success('Email copy placed in clipboard!');

    const subject = `Proposition de collaboration Web-OS - ${lead.agency_name}`;
    let mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(activeText)}`;
    
    if (lead.email_2) {
      const altList = lead.email_2.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (altList.length > 0) {
        mailtoUrl += `&cc=${encodeURIComponent(altList.join(','))}`;
      }
    }
    window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
  };

  // Live Interactive Parser function
  const renderInteractivePreview = (text: string) => {
    if (!text) {
      return <div className="text-slate-400 italic text-center py-10">No pitch content available.</div>;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi;
    const phoneRegex = /(\+213\s?[567]\s?(?:\d{2}\s?){4}|0[567]\d{8}|\+213\s?\d{9})/gi;

    const unifiedRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|(\+213\s?[567]\s?(?:\d{2}\s?){4}|0[567]\d{8}|\+213\s?\d{9})/gi;
    const parts = text.split(unifiedRegex);

    return parts.map((part, index) => {
      if (!part) return null;

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

      if (emailRegex.test(part)) {
        emailRegex.lastIndex = 0;
        return (
          <span
            key={index}
            onClick={() => {
              void navigator.clipboard.writeText(part);
              toast.success(`Copied email: ${part}`);
              handleEmailSend();
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-150 font-bold cursor-pointer transition-all transition-colors select-all"
            title="Send Email & Copy"
          >
            <Mail className="w-3 h-3 text-blue-500 shrink-0" />
            {part}
          </span>
        );
      }

      if (phoneRegex.test(part)) {
        phoneRegex.lastIndex = 0;
        return (
          <span
            key={index}
            onClick={() => {
              void navigator.clipboard.writeText(part);
              toast.success(`Copied phone: ${part}`);
              if (onDial) onDial(part);
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-150 font-bold cursor-pointer transition-all transition-colors select-all"
            title="Dial number & Copy"
          >
            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
            {part}
          </span>
        );
      }

      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  if (!lead) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Format & Style Settings Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
          Outreach Script Center
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Angle Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-slate-400 uppercase font-black">Angle:</span>
            <select
              value={angle}
              onChange={(e) => setAngle(e.target.value as AngleType)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-[10px] font-bold cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <option value="rating">E-Réputation (Avis Google)</option>
              <option value="social">Réseaux Sociaux & Visibilité</option>
              <option value="technical">Audit Technique (Lenteurs Site)</option>
            </select>
          </div>

          {/* Format Tabs Selector */}
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
              WhatsApp / DM
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
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: Editor and Helpers */}
        <div className="flex flex-col gap-3">
          {/* Quick instructions indicator */}
          <div className="flex items-center justify-between bg-slate-50/50 border border-slate-250/70 p-3 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 uppercase font-black">Outreach Angle Mode</span>
              <span className="text-[10px] text-slate-700 font-extrabold font-display mt-0.5">
                {angle === 'rating' && '🎯 Google Reviews Focus'}
                {angle === 'social' && '📱 Social & Traffic Focus'}
                {angle === 'technical' && '⚙️ Mobile Speed Optimization'}
              </span>
            </div>
            <button
              onClick={handleResetToTemplate}
              className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-650 hover:text-indigo-850 uppercase cursor-pointer"
              title="Reset current script to the default professional formula"
            >
              <RefreshCw className="w-3 h-3" /> Revert to Formula
            </button>
          </div>

          {/* Large text draft editor */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
              Draft Editor (Edit script below)
            </label>
            <textarea
              rows={format === 'email' ? 14 : 7}
              value={activeText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 text-xs text-slate-800 leading-relaxed font-semibold shadow-inner"
              placeholder={`Write or edit your outreach copy here...`}
            />
            <button
              onClick={handleCopy}
              disabled={!activeText}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-white border border-slate-250 hover:bg-slate-50 text-slate-650 hover:text-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
              title="Copy Draft to Clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive live preview */}
        <div className="flex flex-col gap-2">
          <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
            Interactive Output & Quick Channels
          </label>
          
          <div className="flex-1 flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[260px]">
            {/* Sleek Web-OS Branding Header */}
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
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
                Outbox Card
              </span>
            </div>

            {/* Rendered output (Clickable links inside) */}
            <div className="flex-1 p-4 text-xs font-semibold text-slate-750 leading-relaxed font-body bg-gradient-to-b from-white to-slate-50/50 overflow-y-auto max-h-[350px]">
              {renderInteractivePreview(activeText)}
            </div>

            {/* Quick Action Redirect Buttons Footer */}
            <div className="bg-slate-50 border-t border-slate-150/80 p-3 flex flex-wrap gap-2 justify-end">
              {format === 'whatsapp' ? (
                <>
                  {/* WhatsApp Quick Link */}
                  {lead.phone && (
                    <button
                      onClick={handleWhatsappSend}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shadow-emerald-100"
                    >
                      <Send className="w-3 h-3" />
                      Copy & WhatsApp
                    </button>
                  )}
                  {/* Instagram DM Link */}
                  {lead.instagram && (
                    <button
                      onClick={handleInstagramSend}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-display text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shadow-rose-100"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Copy & IG DM
                    </button>
                  )}
                  {/* Facebook Messenger Link */}
                  {lead.facebook && (
                    <button
                      onClick={handleMessengerSend}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-650 hover:bg-blue-750 text-white font-display text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shadow-blue-100"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Copy & Messenger
                    </button>
                  )}
                </>
              ) : (
                /* Email Quick Link */
                lead.email && (
                  <button
                    onClick={handleEmailSend}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-display text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shadow-indigo-150"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Copy & Open Mail
                  </button>
                )
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
