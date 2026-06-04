"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { submitInquiryAction } from "@/app/actions";

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    destination: "Arctic",
    month: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.month) {
      setError("Please populate all parameters.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await submitInquiryAction(formData.name, formData.phone, formData.destination, formData.month);
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setError(res.error || "Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="inquiry" className="w-full bg-[#010101] text-[#f1f1f1] px-6 py-28 flex justify-center border-t border-white/[0.08]">
      <div className="w-full max-w-lg p-8 md:p-10 rounded-md border border-[#374151] bg-[#121212] transition-colors hover:border-white/20">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-2">
                SECURE ACCESS
              </span>
              <h2 className="font-display text-3xl font-bold uppercase text-white leading-none mb-3">
                INITIATE YOUR JOURNEY
              </h2>
              <p className="font-body text-xs text-[#f1f1f1]/60">
                Fill out your details below. A private expedition designer will contact you within 12 hours.
              </p>
            </div>

            {error && (
              <p className="font-body text-xs text-red-400 font-semibold uppercase tracking-wider bg-red-950/20 border border-red-500/20 px-4 py-2.5 rounded-sm">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="font-body text-[10px] font-bold tracking-widest uppercase text-white/70">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-sm border border-white/[0.1] bg-[#0c0c0c] font-body text-sm text-[#f1f1f1] placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                placeholder="Alexander Vance"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="font-body text-[10px] font-bold tracking-widest uppercase text-white/70">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-sm border border-white/[0.1] bg-[#0c0c0c] font-body text-sm text-[#f1f1f1] placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                placeholder="+49 170 1234567"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="destination" className="font-body text-[10px] font-bold tracking-widest uppercase text-white/70">
                Target Destination
              </label>
              <select
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-3 rounded-sm border border-white/[0.1] bg-[#0c0c0c] font-body text-sm text-[#f1f1f1] focus:outline-none focus:border-white/40 transition-colors cursor-pointer appearance-none"
              >
                <option value="Arctic">Arctic (Svalbard Ice & Silence)</option>
                <option value="Desert">Desert (Sahara Silent Dunes)</option>
                <option value="Ocean">Ocean (Private Archipelago)</option>
                <option value="Custom">Custom Expedition Grid</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="month" className="font-body text-[10px] font-bold tracking-widest uppercase text-white/70">
                Preferred Month
              </label>
              <input
                id="month"
                type="text"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-4 py-3 rounded-sm border border-white/[0.1] bg-[#0c0c0c] font-body text-sm text-[#f1f1f1] placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                placeholder="September 2026"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex items-center justify-between w-full h-[52px] px-6 rounded-sm bg-[#f1f1f1] text-[#010101] hover:bg-white transition-all duration-200 hover:scale-[1.01] font-body text-xs font-bold tracking-[0.2em] uppercase cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span>SUBMITTING REQUEST...</span>
                  <Loader2 className="w-4 h-4 text-[#010101] animate-spin" />
                </>
              ) : (
                <>
                  <span>SUBMIT CALLBACK REQUEST</span>
                  <ArrowRight className="w-4 h-4 text-[#010101]" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-[#f1f1f1]" />
            </div>
            <div>
              <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-2">
                TRANSMISSION VERIFIED
              </span>
              <h2 className="font-display text-3xl font-bold uppercase text-white leading-none mb-3">
                REQUEST LOGGED
              </h2>
              <p className="font-body text-sm text-[#f1f1f1]/70 leading-relaxed max-w-sm">
                Thank you, <strong className="text-white">{formData.name}</strong>. A dedicated designer has reserved your slot and will call you on <strong className="text-white">{formData.phone}</strong> within 12 hours to discuss your plan for <strong className="text-white">{formData.destination}</strong> in <strong className="text-white">{formData.month}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
