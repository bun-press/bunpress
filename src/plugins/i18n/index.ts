import type { Plugin } from '../../core/plugin';
import type { ContentFile } from '../../core/content-processor';

export interface I18nOptions {
  defaultLocale?: string;
  locales?: string[];
  translationsDir?: string;
  allowMissingTranslations?: boolean;
  generateLocaleRoutes?: boolean;
  prefixLocaleInUrl?: boolean;
}

// Simple stub implementation to be expanded later
export default function i18nPlugin(options: I18nOptions = {}): Plugin {
  return {
    name: 'i18n',
    options,
    
    buildStart(): void {
      console.log('i18n plugin: Implementation in progress');
    },
    
    transform(content: string): string {
      // Placeholder - will be implemented fully according to README.md
      return content;
    }
  };
} 