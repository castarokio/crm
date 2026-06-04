'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, ArrowRight, Loader2, RefreshCcw, FileSpreadsheet } from 'lucide-react';
import { extractCsvHeaders, previewLeadImportWithMapping, commitLeadImport, undoLastImport } from '@/app/actions/admin';
import { Button } from '../ui/button';
import { toast, confirm } from '@/lib/toast';

const FIELD_LABELS: Record<string, string> = {
  skip: 'Skip Column',
  agency_name: 'Agency/Business Name *',
  phone: 'Primary Phone *',
  phone_2: 'Alternative Phone',
  email: 'Primary Email',
  email_2: 'Alternative Email',
  website: 'Website Address',
  website_quality: 'Website Quality (Low/Med/High)',
  area: 'Area/City *',
  address: 'Physical Address',
  maps_link: 'Google Maps Link',
  priority: 'Priority (1-5)',
  google_rating: 'Google Rating (decimal)',
  review_count: 'Review Count (number)',
  facebook: 'Facebook URL',
  instagram: 'Instagram URL',
  tiktok: 'Tiktok URL',
  linkedin: 'Linkedin URL',
  social_link: 'General Social Link',
  followers_if_visible: 'Followers (general)',
  facebook_followers: 'Facebook Followers',
  instagram_followers: 'Instagram Followers',
  running_ads: 'Running Ads (Yes/No)',
  services: 'Services Offered',
  notes: 'Scraping Notes',
  contact_person: 'Contact Person'
};

const REQUIRED_FIELDS = ['agency_name', 'phone', 'area'];

type CsvImporterProps = {
  adminName: string;
  onImportComplete: () => void;
};

