"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-4xl h-14 px-6 md:px-8 rounded-full border border-white/[0.08] bg-[#0c0c0c]/70 backdrop-blur-md transition-all duration-300 hover:border-white/[0.15]">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-1.5 font-display text-lg font-bold tracking-widest text-[#f1f1f1]">
          <span>TRAVEL</span>
          <span className="text-white bg-white/10 px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium">NXT</span>
          <span className="text-white/40 group-hover:text-[#f1f1f1] transition-colors duration-300">LVL</span>
        </Link>

        {/* Menu Links */}
        <div className="hidden sm:flex items-center gap-8 font-body text-xs font-medium tracking-[0.2em] text-[#f1f1f1]/60">
          <Link href="#problem" className="hover:text-[#f1f1f1] transition-colors duration-200">
            THE ANTIDOTE
          </Link>
          <Link href="#destinations" className="hover:text-[#f1f1f1] transition-colors duration-200">
            REGIONS
          </Link>
          <Link href="#process" className="hover:text-[#f1f1f1] transition-colors duration-200">
            PROCESS
          </Link>
          <Link href="#faq" className="hover:text-[#f1f1f1] transition-colors duration-200">
            FAQ
          </Link>
        </div>

        {/* CTA Button */}
        <Link
          href="#inquiry"
          className="flex items-center gap-1 font-body text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full bg-[#f1f1f1] text-[#010101] hover:bg-white transition-all duration-200 hover:scale-[1.02]"
        >
          <span>CALLBACK</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </nav>
    </header>
  );
}
