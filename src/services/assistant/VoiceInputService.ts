/**
 * VoiceInputService
 *
 * Reliable Web Speech API wrapper.
 * - Uses continuous=true so the user controls when to stop
 * - Accumulates interim + final results
 * - Maps short locale codes to full BCP-47 tags
 */

import type { IVoiceInputService } from '../../types/assistant-services.types';

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

/** Map short i18n codes → BCP-47 locale tags the Speech API understands */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'fr-FR': 'fr-FR',
  'ar-SA': 'ar-SA',
  'ar-MA': 'ar-MA',
  'ar-DZ': 'ar-DZ',
};

function resolveLang(locale: string): string {
  if (!locale) return 'en-US';
  const exact = LOCALE_MAP[locale];
  if (exact) return exact;
  // Try the base language code
  const base = locale.split('-')[0].toLowerCase();
  return LOCALE_MAP[base] ?? locale;
}

export class VoiceInputService implements IVoiceInputService {
  private recognition: SpeechRecognition | null = null;
  private transcriptCallback: ((text: string) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private accumulatedTranscript = '';

  isSupported(): boolean {
    return !!(
      (typeof window !== 'undefined') &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  async startRecording(locale: string): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    // Stop any existing session first
    this.stopSilently();

    const API = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    this.recognition = new API();
    this.accumulatedTranscript = '';

    const lang = resolveLang(locale);
    this.recognition.lang = lang;
    this.recognition.continuous = true;       // keep listening until user stops
    this.recognition.interimResults = true;   // show partial results
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText) {
        this.accumulatedTranscript += (this.accumulatedTranscript ? ' ' : '') + finalText.trim();
        // Fire the callback with the running transcript so the textarea updates live
        this.transcriptCallback?.(this.accumulatedTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is not a real error — just silence
      if (event.error === 'no-speech') return;
      this.errorCallback?.(new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      // Auto-ended (e.g. silence timeout) — fire final transcript if any
      if (this.accumulatedTranscript) {
        this.transcriptCallback?.(this.accumulatedTranscript);
      }
    };

    this.recognition.start();
  }

  async stopRecording(): Promise<string> {
    const transcript = this.accumulatedTranscript;
    this.stopSilently();
    return transcript;
  }

  onTranscript(callback: (text: string) => void): void {
    this.transcriptCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  private stopSilently(): void {
    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.accumulatedTranscript = '';
  }
}

export const voiceInputService = new VoiceInputService();
