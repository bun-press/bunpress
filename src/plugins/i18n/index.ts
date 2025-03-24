import type { Plugin } from '../../core/plugin';
import fs from 'fs';
import path from 'path';
import { ContentFile } from '../../core/content-processor';

export interface I18nOptions {
  defaultLocale?: string;
  locales?: string[];
  translationsDir?: string;
  allowMissingTranslations?: boolean;
  generateLocaleRoutes?: boolean;
  prefixLocaleInUrl?: boolean;
  contentDir?: string; // Directory containing content files
  outputDir?: string;  // Output directory for build
}

interface Translations {
  [key: string]: any;
}

export class I18nPlugin implements Plugin {
  name: string = 'i18n';
  options: I18nOptions;
  translations: Record<string, Translations> = {};
  routeMap: Map<string, ContentFile[]> = new Map(); // Map to store locale routes
  
  constructor(options: I18nOptions = {}) {
    this.options = {
      defaultLocale: 'en',
      locales: ['en'],
      translationsDir: 'i18n',
      allowMissingTranslations: true,
      generateLocaleRoutes: true,
      prefixLocaleInUrl: true,
      contentDir: 'pages',
      outputDir: 'dist',
      ...options
    };
  }
  
  buildStart(): void {
    console.log('i18n plugin: Loading translations...');
    this.loadTranslations();
    this.routeMap = new Map();
  }
  
