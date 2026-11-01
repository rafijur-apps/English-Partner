import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Bookmark,
  Star,
  Flame,
  Volume2,
  Mic,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { SENTENCES } from '../data/sentences';
import { VOCABULARY } from '../data/vocabulary';
import { speakText } from '../utils/audio';

interface ProgressScreenProps {
  completedSentenceIds: Set<number>;
  bookmarkedSentenceIds: Set<number>;
  favoriteWordIds: Set<number>;
  onNavigateToSentences: () => void;
  onNavigateToVocabulary: () => void;
  onResetProgress: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  completedSentenceIds,
  bookmarkedSentenceIds,
  favoriteWordIds,
  onNavigateToSentences,
  onNavigateToVocabulary,
  onResetProgress,
}) => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bookmarks' | 'favorites'>('bookmarks');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const totalSentences = SENTENCES.length;
  const completedCount = completedSentenceIds.size;
  const percentComplete = Math.round((completedCount / totalSentences) * 100);

  const bookmarkedSentences = SENTENCES.filter((s) => bookmarkedSentenceIds.has(s.id));
  const favoriteWords = VOCABULARY.filter((w) => favoriteWordIds.has(w.id));

  const handlePlayAudio = (id: number, text: string) => {
    setPlayingId(id);
    speakText(
      text,
      0.88,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-slate-800/80 border border-sky-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/20">
              <Trophy className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                আমার অগ্রগতি ও পরিসংখ্যান
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                  Analytics
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                আপনার স্পোকেন ইংলিশ ও ভোকাবুলারি টেস্টের সার্বিক অগ্রগতি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট ডাটা</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>বাক্য প্র্যাকটিস অগ্রগতি ({completedCount} / {totalSentences})</span>
            <span className="text-sky-400 font-bold">{percentComplete}% সম্পন্ন</span>
          </div>
          <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-sky-400/50"
              style={{ width: `${Math.max(4, percentComplete)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold text-slate-400">সমাপ্ত বাক্য</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{completedCount}</div>
          <p className="text-[11px] text-slate-400">মোট ৫০০টি বাক্যের মধ্যে</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-xs font-semibold text-slate-400">বুকমার্ক বাক্য</span>
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{bookmarkedSentences.length}</div>
          <p className="text-[11px] text-slate-400">বিশেষ পছন্দের বাক্য</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold text-slate-400">প্রিয় শব্দ</span>
            <Star className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{favoriteWords.length}</div>
          <p className="text-[11px] text-slate-400">সংরক্ষিত ভোকাবুলারি</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold text-slate-400">স্টাডি স্ট্রিক</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">
            {completedCount > 0 ? 'Active' : 'Start'}
          </div>
          <p className="text-[11px] text-slate-400">প্রতিদিনের প্র্যাকটিস</p>
        </div>
      </div>

      {/* Quick Filter Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveFilter('bookmarks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFilter === 'bookmarks'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>বুকমার্ক করা বাক্য ({bookmarkedSentences.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFilter === 'favorites'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>প্রিয় শব্দ ভাণ্ডার ({favoriteWords.length})</span>
        </button>
      </div>

      {/* Bookmarked Sentences List */}
      {activeFilter === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarkedSentences.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">কোনো বুকমার্ক করা বাক্য নেই</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                বাক্য প্র্যাকটিস স্ক্রিন থেকে যেকোনো বাক্যের বুকমার্ক আইকনে চাপ দিলে তা এখানে জমা হবে।
              </p>
              <button
                onClick={onNavigateToSentences}
                className="mt-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>বাক্য প্র্যাকটিস-এ যান</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookmarkedSentences.map((sentence) => (
                <div
                  key={sentence.id}
                  className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2 relative hover:border-sky-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-sky-400">
                      #{sentence.id} · {sentence.category}
                    </span>
                    <button
                      onClick={() => handlePlayAudio(sentence.id, sentence.english)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        playingId === sentence.id
                          ? 'bg-sky-500 text-slate-950 animate-pulse'
                          : 'bg-slate-700/80 hover:bg-sky-500 hover:text-slate-950 text-slate-300'
                      }`}
                      title="শুনুন"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base font-bold text-white leading-snug">{sentence.bengali}</p>
                  <p className="text-xs text-sky-300 font-medium border-l-2 border-sky-400/60 pl-2">
                    {sentence.english}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorite Words List */}
      {activeFilter === 'favorites' && (
        <div className="space-y-3">
          {favoriteWords.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <Star className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">কোনো প্রিয় শব্দ নেই</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                শব্দ ভাণ্ডার স্ক্রিনে স্টাডি করার সময় স্টার আইকনে চাপ দিলে আপনার প্রিয় শব্দগুলো এখানে সংরক্ষিত থাকবে।
              </p>
              <button
                onClick={onNavigateToVocabulary}
                className="mt-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>শব্দ ভাণ্ডার-এ যান</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {favoriteWords.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {item.partOfSpeech}
                    </span>
                    <button
                      onClick={() => handlePlayAudio(item.id, item.word)}
                      className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{item.bengali}</h4>
                  <p className="text-xs text-sky-300 font-medium font-mono">{item.word}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">অগ্রগতি রিসেট করবেন?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনার সমস্ত সম্পন্ন বাক্য, বুকমার্ক ও সংরক্ষিত প্রিয় শব্দ রিসেট হয়ে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  onResetProgress();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
