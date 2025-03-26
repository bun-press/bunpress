import * as fs from 'fs';
import * as path from 'path';

export interface TranslationOptions {
  defaultLocale: string;
  locales: string[];
  translationsDir: string;
  allowMissingTranslations?: boolean;
  generateLocaleRoutes?: boolean;
  prefixLocaleInUrl?: boolean;
  contentDir?: string;
  outputDir?: string;
}

interface ContentFile {
  path: string;
  route?: string;
  content: string;
  frontmatter: Record<string, any>;
  html: string;
}

export interface I18nPlugin {
  name: string;
  options: Required<TranslationOptions>;
  translations: Record<string, any>;
  routeMap?: Map<string, ContentFile>;
  transform?: (content: string, locale?: string) => string;
  onBuild?: () => Promise<void>;
  loadTranslations?: () => void;
  isLocaleRoute?: (path: string) => boolean;
  generateLocaleRoute?: (path: string, locale: string) => string;
  registerContentFile?: (file: ContentFile) => void;
}

// Helper function to get nested translation value from a path like "blog.title"
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
}

// Function to replace translation keys in content
function replaceTranslationKeys(
  content: string,
  translations: any,
  defaultTranslations: any | null = null
): string {
  // Match {{t:key}} or {{t:key|default text}}
  const translationRegex = /{{t:([^|}}]+)(?:\|([^}}]+))?}}/g;

  return content.replace(translationRegex, (_match, key, defaultText) => {
    const translation = getNestedValue(translations, key);

    if (translation !== undefined) {
      return translation;
    } else if (defaultTranslations) {
      const defaultTranslation = getNestedValue(defaultTranslations, key);
      if (defaultTranslation !== undefined) {
        return defaultTranslation;
      }
    }

    // Use provided default text or return key if translation is missing
    return defaultText !== undefined ? defaultText : key;
  });
}

// Load translations from a JSON file
function loadTranslationFile(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error);
  }
  return {};
}

