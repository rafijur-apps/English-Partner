import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  HelpCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { SENTENCES, SentenceItem } from '../data/sentences';
import { speakText, playSuccessChime, playRetryChime, triggerHaptic } from '../utils/audio';
import { evaluateSpeechMatch } from '../utils/similarity';
import { speechService } from '../services/speechRecognition';

interface SentencePracticeScreenProps {
  completedIds: Set<number>;
  onToggleComplete: (id: number) => void;
  bookmarkedIds: Set<number>;
  onToggleBookmark: (id: number) => void;
  savedPage: number;
  onPageChange: (page: number) => void;
}

export const SentencePracticeScreen: React.FC<SentencePracticeScreenProps> = ({
  completedIds,
  onToggleComplete,
  bookmarkedIds,
  onToggleBookmark,
  savedPage,
  onPageChange
}) => {
  const [currentPage, setCurrentPage] = useState<number>(savedPage || 1);
  const [pageSize, setPageSize] = useState<10 | 12>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [jumpInput, setJumpInput] = useState<string>('');

  // Active audio speech states
  const [speakingSentenceId, setSpeakingSentenceId] = useState<number | null>(null);
  const [activeRecordingId, setActiveRecordingId] = useState<number | null>(null);
  const [recordingTranscript, setRecordingTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Results cache for cards: sentenceId -> { transcript, similarity, isMatch }
  const [speechFeedbackMap, setSpeechFeedbackMap] = useState<
    Record<number, { transcript: string; similarity: number; isMatch: boolean }>
  >({});

  // Manual fallback test modal / input for browser environments with mic restrictions
  const [manualTestSentence, setManualTestSentence] = useState<SentenceItem | null>(null);
  const [manualInputText, setManualInputText] = useState<string>('');

  // Sync page changes upward for persistence
  useEffect(() => {
    onPageChange(currentPage);
  }, [currentPage, onPageChange]);

  // Categories list with counts
  const categories = useMemo(() => {
    return [
      { name: 'All', label: 'সব ক্যাটাগরি', count: SENTENCES.length },
      { name: 'Conversational', label: 'কথোপকথন (Conversational)', count: 75 },
      { name: 'Daily Life', label: 'দৈনন্দিন জীবন (Daily Life)', count: 125 },
      { name: 'Workplace', label: 'অফিস ও কর্মক্ষেত্র (Workplace)', count: 125 },
      { name: 'Data & Tech', label: 'ডেটা ও টেকনোলজি (Data & Tech)', count: 100 },
      { name: 'Job Interview', label: 'চাকরির ইন্টারভিউ (Job Interview)', count: 75 },
    ];
  }, []);

  // Filter sentences by category & search query
  const filteredSentences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SENTENCES.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !q ||
        item.english.toLowerCase().includes(q) ||
        item.bengali.toLowerCase().includes(q) ||
        item.id.toString() === q;
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredSentences.length / pageSize));

  // Ensure valid current page on filter change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentSentences = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSentences.slice(start, start + pageSize);
  }, [filteredSentences, currentPage, pageSize]);

  // Handle TTS
  const handleListen = (sentence: SentenceItem) => {
    setSpeakingSentenceId(sentence.id);
    speakText(
      sentence.english,
      0.88, // Clear speech rate between 0.85 and 0.90
      () => setSpeakingSentenceId(sentence.id),
      () => setSpeakingSentenceId(null)
    );
  };

  // Start Speech Recognition
  const handleStartPractice = (sentence: SentenceItem) => {
    if (activeRecordingId === sentence.id && isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      setActiveRecordingId(null);
      return;
    }

    setSpeechError(null);
    setActiveRecordingId(sentence.id);
    setRecordingTranscript('');
    setIsRecording(true);

    speechService.startListening({
      onStart: () => {
        setIsRecording(true);
      },
      onInterimResult: (transcript) => {
        setRecordingTranscript(transcript);
      },
      onFinalResult: (transcript) => {
        setRecordingTranscript(transcript);
        setIsRecording(false);
        setActiveRecordingId(null);

        // Evaluate fuzzy matching
        const evaluation = evaluateSpeechMatch(transcript, sentence.english, 0.65);

        setSpeechFeedbackMap(prev => ({
          ...prev,
          [sentence.id]: {
            transcript,
            similarity: evaluation.similarity,
            isMatch: evaluation.isMatch,
          }
        }));

        if (evaluation.isMatch) {
          playSuccessChime();
          triggerHaptic('success');
          onToggleComplete(sentence.id);
        } else {
          playRetryChime();
          triggerHaptic('warning');
        }
      },
      onError: (err) => {
        setIsRecording(false);
        setActiveRecordingId(null);
        setSpeechError(err);
      },
      onEnd: () => {
        setIsRecording(false);
        setActiveRecordingId(null);
      }
    });
  };

  // Manual test submission for fuzzy matcher verification
  const handleManualTestSubmit = () => {
    if (!manualTestSentence) return;
    const evaluation = evaluateSpeechMatch(manualInputText, manualTestSentence.english, 0.65);

    setSpeechFeedbackMap(prev => ({
      ...prev,
      [manualTestSentence.id]: {
        transcript: manualInputText,
        similarity: evaluation.similarity,
        isMatch: evaluation.isMatch,
      }
    }));

    if (evaluation.isMatch) {
      playSuccessChime();
      triggerHaptic('success');
      onToggleComplete(manualTestSentence.id);
    } else {
      playRetryChime();
      triggerHaptic('warning');
    }

    setManualTestSentence(null);
    setManualInputText('');
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpInput('');
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-900 text-slate-100">
      {/* Search & Category Filter Section */}
      <div className="sticky top-15 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 space-y-2.5">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Search bar & Page-size toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ইংরেজি বাক্য বা বাংলা অর্থ দিয়ে খুঁজুন (৫০০টি বাক্য)..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Page Size Toggle (10 or 12 cards per page as requested) */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-0.5 shrink-0 text-xs font-semibold">
              <button
                onClick={() => setPageSize(10)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  pageSize === 10 ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="প্রতি পাতায় ১০টি বাক্য"
              >
                10
              </button>
              <button
                onClick={() => setPageSize(12)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  pageSize === 12 ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="প্রতি পাতায় ১২টি বাক্য"
              >
                12
              </button>
            </div>
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats Strip */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <span>মোট পাওয়া গেছে: <strong className="text-white font-mono">{filteredSentences.length}</strong></span>
              <span>·</span>
              <span>প্র্যাকটিস সম্পন্ন: <strong className="text-emerald-400 font-mono">{completedIds.size} / 500</strong></span>
            </div>
            <div className="text-[11px] text-sky-400 font-medium">
              দক্ষিণ এশীয় অ্যাকসেন্ট সহনশীল (en-IN)
            </div>
          </div>
        </div>
      </div>

      {/* Top Pagination Bar */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>◀ আগের পাতা</span>
          </button>

          {/* Page Display & Jump */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">
              পাতা <strong className="text-sky-400 font-mono text-sm">{currentPage}</strong> / <span className="font-mono">{totalPages}</span>
            </span>
            <form onSubmit={handleJumpPage} className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder="Go"
                className="w-12 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                যান
              </button>
            </form>
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors font-medium"
          >
            <span>পরের পাতা ▶</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Speech Error Banner if any */}
      {speechError && (
        <div className="max-w-4xl mx-auto px-4 mt-2">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="p-1 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Sentence Cards Feed */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        {currentSentences.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-800/40 rounded-2xl border border-slate-800">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">কোনো বাক্য খুঁজে পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-1">অন্য কোনো শব্দ বা ক্যাটাগরি দিয়ে চেষ্টা করুন</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : (
          currentSentences.map((sentence) => {
            const isSpeaking = speakingSentenceId === sentence.id;
            const isThisRecording = activeRecordingId === sentence.id && isRecording;
            const feedback = speechFeedbackMap[sentence.id];
            const isCompleted = completedIds.has(sentence.id);
            const isBookmarked = bookmarkedIds.has(sentence.id);

            return (
              <div
                key={sentence.id}
                className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Card Header: Badge, Category, Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        #{sentence.id}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {sentence.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          সম্পন্ন
                        </span>
                      )}
                      <button
                        onClick={() => onToggleBookmark(sentence.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                        title={isBookmarked ? 'বুকমার্ক সরানো' : 'বুকমার্ক করুন'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* English Sentence */}
                  <div className="mb-3">
                    <p className="text-base sm:text-lg font-bold tracking-tight text-white leading-relaxed select-text">
                      {sentence.english}
                    </p>
                  </div>

                  {/* Bengali Meaning with Accent Border */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border-l-3.5 border-sky-400 mb-4">
                    <p className="text-sm font-medium text-sky-300 leading-normal">
                      {sentence.bengali}
                    </p>
                  </div>

                  {/* Action Buttons: 🔊 শুনুন & 🎙️ দেখে বলুন */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Listen Button */}
                    <button
                      onClick={() => handleListen(sentence)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isSpeaking
                          ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 animate-pulse'
                          : 'bg-slate-700/80 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-600/60'
                      }`}
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-slate-950' : 'text-sky-400'}`} />
                      <span>{isSpeaking ? 'শোনা হচ্ছে...' : '🔊 শুনুন'}</span>
                    </button>

                    {/* Speech Practice Button */}
                    <button
                      onClick={() => handleStartPractice(sentence)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isThisRecording
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                      }`}
                    >
                      {isThisRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>থামুন (বলছি...)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-sky-200" />
                          <span>🎙️ দেখে বলুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Recording Feedback Banner */}
                  {isThisRecording && (
                    <div className="mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-slate-300">
                          {recordingTranscript ? `"${recordingTranscript}"` : 'কথা বলুন, শুনছি...'}
                        </span>
                      </div>
                      <span className="text-[11px] text-sky-400 font-mono">locale: en-IN</span>
                    </div>
                  )}

                  {/* Evaluated Speech Card Feedback */}
                  {feedback && !isThisRecording && (
                    <div
                      className={`mt-3 p-3 rounded-xl border text-xs transition-all ${
                        feedback.isMatch
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-200 mb-0.5">
                            You said:{' '}
                            <span className="italic font-normal text-white">
                              "{feedback.transcript || '(অস্পষ্ট শব্দ)'}"
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            উচ্চারণ মিল:{' '}
                            <strong className="text-white font-mono">
                              {Math.round(feedback.similarity * 100)}%
                            </strong>{' '}
                            (অ্যাকসেন্ট সহনশীল মাত্রা: ৬৫%)
                          </p>
                        </div>
                        <div className="shrink-0">
                          {feedback.isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                              ✅ দারুণ উচ্চারণ!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                              ⚠️ আবার বলুন
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Retry suggestion */}
                      {!feedback.isMatch && (
                        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
                          <span className="text-amber-200/80">
                            টিপস: শব্দগুলো আলাদা করে স্পষ্টভাবে উচ্চারণ করুন।
                          </span>
                          <button
                            onClick={() => handleStartPractice(sentence)}
                            className="text-sky-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            পুনরায় বলুন
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Evaluation Trigger Button (for environments without mic) */}
                  <div className="mt-2.5 text-right">
                    <button
                      onClick={() => {
                        setManualTestSentence(sentence);
                        setManualInputText(sentence.english);
                      }}
                      className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors inline-flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>টেস্ট ডায়লগ / মাইক্রোফোন বিকল্প</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Bottom Pagination Bar */}
      <div className="sticky bottom-16 sm:bottom-0 z-20 bg-slate-950/80 border-t border-slate-800/80 py-2.5 px-4 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>◀ আগের পাতা</span>
          </button>

          <span className="font-medium text-slate-400">
            পাতা <strong className="text-white font-mono">{currentPage}</strong> / <span className="font-mono">{totalPages}</span>
          </span>

          <button
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors font-medium"
          >
            <span>পরের পাতা ▶</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Manual Test Fallback Modal */}
      {manualTestSentence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                উচ্চারণ ও ফাজি ম্যাচিং যাচাই
              </h3>
              <button
                onClick={() => setManualTestSentence(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              আসল বাক্য:{' '}
              <span className="text-white font-semibold">{manualTestSentence.english}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  আপনি যেভাবে উচ্চারণ করলেন তা লিখুন (বা ভয়েস টাইপিং করুন):
                </label>
                <input
                  type="text"
                  value={manualInputText}
                  onChange={(e) => setManualInputText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  placeholder="যেমন: Let me think for a second"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualTestSentence(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleManualTestSubmit}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
                >
                  ম্যাচিং চেক করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
