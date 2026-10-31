// Speech Recognition Service using Web Speech API with en-IN locale

// Declare SpeechRecognition interfaces for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentCallbacks: SpeechRecognitionCallbacks | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        // South Asian / Indian English locale for Bangladeshi accent tolerance
        this.recognition.lang = 'en-IN';

        this.setupListeners();
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public startListening(callbacks: SpeechRecognitionCallbacks) {
    if (!this.recognition) {
      if (callbacks.onError) {
        callbacks.onError('আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।');
      }
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.currentCallbacks = callbacks;

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start error:', err);
      // Restart if already started
      try {
        this.recognition.stop();
        setTimeout(() => {
          this.recognition.start();
        }, 150);
      } catch (retryErr) {
        if (callbacks.onError) callbacks.onError('মাইক্রোফোন চালু করা যায়নি');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.currentCallbacks?.onStart) {
        this.currentCallbacks.onStart();
      }
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && this.currentCallbacks?.onInterimResult) {
        this.currentCallbacks.onInterimResult(interim);
      }

      if (final && this.currentCallbacks?.onFinalResult) {
        this.currentCallbacks.onFinalResult(final.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let msg = 'স্পিচ বুঝতে সমস্যা হয়েছে';
      if (event.error === 'not-allowed') {
        msg = 'অনুগ্রহ করে মাইক্রোফোনের অনুমতি দিন (Microphone Permission)';
      } else if (event.error === 'no-speech') {
        msg = 'কোনো কথা শোনা যায়নি, আবার চেষ্টা করুন';
      } else if (event.error === 'network') {
        msg = 'নেটওয়ার্ক সংযোগ চেক করুন';
      }
      if (this.currentCallbacks?.onError) {
        this.currentCallbacks.onError(msg);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.currentCallbacks?.onEnd) {
        this.currentCallbacks.onEnd();
      }
    };
  }
}

export const speechService = new SpeechRecognitionService();