// Extract locale from frontmatter
function extractLocaleFromContent(content: string): string | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (match && match[1]) {
    const localeMatch = match[1].match(/locale:\s*['"]?([a-zA-Z-]+)['"]?/);
    if (localeMatch && localeMatch[1]) {
      return localeMatch[1];
    }
  }

  return null;
}

// Normalize path for consistent handling
function normalizePath(path: string): string {
  // Handle empty or root path
  if (!path || path === '/') {
    return '/';
  }

  // Ensure path starts with a slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Remove trailing slash unless it's the root path
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
}

export default function i18nPlugin(options: TranslationOptions): I18nPlugin {
  const defaultOptions: Required<TranslationOptions> = {
    defaultLocale: 'en',
    locales: ['en'],
    translationsDir: 'i18n',
    allowMissingTranslations: true,
    generateLocaleRoutes: true,
    prefixLocaleInUrl: true,
    contentDir: 'pages',
    outputDir: 'dist',
  };

  const mergedOptions: Required<TranslationOptions> = {
    ...defaultOptions,
    ...options,
  };

  // Store registered content files for processing during build
  const contentFiles: ContentFile[] = [];

  // Map of routes to content files
  const routeMap = new Map<string, ContentFile>();

  // Create plugin instance
  const plugin: I18nPlugin = {
    name: 'i18n',
    options: mergedOptions,
    translations: {},
    routeMap,

    // Transform content by replacing translation keys
    transform(content: string, localeOverride?: string): string {
      // Load translations if not already loaded
      if (Object.keys(this.translations).length === 0) {
        this.loadTranslations?.();
      }

      // Extract locale from frontmatter or use provided locale
      const contentLocale =
        localeOverride || extractLocaleFromContent(content) || this.options.defaultLocale;

      // Get translations for this locale
      const translations = this.translations[contentLocale];
      const defaultTranslations =
        contentLocale !== this.options.defaultLocale
          ? this.translations[this.options.defaultLocale]
          : null;

      // Replace translation keys
      if (translations) {
        return replaceTranslationKeys(content, translations, defaultTranslations);
      }

      // If locale not found, try default locale
      if (this.options.allowMissingTranslations && this.translations[this.options.defaultLocale]) {
        return replaceTranslationKeys(content, this.translations[this.options.defaultLocale]);
      }

      // If no translations available, return content as is
      return content;
    },

    // Check if a route has a locale prefix
    isLocaleRoute(route: string): boolean {
      // Remove leading slash for easier processing
      const normalizedPath = route.startsWith('/') ? route.substring(1) : route;

      // If path is empty, it's not a locale route
      if (normalizedPath === '') return false;

      // Get the first part of the path
      const firstSegment = normalizedPath.split('/')[0];

      // Check if it matches any of our locales
      return this.options.locales.includes(firstSegment);
    },

    // Generate a locale-specific route
    generateLocaleRoute(route: string, locale: string): string {
      // Special case for root path
      if (route === '/') {
        return '/' + locale;
      }

      // If locale is the default and we don't prefix default locale
      if (locale === this.options.defaultLocale && !this.options.prefixLocaleInUrl) {
        return route;
      }

      // If route already has a locale prefix, replace it
      if (this.isLocaleRoute?.(route)) {
        // Remove leading slash for easier processing
        const normalizedPath = route.startsWith('/') ? route.substring(1) : route;
        const segments = normalizedPath.split('/');

        // Replace first segment (the locale) with new locale
        segments[0] = locale;

        return '/' + segments.join('/');
      }

      // Otherwise, add locale prefix
      return `/${locale}${route.startsWith('/') ? route : '/' + route}`;
    },

    // Register a content file for i18n processing
    registerContentFile(file: ContentFile): void {
      // Skip registration if locale routes are disabled
      if (!this.options.generateLocaleRoutes) {
        return;
      }

      // Store the file for processing during build
      contentFiles.push(file);

      // Use the route property if available, otherwise normalize the path
      const routePath = file.route || normalizePath(file.path);

      // If a route is provided and it has a locale prefix, skip adding it to the route map
      if (file.route && this.isLocaleRoute?.(file.route)) {
        return;
      }

      // Add the file to the route map
      routeMap.set(routePath, file);

      // Special handling for root path
      if (routePath === '/' || file.path === '/' || file.route === '/') {
        routeMap.set('/', file);
      }
    },

    // Generate locale-specific routes during build
    async onBuild(): Promise<void> {
      if (!this.options.generateLocaleRoutes) {
        return;
      }

      console.log(`i18n plugin: Generating routes for locales: ${this.options.locales.join(', ')}`);

      // Process all registered content files
      for (const file of contentFiles) {
        // Get file's locale from frontmatter or use default
        const fileLocale = file.frontmatter?.locale || this.options.defaultLocale;

        // Generate localized routes for each locale
        for (const locale of this.options.locales) {
          // Skip the file's own locale as it's already processed
          if (locale === fileLocale) continue;

          // Generate localized path for this locale
          const routePath = file.route || normalizePath(file.path);
          const localizedPath = this.generateLocaleRoute?.(routePath, locale);

          // Output directory path
          const outputPath = path.join(this.options.outputDir, localizedPath || '');

          // Ensure the output directory exists
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // Here we would normally write the localized content to the file
          // This is a placeholder for the actual file writing logic
          console.log(`i18n plugin: Generated localized route: ${localizedPath}`);
        }
      }

      console.log(`i18n plugin: Completed route generation for ${contentFiles.length} files`);
    },

    // Load all translation files
    loadTranslations(): void {
      const { translationsDir, locales } = this.options;

      // Create translations directory if it doesn't exist
      if (!fs.existsSync(translationsDir)) {
        fs.mkdirSync(translationsDir, { recursive: true });
      }

      // Load translations for each locale
      locales.forEach(locale => {
        const filePath = path.join(translationsDir, `${locale}.json`);
        this.translations[locale] = loadTranslationFile(filePath);
      });

      console.log(
        `i18n plugin: Loaded translations for ${Object.keys(this.translations).length} locales`
      );
    },
  };

  return plugin;
}