export function CsvImporter({ adminName, onImportComplete }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  // Preview and Import state
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      processFile(droppedFile);
    } else {
      toast.warning('Please upload a valid .csv file.');
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setStatusMessage(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvText(text);

      const res = await extractCsvHeaders(text);
      if (res.success && res.headers) {
        setHeaders(res.headers);
        
        // Auto map obvious headings (case-insensitive checks)
        const initialMapping: Record<string, string> = {};
        res.headers.forEach(header => {
          const lower = header.toLowerCase().replace(/[^a-z0-9_]/g, '');
          
          if (lower.includes('agency') || lower.includes('company') || lower.includes('business') || lower === 'name') {
            initialMapping[header] = 'agency_name';
          } else if (lower.includes('phone2') || lower.includes('telephone2') || lower.includes('mobile2')) {
            initialMapping[header] = 'phone_2';
          } else if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile') || lower.includes('number')) {
            initialMapping[header] = 'phone';
          } else if (lower.includes('email2')) {
            initialMapping[header] = 'email_2';
          } else if (lower.includes('email') || lower.includes('mail')) {
            initialMapping[header] = 'email';
          } else if (lower.includes('website') || lower.includes('site') || lower.includes('web')) {
            initialMapping[header] = 'website';
          } else if (lower.includes('area') || lower.includes('city') || lower.includes('region') || lower.includes('wilaya')) {
            initialMapping[header] = 'area';
          } else if (lower.includes('address') || lower.includes('location')) {
            initialMapping[header] = 'address';
          } else if (lower.includes('maps') || lower.includes('googlemaps') || lower.includes('link')) {
            initialMapping[header] = 'maps_link';
          } else if (lower.includes('rating') || lower.includes('stars')) {
            initialMapping[header] = 'google_rating';
          } else if (lower.includes('review') || lower.includes('reviews') || lower.includes('reviews_count')) {
            initialMapping[header] = 'review_count';
          } else if (lower.includes('priority')) {
            initialMapping[header] = 'priority';
          } else {
            initialMapping[header] = 'skip';
          }
        });
        setMapping(initialMapping);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to parse CSV headers.' });
      }
      setLoading(false);
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleMappingChange = (header: string, field: string) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handlePreview = async () => {
    // Check if required fields are mapped
    const mappedFields = Object.values(mapping);
    const missing = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field));
    if (missing.length > 0) {
      toast.warning(`Required columns missing: ${missing.map(f => FIELD_LABELS[f]).join(', ')}`);
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const res = await previewLeadImportWithMapping(csvText, mapping);
    setLoading(false);

    if (res.success && res.preview) {
      setPreviewData(res.preview);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to generate preview.' });
    }
  };

  const handleImport = async () => {
    if (!previewData || !file) return;
    setLoading(true);
    setStatusMessage(null);

    const res = await commitLeadImport(previewData.rows, file.name, adminName);
    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${res.inserted} fresh leads into the campaign database! (${res.skipped} rows skipped as duplicates).`
      });
      setPreviewData(null);
      setFile(null);
      setHeaders([]);
      onImportComplete();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Import failed.' });
    }
  };

  const handleUndoLastImport = async () => {
    const ok = await confirm('Permanently delete all leads from the last imported CSV batch that have not been called yet?', {
      title: 'Rollback Last Import',
      danger: true,
      confirmLabel: 'Rollback',
    });
    if (!ok) return;
    
    setLoading(true);
    setStatusMessage(null);
    const res = await undoLastImport(adminName);
    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Rollback successful! Removed ${res.removed} leads from batch (${res.sourceFile}) from the database.`
      });
      onImportComplete();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to rollback last import.' });
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm font-body text-xs">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide">CSV Batch Importer</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Import, map headers, and check for database duplicates</p>
        </div>
        <Button
          onClick={handleUndoLastImport}
          variant="secondary"
          className="flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100/50 hover:border-rose-200"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          ROLLBACK LAST BATCH
        </Button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
            : 'bg-rose-50 text-rose-800 border-rose-250'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span className="font-medium text-xs">{statusMessage.text}</span>
        </div>
      )}

      {/* Drag & Drop Box */}
      {!file && !previewData && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-slate-50/50 hover:bg-slate-50"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
          <span className="font-display text-xs font-bold text-slate-700 block uppercase tracking-wide">Drag & Drop CSV File Here</span>
          <span className="text-[10px] text-slate-400 mt-1 block font-semibold uppercase tracking-wider">or click to browse local files</span>
        </div>
      )}

      {/* Mapping form */}
      {file && headers.length > 0 && !previewData && (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-650" />
              <span className="font-bold text-slate-700">{file.name}</span>
              <span className="text-[10px] text-slate-450">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={() => { setFile(null); setHeaders([]); setMapping({}); }}
              className="text-[10px] text-slate-400 hover:text-slate-650 underline font-bold uppercase tracking-wider"
            >
              Clear file
            </button>
          </div>

          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1 mt-1">
            Map CSV Columns to Database Schema
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {headers.map(header => (
              <div key={header} className="p-3 bg-white border border-slate-200/80 rounded-xl flex flex-col gap-1.5 shadow-sm">
                <span className="font-bold text-slate-700 truncate block border-b border-slate-50 pb-1" title={header}>
                  CSV: {header}
                </span>
                <select
                  value={mapping[header] || 'skip'}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 text-xs"
                >
                  <option value="skip">Skip Column (skip)</option>
                  {Object.entries(FIELD_LABELS).map(([field, label]) => (
                    field !== 'skip' && (
                      <option key={field} value={field}>
                        {label}
                      </option>
                    )
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <Button
              onClick={handlePreview}
              disabled={loading}
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'GENERATE PREVIEW'}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap justify-between items-center gap-3 font-body text-[10px] uppercase font-bold tracking-wider">
            <div className="flex items-center gap-4 text-slate-550">
              <div>Total CSV Rows: <span className="text-slate-800 font-extrabold">{previewData.total_rows}</span></div>
              <div>•</div>
              <div>Importable Rows: <span className="text-emerald-700 font-extrabold">{previewData.importable_rows}</span></div>
              <div>•</div>
              <div>Duplicate Rows (to skip): <span className="text-rose-700 font-extrabold">{previewData.skipped_rows}</span></div>
            </div>
            
            <button
              onClick={() => setPreviewData(null)}
              className="text-slate-450 hover:text-slate-650 underline font-bold"
            >
              Change Mapping
            </button>
          </div>

          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-1 mt-1">
            Data Import Preview (First 5 Rows)
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-display text-[9px] text-slate-450 uppercase font-bold tracking-wider">
                  <th className="px-4 py-2">Row</th>
                  <th className="px-4 py-2">Agency Name</th>
                  <th className="px-4 py-2">Area</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Remarks/Warnings</th>
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 5).map((row: any) => (
                  <tr key={row.row_number} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-slate-400 text-[10px]">#{row.row_number}</td>
                    <td className="px-4 py-2 font-bold uppercase tracking-wide">{row.agency_name}</td>
                    <td className="px-4 py-2 uppercase tracking-wide text-slate-500">{row.area}</td>
                    <td className="px-4 py-2">{row.phone_display || row.phone}</td>
                    <td className="px-4 py-2">
                      {row.importable ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-150 uppercase tracking-wide">Importable</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-150 uppercase tracking-wide">Skip</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-[10px]">
                      {row.duplicate_reasons.length > 0 && (
                        <div className="text-rose-600 font-semibold">{row.duplicate_reasons.join(', ')}</div>
                      )}
                      {row.warnings.length > 0 && (
                        <div className="text-amber-600 font-semibold">{row.warnings.join(', ')}</div>
                      )}
                      {row.duplicate_reasons.length === 0 && row.warnings.length === 0 && (
                        <span className="text-slate-400">Clean row</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <Button
              variant="secondary"
              onClick={() => { setFile(null); setHeaders([]); setPreviewData(null); }}
              disabled={loading}
            >
              CANCEL IMPORT
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || previewData.importable_rows === 0}
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `COMMIT ${previewData.importable_rows} LEADS`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
