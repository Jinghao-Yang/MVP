/**
 * i18n Configuration
 * Internationalization setup for Axiom Planner
 */

import { en, type Translations } from './locales/en';

// Available languages
export const languages = {
  en: 'English',
  // Add more languages here as needed:
  // zh: '中文',
  // ja: '日本語',
  // etc.
} as const;

export type LanguageCode = keyof typeof languages;

// Current language (can be extended to use a store or localStorage)
let currentLanguage: LanguageCode = 'en';

// Translation resources
const translations: Record<LanguageCode, Translations> = {
  en,
  // Add more language resources here
};

/**
 * Get the current language code
 */
export function getCurrentLanguage(): LanguageCode {
  return currentLanguage;
}

/**
 * Set the current language
 */
export function setCurrentLanguage(lang: LanguageCode): void {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    console.warn(`Language "${lang}" is not available. Falling back to "en".`);
    currentLanguage = 'en';
  }
}

/**
 * Get translations for the current language
 */
export function getTranslations(): Translations {
  return translations[currentLanguage] || translations.en;
}

/**
 * Get a translation by key path
 * Supports nested keys like 'sidebar.brandName'
 *
 * @example
 * t('sidebar.brandName') // returns 'AXIOM'
 * t('common.loading') // returns 'Loading...'
 */
export function t(keyPath: string, params?: Record<string, string | number>): string {
  const keys = keyPath.split('.');
  let value: unknown = getTranslations();

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation key "${keyPath}" not found`);
      return keyPath;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation key "${keyPath}" is not a string`);
    return keyPath;
  }

  // Replace parameters like {name} with actual values
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() ?? match;
    });
  }

  return value;
}

/**
 * Type-safe translation function
 * Provides autocomplete for translation keys
 */
export type TranslationKey = RecursiveKeyOf<Translations>;

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & string]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & string];

// Export translations and types
export { en, type Translations };

// Default export
export default {
  languages,
  getCurrentLanguage,
  setCurrentLanguage,
  getTranslations,
  t,
};
