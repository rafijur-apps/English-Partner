import React from 'react';
import {
  X,
  Globe,
  Github,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Heart
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20">
              <Globe className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                English Partner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40">
                  Web Edition
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                স্পোকেন ইংলিশ ও ভোকাবুলারি লার্নিং প্ল্যাটফর্ম
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Netlify Deployment Guide */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Github className="w-4 h-4 text-sky-400" />
              <span>GitHub ও Netlify-তে কীভাবে হোস্ট করবেন:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs leading-relaxed">
              <li>
                এই কোডবেসটি আপনার <strong>GitHub</strong> রিপোজিটরিতে পুশ করুন।
              </li>
              <li>
                <strong>Netlify.com</strong>-এ গিয়ে আপনার GitHub একাউন্ট দিয়ে লগইন করুন।
              </li>
              <li>
                <strong>"Add new site" &gt; "Import an existing project"</strong> সিলেক্ট করে আপনার রিপোজিটরি পছন্দ করুন।
              </li>
              <li>
                বিল্ড সেটিংসে স্বয়ংক্রিয়ভাবে পাবে:
                <div className="p-2.5 my-1 rounded-xl bg-slate-950 font-mono text-[11px] text-sky-300 space-y-1">
                  <div>Build command: <span className="text-emerald-400">npm run build</span></div>
                  <div>Publish directory: <span className="text-emerald-400">dist</span></div>
                </div>
              </li>
              <li>
                <strong>"Deploy site"</strong> বাটনে ক্লিক করলেই কয়েক সেকেন্ডে আপনার ওয়েবসাইট বিশ্বব্যাপী লাইভ হয়ে যাবে! (<code className="text-sky-300">netlify.toml</code> ফাইল আগেই কনফিগার করা আছে)।
              </li>
            </ol>
          </div>

          {/* Key Features Overview */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>৫০০টি বাক্য</span>
              </span>
              <p className="text-[11px] text-slate-400">ক্যাটাগরিভিত্তিক স্পোকেন বাক্য ও বাংলা অনুবাদ।</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>৫০০টি ভোকাবুলারি</span>
              </span>
              <p className="text-[11px] text-slate-400">৪-অপশন ইন্টারেক্টিভ কুইজ ও শব্দ ভাণ্ডার।</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ভয়েস ও উচ্চারণ</span>
              </span>
              <p className="text-[11px] text-slate-400">TTS অডিও ও সাউথ এশিয়ান অ্যাকসেন্ট সহনশীল মাইক্রোফোন।</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PWA অফলাইন সাপোর্ট</span>
              </span>
              <p className="text-[11px] text-slate-400">ইন্টারনেট ছাড়াও ১০০% অফলাইনে কাজ করে।</p>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-slate-950 border border-sky-500/20 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-300">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline" />
              <span>by</span>
            </div>
            <h4 className="text-base font-black text-white">
              Md. Rafijur Rahman (Zuboraj)
            </h4>
            <p className="text-xs text-sky-400 font-medium">
              English Partner Creator & Developer
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            English Partner v1.0 · Ready for Netlify
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
