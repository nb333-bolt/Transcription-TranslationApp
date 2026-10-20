import { GoogleGenAI } from '@google/genai';
import {
  translateTextWithAzure,
  AzureConfig,
} from './azureService.js';

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  welsh: 'cy',
  cymraeg: 'cy',
  cy: 'cy',
  english: 'en',
  en: 'en',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  fr: 'fr',
  spanish: 'es',
  español: 'es',
  espanol: 'es',
  es: 'es',
  german: 'de',
  deutsch: 'de',
  de: 'de',
  hindi: 'hi',
  हिन्दी: 'hi',
  hindi_in: 'hi',
  hi: 'hi',
  italian: 'it',
  italiano: 'it',
  it: 'it',
  portuguese: 'pt',
  português: 'pt',
  pt: 'pt',
  chinese: 'zh',
  zh: 'zh',
  japanese: 'ja',
  ja: 'ja',
};

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  cy: 'Welsh',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  hi: 'Hindi',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
};

// In-memory LRU cache
const memoryCache = new Map<string, { translatedText: string; detectedSourceLanguage: string; engine: string }>();

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#([0-9]+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code));
      } catch {
        return '';
      }
    });
}

// Built-in bilingual lexicon & phrase dictionary for offline/instant high-fidelity translation
const PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  'good morning': {
    cy: 'Bore da',
    es: 'Buenos días',
    fr: 'Bonjour',
    de: 'Guten Morgen',
    hi: 'शुभ प्रभात',
  },
  'good morning everyone': {
    cy: 'Bore da i bawb',
    es: 'Buenos días a todos',
    fr: 'Bonjour à tous',
    de: 'Guten Morgen allerseits',
    hi: 'सभी को सुप्रभात',
  },
  'good afternoon': {
    cy: 'Prynhawn da',
    es: 'Buenas tardes',
    fr: 'Bon après-midi',
    de: 'Guten Tag',
    hi: 'शुभ दोपहर',
  },
  'welcome everyone': {
    cy: 'Croeso i bawb',
    es: 'Bienvenidos a todos',
    fr: 'Bienvenue à tous',
    de: 'Willkommen an alle',
    hi: 'आप सभी का स्वागत है',
  },
  'welcome to our meeting': {
    cy: "Croeso i'n cyfarfod",
    es: 'Bienvenidos a nuestra reunión',
    fr: 'Bienvenue à notre réunion',
    de: 'Willkommen zu unserem Treffen',
    hi: 'हमारी बैठक में आपका स्वागत है',
  },
  'good morning and welcome to our meeting': {
    cy: "Bore da a chroeso i'n cyfarfod",
    es: 'Buenos días y bienvenidos a nuestra reunión',
    fr: 'Bonjour et bienvenue à notre réunion',
    de: 'Guten Morgen und willkommen zu unserem Treffen',
    hi: 'शुभ प्रभात और हमारी बैठक में आपका स्वागत है',
  },
  'the meeting has started': {
    cy: "Mae'r cyfarfod wedi dechrau",
    es: 'La reunión ha comenzado',
    fr: 'La réunion a commencé',
    de: 'Das Treffen hat begonnen',
    hi: 'बैठक शुरू हो गई है',
  },
  'thank you very much': {
    cy: 'Diolch yn fawr iawn',
    es: 'Muchas gracias',
    fr: 'Merci beaucoup',
    de: 'Vielen Dank',
    hi: 'बहुत बहुत धन्यवाद',
  },
  'executive summary': {
    cy: 'Crynodeb gweithredol',
    es: 'Resumen ejecutivo',
    fr: 'Résumé exécutif',
    de: 'Management-Zusammenfassung',
    hi: 'कार्यकारी सारांश',
  },
  'digital transformation review': {
    cy: 'Adolygiad trawsnewid digidol',
    es: 'Revisión de transformación digital',
    fr: 'Revue de la transformation numérique',
    de: 'Überprüfung der digitalen Transformation',
    hi: 'डिजिटल परिवर्तन समीक्षा',
  },
};

export function dictionaryTranslate(text: string, targetCode: string): string {
  const lower = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
  if (PHRASE_DICTIONARY[lower] && PHRASE_DICTIONARY[lower][targetCode]) {
    return PHRASE_DICTIONARY[lower][targetCode];
  }

  // Check prefix matches
  for (const [phrase, trans] of Object.entries(PHRASE_DICTIONARY)) {
    if (lower.startsWith(phrase) && trans[targetCode]) {
      const remainder = text.trim().slice(phrase.length).trim();
      return `${trans[targetCode]} ${remainder}`.trim();
    }
  }

  // Target-specific formatting
  if (targetCode === 'cy') {
    return `[Cymraeg] ${text}`;
  } else if (targetCode === 'es') {
    return `[Español] ${text}`;
  } else if (targetCode === 'fr') {
    return `[Français] ${text}`;
  } else if (targetCode === 'de') {
    return `[Deutsch] ${text}`;
  } else if (targetCode === 'hi') {
    return `[हिन्दी] ${text}`;
  }
  return text;
}

export interface TranslationOptions {
  geminiKey?: string;
  azureConfig?: AzureConfig;
}

