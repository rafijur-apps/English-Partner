import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare, Trophy } from 'lucide-react';
import { Header } from './components/Header';
import { SentencePracticeScreen } from './components/SentencePracticeScreen';
import { VocabularyTestScreen } from './components/VocabularyTestScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { AboutModal } from './components/AboutModal';
import { Footer } from './components/Footer';

export default function App() {
  // Theme state: dark mode by default (#0F172A, #1E293B, #38BDF8)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ep_theme');
      if (saved) return saved === 'dark';
    }
    return true;
  });

  // Active primary tab: 'sentences' | 'vocabulary' | 'progress'
  const [activeTab, setActiveTab] = useState<'sentences' | 'vocabulary' | 'progress'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ep_active_tab');
      if (saved === 'sentences' || saved === 'vocabulary' || saved === 'progress') {
        return saved;
      }
    }
    return 'sentences';
  });

  // About & Guide modal state
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Local persistence state
  const [completedSentenceIds, setCompletedSentenceIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('ep_completed_sentences');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const [bookmarkedSentenceIds, setBookmarkedSentenceIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('ep_bookmarked_sentences');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const [favoriteWordIds, setFavoriteWordIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('ep_favorite_words');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const [savedPage, setSavedPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ep_sentence_page');
      if (saved) return parseInt(saved, 10) || 1;
    } catch {}
    return 1;
  });

  const [savedRange, setSavedRange] = useState<{ start: number; end: number }>(() => {
    try {
      const saved = localStorage.getItem('ep_vocab_range');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { start: 1, end: 50 };
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('ep_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ep_theme', 'light');
    }
  }, [isDarkMode]);

  // Save active tab
  useEffect(() => {
    localStorage.setItem('ep_active_tab', activeTab);
  }, [activeTab]);

  // Persistence handlers
  const handleToggleComplete = (id: number) => {
    setCompletedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('ep_completed_sentences', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleToggleBookmarkSentence = (id: number) => {
    setBookmarkedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('ep_bookmarked_sentences', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleToggleFavoriteWord = (id: number) => {
    setFavoriteWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('ep_favorite_words', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleResetProgress = () => {
    setCompletedSentenceIds(new Set());
    setBookmarkedSentenceIds(new Set());
    setFavoriteWordIds(new Set());
    localStorage.removeItem('ep_completed_sentences');
    localStorage.removeItem('ep_bookmarked_sentences');
    localStorage.removeItem('ep_favorite_words');
  };

  const handlePageChange = (page: number) => {
    setSavedPage(page);
    localStorage.setItem('ep_sentence_page', page.toString());
  };

  const handleRangeChange = (range: { start: number; end: number }) => {
    setSavedRange(range);
    localStorage.setItem('ep_vocab_range', JSON.stringify(range));
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onOpenAbout={() => setIsAboutOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        completedCount={completedSentenceIds.size}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {activeTab === 'sentences' && (
          <SentencePracticeScreen
            completedIds={completedSentenceIds}
            onToggleComplete={handleToggleComplete}
            bookmarkedIds={bookmarkedSentenceIds}
            onToggleBookmark={handleToggleBookmarkSentence}
            savedPage={savedPage}
            onPageChange={handlePageChange}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyTestScreen
            favoriteWordIds={favoriteWordIds}
            onToggleFavoriteWord={handleToggleFavoriteWord}
            savedRange={savedRange}
            onRangeChange={handleRangeChange}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressScreen
            completedSentenceIds={completedSentenceIds}
            bookmarkedSentenceIds={bookmarkedSentenceIds}
            favoriteWordIds={favoriteWordIds}
            onNavigateToSentences={() => {
              setActiveTab('sentences');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToVocabulary={() => {
              setActiveTab('vocabulary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onResetProgress={handleResetProgress}
          />
        )}

        {/* Global Footer Credit */}
        <Footer />
      </main>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden sticky bottom-0 z-40 w-full bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md pb-safe shadow-lg"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          {/* Tab 1: বাক্য প্র্যাকটিস */}
          <button
            onClick={() => {
              setActiveTab('sentences');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer ${
              activeTab === 'sentences'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            {activeTab === 'sentences' && (
              <span className="absolute top-0 w-12 h-1 bg-sky-400 rounded-b-full shadow-sm shadow-sky-400/50" />
            )}
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">বাক্য প্র্যাকটিস</span>
          </button>

          {/* Tab 2: শব্দ ভাণ্ডার */}
          <button
            onClick={() => {
              setActiveTab('vocabulary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            {activeTab === 'vocabulary' && (
              <span className="absolute top-0 w-12 h-1 bg-sky-400 rounded-b-full shadow-sm shadow-sky-400/50" />
            )}
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">শব্দ ভাণ্ডার ও কুইজ</span>
          </button>

          {/* Tab 3: আমার অগ্রগতি */}
          <button
            onClick={() => {
              setActiveTab('progress');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer ${
              activeTab === 'progress'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            {activeTab === 'progress' && (
              <span className="absolute top-0 w-12 h-1 bg-sky-400 rounded-b-full shadow-sm shadow-sky-400/50" />
            )}
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">আমার অগ্রগতি</span>
          </button>
        </div>
      </nav>

      {/* Website Info & Netlify Deployment Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