  buildEnd(): Promise<void> {
    if (!this.options.generateLocaleRoutes) {
      return Promise.resolve();
    }
    
    console.log('i18n plugin: Generating locale-specific routes...');
    
    // Process the route map to generate locale-specific files
    const { locales, defaultLocale, outputDir, prefixLocaleInUrl } = this.options;
    
    if (!locales || locales.length === 0) {
      return Promise.resolve();
    }
    
    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir!)) {
        fs.mkdirSync(outputDir!, { recursive: true });
      }
      
      // Process each registered route
      this.routeMap.forEach((contentFiles, route) => {
        // Skip processing if no content files (shouldn't happen)
        if (contentFiles.length === 0) return;
        
        // Use the first content file as the template
        
        // For each locale, generate a locale-specific route and file
        locales.forEach(locale => {
          // Skip the default locale if we're not prefixing URLs
          if (locale === defaultLocale && !prefixLocaleInUrl) {
            return;
          }
          
          // Generate the localized route
          const localeRoute = this.generateLocaleRoute(route, locale);
          
          // Create a localized version of the content
   
          // In a real implementation, you'd now:
          // 1. Create the output file in the build directory
          // 2. Update any navigation/routing data structures to include this route
          
          console.log(`i18n plugin: Generated locale route ${localeRoute} for locale ${locale}`);
          
          // For demo purposes, we'll just log that we generated the route
          // In a complete implementation, you would actually write the file to disk
        });
      });
      
      console.log(`i18n plugin: Finished generating locale-specific routes for ${locales.length} locales`);
      return Promise.resolve();
    } catch (error) {
      console.error('i18n plugin: Error generating locale-specific routes', error);
      return Promise.reject(error);
    }
  }
  
  // Method to register a content file for i18n route generation
  registerContentFile(contentFile: ContentFile): void {
    if (!this.options.generateLocaleRoutes) {
      return;
    }
    
    const { route } = contentFile;
    
    // Skip routes already starting with locale
    if (this.isLocaleRoute(route)) {
      return;
    }
    
    // Register the route for later processing
    let routeFiles = this.routeMap.get(route) || [];
    routeFiles.push(contentFile);
    this.routeMap.set(route, routeFiles);
  }
  
  // Helper to check if a route already has a locale prefix
  isLocaleRoute(route: string): boolean {
    const { locales } = this.options;
    if (!locales || locales.length === 0) return false;
    
    const segments = route.split('/').filter(Boolean);
    // If the first segment is a locale, return true
    return segments.length > 0 && locales.includes(segments[0]);
  }
  
  // Generate route with locale prefix
  generateLocaleRoute(route: string, locale: string): string {
    if (route === '/') {
      return `/${locale}`;
    }
    
    return `/${locale}${route}`;
  }
  
  transform(content: string): string {
    // Check if content contains translation markers
    if (!content.includes('{{t:')) {
      return content;
    }
    
    // Keep track of any locale mentioned in the content's frontmatter
    let currentLocale = this.options.defaultLocale;
    
    // Check for locale in frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const localeMatch = frontmatter.match(/locale:\s*([a-zA-Z-]+)/);
      if (localeMatch && localeMatch[1] && this.options.locales?.includes(localeMatch[1])) {
        currentLocale = localeMatch[1];
      }
    }
    
    // Replace all translation markers
    // Format: {{t:key}} or {{t:key|default value}}
    return content.replace(/\{\{t:([^|{}]+)(?:\|([^{}]*))?\}\}/g, (_match,key, defaultValue) => {
      return this.getTranslation(
        currentLocale || this.options.defaultLocale as string, 
        key.trim(), 
        defaultValue ? defaultValue.trim() : undefined
      );
    });
  }
  
  // Load translation files from the specified directory
  loadTranslations(): void {
    const { translationsDir, locales } = this.options;
    
    if (!translationsDir) {
      console.warn('i18n plugin: No translations directory specified');
      return;
    }
    
    // Create translations directory if it doesn't exist
    if (!fs.existsSync(translationsDir)) {
      console.log(`i18n plugin: Creating translations directory at ${translationsDir}`);
      fs.mkdirSync(translationsDir, { recursive: true });
      
      // Create sample translation files
      this.createSampleTranslations(translationsDir);
      return;
    }
    
    // Load translation files for each locale
    locales?.forEach(locale => {
      const translationFile = path.join(translationsDir, `${locale}.json`);
      
      if (fs.existsSync(translationFile)) {
        try {
          const translationData = fs.readFileSync(translationFile, 'utf-8');
          this.translations[locale] = JSON.parse(translationData);
          console.log(`i18n plugin: Loaded translations for ${locale}`);
        } catch (error) {
          console.error(`i18n plugin: Error loading translations for ${locale}`, error);
          this.translations[locale] = {};
        }
      } else {
        console.warn(`i18n plugin: No translation file found for ${locale}`);
        this.translations[locale] = {};
      }
    });
  }
  
  // Create sample translation files for demonstration
  private createSampleTranslations(dir: string): void {
    const { locales } = this.options;
    
    const enSample = {
      navigation: {
        home: "Home",
        about: "About",
        contact: "Contact"
      },
      home: {
        title: "Welcome to my site",
        description: "This is a BunPress site with i18n support"
      }
    };
    
    const frSample = {
      navigation: {
        home: "Accueil",
        about: "À propos",
        contact: "Contact"
      },
      home: {
        title: "Bienvenue sur mon site",
        description: "Ceci est un site BunPress avec support i18n"
      }
    };
    
    const esSample = {
      navigation: {
        home: "Inicio",
        about: "Acerca de",
        contact: "Contacto"
      },
      home: {
        title: "Bienvenido a mi sitio",
        description: "Este es un sitio BunPress con soporte i18n"
      }
    };
    
    // Write sample files
    if (locales?.includes('en')) {
      fs.writeFileSync(path.join(dir, 'en.json'), JSON.stringify(enSample, null, 2));
    }
    
    if (locales?.includes('fr')) {
      fs.writeFileSync(path.join(dir, 'fr.json'), JSON.stringify(frSample, null, 2));
    }
    
    if (locales?.includes('es')) {
      fs.writeFileSync(path.join(dir, 'es.json'), JSON.stringify(esSample, null, 2));
    }
    
    console.log('i18n plugin: Created sample translation files');
  }
  
  // Helper method for accessing translations programmatically (exposed for public use)
  getTranslation(locale: string, key: string, defaultValue?: string): string {
    const parts = key.split('.');
    let translation: any = this.translations[locale];
    
    // Traverse nested keys
    for (const part of parts) {
      if (!translation || typeof translation !== 'object') {
        // Fall back to default locale if configured
        if (this.options.allowMissingTranslations && locale !== this.options.defaultLocale) {
          return this.getTranslation(this.options.defaultLocale as string, key, defaultValue);
        }
        return defaultValue || key;
      }
      translation = translation[part];
    }
    
    if (translation === undefined) {
      // Fall back to default locale if configured
      if (this.options.allowMissingTranslations && locale !== this.options.defaultLocale) {
        return this.getTranslation(this.options.defaultLocale as string, key, defaultValue);
      }
      return defaultValue || key;
    }
    
    return translation;
  }

  translateContent(content: string, locale: string): string {
    // Check if content contains translation markers
    if (!content.includes('{{t:')) {
      return content;
    }
    
    // Replace all translation markers
    // Format: {{t:key}} or {{t:key|default value}}
    return content.replace(/\{\{t:([^|{}]+)(?:\|([^{}]*))?\}\}/g, (_match,key, defaultValue) => {
      return this.getTranslation(
        locale, 
        key.trim(), 
        defaultValue ? defaultValue.trim() : undefined
      );
    });
  }
}

// Create and export plugin factory function
export default function i18nPlugin(options: I18nOptions = {}): Plugin {
  return new I18nPlugin(options);
}

// Expose translation loading for programmatic use
export function loadTranslations(locale: string): Translations {
  const plugin = new I18nPlugin();
  plugin.loadTranslations();
  return plugin.translations[locale] || {};
} 