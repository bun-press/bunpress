import { useState, useEffect, useCallback } from 'react';

type TranslationFunction = (key: string, params?: Record<string, string>) => string;
type TranslationsObject = Record<string, any>;

interface TranslationHook {
  t: TranslationFunction;
  locale: string;
  setLocale: (locale: string) => void;
  isLoaded: boolean;
  error: string | null;
}

/**
 * React hook for i18n functionality in components
 * @param initialLocale - The initial locale to use
 * @param translationsPath - Path to the translations directory
 */
export function useTranslation(
  initialLocale: string = 'en',
  translationsPath: string = '/i18n'
): TranslationHook {
  const [locale, setLocale] = useState(initialLocale);
  const [translations, setTranslations] = useState<TranslationsObject>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect browser language on initial load if no locale specified
  useEffect(() => {
    if (initialLocale === 'auto' && typeof window !== 'undefined') {
      const browserLocale = 
        window.navigator.language?.split('-')[0] || 
        window.navigator.languages?.[0]?.split('-')[0] || 
        'en';
      setLocale(browserLocale);
    }
  }, [initialLocale]);

  // Load translations whenever the locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoaded(false);
        setError(null);
        
        // Try to load the translations for the current locale
        const response = await fetch(`${translationsPath}/${locale}.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${locale}`);
        }
        
        const data = await response.json();
        setTranslations(data);
        setIsLoaded(true);
        
        // Store the current locale in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('locale', locale);
        }
      } catch (err) {
        console.error('Error loading translations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load translations');
        
        // Fallback to English if translations fail to load
        if (locale !== 'en') {
          console.log('Falling back to English translations');
          setLocale('en');
        } else {
          // If even English fails, use an empty object
          setTranslations({});
          setIsLoaded(true);
        }
      }
    };
    
    loadTranslations();
  }, [locale, translationsPath]);

  // Translation function
  const t: TranslationFunction = useCallback((key: string, params?: Record<string, string>) => {
    // Split the key by dots to access nested properties
    const keys = key.split('.');
    
    // Find the translation by traversing the nested object
    let translation: any = translations;
    for (const k of keys) {
      translation = translation?.[k];
      if (translation === undefined) break;
    }
    
    // If no translation found, return the key
    if (!translation) {
      return key;
    }
    
    // Replace params if provided
    if (params && typeof translation === 'string') {
      return Object.entries(params).reduce(
        (result, [paramKey, paramValue]) => 
          result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue),
        translation
      );
    }
    
    return translation;
  }, [translations]);

  return {
    t,
    locale,
    setLocale,
    isLoaded,
    error
  };
} 