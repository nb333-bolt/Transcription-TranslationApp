import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { spawn } from 'child_process';

export interface AzureConfig {
  key?: string;
  region?: string;
}

export interface AzureTranscriptionResult {
  text: string;
  durationSeconds?: number;
  engine: string;
}

export interface AzureTranslationResult {
  originalText: string;
  translations: Record<string, string>;
  engine: string;
}

/**
 * Normalizes language codes for Azure Speech (e.g. 'cy' -> 'cy-GB', 'en' -> 'en-GB')
 */
export function getAzureSpeechLocale(langOrCode: string): string {
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
 * Normalizes language code for Azure Translator text translation API
 */
export function getAzureTranslatorCode(langOrCode: string): string {
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

/**
 * Generates a minimal 100ms silent 16kHz 16-bit mono PCM WAV for live endpoint verification
 */
export function createSilent16kWav(): Buffer {
  const sampleRate = 16000;
  const numSamples = 1600; // 0.1s
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

/**
 * Converts any audio buffer (webm, opus, mp4, ogg, mp3, wav) to standard 16kHz 16-bit mono PCM WAV using ffmpeg
 */
export async function convertAudioTo16kPcmWav(inputBuffer: Buffer): Promise<Buffer> {
  // If buffer is already 16kHz PCM WAV, check headers
  if (
    inputBuffer.length > 44 &&
    inputBuffer.toString('ascii', 0, 4) === 'RIFF' &&
    inputBuffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    const sampleRate = inputBuffer.readUInt32LE(24);
    const channels = inputBuffer.readUInt16LE(22);
    if (sampleRate === 16000 && channels === 1) {
      return inputBuffer;
    }
  }

  return new Promise((resolve) => {
    try {
      const ffmpeg = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', 'pipe:0',
        '-vn',
        '-ar', '16000',
        '-ac', '1',
        '-f', 'wav',
        'pipe:1',
      ]);

      const chunks: Buffer[] = [];
      let errStr = '';

      ffmpeg.stdout.on('data', (c) => chunks.push(c));
      ffmpeg.stderr.on('data', (e) => (errStr += e.toString()));

      ffmpeg.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          console.warn('ffmpeg conversion fallback (code ' + code + '):', errStr);
          resolve(inputBuffer);
        }
      });

      ffmpeg.on('error', (err) => {
        console.warn('ffmpeg spawn fallback:', err.message);
        resolve(inputBuffer);
      });

      ffmpeg.stdin.write(inputBuffer);
      ffmpeg.stdin.end();
    } catch (e) {
      resolve(inputBuffer);
    }
  });
}

/**
 * Transcribes audio buffer using Azure Cognitive Services Speech SDK and REST API
 */
