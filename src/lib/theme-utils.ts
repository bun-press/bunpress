/**
 * Theme Utilities
 * Helper functions for theme validation and management
 */

import { fileExists, directoryExists } from './fs-utils';
import { joinPaths } from './path-utils';
import { readdir } from 'fs/promises';
import { getNamespacedLogger } from './logger-utils';

// Create namespaced logger for theme utilities
const logger = getNamespacedLogger('theme-utils');

/**
 * Interface for theme structure
 */
export interface ThemeStructure {
  name: string;
  path: string;
  layoutComponent: string;
  styleFile: string;
  layouts?: Record<string, string>;
  options?: Record<string, any>;
  variables?: Record<string, string>;
  isValid?: boolean;
}

/**
 * Theme validation options
 */
export interface ThemeValidationOptions {
  /**
   * Whether to require a layout component
   * @default true
   */
  requireLayoutComponent?: boolean;

  /**
   * Whether to require a style file
   * @default true
   */
  requireStyleFile?: boolean;

  /**
   * Whether to require layout components
   * @default false
   */
  requireLayouts?: boolean;

  /**
   * Alternative file names to look for style file
   * @default ['style.css', 'theme.css']
   */
  alternativeStyleFiles?: string[];

  /**
   * Alternative file names to look for layout component
   * @default ['Layout.tsx', 'Layout.jsx', 'index.jsx']
   */
  alternativeLayoutFiles?: string[];
}

/**
 * Validate a theme directory and extract theme structure
 *
 * @param themeName Name of the theme
 * @param themePath Path to the theme directory
 * @param options Validation options
 * @returns Promise resolving to theme structure or null if invalid
 */
export async function validateTheme(
  themeName: string,
  themePath: string,
  options: ThemeValidationOptions = {}
): Promise<ThemeStructure | null> {
  // Default options
  const opts = {
    requireLayoutComponent: options.requireLayoutComponent !== false,
    requireStyleFile: options.requireStyleFile !== false,
    requireLayouts: options.requireLayouts === true, // Default to false
    alternativeStyleFiles: options.alternativeStyleFiles || ['style.css', 'theme.css'],
    alternativeLayoutFiles: options.alternativeLayoutFiles || [
      'Layout.tsx',
      'Layout.jsx',
      'index.jsx',
    ],
  };

  logger.debug(`Processing theme: ${themeName} at path ${themePath}`);

  // Look for main component file
  const indexFile = joinPaths(themePath, 'index.tsx');
  let layoutComponent = '';

  if (await fileExists(indexFile)) {
    layoutComponent = indexFile;
    logger.debug(`Found layout component: ${layoutComponent}`);
  } else {
    // Try alternative layout files
    for (const altFile of opts.alternativeLayoutFiles) {
      const altFilePath = joinPaths(themePath, altFile);
      if (await fileExists(altFilePath)) {
        layoutComponent = altFilePath;
        logger.debug(`Found alternative layout component: ${layoutComponent}`);
        break;
      }
    }
  }

  if (!layoutComponent && opts.requireLayoutComponent) {
    logger.warn(`Theme "${themeName}" missing main component file, skipping`);
    return null;
  }

  // Look for style file
  const styleFile = joinPaths(themePath, 'styles.css');
  const styleExists = await fileExists(styleFile);
  logger.debug(`Looking for style file: ${styleFile}, exists: ${styleExists}`);

  let finalStyleFile = styleFile;
  if (!styleExists) {
    // Try alternative style file names
    for (const altStyle of opts.alternativeStyleFiles) {
      const altStylePath = joinPaths(themePath, altStyle);
      if (await fileExists(altStylePath)) {
        logger.warn(`Theme "${themeName}" uses non-standard style file name: ${altStyle}`);
        finalStyleFile = altStylePath;
        break;
      }
    }
  } else {
    logger.debug(`Found style file: ${styleFile}`);
  }

  if (!(await fileExists(finalStyleFile)) && opts.requireStyleFile) {
    logger.warn(`Theme "${themeName}" missing style file, skipping`);
    return null;
  }

  // Find layout components
  const layouts: Record<string, string> = {};
  const layoutsDir = joinPaths(themePath, 'layouts');

  if (await directoryExists(layoutsDir)) {
    const layoutFiles = await readdir(layoutsDir);
    logger.debug(`Found layout files: ${layoutFiles.join(', ')}`);

    for (const file of layoutFiles) {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const layoutType = file
          .replace(/\.(tsx|jsx)$/, '')
          .replace(/Layout$/, '')
          .toLowerCase();
        layouts[layoutType] = joinPaths(layoutsDir, file);
        logger.debug(`Registered layout: ${layoutType} => ${layouts[layoutType]}`);
      }
    }
  }

  if (Object.keys(layouts).length === 0 && opts.requireLayouts) {
    logger.warn(`Theme "${themeName}" has no layout components, skipping`);
    return null;
  }

  // Create the theme structure
  const theme: ThemeStructure = {
    name: themeName,
    path: themePath,
    layoutComponent: layoutComponent || '',
    styleFile: finalStyleFile,
    layouts,
    isValid: true,
  };

  logger.debug(`Added theme "${themeName}" to registry`);
  return theme;
}

/**
 * Find and validate themes in a directory
 *
 * @param themesDir Path to the directory containing themes
 * @param options Validation options
 * @returns Promise resolving to Map of theme name to theme structure
 */
export async function findThemes(
  themesDir: string,
  options: ThemeValidationOptions = {}
): Promise<Map<string, ThemeStructure>> {
  const themes = new Map<string, ThemeStructure>();
  logger.debug(`Checking themes directory: ${themesDir}`);

  const exists = await directoryExists(themesDir);
  if (!exists) {
    logger.warn(`Themes directory not found at ${themesDir}`);
    return themes;
  }

  try {
    // Get all directories in the themes directory
    const directories = await readdir(themesDir, { withFileTypes: true });
    const themeDirectories = directories
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map(dirent => dirent.name);

    logger.debug(`Found theme directories: ${themeDirectories.join(', ')}`);

    for (const themeName of themeDirectories) {
      const themePath = joinPaths(themesDir, themeName);
      const theme = await validateTheme(themeName, themePath, options);

      if (theme) {
        themes.set(themeName, theme);
      }
    }

    logger.info(`Loaded ${themes.size} themes: ${[...themes.keys()].join(', ')}`);
  } catch (error) {
    logger.error(`Error loading themes: ${error instanceof Error ? error.message : String(error)}`);
  }

  return themes;
}

/**
 * Get CSS variables from a theme
 *
 * @param theme Theme structure
 * @returns Record of CSS variable names to values
 */
export function extractThemeVariables(theme: ThemeStructure | null): Record<string, string> {
  if (!theme) {
    return {};
  }

  // For now, return empty object - this will be implemented to extract CSS variables from the theme's style file
  // Actual implementation would involve parsing CSS and extracting :root { --variable: value } declarations
  return {};
}
