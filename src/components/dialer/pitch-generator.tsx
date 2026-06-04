import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { generatePitchWithAI } from '@/app/actions/leads';
import { toast } from '@/lib/toast';

type PitchGeneratorProps = {
  lead: any;
  callerName: string;
};

export function PitchGenerator({ lead, callerName }: PitchGeneratorProps) {
  const [pitch, setPitch] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Load default pitch or cached draft
  useEffect(() => {
    if (lead) {
      const cached = localStorage.getItem(`pitch_draft_${lead.id}`);
      if (cached) {
        setPitch(cached);
        return;
      }

      const isNoWeb = !lead.website || lead.website === 'Not found' || lead.website.toLowerCase() === 'none';
      const defaultPitch = isNoWeb
        ? `Bonjour l'équipe de ${lead.agency_name || "l'agence"}, c'est hamid de Web-OS. J'ai remarqué votre forte présence sur les réseaux sociaux, mais l'absence de site web vous fait perdre des réservations directes. Vous pouvez voir nos réalisations sur https://castarokio.github.io/. Seriez-vous ouvert à un court échange de 5 minutes ?`
        : `Bonjour l'équipe de ${lead.agency_name || "l'agence"}, c'est hamid de Web-OS. J'ai jeté un coup d'œil à votre site ${lead.website} et noté quelques lenteurs sur mobile qui freinent vos conversions. Vous pouvez voir nos réalisations sur https://castarokio.github.io/. Seriez-vous intéressé par un court audit gratuit de 5 minutes ?`;
      
      setPitch(defaultPitch);
      setInstruction('');
    }
  }, [lead, callerName]);

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
      });

      if (res.success && res.pitch) {
        setPitch(res.pitch);
        localStorage.setItem(`pitch_draft_${lead.id}`, res.pitch);
      } else {
        toast.error(res.error || 'Failed to generate pitch. Check your Gemini API key.');
      }
    } catch (err) {
      console.error('[Generate Pitch Error]', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!pitch) return;
    void navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePitchChange = (newVal: string) => {
    setPitch(newVal);
    if (lead) {
      localStorage.setItem(`pitch_draft_${lead.id}`, newVal);
    }
  };

  if (!lead) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
        Outreach Copy Generator (French)
      </h3>

      <div className="flex flex-col gap-3 font-body text-xs">
        {/* Custom Instructions */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-slate-400 uppercase font-bold">Custom instructions / Hook override</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. mention summer flight offers, friendly tone..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs placeholder-slate-400 text-slate-700"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 hover:border-indigo-200 text-indigo-700 font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI
            </button>
          </div>
        </div>

        {/* Pitch Content Textbox */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-[9px] text-slate-400 uppercase font-bold">Generated outreach script</label>
          <textarea
            rows={5}
            value={pitch}
            onChange={(e) => handlePitchChange(e.target.value)}
            className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-slate-800 leading-relaxed resize-none font-medium"
          />
          <button
            onClick={handleCopy}
            disabled={!pitch}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-500 hover:text-slate-700 active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Copy Pitch"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