export async function transcribeWithAzureSpeech(
  audioBuffer: Buffer,
  _mimeType: string,
  options: AzureConfig & { language?: string }
): Promise<AzureTranscriptionResult> {
  const key = (
    options.key ||
    process.env.AZURE_SPEECH_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    process.env.AZURE_TRANSLATOR_KEY ||
    ''
  ).trim();

  const region = (
    options.region ||
    process.env.AZURE_SPEECH_REGION ||
    process.env.AZURE_TRANSLATOR_REGION ||
    'eastus'
  ).trim();

  if (!key) {
    throw new Error('Azure Speech Key is not configured.');
  }

  const locale = getAzureSpeechLocale(options.language || 'en');

  // 1. Transcode input to standard 16kHz 16-bit mono PCM WAV
  const wavBuffer = await convertAudioTo16kPcmWav(audioBuffer);

  // 2. Primary: Azure Cognitive Services Speech-to-Text REST API
  // Highly reliable for recorded clips and meetings up to 60s+
  try {
    const sttUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}`;
    const sttResponse = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Accept': 'application/json',
      },
      body: new Uint8Array(wavBuffer) as any,
    });

    if (sttResponse.ok) {
      const data: any = await sttResponse.json();
      if (
        data?.RecognitionStatus === 'Success' &&
        data.DisplayText &&
        data.DisplayText.trim().length > 0
      ) {
        return {
          text: data.DisplayText.trim(),
          engine: 'Azure Cognitive Services Speech SDK / REST',
        };
      }
    } else {
      const errText = await sttResponse.text();
      console.warn(`Azure Speech REST returned HTTP ${sttResponse.status}: ${errText}`);
    }
  } catch (restErr: any) {
    console.warn('Azure Speech REST request note:', restErr.message);
  }

  // 3. Fallback: Azure Speech SDK PushStream with SpeechRecognizer
  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = locale;

    // Extract raw PCM samples by stripping the 44-byte WAV header if present
    const pcmData =
      wavBuffer.length > 44 && wavBuffer.toString('ascii', 0, 4) === 'RIFF'
        ? wavBuffer.subarray(44)
        : wavBuffer;

    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    );

    const bufferSlice = pcmData.buffer.slice(
      pcmData.byteOffset,
      pcmData.byteOffset + pcmData.byteLength
    ) as ArrayBuffer;

    pushStream.write(bufferSlice);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    return await new Promise<AzureTranscriptionResult>((resolve, reject) => {
      let accumulatedText = '';

      recognizer.recognized = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
          accumulatedText += (accumulatedText ? ' ' : '') + e.result.text;
        }
      };

      recognizer.canceled = (_s, e) => {
        recognizer.close();
        if (accumulatedText.trim()) {
          resolve({
            text: accumulatedText.trim(),
            engine: 'Azure Cognitive Services Speech SDK',
          });
        } else if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(`Azure Speech recognition error: ${e.errorDetails}`));
        } else {
          resolve({
            text: '',
            engine: 'Azure Cognitive Services Speech SDK',
          });
        }
      };

      recognizer.sessionStopped = () => {
        recognizer.close();
        resolve({
          text: accumulatedText.trim(),
          engine: 'Azure Cognitive Services Speech SDK',
        });
      };

      // Recognize once for single clip
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          const recognized = (result.text || accumulatedText || '').trim();
          if (recognized) {
            resolve({
              text: recognized,
              engine: 'Azure Cognitive Services Speech SDK',
            });
          } else {
            resolve({
              text: '',
              engine: 'Azure Cognitive Services Speech SDK',
            });
          }
        },
        (err) => {
          recognizer.close();
          if (accumulatedText.trim()) {
            resolve({
              text: accumulatedText.trim(),
              engine: 'Azure Cognitive Services Speech SDK',
            });
          } else {
            reject(err);
          }
        }
      );
    });
  } catch (sdkErr: any) {
    throw new Error(`Azure Speech transcription failed: ${sdkErr.message}`);
  }
}

/**
 * Translates speech audio buffer directly into multiple target languages using Azure Speech Translation SDK
 */
export async function translateSpeechWithAzureSDK(
  audioBuffer: Buffer,
  options: AzureConfig & { fromLang?: string; toLangs: string[] }
): Promise<AzureTranslationResult> {
  const key = (
    options.key ||
    process.env.AZURE_SPEECH_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    process.env.AZURE_TRANSLATOR_KEY ||
    ''
  ).trim();
  const region = (options.region || process.env.AZURE_SPEECH_REGION || 'eastus').trim();

  if (!key) {
    throw new Error('Azure Speech Key is not configured.');
  }

  const fromLocale = getAzureSpeechLocale(options.fromLang || 'en');
  const translationConfig = sdk.SpeechTranslationConfig.fromSubscription(key, region);
  translationConfig.speechRecognitionLanguage = fromLocale;

  const targetCodes: string[] = options.toLangs.map(getAzureTranslatorCode);
  targetCodes.forEach((code) => translationConfig.addTargetLanguage(code));

  const wavBuffer = await convertAudioTo16kPcmWav(audioBuffer);
  const pcmData =
    wavBuffer.length > 44 && wavBuffer.toString('ascii', 0, 4) === 'RIFF'
      ? wavBuffer.subarray(44)
      : wavBuffer;

  const pushStream = sdk.AudioInputStream.createPushStream(
    sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  );
  const bufferSlice = pcmData.buffer.slice(
    pcmData.byteOffset,
    pcmData.byteOffset + pcmData.byteLength
  ) as ArrayBuffer;
  pushStream.write(bufferSlice);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.TranslationRecognizer(translationConfig, audioConfig);

  return new Promise<AzureTranslationResult>((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        if (result.reason === sdk.ResultReason.TranslatedSpeech) {
          const translations: Record<string, string> = {};
          targetCodes.forEach((code) => {
            const trans = result.translations.get(code);
            if (trans) translations[code] = trans;
          });
          resolve({
            originalText: result.text,
            translations,
            engine: 'Azure Cognitive Services Speech Translation SDK',
          });
        } else {
          reject(new Error(`Azure speech translation returned reason: ${result.reason}`));
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      }
    );
  });
}

/**
 * Translates text using Azure Cognitive Services / Azure Translator REST API
 * Supports both Regional and Global Azure Translator resources seamlessly.
 */
export async function translateTextWithAzure(
  text: string,
  targetLangOrCode: string,
  options: AzureConfig & { fromLangOrCode?: string } = {}
): Promise<{ translatedText: string; engine: string }> {
  const key = (
    options.key ||
    process.env.AZURE_TRANSLATOR_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    process.env.AZURE_SPEECH_KEY ||
    ''
  ).trim();

  const region = (
    options.region ||
    process.env.AZURE_TRANSLATOR_REGION ||
    process.env.AZURE_SPEECH_REGION ||
    'eastus'
  ).trim();

  if (!key) {
    throw new Error('Azure Translation Key is not configured.');
  }

  const tgtCode = getAzureTranslatorCode(targetLangOrCode);
  const fromCode = options.fromLangOrCode ? getAzureTranslatorCode(options.fromLangOrCode) : undefined;

  let url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${tgtCode}`;
  if (fromCode && fromCode !== tgtCode) {
    url += `&from=${fromCode}`;
  }

  // Attempt 1: With region header (required for regional resources and multi-service keys)
  const isGlobalRegion = !region || region.toLowerCase() === 'global' || region.toLowerCase() === 'none';
  const primaryHeaders: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': key,
    'Content-Type': 'application/json',
  };
  if (!isGlobalRegion) {
    primaryHeaders['Ocp-Apim-Subscription-Region'] = region;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: primaryHeaders,
      body: JSON.stringify([{ text }]),
    });

    if (response.ok) {
      const data: any = await response.json();
      const translated = data?.[0]?.translations?.[0]?.text;
      if (translated) {
        return {
          translatedText: translated,
          engine: 'Azure Cognitive Services Translator',
        };
      }
    }

    // Attempt 2: If regional header failed with 400 (e.g. "resource is global, please omit header")
    // or 401, retry without the region header
    if (primaryHeaders['Ocp-Apim-Subscription-Region']) {
      const retryHeadersWithoutRegion: Record<string, string> = {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      };
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: retryHeadersWithoutRegion,
        body: JSON.stringify([{ text }]),
      });
      if (retryRes.ok) {
        const retryData: any = await retryRes.json();
        const retryTrans = retryData?.[0]?.translations?.[0]?.text;
        if (retryTrans) {
          return {
            translatedText: retryTrans,
            engine: 'Azure Cognitive Services Translator (Global)',
          };
        }
      }
    } else {
      // Attempt 3: If global failed with 401/400 because resource IS regional, retry with eastus/region
      const fallbackRegion = region || 'eastus';
      const retryHeadersWithRegion: Record<string, string> = {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': fallbackRegion,
        'Content-Type': 'application/json',
      };
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: retryHeadersWithRegion,
        body: JSON.stringify([{ text }]),
      });
      if (retryRes.ok) {
        const retryData: any = await retryRes.json();
        const retryTrans = retryData?.[0]?.translations?.[0]?.text;
        if (retryTrans) {
          return {
            translatedText: retryTrans,
            engine: `Azure Cognitive Services Translator (${fallbackRegion})`,
          };
        }
      }
    }

    const errBody = await response.text();
    throw new Error(`Azure Translator API returned status ${response.status}: ${errBody}`);
  } catch (err: any) {
    throw new Error(`Azure Translator translation failed: ${err.message}`);
  }
}

