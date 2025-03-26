/**
 * Utilities for working with locales in BunPress
 */

/**
 * Get the current locale from the URL path
 * @param path - The URL path
 * @param supportedLocales - List of supported locales 
 * @param defaultLocale - Default locale to return if no match found
 * @returns Current locale code
 */
export function getLocaleFromPath(
  path: string, 
  supportedLocales: string[] = ['en', 'fr', 'es'], 
  defaultLocale: string = 'en'
): string {
  const pathSegments = path.split('/').filter(Boolean);
  
  if (pathSegments.length > 0) {
    const potentialLocale = pathSegments[0];
    // Check if the first path segment is a supported locale
    if (supportedLocales.includes(potentialLocale)) {
      return potentialLocale;
    }
  }
  
  return defaultLocale;
}

/**
 * Remove the locale prefix from a path
 * @param path - The URL path
 * @param supportedLocales - List of supported locales
 * @returns Path without locale prefix
 */
export function removeLocaleFromPath(
  path: string,
  supportedLocales: string[] = ['en', 'fr', 'es']
): string {
  const pathSegments = path.split('/').filter(Boolean);
  
  if (pathSegments.length > 0 && supportedLocales.includes(pathSegments[0])) {
    return '/' + pathSegments.slice(1).join('/');
  }
  
  return path;
}

/**
 * Add a locale prefix to a path
 * @param path - The URL path
 * @param locale - Locale to add
 * @returns Path with locale prefix
 */
export function addLocaleToPath(path: string, locale: string): string {
  // First, ensure we have a clean path without an existing locale
  const cleanPath = removeLocaleFromPath(path);
  
  // Handle root path
  if (cleanPath === '/') {
    return `/${locale}`;
  }
  
  // Add locale prefix
  const pathWithoutLeadingSlash = cleanPath.startsWith('/')
    ? cleanPath.slice(1)
    : cleanPath;
    
  return `/${locale}/${pathWithoutLeadingSlash}`;
}

/**
 * Check if a path has a locale prefix
 * @param path - The URL path
 * @param supportedLocales - List of supported locales
 * @returns True if the path has a locale prefix
 */
export function hasLocalePrefix(
  path: string,
  supportedLocales: string[] = ['en', 'fr', 'es']
): boolean {
  const pathSegments = path.split('/').filter(Boolean);
  return pathSegments.length > 0 && supportedLocales.includes(pathSegments[0]);
}

/**
 * Switch the locale in a path
 * @param path - The URL path
 * @param newLocale - New locale to use
 * @param supportedLocales - List of supported locales
 * @returns Path with the new locale
 */
export function switchLocaleInPath(
  path: string,
  newLocale: string,
  supportedLocales: string[] = ['en', 'fr', 'es']
): string {
  // If the path already has a locale, replace it
  if (hasLocalePrefix(path, supportedLocales)) {
    const cleanPath = removeLocaleFromPath(path, supportedLocales);
    return addLocaleToPath(cleanPath, newLocale);
  }
  
  // Otherwise, add the locale
  return addLocaleToPath(path, newLocale);
} 