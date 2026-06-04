import React, { useState, useEffect } from 'react';
import { Phone, Mail, Globe, MapPin, Star, ExternalLink, Check, Loader2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { Input, Textarea } from '../ui/input';
import { updateLeadDetails } from '@/app/actions/leads';

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
  const [fields, setFields] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'failed'>>({});

  useEffect(() => {
    if (lead) {
      setFields({
        contact_person: lead.contact_person || '',
        notes: lead.notes || '',
        email: lead.email || '',
        email_2: lead.email_2 || '',
        phone_2: lead.phone_2 || '',
        website_quality: lead.website_quality || 'None',
      });
      setSaveStatus({});
    }
  }, [lead]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-body text-xs">
        <span>No lead selected</span>
      </div>
    );
  }

  // Handle auto-save on input blur
  const handleBlurSave = async (fieldName: string, value: string) => {
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
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />;
    }
    if (status === 'saved') {
      return <Check className="w-3.5 h-3.5 text-emerald-600" />;
    }
    return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
  };

  const getMailtoUrl = (email: string) => {
    const subject = `Proposition de collaboration Web-OS - ${lead.agency_name}`;
    const body = `Bonjour,

Je suis ${callerName} de Web-OS. Nous avons analysé votre présence en ligne pour ${lead.agency_name} et souhaiterions vous proposer nos services d'optimisation de site internet.

Cordialement,
${callerName}`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900 uppercase tracking-wide">
          {lead.agency_name || 'Unnamed Agency'}
        </h2>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-body">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {lead.area || 'Algeria'}
          </span>
          {lead.google_rating > 0 && (
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              {lead.google_rating.toFixed(1)} ({lead.review_count} Reviews)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Contact Dialers */}
        <div className="flex flex-col gap-5">
          <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
            Direct Outreach Contacts
          </h3>

          {/* Phone 1 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 uppercase font-bold">Primary Phone</span>
              <span className="text-xs font-semibold text-slate-800">{lead.phone || 'Missing'}</span>
            </div>
            {lead.phone && (
              <button
                onClick={() => onDial(lead.phone)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
              >
                <Phone className="w-3 h-3" />
                Dial 1
              </button>
            )}
          </div>

          {/* Phone 2 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex-1 flex flex-col mr-3">
              <span className="text-[8px] text-slate-400 uppercase font-bold">Alt Phone</span>
              <input
                type="text"
                value={fields.phone_2 || ''}
                onChange={(e) => setFields({ ...fields, phone_2: e.target.value })}
                onBlur={(e) => handleBlurSave('phone_2', e.target.value)}
                placeholder="Enter alternative phone..."
                className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none w-full p-0 h-5 focus:ring-0 placeholder-slate-350 mt-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              {renderStatusIndicator('phone_2')}
              {fields.phone_2 && (
                <button
                  onClick={() => onDial(fields.phone_2)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Phone className="w-3 h-3" />
                  Dial 2
                </button>
              )}
            </div>
          </div>

          {/* Email 1 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
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

          {/* Email 2 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex-1 flex flex-col mr-3">
              <span className="text-[8px] text-slate-400 uppercase font-bold">Alt Email</span>
              <input
                type="text"
                value={fields.email_2 || ''}
                onChange={(e) => setFields({ ...fields, email_2: e.target.value })}
                onBlur={(e) => handleBlurSave('email_2', e.target.value)}
                placeholder="Enter alternative email..."
                className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none w-full p-0 h-5 focus:ring-0 placeholder-slate-350 mt-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              {renderStatusIndicator('email_2')}
              {fields.email_2 && (
                <a
                  href={getMailtoUrl(fields.email_2)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-body text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Mail className="w-3 h-3" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Details Form Editor */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 pb-2">
            Lead Specifics
          </h3>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Contact Person Name
              </label>
              {renderStatusIndicator('contact_person')}
            </div>
            <input
              type="text"
              value={fields.contact_person || ''}
              onChange={(e) => setFields({ ...fields, contact_person: e.target.value })}
              onBlur={(e) => handleBlurSave('contact_person', e.target.value)}
              placeholder="Enter decision maker name..."
              className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all placeholder-slate-350"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Website Quality Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Website Quality
                </label>
                {renderStatusIndicator('website_quality')}
              </div>
              <select
                value={fields.website_quality || 'None'}
                onChange={(e) => {
                  setFields({ ...fields, website_quality: e.target.value });
                  handleBlurSave('website_quality', e.target.value);
                }}
                className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all cursor-pointer"
              >
                <option value="None">None (No Web)</option>
                <option value="Low">Low Quality</option>
                <option value="Medium">Medium Quality</option>
                <option value="High">High Quality</option>
              </select>
            </div>

            {/* Website Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Website URL
              </label>
              {lead.website && lead.website !== 'None' && lead.website !== 'Not found' ? (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-indigo-50"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  Visit Web
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 text-center rounded-xl text-xs font-bold uppercase tracking-wider select-none">
                  No Website
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                General Notes / Details
              </label>
              {renderStatusIndicator('notes')}
            </div>
            <textarea
              rows={3}
              value={fields.notes || ''}
              onChange={(e) => setFields({ ...fields, notes: e.target.value })}
              onBlur={(e) => handleBlurSave('notes', e.target.value)}
              placeholder="Enter scraped comments or details..."
              className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all placeholder-slate-350 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