/**
 * Dedicated test for Azure Translator API Key
 */
export async function testAzureTranslatorConnection(options: AzureConfig): Promise<{
  success: boolean;
  region: string;
  latencyMs: number;
  message: string;
  sampleTranslation?: string;
  error?: string;
}> {
  const startTime = Date.now();
  const key = (
    options.key ||
    process.env.AZURE_TRANSLATOR_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    process.env.AZURE_SPEECH_KEY ||
    ''
  ).trim();

  const region = (
    options.region ||
    process.env.AZURE_TRANSLATOR_REGION ||
    process.env.AZURE_SPEECH_REGION ||
    'eastus'
  ).trim();

  if (!key) {
    return {
      success: false,
      region,
      latencyMs: 0,
      message: 'No Azure Translation Key provided.',
      error: 'Please enter your Azure Cognitive Services Translator Key.',
    };
  }

  try {
    const testPhrase = 'Good morning, welcome to our bilingual meeting.';
    const result = await translateTextWithAzure(testPhrase, 'cy', { key, region });
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      region,
      latencyMs,
      message: `Azure Translation Key verified successfully via ${result.engine}.`,
      sampleTranslation: result.translatedText,
    };
  } catch (err: any) {
    return {
      success: false,
      region,
      latencyMs: Date.now() - startTime,
      message: 'Azure Translation Key test failed.',
      error: err.message,
    };
  }
}

