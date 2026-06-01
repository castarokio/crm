"use client";

import { ArrowUpRight, ShieldCheck, UserCheck, HelpCircle } from "lucide-react";
import Image from "next/image";

export default function Sections() {
  return (
    <div className="w-full bg-[#010101] text-[#f1f1f1] px-6 py-20 flex flex-col items-center">
      {/* 1. Trust Hook Banner */}
      <section className="w-full max-w-4xl py-6 border-y border-white/[0.08] text-center my-10 bg-[#0c0c0c]/40 backdrop-blur-sm">
        <p className="font-body text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#f1f1f1]/80 uppercase">
          98% Callback Rate &nbsp;•&nbsp; 1,400+ Uncharted Expeditions &nbsp;•&nbsp; 100% Private Itineraries
        </p>
      </section>

      {/* 2. Problem Section */}
      <section id="problem" className="w-full max-w-4xl py-24 flex flex-col md:flex-row gap-12 items-start border-b border-white/[0.08]">
        <div className="w-full md:w-1/3">
          <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-3">
            01 / CRITICAL PERSPECTIVE
          </span>
          <h2 className="font-display text-4xl font-bold tracking-tight uppercase leading-none text-[#f1f1f1]">
            THE ANTIDOTE TO PACKAGED TOURISM
          </h2>
        </div>
        <div className="w-full md:w-2/3">
          <p className="font-body text-base md:text-lg leading-relaxed text-[#f1f1f1]/70 font-normal">
            Mass-market travel has commoditized the globe. Mainstream resorts offer sterile, scripted experiences, leaving you surrounded by crowds on routes that thousands have walked before.
          </p>
          <p className="font-body text-base md:text-lg leading-relaxed text-[#f1f1f1]/70 font-normal mt-6">
            You do not travel to follow coordinates; you travel to disconnect, challenge boundaries, and experience absolute silence.
          </p>
        </div>
      </section>

      {/* 3. Unique Value Proposition */}
      <section className="w-full max-w-4xl py-24 flex flex-col md:flex-row gap-12 items-start border-b border-white/[0.08]">
        <div className="w-full md:w-1/3">
          <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-3">
            02 / THE SOLUTIONS ENGINE
          </span>
          <h2 className="font-display text-4xl font-bold tracking-tight uppercase leading-none text-[#f1f1f1]">
            DESIGNING OUTCOMES, NOT JUST ITINERARIES
          </h2>
        </div>
        <div className="w-full md:w-2/3">
          <p className="font-body text-base md:text-lg leading-relaxed text-[#f1f1f1]/70 font-normal">
            We operate a private, member-only booking system. We do not sell packages. We custom-engineer every trip from the ground up: securing private guides, plotting remote paths in the Icelandic highlands or private archipelagos of French Polynesia, and ensuring seamless logistic handoffs. We return the mystery to travel.
          </p>
        </div>
      </section>

      {/* 4. Core Destinations (Uncharted Regions) */}
      <section id="destinations" className="w-full max-w-4xl py-24 border-b border-white/[0.08]">
        <div className="mb-12">
          <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-3">
            03 / CURRENT EXPEDITIONS
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight uppercase text-[#f1f1f1]">
            UNCHARTED REGIONS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Destination 1 */}
          <div className="group rounded-md border border-white/[0.08] bg-[#0c0c0c]/40 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <div className="relative h-64 w-full">
              <Image
                src="/images/ocean_background.png"
                alt="Svalbard Ice & Silence"
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] to-transparent opacity-85" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-mono text-[10px] text-white/50 tracking-wider">REG-01 // ARCTIC CIRCLE</span>
                <h3 className="font-display text-2xl font-bold uppercase text-white mt-1">
                  Svalbard Ice & Silence
                </h3>
              </div>
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <p className="font-body text-sm text-[#f1f1f1]/70 leading-relaxed mb-8">
                Navigate frozen fjords on private vessels. Dogsled across glaciers under the midnight sun, guided by polar experts.
              </p>
              <a
                href="#inquiry"
                className="inline-flex items-center justify-between w-full font-body text-[10px] font-bold tracking-widest uppercase py-3 border-t border-white/[0.08] text-[#f1f1f1] hover:text-white transition-colors group/link"
              >
                <span>REQUEST SVALBARD DETAIL</span>
                <ArrowUpRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Destination 2 */}
          <div className="group rounded-md border border-white/[0.08] bg-[#0c0c0c]/40 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <div className="relative h-64 w-full">
              {/* Fallback to ocean background with a warm sand-like overlay filter for the Sahara styling */}
              <Image
                src="/images/ocean_background.png"
                alt="Sahara Silent Dunes"
                fill
                className="object-cover grayscale group-hover:grayscale-0 contrast-125 sepia-[0.3] transition-all duration-500 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] to-transparent opacity-85" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-mono text-[10px] text-white/50 tracking-wider">REG-02 // OASIS GRID</span>
                <h3 className="font-display text-2xl font-bold uppercase text-white mt-1">
                  Sahara Silent Dunes
                </h3>
              </div>
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <p className="font-body text-sm text-[#f1f1f1]/70 leading-relaxed mb-8">
                Dune crossings via private visual guides. Undergo absolute silence in luxury nomad camps located deep inside the Algerian Erg.
              </p>
              <a
                href="#inquiry"
                className="inline-flex items-center justify-between w-full font-body text-[10px] font-bold tracking-widest uppercase py-3 border-t border-white/[0.08] text-[#f1f1f1] hover:text-white transition-colors group/link"
              >
                <span>REQUEST SAHARA DETAIL</span>
                <ArrowUpRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Process */}
      <section id="process" className="w-full max-w-4xl py-24 border-b border-white/[0.08]">
        <div className="mb-16">
          <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-3">
            04 / PATHWAY
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight uppercase text-[#f1f1f1]">
            THE PROCESS TO DEPARTURE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative p-8 rounded-md border border-white/[0.06] bg-[#0c0c0c]/30">
            <span className="font-mono text-5xl font-extralight text-white/10 absolute top-4 right-6">01</span>
            <h3 className="font-display text-xl font-bold uppercase text-white mb-4 mt-2">
              The Design Intake
            </h3>
            <p className="font-body text-sm text-[#f1f1f1]/60 leading-relaxed">
              Request a callback. We spend 30 minutes understanding your endurance level, comfort requirements, and sensory goals.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-8 rounded-md border border-white/[0.06] bg-[#0c0c0c]/30">
            <span className="font-mono text-5xl font-extralight text-white/10 absolute top-4 right-6">02</span>
            <h3 className="font-display text-xl font-bold uppercase text-white mb-4 mt-2">
              Route Drafting
            </h3>
            <p className="font-body text-sm text-[#f1f1f1]/60 leading-relaxed">
              Our designers draft two custom routes featuring locations unseen by standard tourists.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-8 rounded-md border border-white/[0.06] bg-[#0c0c0c]/30">
            <span className="font-mono text-5xl font-extralight text-white/10 absolute top-4 right-6">03</span>
            <h3 className="font-display text-xl font-bold uppercase text-white mb-4 mt-2">
              Expedition Launch
            </h3>
            <p className="font-body text-sm text-[#f1f1f1]/60 leading-relaxed">
              We secure private logistics, satellite communications, and expert local visual scouts. You just show up.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="w-full max-w-4xl py-24">
        <div className="mb-16">
          <span className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 block mb-3">
            05 / CLARITY
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight uppercase text-[#f1f1f1]">
            FREQUENT QUESTIONING
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-8 rounded-md border border-white/[0.06] bg-[#0c0c0c]/30 flex gap-4 items-start">
            <HelpCircle className="w-5 h-5 text-white/40 mt-1 shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white mb-2">
                How do you ensure safety on remote expeditions?
              </h3>
              <p className="font-body text-sm text-[#f1f1f1]/60 leading-relaxed">
                Every launch has 24/7 satellite coverage, local guides, and real-time medical evacuation dispatch ready on standby.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-md border border-white/[0.06] bg-[#0c0c0c]/30 flex gap-4 items-start">
            <HelpCircle className="w-5 h-5 text-white/40 mt-1 shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white mb-2">
                Is this for members only?
              </h3>
              <p className="font-body text-sm text-[#f1f1f1]/60 leading-relaxed">
                Your first callback and booking establishes your membership. We limit active travelers to 100 individuals globally per year to preserve service fidelity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
