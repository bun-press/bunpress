import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Check } from 'lucide-react';
import { cn } from '@bunpress/lib/utils';

export interface Language {
  code: string;
  name: string;
  flag?: string;
}

interface LanguageSelectorProps {
  currentLocale: string;
  availableLocales?: Language[];
  onLocaleChange?: (locale: string) => void;
}

// Default languages
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export function LanguageSelector({
  currentLocale = 'en',
  availableLocales,
  onLocaleChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [currentPath, setCurrentPath] = useState('');

  // Detect whether we're on client side
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set up languages and current path
  useEffect(() => {
    // Use available locales or default to English only if array is empty
    setLanguages(availableLocales && availableLocales.length > 0 ? availableLocales : DEFAULT_LANGUAGES);
    
    // Get current path for language switching
    const path = window.location.pathname;
    setCurrentPath(path);
  }, [availableLocales]);

  // Handle language change
  const handleLanguageChange = (locale: string) => {
    // Call the provided callback if it exists
    if (onLocaleChange) {
      onLocaleChange(locale);
    } else {
      // Default behavior: redirect to the same page in the new locale
      // First, check if we're already in a localized route
      const pathParts = currentPath.split('/').filter(Boolean);
      
      // If first part is a locale, replace it
      const isCurrentPathLocalized = languages.some(lang => pathParts[0] === lang.code);
      
      let newPath;
      if (isCurrentPathLocalized) {
        // Replace current locale with new one
        pathParts[0] = locale;
        newPath = '/' + pathParts.join('/');
      } else if (locale !== 'en') {
        // Add locale prefix for non-default language
        newPath = '/' + locale + currentPath;
      } else {
        // Keep path as is for default language (English)
        newPath = currentPath;
      }
      
      // Navigate to new path
      window.location.href = newPath;
    }
    
    // Close the dialog
    setIsOpen(false);
  };

  // If not on client side, just show the current language name
  if (!isClient) {
    const defaultLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];
    return (
      <div className="language-selector">
        <span>{defaultLanguage.name}</span>
      </div>
    );
  }

  // Find current language object
  const defaultLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <div className="language-selector">
      <Button
        variant="ghost"
        className="flex items-center gap-1 px-2 py-1"
        onClick={() => setIsOpen(true)}
      >
        <span>{defaultLanguage.name}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 8.5L1.5 4L2.55 2.95L6 6.4L9.45 2.95L10.5 4L6 8.5Z"
            fill="currentColor"
          />
        </svg>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Change Language</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-1 gap-2">
              {languages.map((language) => (
                <Button
                  key={language.code}
                  variant="ghost"
                  className={cn(
                    "flex justify-start items-center gap-3 px-4 py-3 w-full text-left",
                    language.code === currentLocale && "bg-accent"
                  )}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <span className="text-base mr-1">{language.flag}</span>
                  <span className="flex-1">{language.name}</span>
                  {language.code === currentLocale && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 