import { readdir } from 'fs/promises';
import type { BunPressConfig } from '../../bunpress.config';
import { createThemeUtils } from '../lib/ui-utils';
import { getNamespacedLogger } from '../lib/logger-utils';
import { joinPaths } from '../lib/path-utils';
import { directoryExists, fileExists, readFileAsString } from '../lib/fs-utils';
import { tryCatch, tryCatchWithCode, ErrorCode } from '../lib/error-utils';
import { findThemes, ThemeStructure, extractThemeVariables } from '../lib/theme-utils';

export interface Theme {
  name: string;
  path: string;
  layoutComponent: string;
  styleFile: string;
  layouts?: Record<string, string>;
  options?: Record<string, any>;
  variables?: Record<string, string>;
}

export interface ThemeManager {
  getThemes(): Map<string, Theme>;
  getActiveTheme(): Theme | null;
  setThemeFromConfig(config: BunPressConfig): void;
  getThemeStyleContent(): Promise<string>;
  getAvailableThemes(): string[];
  getThemeComponent(type?: string): string;
  getThemeVariables(): Record<string, string>;
}

/**
 * Default theme manager implementation
 */
export class DefaultThemeManager implements ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private activeTheme: Theme | null = null;
  private readonly defaultThemeName = 'docs';
  private readonly themesDir: string;
  private readonly themeUtils = createThemeUtils();
  private readonly logger = getNamespacedLogger('theme-manager');

  constructor(workspaceRoot: string) {
    this.themesDir = joinPaths(workspaceRoot, 'themes');
    this.logger.info(`ThemeManager initialized with workspace root: ${workspaceRoot}`);
    this.logger.debug(`Themes directory path: ${this.themesDir}`);
    this.logger.debug(`Current working directory: ${process.cwd()}`);

    // Initialize async loading
    this.loadAvailableThemes().catch(err => {
      this.logger.error('Failed to load available themes', { error: err });
    });
  }

  /**
   * Get all registered themes
   */
  public getThemes(): Map<string, Theme> {
    return this.themes;
  }

  /**
   * Load all available themes from the themes directory
   */
  private async loadAvailableThemes(): Promise<void> {
    this.logger.debug(`Checking themes directory: ${this.themesDir}`);

    try {
      // Use the new findThemes utility to discover and validate themes
      const themeStructures = await findThemes(this.themesDir);

      // Convert ThemeStructure to Theme interface
      themeStructures.forEach((themeStructure, themeName) => {
        this.themes.set(themeName, this.convertThemeStructure(themeStructure));
      });

      this.logger.info(`Loaded ${this.themes.size} themes: ${[...this.themes.keys()].join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Error loading themes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert ThemeStructure to Theme interface
   */
  private convertThemeStructure(structure: ThemeStructure): Theme {
    return {
      name: structure.name,
      path: structure.path,
      layoutComponent: structure.layoutComponent,
      styleFile: structure.styleFile,
      layouts: structure.layouts,
      options: structure.options || {},
      variables: structure.variables || {},
    };
  }

  /**
   * Set the active theme based on the configuration
   */
  public setThemeFromConfig(config: BunPressConfig): void {
    const themeName = config.themeConfig?.name || this.defaultThemeName;
    const themeOptions = config.themeConfig?.options || {};

    if (this.themes.has(themeName)) {
      const theme = this.themes.get(themeName)!;
      this.activeTheme = {
        ...theme,
        options: themeOptions,
      };
      this.logger.info(`Active theme set to "${themeName}"`);
    } else {
      this.logger.warn(`Theme "${themeName}" not found, using default theme`);
      if (this.themes.has(this.defaultThemeName)) {
        this.activeTheme = {
          ...this.themes.get(this.defaultThemeName)!,
          options: themeOptions,
        };
      } else {
        this.logger.error(`Default theme "${this.defaultThemeName}" not found`);
        this.activeTheme = null;
      }
    }
  }

  /**
   * Get the currently active theme
   */
  public getActiveTheme(): Theme | null {
    return this.activeTheme;
  }

  /**
   * Get the theme component path for a specific layout type
   * @param type Optional layout type (doc, page, home, etc)
   * @returns Path to the component file
   */
  public getThemeComponent(type?: string): string {
    if (!this.activeTheme) {
      return '';
    }

    if (type && this.activeTheme.layouts && this.activeTheme.layouts[type]) {
      return this.activeTheme.layouts[type];
    }

    return this.activeTheme.layoutComponent;
  }

  /**
   * Get the theme's style content
   */
  public async getThemeStyleContent(): Promise<string> {
    if (!this.activeTheme) {
      this.logger.warn('No active theme, returning empty style content');
      return '';
    }

    return await tryCatchWithCode(
      async () => {
        const styleFile = this.activeTheme?.styleFile;
        if (!styleFile || !(await fileExists(styleFile))) {
          this.logger.warn(`Style file ${styleFile} not found for theme ${this.activeTheme?.name}`);
          return '';
        }

        this.logger.debug(`Reading style file: ${styleFile}`);
        return await readFileAsString(styleFile);
      },
      ErrorCode.FILE_READ_ERROR,
      `Failed to read theme style file: ${this.activeTheme?.styleFile}`,
      { themeName: this.activeTheme.name }
    );
  }

  /**
   * Get a list of available theme names
   */
  public getAvailableThemes(): string[] {
    return [...this.themes.keys()];
  }

  /**
   * Get CSS variables for the current theme
   */
  public getThemeVariables(): Record<string, string> {
    if (!this.activeTheme) {
      return {};
    }

    // Use the extractThemeVariables utility from theme-utils
    const themeVars = extractThemeVariables({
      name: this.activeTheme.name,
      path: this.activeTheme.path,
      layoutComponent: this.activeTheme.layoutComponent,
      styleFile: this.activeTheme.styleFile,
      layouts: this.activeTheme.layouts,
      options: this.activeTheme.options,
      variables: this.activeTheme.variables,
    });

    // Fall back to themeUtils if no variables extracted
    if (Object.keys(themeVars).length === 0) {
      return this.themeUtils.getThemeVariables(this.activeTheme);
    }

    return themeVars;
  }

  /**
   * Get available layouts for a theme
   */
  async getAvailableLayouts(themeName: string): Promise<string[]> {
    return await tryCatch(
      async () => {
        const layoutsDir = joinPaths(this.themesDir, themeName, 'layouts');

        if (!(await directoryExists(layoutsDir))) {
          return [];
        }

        // Read layout directories
        const layoutDirEntries = await readdir(layoutsDir, { withFileTypes: true });

        // Filter to only include files with .tsx extension
        return layoutDirEntries
          .filter(entry => entry.isFile() && entry.name.endsWith('.tsx'))
          .map(entry => entry.name.replace(/\.tsx$/, ''));
      },
      error => {
        this.logger.error(`Error getting layouts for theme ${themeName}:`, error);
        return [];
      }
    );
  }
}

// Export default instance for convenience
declare global {
  var defaultThemeManager: ThemeManager | null;
}

export function getThemeManager(workspaceRoot?: string): ThemeManager {
  if (!global.defaultThemeManager && workspaceRoot) {
    global.defaultThemeManager = new DefaultThemeManager(workspaceRoot);
  } else if (!global.defaultThemeManager) {
    throw new Error('Theme manager not initialized and no workspace root provided');
  }

  return global.defaultThemeManager;
}

export function initThemeManager(workspaceRoot: string): ThemeManager {
  global.defaultThemeManager = new DefaultThemeManager(workspaceRoot);
  return global.defaultThemeManager;
}
