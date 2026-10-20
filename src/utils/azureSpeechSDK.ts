import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureClientConfig {
  speechKey?: string;
  translationKey?: string;
  region?: string;
}

export function getStoredAzureClientConfig(): AzureClientConfig {
  try {
    const speechKey =
      localStorage.getItem('voice_studio_azure_speech_key') ||
      localStorage.getItem('voice_studio_azure_key') ||
      '';
    const translationKey =
      localStorage.getItem('voice_studio_azure_translation_key') ||
      localStorage.getItem('voice_studio_azure_key') ||
      '';
    const region = localStorage.getItem('voice_studio_azure_region') || 'eastus';

    return { speechKey, translationKey, region };
  } catch {
    return { speechKey: '', translationKey: '', region: 'eastus' };
  }
}

/**
 * Normalizes language codes to Azure Speech recognition locales (e.g. 'cy' -> 'cy-GB')
 */
export function toAzureSpeechLocale(langOrCode: string): string {
  const l = (langOrCode || '').toLowerCase().trim();
  if (l === 'cy' || l.includes('welsh') || l.includes('cymraeg')) return 'cy-GB';
  if (l === 'es' || l.includes('spanish') || l.includes('español')) return 'es-ES';
  if (l === 'fr' || l.includes('french') || l.includes('français')) return 'fr-FR';
  if (l === 'de' || l.includes('german') || l.includes('deutsch')) return 'de-DE';
  if (l === 'hi' || l.includes('hindi')) return 'hi-IN';
  if (l === 'it' || l.includes('italian')) return 'it-IT';
  if (l === 'pt' || l.includes('portuguese')) return 'pt-PT';
  if (l === 'zh' || l.includes('chinese')) return 'zh-CN';
  if (l === 'ja' || l.includes('japanese')) return 'ja-JP';
  return 'en-GB';
}

/**
 * Normalizes language codes for Azure Speech target translation
 */
export function toAzureTranslatorCode(langOrCode: string): string {
  const l = (langOrCode || '').toLowerCase().trim();
  if (l === 'cy' || l.includes('welsh') || l.includes('cymraeg')) return 'cy';
  if (l === 'es' || l.includes('spanish') || l.includes('español')) return 'es';
  if (l === 'fr' || l.includes('french') || l.includes('français')) return 'fr';
  if (l === 'de' || l.includes('german') || l.includes('deutsch')) return 'de';
  if (l === 'hi' || l.includes('hindi')) return 'hi';
  if (l === 'it' || l.includes('italian')) return 'it';
  if (l === 'pt' || l.includes('portuguese')) return 'pt';
  if (l === 'zh' || l.includes('chinese')) return 'zh-Hans';
  if (l === 'ja' || l.includes('japanese')) return 'ja';
  return 'en';
}

export class AzureLiveSpeechClient {
  private speechRecognizer: SpeechSDK.SpeechRecognizer | null = null;
  private translationRecognizer: SpeechSDK.TranslationRecognizer | null = null;
  private isRunning = false;
  private config: AzureClientConfig;

  constructor(customConfig?: AzureClientConfig) {
    this.config = customConfig || getStoredAzureClientConfig();
  }

  public updateConfig(newConfig: AzureClientConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  public isConfigured(): boolean {
    const key = (this.config.speechKey || this.config.translationKey || '').trim();
    return Boolean(key && !key.includes('dummy') && key.length >= 10);
  }

  public isTranslationConfigured(): boolean {
    const key = (this.config.translationKey || this.config.speechKey || '').trim();
    return Boolean(key && !key.includes('dummy') && key.length >= 10);
  }

  /**
   * Start live speech-to-text transcription using Azure Speech SDK
   */
  public async startLiveTranscription(options: {
    sourceLanguage?: string;
    onRecognizing?: (interimText: string, fullAccumulated: string) => void;
    onRecognized?: (finalPhrase: string, fullAccumulated: string) => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }

    const key = (this.config.speechKey || this.config.translationKey || '').trim();
    const region = (this.config.region || 'eastus').trim();

    if (!key) {
      throw new Error('Azure Speech Key is not configured. Please add your key in the Azure SDK settings.');
    }

    const locale = toAzureSpeechLocale(options.sourceLanguage || 'en');
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = locale;
    speechConfig.enableDictation();

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    this.speechRecognizer = recognizer;
    this.isRunning = true;

    let accumulatedText = '';

    recognizer.recognizing = (_sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech && e.result.text) {
        const full = accumulatedText ? `${accumulatedText} ${e.result.text}` : e.result.text;
        options.onRecognizing?.(e.result.text, full);
      }
    };

    recognizer.recognized = (_sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
        accumulatedText = accumulatedText ? `${accumulatedText} ${e.result.text}` : e.result.text;
        options.onRecognized?.(e.result.text, accumulatedText);
      }
    };