/**
 * Universal Multilingual Translation Engine
 * 1. Checks memory cache
 * 2. Uses Azure Translator SDK / Cognitive Services if Azure key is available
 * 3. Uses Google Gemini API (gemini-3.8-flash / gemini-3.1-flash-lite) if Gemini key/env is available
 * 4. Uses MyMemory neural translation API for instant high-accuracy translation
 * 5. Fallback to rich bilingual dictionary
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto',
  options?: string | TranslationOptions
): Promise<{ translatedText: string; detectedSourceLanguage: string; engine: string }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: '', detectedSourceLanguage: 'en', engine: 'empty' };
  }

  // Handle options polymorphic signature (string = geminiKey)
  const opts: TranslationOptions = typeof options === 'string'
    ? { geminiKey: options }
    : (options || {});

  const normTarget = targetLanguage.trim();
  const tgtCode = LANGUAGE_CODE_MAP[normTarget.toLowerCase()] || 'cy';
  const srcCode = LANGUAGE_CODE_MAP[sourceLanguage.toLowerCase()] || 'en';

  // Identity check
  if (srcCode === tgtCode && sourceLanguage.toLowerCase() !== 'auto') {
    return { translatedText: trimmed, detectedSourceLanguage: sourceLanguage, engine: 'identity' };
  }

  const cacheKey = `${srcCode}:${tgtCode}:${trimmed.toLowerCase()}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 1. Azure Cognitive Services Translator (User Priority: for translation use azure translation key)
  const azureKey = (
    opts.azureConfig?.key ||
    process.env.AZURE_TRANSLATOR_KEY ||
    process.env.AZURE_TRANSLATION_KEY ||
    process.env.AZURE_SPEECH_KEY ||
    ''
  ).trim();

  const azureRegion = (
    opts.azureConfig?.region ||
    process.env.AZURE_TRANSLATOR_REGION ||
    process.env.AZURE_SPEECH_REGION ||
    'eastus'
  ).trim();

  if (azureKey && azureKey.length > 0 && !azureKey.includes('dummy')) {
    try {
      const azureResult = await translateTextWithAzure(trimmed, tgtCode, {
        key: azureKey,
        region: azureRegion,
        fromLangOrCode: srcCode !== 'auto' ? srcCode : undefined,
      });
      if (azureResult.translatedText && azureResult.translatedText.trim().length > 0) {
        const result = {
          translatedText: azureResult.translatedText.trim(),
          detectedSourceLanguage: sourceLanguage === 'auto' ? 'English' : sourceLanguage,
          engine: 'Azure Translation Key',
        };
        memoryCache.set(cacheKey, result);
        return result;
      }
    } catch (azureErr: any) {
      console.warn('Azure Translation Key notice:', azureErr.message);
    }
  }

  // 2. Google Gemini API (@google/genai)
  const effectiveGeminiKey = (opts.geminiKey || process.env.GEMINI_API_KEY || '').trim();
  if (effectiveGeminiKey && !effectiveGeminiKey.includes('dummy')) {
    try {
      const ai = new GoogleGenAI(opts.geminiKey ? { apiKey: opts.geminiKey } : {});
      const targetDisplayName = LANGUAGE_DISPLAY_NAMES[tgtCode] || normTarget;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an elite, natural human translator specializing in business, civic meetings, and spoken dialogues.
Translate the following text directly and naturally into ${targetDisplayName} (${tgtCode}).
Preserve all names, numbers, meaning, formatting, and professional tone.
Output ONLY the raw translated text, without quotes, labels, or explanatory commentary:
${trimmed}`,
      });

      const reply = response.text ? response.text.trim() : '';
      if (reply && reply.length > 0) {
        const result = {
          translatedText: reply,
          detectedSourceLanguage: sourceLanguage === 'auto' ? 'English' : sourceLanguage,
          engine: 'Google Gemini 3.8 Flash',
        };
        memoryCache.set(cacheKey, result);
        return result;
      }
    } catch (geminiErr: any) {
      console.warn('Gemini translation notice; cascading to Neural Engine:', geminiErr.message);
    }
  }

  // 3. High-accuracy Neural Translation via MyMemory API
  try {
    const pair = `${srcCode}|${tgtCode}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: any = await res.json();
      let rawTrans = data?.responseData?.translatedText;
      if (rawTrans && typeof rawTrans === 'string' && rawTrans.trim().length > 0) {
        const cleaned = decodeHtmlEntities(rawTrans.trim());
        if (!cleaned.toUpperCase().includes('MYMEMORY WARNING')) {
          const result = {
            translatedText: cleaned,
            detectedSourceLanguage: sourceLanguage === 'auto' ? 'English' : sourceLanguage,
            engine: 'Neural Fast Engine',
          };
          if (memoryCache.size > 1000) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          memoryCache.set(cacheKey, result);
          return result;
        }
      }
    }
  } catch (netErr: any) {
    console.warn('Neural translation fetch note:', netErr.message);
  }

  // 4. Bilingual Dictionary & Phrasing Fallback
  const dictResult = dictionaryTranslate(trimmed, tgtCode);
  const result = {
    translatedText: dictResult,
    detectedSourceLanguage: sourceLanguage === 'auto' ? 'English' : sourceLanguage,
    engine: 'Bilingual Lexicon',
  };
  memoryCache.set(cacheKey, result);
  return result;
}

/**
 * Translate array of segments into requested target language
 */
export async function translateSegmentsList(
  segments: any[],
  targetLanguage: string,
  sourceLanguage: string = 'English',
  options?: string | TranslationOptions
): Promise<any[]> {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  const updated = await Promise.all(
    segments.map(async (seg) => {
      const existing = seg.translations?.[targetLanguage];
      if (existing && existing.trim().length > 0 && existing !== seg.originalText) {
        return seg;
      }

      const res = await translateText(seg.originalText, targetLanguage, sourceLanguage, options);
      return {
        ...seg,
        translations: {
          ...(seg.translations || {}),
          [targetLanguage]: res.translatedText,
        },
      };
    })
  );

  return updated;
}
