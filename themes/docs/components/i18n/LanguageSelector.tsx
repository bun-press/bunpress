import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Check, Globe } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Recreate the cn utility function locally to avoid import issues
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export interface Language {
  code: string;
  name: string;
  flag?: string;
}

interface LanguageSelectorProps {
  currentLocale: string;
  availableLocales?: Language[];
  onLocaleChange?: (locale: string) => void;
  className?: string;
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
  className
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentPath, setCurrentPath] = useState('');

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn("h-9 w-9 rounded-full", className)}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
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
    </>
  );
} 