import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';
import type { BunPressConfig } from '../../bunpress.config';
import { createThemeUtils } from '../lib/ui-utils';
import { getNamespacedLogger } from '../lib/logger-utils';
import { joinPaths } from '../lib/path-utils';

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
    console.log(`ThemeManager initialized with workspace root: ${workspaceRoot}`);
    console.log(`Themes directory path: ${this.themesDir}`);
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Themes directory exists (sync): ${fs.existsSync(this.themesDir)}`);
    
    // Initialize async loading
    this.loadAvailableThemes().catch(err => {
      console.error('Failed to load available themes', err);
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
    console.log(`Checking themes directory: ${this.themesDir}`);
    console.log(`Directory exists according to fs.existsSync: ${fs.existsSync(this.themesDir)}`);
    console.log(`Process CWD: ${process.cwd()}`);
    
    // Use direct fs.existsSync instead of fileExists
    if (!fs.existsSync(this.themesDir)) {
      this.logger.warn(`Themes directory not found at ${this.themesDir}`);
      return;
    }

    try {
      // Sync implementation that's more efficient
      const dirEntries = fs.readdirSync(this.themesDir, { withFileTypes: true });
      const themeDirectories = dirEntries
        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map(dirent => dirent.name);
      
      console.log(`Found theme directories: ${themeDirectories.join(', ')}`);
      
      for (const themeName of themeDirectories) {
        const themePath = joinPaths(this.themesDir, themeName);
        console.log(`Processing theme: ${themeName} at path ${themePath}`);
        
        // Look for main component file
        const indexFiles = [
          joinPaths(themePath, 'index.tsx'),
          joinPaths(themePath, 'Layout.tsx'),
          joinPaths(themePath, 'index.jsx'),
          joinPaths(themePath, 'Layout.jsx')
        ];
        
        let layoutComponent = '';
        for (const indexFile of indexFiles) {
          if (fs.existsSync(indexFile)) {
            layoutComponent = indexFile;
            console.log(`Found layout component: ${layoutComponent}`);
            break;
          }
        }
        
        if (!layoutComponent) {
          this.logger.warn(`Theme "${themeName}" missing main component file, skipping`);
          continue;
        }
        
        // Look for style file
        const styleFile = joinPaths(themePath, 'styles.css');
        console.log(`Looking for style file: ${styleFile}, exists: ${fs.existsSync(styleFile)}`);
        
        if (!fs.existsSync(styleFile)) {
          // Try alternative style file names
          const alternativeStyles = [
            joinPaths(themePath, 'style.css'),
            joinPaths(themePath, 'theme.css')
          ];
          
          for (const altStyle of alternativeStyles) {
            if (fs.existsSync(altStyle)) {
              this.logger.warn(`Theme "${themeName}" uses non-standard style file name: ${path.basename(altStyle)}`);
              break;
            }
          }
        } else {
          console.log(`Found style file: ${styleFile}`);
        }
        
        // Find layout components
        const layouts: Record<string, string> = {};
        const layoutsDir = joinPaths(themePath, 'layouts');
        
        if (fs.existsSync(layoutsDir)) {
          const layoutFiles = fs.readdirSync(layoutsDir);
          console.log(`Found layout files: ${layoutFiles.join(', ')}`);
          
          for (const file of layoutFiles) {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
              const layoutType = file.replace(/\.(tsx|jsx)$/, '').replace(/Layout$/, '').toLowerCase();
              layouts[layoutType] = joinPaths(layoutsDir, file);
              console.log(`Registered layout: ${layoutType} => ${layouts[layoutType]}`);
            }
          }
        }
        
        // Create the theme
        this.themes.set(themeName, {
          name: themeName,
          path: themePath,
          layoutComponent,
          styleFile,
          layouts
        });
        console.log(`Added theme "${themeName}" to registry`);
      }
      
      console.log(`Total themes loaded: ${this.themes.size}`);
      this.logger.info(`Loaded ${this.themes.size} themes: ${[...this.themes.keys()].join(', ')}`);
    } catch (error) {
      console.error(`Error loading themes: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
      this.logger.error(`Error loading themes: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * Get the CSS content for the active theme
   */
  public async getThemeStyleContent(): Promise<string> {
    if (!this.activeTheme) {
      this.logger.warn('No active theme set, cannot get theme styles');
      return '';
    }

    const styleFilePath = this.activeTheme.styleFile;
    console.log(`Getting style content from: ${styleFilePath}`);
    console.log(`Style file exists: ${fs.existsSync(styleFilePath)}`);
    
    try {
      // Use synchronous operation directly
      if (fs.existsSync(styleFilePath)) {
        return fs.readFileSync(styleFilePath, 'utf-8');
      } else {
        this.logger.warn(`Theme style file not found: ${styleFilePath}`);
        return '';
      }
    } catch (error) {
      console.error(`Error reading theme style file: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`Error reading theme style file: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
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
    return this.themeUtils.getThemeVariables(this.activeTheme);
  }

  /**
   * Get available layouts for a theme
   */
  async getAvailableLayouts(themeName: string): Promise<string[]> {
    try {
      const layoutsDir = path.join(this.themesDir, themeName, 'layouts');
      
      if (!fs.existsSync(layoutsDir)) {
        return [];
      }
      
      // Read layout directories
      const layoutDirEntries = await readdir(layoutsDir, { withFileTypes: true });
      
      // Filter to only include files with .tsx extension
      return layoutDirEntries
        .filter(entry => entry.isFile() && entry.name.endsWith('.tsx'))
        .map(entry => entry.name.replace(/\.tsx$/, ''));
    } catch (error) {
      const errorObj = error instanceof Error ? { message: error.message } : { message: String(error) };
      this.logger.error(`Error getting layouts for theme ${themeName}:`, errorObj);
      return [];
    }
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
