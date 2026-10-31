import React from 'react';
import { Volume2, Moon, Sun, Info, Trophy, BookOpen, MessageSquare, User, Cloud, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
  onOpenSync: () => void;
  activeTab: 'sentences' | 'vocabulary' | 'progress';
  onSelectTab: (tab: 'sentences' | 'vocabulary' | 'progress') => void;
  completedCount: number;
  currentUsername: string | null;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenAbout,
  onOpenSync,
  activeTab,
  onSelectTab,
  completedCount,
  currentUsername,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 dark:bg-slate-900/95 border-b border-slate-800 backdrop-blur-md transition-colors shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Wordmark */}
        <div
          onClick={() => onSelectTab('sentences')}
          className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Volume2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              English Partner
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              স্পোকেন ইংলিশ ও ভোকাবুলারি টেস্ট
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <button
            onClick={() => onSelectTab('sentences')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sentences'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>🗣️ বাক্য প্র্যাকটিস</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 text-slate-950 font-extrabold">
              500
            </span>
          </button>

          <button
            onClick={() => onSelectTab('vocabulary')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📝 শব্দ ভাণ্ডার ও কুইজ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 text-slate-950 font-extrabold">
              MCQ
            </span>
          </button>

          <button
            onClick={() => onSelectTab('progress')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>📊 আমার অগ্রগতি</span>
            {completedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                {completedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Controls: User Sync Badge, About & Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Cloud Sync Badge Button */}
          <button
            onClick={onOpenSync}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer border ${
              currentUsername
                ? 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 shadow-sm'
                : 'bg-sky-500/15 border-sky-500/30 hover:bg-sky-500/25 text-sky-300'
            }`}
            title="ইউজার লগইন ও ক্রস-ডিভাইস ক্লাউড সিঙ্ক"
          >
            {currentUsername ? (
              <>
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-white text-[11px] sm:text-xs max-w-[80px] sm:max-w-[110px] truncate">
                  {currentUsername}
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {isSyncing ? (
                    <span className="animate-spin">🔄</span>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      <span>সিঙ্কড</span>
                    </>
                  )}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] sm:text-xs">সিঙ্ক লগইন</span>
              </>
            )}
          </button>

          {/* About & Netlify Guide Modal */}
          <button
            onClick={onOpenAbout}
            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="ওয়েবসাইট পরিচিতি ও গাইড"
            aria-label="About"
          >
            <Info className="w-4 h-4 text-sky-400" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title={isDarkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
