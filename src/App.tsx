import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, MessageSquare, Trophy, User, Cloud } from 'lucide-react';
import { Header } from './components/Header';
import { SentencePracticeScreen } from './components/SentencePracticeScreen';
import { VocabularyTestScreen } from './components/VocabularyTestScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { AboutModal } from './components/AboutModal';
import { UserSyncModal } from './components/UserSyncModal';
import { Footer } from './components/Footer';
import {
  getStoredUsername,
  setStoredUsername,
  clearStoredUsername,
  fetchCloudProgress,
  pushCloudProgress,
  UserSyncPayload
} from './services/cloudSync';

export default function App() {
  // Current Case-Sensitive Username state
  const [currentUsername, setCurrentUsername] = useState<string | null>(() => getStoredUsername());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  // About modal state
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

  // Reference for debounce sync timeout
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger cloud sync to save current progress
  const triggerDebouncedCloudSave = useCallback(
    (customPayload?: Partial<UserSyncPayload>) => {
      if (!currentUsername) return;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        setIsSyncing(true);
        const payload: UserSyncPayload = {
          username: currentUsername,
          completedSentenceIds: Array.from(completedSentenceIds),
          bookmarkedSentenceIds: Array.from(bookmarkedSentenceIds),
          favoriteWordIds: Array.from(favoriteWordIds),
          sentencePage: savedPage,
          vocabRange: savedRange,
          theme: isDarkMode ? 'dark' : 'light',
          lastUpdated: new Date().toISOString(),
          ...customPayload,
        };
        await pushCloudProgress(payload);
        setIsSyncing(false);
      }, 1000); // 1-second debounce
    },
    [
      currentUsername,
      completedSentenceIds,
      bookmarkedSentenceIds,
      favoriteWordIds,
      savedPage,
      savedRange,
      isDarkMode,
    ]
  );

  // Check for 1-click mobile auto-sync URL params (?sync=...&u=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const syncUrl = params.get('sync');
      const user = params.get('u') || params.get('user');

      if (syncUrl && syncUrl.trim()) {
        localStorage.setItem('ep_custom_sync_endpoint', syncUrl.trim());
      }
      if (user && user.trim()) {
        handleLogin(user.trim());
      }
      if (syncUrl || user) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {}
  }, []);

  // Fetch from cloud on initial load if logged in
  useEffect(() => {
    if (!currentUsername) return;

    let isMounted = true;
    const loadFromCloud = async () => {
      setIsSyncing(true);
      const remoteData = await fetchCloudProgress(currentUsername);
      if (isMounted && remoteData) {
        if (remoteData.completedSentenceIds) {
          const remoteSet = new Set(remoteData.completedSentenceIds);
          setCompletedSentenceIds(remoteSet);
          localStorage.setItem('ep_completed_sentences', JSON.stringify(Array.from(remoteSet)));
        }
        if (remoteData.bookmarkedSentenceIds) {
          const remoteSet = new Set(remoteData.bookmarkedSentenceIds);
          setBookmarkedSentenceIds(remoteSet);
          localStorage.setItem('ep_bookmarked_sentences', JSON.stringify(Array.from(remoteSet)));
        }
        if (remoteData.favoriteWordIds) {
          const remoteSet = new Set(remoteData.favoriteWordIds);
          setFavoriteWordIds(remoteSet);
          localStorage.setItem('ep_favorite_words', JSON.stringify(Array.from(remoteSet)));
        }
        if (remoteData.sentencePage) {
          setSavedPage(remoteData.sentencePage);
          localStorage.setItem('ep_sentence_page', remoteData.sentencePage.toString());
        }
        if (remoteData.vocabRange) {
          setSavedRange(remoteData.vocabRange);
          localStorage.setItem('ep_vocab_range', JSON.stringify(remoteData.vocabRange));
        }
        if (remoteData.theme) {
          setIsDarkMode(remoteData.theme === 'dark');
        }
      }
      if (isMounted) setIsSyncing(false);
    };

    loadFromCloud();

    return () => {
      isMounted = false;
    };
  }, [currentUsername]);

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

  // Login handler
  const handleLogin = async (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setIsSyncing(true);
    setStoredUsername(trimmed);
    setCurrentUsername(trimmed);

    // Fetch cloud data for this exact case-sensitive username
    const remoteData = await fetchCloudProgress(trimmed);
    if (remoteData) {
      if (remoteData.completedSentenceIds) {
        const s = new Set(remoteData.completedSentenceIds);
        setCompletedSentenceIds(s);
        localStorage.setItem('ep_completed_sentences', JSON.stringify(Array.from(s)));
      }
      if (remoteData.bookmarkedSentenceIds) {
        const s = new Set(remoteData.bookmarkedSentenceIds);
        setBookmarkedSentenceIds(s);
        localStorage.setItem('ep_bookmarked_sentences', JSON.stringify(Array.from(s)));
      }
      if (remoteData.favoriteWordIds) {
        const s = new Set(remoteData.favoriteWordIds);
        setFavoriteWordIds(s);
        localStorage.setItem('ep_favorite_words', JSON.stringify(Array.from(s)));
      }
      if (remoteData.sentencePage) {
        setSavedPage(remoteData.sentencePage);
        localStorage.setItem('ep_sentence_page', remoteData.sentencePage.toString());
      }
      if (remoteData.vocabRange) {
        setSavedRange(remoteData.vocabRange);
        localStorage.setItem('ep_vocab_range', JSON.stringify(remoteData.vocabRange));
      }
      if (remoteData.theme) {
        setIsDarkMode(remoteData.theme === 'dark');
      }
    } else {
      // First time user on cloud: upload their current local progress to initialize their cloud account!
      const initialPayload: UserSyncPayload = {
        username: trimmed,
        completedSentenceIds: Array.from(completedSentenceIds),
        bookmarkedSentenceIds: Array.from(bookmarkedSentenceIds),
        favoriteWordIds: Array.from(favoriteWordIds),
        sentencePage: savedPage,
        vocabRange: savedRange,
        theme: isDarkMode ? 'dark' : 'light',
        lastUpdated: new Date().toISOString(),
      };
      await pushCloudProgress(initialPayload);
    }

    // Explicitly record LOGIN event in the LoginLogs table
    await pushCloudProgress({
      username: trimmed,
      completedSentenceIds: Array.from(completedSentenceIds),
      bookmarkedSentenceIds: Array.from(bookmarkedSentenceIds),
      favoriteWordIds: Array.from(favoriteWordIds),
      sentencePage: savedPage,
      vocabRange: savedRange,
      theme: isDarkMode ? 'dark' : 'light',
      action: 'LOGIN',
      lastUpdated: new Date().toISOString(),
    });

    setIsSyncing(false);
    setIsSyncModalOpen(false);
  };

  // Logout handler
  const handleLogout = () => {
    if (currentUsername) {
      pushCloudProgress({
        username: currentUsername,
        completedSentenceIds: Array.from(completedSentenceIds),
        bookmarkedSentenceIds: Array.from(bookmarkedSentenceIds),
        favoriteWordIds: Array.from(favoriteWordIds),
        sentencePage: savedPage,
        vocabRange: savedRange,
        theme: isDarkMode ? 'dark' : 'light',
        action: 'LOGOUT',
        lastUpdated: new Date().toISOString(),
      });
    }
    clearStoredUsername();
    setCurrentUsername(null);
  };

  // Manual force sync handler
  const handleForceSync = async () => {
    if (!currentUsername) return;
    setIsSyncing(true);

    // 1. Pull latest
    const remoteData = await fetchCloudProgress(currentUsername);
    if (remoteData) {
      if (remoteData.completedSentenceIds) {
        const s = new Set(remoteData.completedSentenceIds);
        setCompletedSentenceIds(s);
        localStorage.setItem('ep_completed_sentences', JSON.stringify(Array.from(s)));
      }
      if (remoteData.bookmarkedSentenceIds) {
        const s = new Set(remoteData.bookmarkedSentenceIds);
        setBookmarkedSentenceIds(s);
        localStorage.setItem('ep_bookmarked_sentences', JSON.stringify(Array.from(s)));
      }
      if (remoteData.favoriteWordIds) {
        const s = new Set(remoteData.favoriteWordIds);
        setFavoriteWordIds(s);
        localStorage.setItem('ep_favorite_words', JSON.stringify(Array.from(s)));
      }
      if (remoteData.sentencePage) {
        setSavedPage(remoteData.sentencePage);
        localStorage.setItem('ep_sentence_page', remoteData.sentencePage.toString());
      }
      if (remoteData.vocabRange) {
        setSavedRange(remoteData.vocabRange);
        localStorage.setItem('ep_vocab_range', JSON.stringify(remoteData.vocabRange));
      }
      if (remoteData.theme) {
        setIsDarkMode(remoteData.theme === 'dark');
      }
    }

    // 2. Push current
    const currentPayload: UserSyncPayload = {
      username: currentUsername,
      completedSentenceIds: Array.from(completedSentenceIds),
      bookmarkedSentenceIds: Array.from(bookmarkedSentenceIds),
      favoriteWordIds: Array.from(favoriteWordIds),
      sentencePage: savedPage,
      vocabRange: savedRange,
      theme: isDarkMode ? 'dark' : 'light',
      lastUpdated: new Date().toISOString(),
    };
    await pushCloudProgress(currentPayload);

    setIsSyncing(false);
  };

  // Persistence handlers (Update LocalStorage + Debounce Cloud Sync)
  const handleToggleComplete = (id: number) => {
    setCompletedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = Array.from(next);
      localStorage.setItem('ep_completed_sentences', JSON.stringify(arr));
      triggerDebouncedCloudSave({ completedSentenceIds: arr });
      return next;
    });
  };

  const handleToggleBookmarkSentence = (id: number) => {
    setBookmarkedSentenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = Array.from(next);
      localStorage.setItem('ep_bookmarked_sentences', JSON.stringify(arr));
      triggerDebouncedCloudSave({ bookmarkedSentenceIds: arr });
      return next;
    });
  };

  const handleToggleFavoriteWord = (id: number) => {
    setFavoriteWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = Array.from(next);
      localStorage.setItem('ep_favorite_words', JSON.stringify(arr));
      triggerDebouncedCloudSave({ favoriteWordIds: arr });
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
    triggerDebouncedCloudSave({
      completedSentenceIds: [],
      bookmarkedSentenceIds: [],
      favoriteWordIds: [],
    });
  };

  const handlePageChange = (page: number) => {
    setSavedPage(page);
    localStorage.setItem('ep_sentence_page', page.toString());
    triggerDebouncedCloudSave({ sentencePage: page });
  };

  const handleRangeChange = (range: { start: number; end: number }) => {
    setSavedRange(range);
    localStorage.setItem('ep_vocab_range', JSON.stringify(range));
    triggerDebouncedCloudSave({ vocabRange: range });
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
        onToggleTheme={() => {
          setIsDarkMode((prev) => {
            const next = !prev;
            triggerDebouncedCloudSave({ theme: next ? 'dark' : 'light' });
            return next;
          });
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        completedCount={completedSentenceIds.size}
        currentUsername={currentUsername}
        isSyncing={isSyncing}
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

      {/* Website Info Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* User Cloud Sync Modal */}
      <UserSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentUsername={currentUsername}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onForceSync={handleForceSync}
        isSyncing={isSyncing}
      />
    </div>
  );
}