    recognizer.canceled = (_sender, e) => {
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        options.onError?.(`Azure Speech SDK Error: ${e.errorDetails}`);
      }
    };

    return new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => resolve(),
        (err) => {
          this.isRunning = false;
          options.onError?.(String(err));
          reject(err);
        }
      );
    });
  }

  /**
   * Start live speech translation using Azure Speech Translation SDK
   */
  public async startLiveTranslation(options: {
    sourceLanguage?: string;
    targetLanguages: string[];
    onRecognizing?: (
      interimOriginal: string,
      interimTranslations: Record<string, string>,
      fullOriginal: string,
      fullTranslations: Record<string, string>
    ) => void;
    onRecognized?: (
      phraseOriginal: string,
      phraseTranslations: Record<string, string>,
      fullOriginal: string,
      fullTranslations: Record<string, string>
    ) => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }

    // Speech Translation SDK requires the Azure Speech Services key (SpeechServices.F0)
    const key = (this.config.speechKey || this.config.translationKey || '').trim();
    const region = (this.config.region || 'eastus').trim();

    if (!key) {
      throw new Error('Azure Speech Key is not configured for Speech Translation.');
    }

    const fromLocale = toAzureSpeechLocale(options.sourceLanguage || 'en');
    const translationConfig = SpeechSDK.SpeechTranslationConfig.fromSubscription(key, region);
    translationConfig.speechRecognitionLanguage = fromLocale;

    const targetCodes = options.targetLanguages.map(toAzureTranslatorCode);
    targetCodes.forEach((code) => translationConfig.addTargetLanguage(code));

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.TranslationRecognizer(translationConfig, audioConfig);
    this.translationRecognizer = recognizer;
    this.isRunning = true;

    let accumulatedOriginal = '';
    const accumulatedTranslations: Record<string, string> = {};

    recognizer.recognizing = (_sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.TranslatingSpeech) {
        const orig = e.result.text || '';
        const currentTrans: Record<string, string> = {};
        targetCodes.forEach((code) => {
          const t = e.result.translations.get(code);
          if (t) currentTrans[code] = t;
        });

        const fullOrig = accumulatedOriginal ? `${accumulatedOriginal} ${orig}` : orig;
        const fullTrans: Record<string, string> = {};
        targetCodes.forEach((code) => {
          const prev = accumulatedTranslations[code] || '';
          const curr = currentTrans[code] || '';
          fullTrans[code] = prev ? `${prev} ${curr}` : curr;
        });

        options.onRecognizing?.(orig, currentTrans, fullOrig, fullTrans);
      }
    };

    recognizer.recognized = (_sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.TranslatedSpeech) {
        const orig = e.result.text || '';
        const phraseTrans: Record<string, string> = {};
        targetCodes.forEach((code) => {
          const t = e.result.translations.get(code);
          if (t) {
            phraseTrans[code] = t;
            accumulatedTranslations[code] = accumulatedTranslations[code]
              ? `${accumulatedTranslations[code]} ${t}`
              : t;
          }
        });

        accumulatedOriginal = accumulatedOriginal ? `${accumulatedOriginal} ${orig}` : orig;
        options.onRecognized?.(orig, phraseTrans, accumulatedOriginal, { ...accumulatedTranslations });
      }
    };

    recognizer.canceled = (_sender, e) => {
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        options.onError?.(`Azure Speech Translation Error: ${e.errorDetails}`);
      }
    };

    return new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => resolve(),
        (err) => {
          this.isRunning = false;
          options.onError?.(String(err));
          reject(err);
        }
      );
    });
  }

  /**
   * Stop active recognition
   */
  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.speechRecognizer) {
      const rec = this.speechRecognizer;
      this.speechRecognizer = null;
      await new Promise<void>((resolve) => {
        rec.stopContinuousRecognitionAsync(
          () => {
            rec.close();
            resolve();
          },
          () => {
            rec.close();
            resolve();
          }
        );
      });
    }

    if (this.translationRecognizer) {
      const rec = this.translationRecognizer;
      this.translationRecognizer = null;
      await new Promise<void>((resolve) => {
        rec.stopContinuousRecognitionAsync(
          () => {
            rec.close();
            resolve();
          },
          () => {
            rec.close();
            resolve();
          }
        );
      });
    }
  }
}
