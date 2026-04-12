"use client";

import Link from "next/link";
import { Stethoscope, Shield, Zap, Globe, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative py-20 px-6 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-50 to-transparent -z-10" />
        
        <div className="flex items-center gap-2 mb-6 bg-blue-100 px-4 py-2 rounded-full">
          <Heart size={16} className="text-blue-600 fill-blue-600" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Sanjeevani AI v2.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
          Healthcare for the <br /> <span className="text-blue-600">Next Billion.</span>
        </h1>
        
        <p className="max-w-2xl text-lg text-slate-500 mb-10 leading-relaxed font-medium">
          Sanjeevani AI bridges the gap between rural India and quality healthcare using 
          Gemini 2.5 Flash. Simple, fast, and life-saving.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105"
          >
            Enter Portal
          </Link>
          <button className="px-10 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            How it Works
          </button>
        </div>
      </header>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-xl">Low-Bandwidth AI</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Optimized to work on 3G and 4G networks in remote villages with minimal data usage.</p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Globe size={24} />
          </div>
          <h3 className="font-bold text-xl">Bilingual Support</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Describe symptoms in Hindi, English, or regional dialects and get instant AI guidance.</p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100">
            <Shield size={24} />
          </div>
          <h3 className="font-bold text-xl">Emergency Triage</h3>
          <p className="text-slate-500 text-sm leading-relaxed">One-tap SOS alerts that connect rural patients to urban medical command centers instantly.</p>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-10 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Built for the BBDNIIT Hackathon 2026
        </p>
      </footer>
    </div>
  );
}