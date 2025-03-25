import path from 'path';
import fs from 'fs';
import type { BunPressConfig } from '../../bunpress.config';

export interface Theme {
  name: string;
  path: string;
  layoutComponent: string;
  styleFile: string;
  layouts?: Record<string, string>;
  options?: Record<string, any>;
}

export interface ThemeManager {
  getThemes(): Map<string, Theme>;
  getActiveTheme(): Theme | null;
  setThemeFromConfig(config: BunPressConfig): void;
  getThemeStyleContent(): string;
  getAvailableThemes(): string[];
  getThemeComponent(type?: string): string;
}

export class DefaultThemeManager implements ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private activeTheme: Theme | null = null;
  private readonly defaultThemeName = 'docs';
  private readonly themesDir: string;

  constructor(workspaceRoot: string) {
    this.themesDir = path.join(workspaceRoot, 'themes');
    this.loadAvailableThemes();
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
  private loadAvailableThemes(): void {
    if (!fs.existsSync(this.themesDir)) {
      console.warn(`Themes directory not found at ${this.themesDir}`);
      return;
    }

    const themeDirectories = fs
      .readdirSync(this.themesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const themeName of themeDirectories) {
      const themePath = path.join(this.themesDir, themeName);

      // First try to find Layout.tsx at the root
      let layoutComponent = path.join(themePath, 'Layout.tsx');
      if (!fs.existsSync(layoutComponent)) {
        // Then try index.tsx
        layoutComponent = path.join(themePath, 'index.tsx');
        if (!fs.existsSync(layoutComponent)) {
          console.warn(`Theme "${themeName}" does not have a Layout.tsx or index.tsx file`);
          continue;
        }
      }

      // Check for styles.css
      const styleFile = path.join(themePath, 'styles.css');
      if (!fs.existsSync(styleFile)) {
        console.warn(`Theme "${themeName}" does not have a styles.css file`);
        continue;
      }

      // Find layout components
      const layouts: Record<string, string> = {};
      const layoutsDir = path.join(themePath, 'layouts');

      if (fs.existsSync(layoutsDir)) {
        const layoutFiles = fs
          .readdirSync(layoutsDir)
          .filter(file => file.endsWith('.tsx') && !file.includes('.test.'));

        for (const layoutFile of layoutFiles) {
          // Extract layout type from filename (e.g., DocLayout.tsx -> doc)
          const layoutType = layoutFile.replace(/Layout\.tsx$/, '').toLowerCase();
          layouts[layoutType] = path.join(layoutsDir, layoutFile);
        }
      }

      // Register the theme
      this.themes.set(themeName, {
        name: themeName,
        path: themePath,
        layoutComponent,
        styleFile,
        layouts,
      });
    }

    console.log(`Loaded ${this.themes.size} themes: ${[...this.themes.keys()].join(', ')}`);
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
      console.log(`Active theme set to "${themeName}"`);
    } else {
      console.warn(`Theme "${themeName}" not found, using default theme`);
      if (this.themes.has(this.defaultThemeName)) {
        this.activeTheme = {
          ...this.themes.get(this.defaultThemeName)!,
          options: themeOptions,
        };
      } else {
        console.error(`Default theme "${this.defaultThemeName}" not found`);
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

    // If we have layouts and a requested type, try to get the specific layout
    if (this.activeTheme.layouts && type && this.activeTheme.layouts[type]) {
      return this.activeTheme.layouts[type];
    }

    // Otherwise fall back to the main layout component
    return this.activeTheme.layoutComponent;
  }

  /**
   * Get the content of the theme's style file
   */
  public getThemeStyleContent(): string {
    if (!this.activeTheme) {
      return '';
    }

    try {
      return fs.readFileSync(this.activeTheme.styleFile, 'utf-8');
    } catch (error) {
      console.error(`Failed to read theme styles: ${error}`);
      return '';
    }
  }

  /**
   * Get a list of available theme names
   */
  public getAvailableThemes(): string[] {
    return [...this.themes.keys()];
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
