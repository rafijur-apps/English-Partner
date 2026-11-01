import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Bookmark,
  Sparkles,
  BookOpen,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { VOCABULARY, VocabularyItem } from '../data/vocabulary';
import { speakText, playSuccessChime, playRetryChime, triggerHaptic } from '../utils/audio';

interface VocabularyTestScreenProps {
  favoriteWordIds: Set<number>;
  onToggleFavoriteWord: (id: number) => void;
  savedRange: { start: number; end: number };
  onRangeChange: (range: { start: number; end: number }) => void;
}

const PRESET_RANGES = [
  { start: 1, end: 50, label: '1-50' },
  { start: 51, end: 100, label: '51-100' },
  { start: 101, end: 150, label: '101-150' },
  { start: 151, end: 200, label: '151-200' },
  { start: 201, end: 250, label: '201-250' },
  { start: 251, end: 300, label: '251-300' },
  { start: 301, end: 400, label: '301-400' },
  { start: 401, end: 500, label: '401-500' },
  { start: 1, end: 500, label: '1-500 (সব)' },
];

export const VocabularyTestScreen: React.FC<VocabularyTestScreenProps> = ({
  favoriteWordIds,
  onToggleFavoriteWord,
  savedRange,
  onRangeChange
}) => {
  // Sub-tab Navigation (Left / Default: Study List, Right: MCQ Test)
  const [activeSubTab, setActiveSubTab] = useState<'study' | 'quiz'>('study');

  // Range State
  const [rangeStart, setRangeStart] = useState<number>(savedRange?.start || 1);
  const [rangeEnd, setRangeEnd] = useState<number>(savedRange?.end || 50);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomRangeInput, setShowCustomRangeInput] = useState<boolean>(false);

  // Search filter inside study list
  const [studySearchQuery, setStudySearchQuery] = useState<string>('');
  const [speakingWordId, setSpeakingWordId] = useState<number | null>(null);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<{ word: VocabularyItem; chosen: string }[]>([]);

  // Update parent when range changes
  const applyRange = (s: number, e: number) => {
    const validStart = Math.max(1, Math.min(s, 500));
    const validEnd = Math.max(validStart, Math.min(e, 500));
    setRangeStart(validStart);
    setRangeEnd(validEnd);
    onRangeChange({ start: validStart, end: validEnd });
    resetQuiz(validStart, validEnd);
  };

  // Active Words in Range
  const activeRangeWords = useMemo(() => {
    return VOCABULARY.filter(w => w.id >= rangeStart && w.id <= rangeEnd);
  }, [rangeStart, rangeEnd]);

  // Filtered Study Words
  const filteredStudyWords = useMemo(() => {
    const q = studySearchQuery.trim().toLowerCase();
    return activeRangeWords.filter(w => {
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.bengali.toLowerCase().includes(q) ||
        w.partOfSpeech.toLowerCase().includes(q) ||
        w.id.toString() === q
      );
    });
  }, [activeRangeWords, studySearchQuery]);

  // Generate 4 randomized options (1 correct + 3 distinct distractors from dataset)
  const generateOptions = (targetWord: VocabularyItem) => {
    if (!targetWord) return [];
    const correctMeaning = targetWord.bengali;

    // Collect all unique Bengali meanings except correct one
    const allUniqueMeanings = Array.from(
      new Set(VOCABULARY.map(v => v.bengali).filter(m => m !== correctMeaning))
    );

    // Shuffle and pick 3 distinct random distractors
    const shuffledMeanings = [...allUniqueMeanings].sort(() => 0.5 - Math.random());
    const distractors = shuffledMeanings.slice(0, 3);

    // Combine and shuffle 4 options
    const options = [correctMeaning, ...distractors].sort(() => 0.5 - Math.random());
    return options;
  };

  // Reset quiz for new range or restart
  const resetQuiz = (s = rangeStart, e = rangeEnd) => {
    const words = VOCABULARY.filter(w => w.id >= s && w.id <= e);
    setQuizIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizCompleted(false);
    setWrongAnswers([]);
    if (words.length > 0) {
      setCurrentOptions(generateOptions(words[0]));
    }
  };

  // When activeRangeWords changes, ensure current question options are ready
  useEffect(() => {
    if (activeRangeWords.length > 0 && quizIndex < activeRangeWords.length) {
      setCurrentOptions(generateOptions(activeRangeWords[quizIndex]));
    }
  }, [rangeStart, rangeEnd, activeRangeWords, quizIndex]);

  // Handle TTS
  const handlePronounce = (word: string, id: number) => {
    setSpeakingWordId(id);
    speakText(word, 0.88, () => setSpeakingWordId(id), () => setSpeakingWordId(null));
  };

  // Option Click Handler
  const handleSelectOption = (option: string) => {
    if (isAnswered) return;

    const currentWord = activeRangeWords[quizIndex];
    if (!currentWord) return;

    const isCorrect = option === currentWord.bengali;
    setSelectedOption(option);
    setIsAnswered(true);

    if (isCorrect) {
      setScore(s => s + 1);
      playSuccessChime();
      triggerHaptic('success');

      // Auto-advance after 1.2s on correct answer as specified
      setTimeout(() => {
        advanceNextQuestion();
      }, 1200);
    } else {
      playRetryChime();
      triggerHaptic('warning');
      setWrongAnswers(prev => [...prev, { word: currentWord, chosen: option }]);
      // If wrong, stays so user can study the correct meaning before tapping "পরবর্তী শব্দ ▶"
    }
  };

  // Advance to next question
  const advanceNextQuestion = () => {
    if (quizIndex + 1 < activeRangeWords.length) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentOptions(generateOptions(activeRangeWords[nextIdx]));
    } else {
      setIsQuizCompleted(true);
      playSuccessChime();
    }
  };

  const handleCustomRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(customStart, 10);
    const end = parseInt(customEnd, 10);
    if (!isNaN(s) && !isNaN(end) && s >= 1 && end <= 500 && s <= end) {
      applyRange(s, end);
      setShowCustomRangeInput(false);
    }
  };

  const targetWord = activeRangeWords[quizIndex];

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-900 text-slate-100">
      {/* Range Selector Bar */}
      <div className="sticky top-15 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 space-y-2.5">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Header Row: Label & Custom Range button */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                শব্দ রেঞ্জ: <strong className="text-sky-400 font-mono text-sm">{rangeStart} - {rangeEnd}</strong>
              </span>
              <span className="text-[11px] text-slate-400">({activeRangeWords.length}টি শব্দ)</span>
            </div>

            <button
              onClick={() => setShowCustomRangeInput(!showCustomRangeInput)}
              className="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCustomRangeInput ? 'কাস্টম রেঞ্জ লুকান' : 'কাস্টম রেঞ্জ লিখুন'}</span>
            </button>
          </div>

          {/* Preset Range Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {PRESET_RANGES.map((preset) => {
              const isSelected = rangeStart === preset.start && rangeEnd === preset.end;
              return (
                <button
                  key={preset.label}
                  onClick={() => applyRange(preset.start, preset.end)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm shadow-sky-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Range Drawer/Form */}
          {showCustomRangeInput && (
            <form onSubmit={handleCustomRangeSubmit} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs animate-in fade-in">
              <span className="text-slate-300 font-medium shrink-0">শুরু:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                placeholder="1"
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-slate-300 font-medium shrink-0">শেষ:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                placeholder="100"
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
              >
                প্রয়োগ করুন
              </button>
            </form>
          )}

          {/* Sub-tab Navigation (Sub-tab A: Study List, Sub-tab B: MCQ Test) */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => setActiveSubTab('study')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubTab === 'study'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 শব্দ ভাণ্ডার (Study List)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('quiz')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubTab === 'quiz'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🎯 ৪-অপশন এমসিকিউ টেস্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab A: 📚 শব্দ ভাণ্ডার (Study List) */}
      {activeSubTab === 'study' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-3">
          {/* Search within Range */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
            <input
              type="text"
              value={studySearchQuery}
              onChange={(e) => setStudySearchQuery(e.target.value)}
              placeholder={`রেঞ্জ ${rangeStart}-${rangeEnd}-এর মধ্যে শব্দ বা বাংলা অর্থ খুঁজুন...`}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Word List */}
          <div className="space-y-2.5">
            {filteredStudyWords.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800">
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">কোনো শব্দ খুঁজে পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">অন্য কোনো শব্দ দিয়ে সার্চ করুন অথবা রেঞ্জ পরিবর্তন করুন</p>
              </div>
            ) : (
              filteredStudyWords.map((vocab) => {
                const isSpeaking = speakingWordId === vocab.id;
                const isFav = favoriteWordIds.has(vocab.id);

                return (
                  <div
                    key={vocab.id}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* ID Badge */}
                      <span className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        #{vocab.id}
                      </span>

                      {/* Word Info */}
                      <div className="min-w-0">
                        {/* Bengali Meaning */}
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                          {vocab.bengali}
                        </h4>

                        {/* English Word (Same font size & weight as Bengali) */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base sm:text-lg font-bold text-sky-300 tracking-tight">
                            {vocab.word}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                            {vocab.partOfSpeech}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            · {vocab.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Pronounce audio & Bookmark */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handlePronounce(vocab.word, vocab.id)}
                        className={`p-2 rounded-xl transition-all ${
                          isSpeaking
                            ? 'bg-sky-500 text-slate-950 scale-105'
                            : 'bg-slate-700/70 hover:bg-slate-700 text-sky-400 hover:text-sky-300'
                        }`}
                        title="উচ্চারণ শুনুন"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onToggleFavoriteWord(vocab.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isFav
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                        title={isFav ? 'প্রিয় তালিকা থেকে সরান' : 'প্রিয় তালিকায় যুক্ত করুন'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sub-tab B: 🎯 ৪-অপশন এমসিকিউ টেস্ট (MCQ Test) */}
      {activeSubTab === 'quiz' && (
        <div className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col justify-between">
          {/* If Quiz is Completed: Summary Card */}
          {isQuizCompleted ? (
            <div className="my-auto p-6 sm:p-8 rounded-2xl bg-slate-800/90 border border-slate-700 text-center shadow-xl space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-sky-500/20">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">অভিনন্দন! টেস্ট সম্পন্ন হয়েছে</h3>
                <p className="text-xs text-slate-400 mt-1">
                  রেঞ্জ {rangeStart} থেকে {rangeEnd} পর্যন্ত মূল্যায়ন
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">মোট প্রশ্ন</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">{activeRangeWords.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">সঠিক উত্তর</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{score}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">সাফল্যের হার</p>
                  <p className="text-xl font-bold font-mono text-sky-400 mt-1">
                    {activeRangeWords.length > 0 ? Math.round((score / activeRangeWords.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Review wrong answers if any */}
              {wrongAnswers.length > 0 && (
                <div className="text-left space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <p className="font-semibold text-rose-400 mb-2">ভুল উত্তরসমূহ পর্যালোচনা করুন ({wrongAnswers.length}টি):</p>
                  {wrongAnswers.map((item, idx) => (
                    <div key={idx} className="pb-2 border-b border-slate-800/80 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{item.word.word}</span>
                        <span className="text-emerald-400 font-medium">সঠিক: {item.word.bengali}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">আপনার উত্তর ছিল: <span className="line-through text-rose-300">{item.chosen}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => resetQuiz()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-sky-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>আবার টেস্ট দিন</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('study')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>শব্দগুলো পড়ুন</span>
                </button>
              </div>
            </div>
          ) : !targetWord ? (
            <div className="my-auto text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800">
              <p className="text-sm text-slate-300">এই রেঞ্জে কোনো শব্দ নেই</p>
              <button
                onClick={() => applyRange(1, 50)}
                className="mt-3 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold"
              >
                ডিফল্ট রেঞ্জে ফিরে যান
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar & Score Counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">
                    প্রশ্ন <strong className="text-white font-mono text-sm">{quizIndex + 1}</strong> / <span className="font-mono">{activeRangeWords.length}</span>
                  </span>
                  <span className="text-sky-400 font-mono">
                    স্কোর: <strong className="text-emerald-400">{score}</strong> / {quizIndex + (isAnswered && selectedOption === targetWord.bengali ? 1 : 0)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${((quizIndex + 1) / activeRangeWords.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Target Word Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center shadow-lg relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700 text-[11px] font-medium text-slate-400 mb-3">
                  <span>#{targetWord.id}</span>
                  <span>·</span>
                  <span className="uppercase">{targetWord.partOfSpeech}</span>
                  <span>·</span>
                  <span>{targetWord.category}</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {targetWord.word}
                  </h3>
                  <button
                    onClick={() => handlePronounce(targetWord.word, targetWord.id)}
                    className="p-2.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-colors"
                    title="উচ্চারণ শুনুন"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <p className="text-sm font-semibold text-sky-300">
                    সঠিক বাংলা অর্থ কোনটি?
                  </p>
                </div>
              </div>

              {/* 4 Interactive Option Buttons (A, B, C, D) */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentOptions.map((opt, idx) => {
                  const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                  const isCorrectOption = opt === targetWord.bengali;
                  const isSelected = selectedOption === opt;

                  let btnStyle = 'bg-slate-800/70 border-slate-700 text-slate-100 hover:bg-slate-700/80 hover:border-slate-600';
                  let badgeStyle = 'bg-slate-700 text-slate-300';

                  if (isAnswered) {
                    if (isCorrectOption) {
                      // Correct option always green
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500';
                      badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isSelected) {
                      // Selected wrong option turns red
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-500';
                      badgeStyle = 'bg-rose-500 text-white font-black';
                    } else {
                      btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                      badgeStyle = 'bg-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${badgeStyle}`}>
                          {optionLabel}
                        </span>
                        <span className="text-base font-medium leading-snug">
                          {opt}
                        </span>
                      </div>

                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Wrong Answer "পরবর্তী শব্দ ▶" Button to study before proceeding */}
              {isAnswered && selectedOption !== targetWord.bengali && (
                <div className="pt-2 animate-in fade-in">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-3 text-xs text-amber-200">
                    <p className="font-semibold text-white mb-0.5">
                      সঠিক অর্থটি লক্ষ্য করুন: <span className="text-emerald-400 font-bold">{targetWord.bengali}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      পরবর্তী প্রশ্নে যাওয়ার আগে সঠিক উত্তরটি মনে রাখার চেষ্টা করুন।
                    </p>
                  </div>

                  <button
                    onClick={advanceNextQuestion}
                    className="w-full py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99]"
                  >
                    <span>পরবর্তী শব্দ ▶</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
