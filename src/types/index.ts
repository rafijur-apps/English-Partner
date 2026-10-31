export interface SentenceItem {
  id: number;
  category: string;
  english: string;
  bengali: string;
}

export interface VocabularyItem {
  id: number;
  word: string;
  partOfSpeech: string;
  category: string;
  bengali: string;
}

export interface SpeechFeedback {
  sentenceId: number;
  transcript: string;
  similarity: number;
  isMatch: boolean;
  timestamp: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  sentencesPerPage: 10 | 12;
  speechRate: number;
  autoPlayAudio: boolean;
  hapticsEnabled: boolean;
}

export interface QuizQuestion {
  vocab: VocabularyItem;
  options: string[];
  correctOption: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  selectedOption: string | null;
  isAnswered: boolean;
  isCorrect: boolean;
  score: number;
  isFinished: boolean;
  userAnswers: {
    questionId: number;
    word: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
  }[];
}
