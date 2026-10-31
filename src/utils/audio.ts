// Pure Web Audio & Speech Utility for English Partner Web Platform

let audioCtx: AudioContext | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;

declare global {
  interface Window {
    _activeSpeechUtterance?: SpeechSynthesisUtterance | null;
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// User-gesture unmuting for mobile and desktop web browsers
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.getVoices();
    } catch {
      // Ignore
    }
  }
}

// Global first touch/click listener to unlock Web Audio
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
  const unlockHandler = () => {
    unlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockHandler));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, unlockHandler, { passive: true }));
}

/**
 * Play pleasant success chime (C5 -> E5 -> G5)
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.36);
  });
}

/**
 * Play gentle retry / warning chime (F4 -> D4)
 */
export function playRetryChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [349.23, 293.66];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0, now + idx * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.3);
  });
}

/**
 * Play subtle tap click
 */
export function playTapChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

/**
 * Trigger subtle haptic vibration on supporting mobile browsers
 */
export function triggerHaptic(type: 'success' | 'warning' | 'tap' = 'tap') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'success') {
        navigator.vibrate([40, 60, 40]);
      } else if (type === 'warning') {
        navigator.vibrate([70, 50, 70]);
      } else {
        navigator.vibrate(25);
      }
    } catch {
      // Ignore vibration error
    }
  }
}

/**
 * Fallback to HTML5 audio using high quality online TTS
 */
function playHtmlAudioFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  try {
    stopSpeaking();
    const cleanText = text.trim();
    if (!cleanText) return false;

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(
      cleanText
    )}`;

    const audio = new Audio(url);
    currentHtmlAudio = audio;

    if (onStart) {
      audio.onplay = () => onStart();
    }
    audio.onended = () => {
      currentHtmlAudio = null;
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      currentHtmlAudio = null;
      if (onEnd) onEnd();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('HTML Audio fallback playback error:', err);
        if (onEnd) onEnd();
      });
    }
    return true;
  } catch (err) {
    console.error('HTML Audio fallback failed:', err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Universal browser text-to-speech
 */
export function speakText(
  text: string,
  rate: number = 0.88,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined') return false;

  stopSpeaking();
  unlockAudio();

  // Tier 1: Web Speech Synthesis API
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Keep reference to prevent GC mid-speech
      window._activeSpeechUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice =
          voices.find((v) => v.lang.startsWith('en-IN') || v.lang.startsWith('en_IN')) ||
          voices.find(
            (v) =>
              v.lang.startsWith('en-US') &&
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
          ) ||
          voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      let hasStarted = false;
      utterance.onstart = () => {
        hasStarted = true;
        if (onStart) onStart();
      };

      const cleanup = () => {
        window._activeSpeechUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onend = cleanup;
      utterance.onerror = () => {
        window._activeSpeechUtterance = null;
        playHtmlAudioFallback(text, onStart, onEnd);
      };

      window.speechSynthesis.speak(utterance);

      // Watchdog fallback
      setTimeout(() => {
        if (!hasStarted && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
          window.speechSynthesis.cancel();
          playHtmlAudioFallback(text, onStart, onEnd);
        }
      }, 700);

      return true;
    } catch {
      // Fallback
    }
  }

  // Tier 2: HTML5 Audio Fallback
  return playHtmlAudioFallback(text, onStart, onEnd);
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch {}
    currentHtmlAudio = null;
  }

  window._activeSpeechUtterance = null;
}
