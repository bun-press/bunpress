import path from 'path';
import fs from 'fs';
import type { BunPressConfig } from '../../bunpress.config';

export interface Theme {
  name: string;
  path: string;
  layoutComponent: string;
  styleFile: string;
  options?: Record<string, any>;
  type?: 'default' | 'docs';
}

export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private activeTheme: Theme | null = null;
  private readonly defaultThemeName = 'default';
  private readonly themesDir: string;

  constructor(workspaceRoot: string) {
    this.themesDir = path.join(workspaceRoot, 'themes');
    this.loadAvailableThemes();
  }

  private loadAvailableThemes(): void {
    if (!fs.existsSync(this.themesDir)) {
      console.warn(`Themes directory not found at ${this.themesDir}`);
      return;
    }

    const themeDirectories = fs.readdirSync(this.themesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const themeName of themeDirectories) {
      const themePath = path.join(this.themesDir, themeName);
      const layoutPath = path.join(themePath, 'Layout.tsx');
      const stylePath = path.join(themePath, 'styles.css');

      if (fs.existsSync(layoutPath) && fs.existsSync(stylePath)) {
        const themeType = themeName === 'docs' ? 'docs' : 'default';
        
        this.themes.set(themeName, {
          name: themeName,
          path: themePath,
          layoutComponent: layoutPath,
          styleFile: stylePath,
          type: themeType
        });
      } else {
        console.warn(`Theme "${themeName}" is missing required files (Layout.tsx and/or styles.css)`);
      }
    }

    console.log(`Loaded ${this.themes.size} themes: ${[...this.themes.keys()].join(', ')}`);
  }

  public setThemeFromConfig(config: BunPressConfig): void {
    const themeName = config.themeConfig?.name || this.defaultThemeName;
    const themeOptions = config.themeConfig?.options || {};
    const themeType = config.themeConfig?.type;
    
    if (themeType) {
      const matchingThemes = [...this.themes.values()].filter(
        theme => theme.type === themeType
      );
      
      if (matchingThemes.length > 0) {
        const namedTheme = matchingThemes.find(theme => theme.name === themeName);
        if (namedTheme) {
          this.activeTheme = {
            ...namedTheme,
            options: themeOptions
          };
          console.log(`Active theme set to "${namedTheme.name}" (${themeType})`);
          return;
        }
        
        this.activeTheme = {
          ...matchingThemes[0],
          options: themeOptions
        };
        console.log(`Active theme set to "${matchingThemes[0].name}" (${themeType})`);
        return;
      }
    }
    
    if (this.themes.has(themeName)) {
      const theme = this.themes.get(themeName)!;
      this.activeTheme = {
        ...theme,
        options: themeOptions
      };
      console.log(`Active theme set to "${themeName}"`);
    } else {
      console.warn(`Theme "${themeName}" not found, using default theme`);
      if (this.themes.has(this.defaultThemeName)) {
        this.activeTheme = {
          ...this.themes.get(this.defaultThemeName)!,
          options: themeOptions
        };
      } else {
        console.error(`Default theme "${this.defaultThemeName}" not found`);
        this.activeTheme = null;
      }
    }
  }

  public getActiveTheme(): Theme | null {
    return this.activeTheme;
  }

  public getThemeStyleContent(): string {
    if (!this.activeTheme) {
      return '';
    }

    try {
      return fs.readFileSync(this.activeTheme.styleFile, 'utf-8');
    } catch (error) {
      console.error(`Failed to read theme style file: ${this.activeTheme.styleFile}`);
      return '';
    }
  }

  public getAvailableThemes(): string[] {
    return [...this.themes.keys()];
  }
} 