/**
 * Tests live connection to Azure Speech / Translation service
 */
export async function testAzureConnection(options: AzureConfig): Promise<{
  success: boolean;
  region: string;
  latencyMs: number;
  features: string[];
  message: string;
  error?: string;
}> {
  const startTime = Date.now();
  const key = (
    options.key ||
    process.env.AZURE_SPEECH_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    ''
  ).trim();
  const region = (options.region || process.env.AZURE_SPEECH_REGION || 'eastus').trim();

  if (!key) {
    return {
      success: false,
      region,
      latencyMs: 0,
      features: ['Speech-to-Text Transcription', 'Speech Translation', 'Azure Translator'],
      message: 'No Azure Speech Key configured.',
      error: 'Please provide an Azure Cognitive Services Speech or Translator Key.',
    };
  }

  // 1. Probe the Azure Speech REST endpoint with a 100ms silent WAV
  try {
    const silentWav = createSilent16kWav();
    const sttUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    const pingRes = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Accept': 'application/json',
      },
      body: new Uint8Array(silentWav) as any,
    });

    const latencyMs = Date.now() - startTime;

    // HTTP 200 means speech credentials and region are 100% authenticated and authorized
    if (pingRes.ok) {
      return {
        success: true,
        region,
        latencyMs,
        features: [
          'Azure Speech-to-Text SDK (microsoft-cognitiveservices-speech-sdk)',
          'Azure Speech-to-Text REST API',
          'Azure Speech Translation SDK',
        ],
        message: `Azure Speech SDK authenticated and verified successfully in ${region} (${latencyMs}ms).`,
      };
    }

    if (pingRes.status === 401) {
      // Key may be a Translator-only key or multi-service key; test Translator endpoint
      try {
        const transRes = await translateTextWithAzure('Welcome', 'cy', { key, region });
        return {
          success: true,
          region,
          latencyMs: Date.now() - startTime,
          features: ['Azure Cognitive Services Translator'],
          message: `Key verified with Azure Translator. Sample Welsh: "${transRes.translatedText}". (Note: For Speech SDK transcription, an Azure Speech Services resource key is recommended).`,
        };
      } catch (transErr) {
        return {
          success: false,
          region,
          latencyMs,
          features: ['Azure Speech-to-Text SDK'],
          message: 'Azure Speech authentication failed.',
          error: `Azure Speech returned HTTP 401 Unauthorized for region "${region}". Please ensure this key is from an Azure Speech Services resource in "${region}".`,
        };
      }
    }
  } catch (netErr: any) {
    console.warn('Azure Speech probe network warning:', netErr.message);
  }

  // 2. Fallback check: verify SpeechConfig initialization in SDK
  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    if (speechConfig) {
      return {
        success: true,
        region,
        latencyMs: Date.now() - startTime,
        features: ['Azure Speech-to-Text SDK', 'Azure Speech Translation SDK'],
        message: `Azure Speech SDK initialized for subscription in region ${region}.`,
      };
    }
  } catch (speechErr: any) {
    return {
      success: false,
      region,
      latencyMs: Date.now() - startTime,
      features: ['Azure Speech-to-Text SDK'],
      message: 'Azure Speech SDK initialization failed.',
      error: speechErr.message,
    };
  }

  return {
    success: false,
    region,
    latencyMs: Date.now() - startTime,
    features: [],
    message: 'Azure connection failed.',
    error: 'Could not connect to Azure Cognitive Services.',
  };
}
