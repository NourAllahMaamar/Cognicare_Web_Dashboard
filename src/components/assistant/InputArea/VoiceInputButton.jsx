import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * VoiceInputButton — direct Web Speech API implementation.
 * No service abstraction — simpler and more reliable.
 *
 * Locale mapping:
 *   en → en-US, fr → fr-FR, ar → ar-SA
 *
 * Props: { onTranscript, locale, disabled }
 */

const LOCALE_MAP = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
};

function getLang(locale) {
  if (!locale) return 'en-US';
  return LOCALE_MAP[locale] ?? LOCALE_MAP[locale.split('-')[0]] ?? locale;
}

function getSpeechAPI() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export default function VoiceInputButton({ onTranscript, locale, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const errorTimerRef = useRef(null);

  const showError = (msg) => {
    setError(msg);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 5000);
  };

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
      clearTimeout(errorTimerRef.current);
    };
  }, [stopRecognition]);

  // Check support after hooks are registered so render order stays stable.
  const SpeechAPI = getSpeechAPI();
  if (!SpeechAPI) return null;

  const handleClick = () => {
    if (isRecording) {
      stopRecognition();
      // Deliver whatever was accumulated
      if (transcriptRef.current) {
        onTranscript?.(transcriptRef.current);
        transcriptRef.current = '';
      }
      return;
    }

    // Start fresh
    transcriptRef.current = '';

    const recognition = new SpeechAPI();
    recognitionRef.current = recognition;

    recognition.lang = getLang(locale);
    recognition.continuous = true;
    recognition.interimResults = false; // only fire on final results
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let newText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newText += event.results[i][0].transcript;
        }
      }
      if (newText.trim()) {
        transcriptRef.current = transcriptRef.current
          ? `${transcriptRef.current} ${newText.trim()}`
          : newText.trim();
        // Update textarea live
        onTranscript?.(transcriptRef.current);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return; // silence — not an error
      if (event.error === 'aborted') return;   // user stopped — not an error

      const messages = {
        'not-allowed': 'Microphone access denied. Click the lock icon in your browser address bar to allow it.',
        'network': 'Network error. Speech recognition requires an internet connection.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'service-not-allowed': 'Speech service not allowed. Try on HTTPS or localhost.',
      };
      showError(messages[event.error] ?? `Voice error: ${event.error}`);
      stopRecognition();
    };

    recognition.onend = () => {
      // Auto-ended (silence timeout) — deliver transcript and reset
      if (transcriptRef.current) {
        onTranscript?.(transcriptRef.current);
        transcriptRef.current = '';
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not start voice input.');
      recognitionRef.current = null;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        title={isRecording ? 'Click to stop' : `Voice input · ${getLang(locale)}`}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          isRecording
            ? 'bg-red-500/15 text-red-500 ring-2 ring-red-400/40'
            : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: isRecording ? "'FILL' 1" : "'FILL' 0" }}
        >
          {isRecording ? 'stop_circle' : 'mic'}
        </span>
      </button>

      {/* Pulsing dot while recording */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 w-60 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 shadow-lg z-10 leading-relaxed">
          {error}
        </div>
      )}
    </div>
  );
}
