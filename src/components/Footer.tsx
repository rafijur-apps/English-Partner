import React from 'react';
import { Heart, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-4 bg-slate-950 border-t border-slate-800/80 text-center select-none shrink-0 backdrop-blur-sm mt-12">
      <div className="max-w-4xl mx-auto space-y-2">
        <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          This app made by <span className="text-sky-400 font-bold">Md. Rafijur Rahman (Zuboraj)</span>
        </p>
        <p className="text-[11px] text-slate-500">
          English Partner · ৫০০টি স্পোকেন বাক্য ও ৫০০টি ভোকাবুলারি টেস্ট প্ল্যাটফর্ম · Ready for Netlify & GitHub
        </p>
      </div>
    </footer>
  );
};
