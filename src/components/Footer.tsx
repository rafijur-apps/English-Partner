import React from 'react';
import { Linkedin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 px-4 bg-slate-950 border-t border-slate-800/80 text-center select-none shrink-0 backdrop-blur-sm mt-12">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Creator Name & LinkedIn Link */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          <span>This app made by</span>
          <a
            href="https://www.linkedin.com/in/mdrafijur"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 font-bold transition-all hover:scale-105 active:scale-95 shadow-sm shadow-sky-500/10"
            title="Md. Rafijur Rahman (Zuboraj) - LinkedIn Profile"
          >
            <Linkedin className="w-3.5 h-3.5 fill-sky-400 text-sky-400" />
            <span>Md. Rafijur Rahman (Zuboraj)</span>
            <ExternalLink className="w-3 h-3 text-sky-400 opacity-70" />
          </a>
        </div>

        <p className="text-[11px] text-slate-500">
          English Partner · ৫০০টি স্পোকেন বাক্য ও ৫০০টি ভোকাবুলারি টেস্ট প্ল্যাটফর্ম · Hosted on Netlify
        </p>
      </div>
    </footer>
  );
};
