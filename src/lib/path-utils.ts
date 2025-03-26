/**
 * Path utilities to ensure consistent path handling
 * and improve cross-platform compatibility
 */

import * as path from 'path';
import * as os from 'os';

/**
 * Normalize path separators to forward slashes
 * This helps with path consistency across platforms
 */
export function normalizePath(filepath: string): string {
  return filepath.split(path.sep).join('/');
}

/**
 * Convert a path to use the platform-specific separator
 */
export function toPlatformPath(filepath: string): string {
  return filepath.split('/').join(path.sep);
}

/**
 * Get the absolute path, normalized with forward slashes
 */
export function getAbsolutePath(filepath: string, base?: string): string {
  if (path.isAbsolute(filepath)) {
    return normalizePath(filepath);
  }
  
  const baseDir = base || process.cwd();
  return normalizePath(path.resolve(baseDir, filepath));
}

/**
 * Get a relative path, normalized with forward slashes
 */
export function getRelativePath(filepath: string, base?: string): string {
  const baseDir = base || process.cwd();
  return normalizePath(path.relative(baseDir, filepath));
}

/**
 * Join path segments and normalize with forward slashes
 */
export function joinPaths(...segments: string[]): string {
  return normalizePath(path.join(...segments));
}

/**
 * Resolve a path and normalize with forward slashes
 */
export function resolvePath(...segments: string[]): string {
  return normalizePath(path.resolve(...segments));
}

/**
 * Get URL-friendly path (useful for route generation)
 */
export function getUrlPath(filepath: string): string {
  // Remove file extension
  const withoutExt = filepath.replace(/\.[^.]+$/, '');
  
  // Convert to URL path
  let urlPath = withoutExt.replace(/\\/g, '/');
  
  // Ensure starts with /
  if (!urlPath.startsWith('/')) {
    urlPath = '/' + urlPath;
  }
  
  // Handle index files
  if (urlPath.endsWith('/index')) {
    urlPath = urlPath.replace(/\/index$/, '/');
  }
  
  return urlPath;
}

/**
 * Check if path is inside another directory
 */
export function isPathInside(filepath: string, directory: string): boolean {
  const normalizedFile = normalizePath(path.resolve(filepath));
  const normalizedDir = normalizePath(path.resolve(directory));
  
  return normalizedFile.startsWith(normalizedDir + '/') || normalizedFile === normalizedDir;
}

/**
 * Convert a file path to its corresponding route path
 */
export function filePathToRoutePath(
  filepath: string, 
  basePath: string, 
  extensions: string[] = ['.md', '.mdx', '.html']
): string {
  // Get relative path from base directory
  const relativePath = getRelativePath(filepath, basePath);
  
  // Remove file extension
  let routePath = relativePath;
  const ext = path.extname(routePath).toLowerCase();
  
  if (extensions.includes(ext)) {
    routePath = routePath.slice(0, -ext.length);
  }
  
  // Handle index files
  if (routePath.endsWith('index')) {
    routePath = routePath.slice(0, -5);
  }
  
  // Ensure proper URL format
  routePath = '/' + routePath.replace(/\\/g, '/');
  
  // Clean up double slashes and trailing slash
  routePath = routePath.replace(/\/+/g, '/');
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }
  
  return routePath;
}

/**
 * Make a path safe for use in a URL or file system
 */
export function toSafePath(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get temporary directory path within the project
 */
export function getTempDir(subdir?: string): string {
  const tmpBaseDir = path.join(process.cwd(), 'tmp');
  
  if (!subdir) {
    return tmpBaseDir;
  }
  
  return path.join(tmpBaseDir, subdir);
}

/**
 * Get platform-appropriate home directory
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * Get cache directory path
 */
export function getCacheDir(appName: string = 'bunpress'): string {
  const homeDir = getHomeDir();
  const platform = process.platform;
  
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Local', appName, 'Cache');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Caches', appName);
  } else {
    return path.join(homeDir, '.cache', appName);
  }
}

/**
 * Get config directory path
 */
export function getConfigDir(appName: string = 'bunpress'): string {
  const homeDir = getHomeDir();
  const platform = process.platform;
  
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Roaming', appName);
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', appName);
  } else {
    return path.join(homeDir, '.config', appName);
  }
} 