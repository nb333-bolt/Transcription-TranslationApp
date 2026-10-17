/**
 * Web Speech Recognition helper for live real-time speech-to-text
 */

export interface LiveRecognitionCallbacks {
  onTranscriptChange: (liveText: string, isFinal: boolean) => void;
  onError: (err: any) => void;
}

export class LiveSpeechTracker {
  private recognition: any = null;
  private isListening = false;
  private currentLanguage = 'en-US';

  constructor(lang = 'en-US') {
    this.currentLanguage = lang;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
    }
  }

  public isAvailable(): boolean {
    return !!this.recognition;
  }

  public setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  public start(callbacks: LiveRecognitionCallbacks) {
    if (!this.recognition || this.isListening) return;

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const total = (final + interim).trim();
      if (total) {
        callbacks.onTranscriptChange(total, !!final);
      }
    };

    this.recognition.onerror = (e: any) => {
      // Don't crash on no-speech
      if (e.error !== 'no-speech') {
        callbacks.onError(e);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if user hasn't explicitly stopped
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // ignore already started error
        }
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      callbacks.onError(e);
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }
}
