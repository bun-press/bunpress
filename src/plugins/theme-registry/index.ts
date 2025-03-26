import fs from 'fs';
import path from 'path';
import { Plugin } from '../../core/plugin';
import { findThemes, ThemeStructure as UtilsThemeStructure } from '../../lib/theme-utils';
import { getNamespacedLogger } from '../../lib/logger-utils';

const logger = getNamespacedLogger('theme-registry-plugin');

interface ThemeRegistryPluginOptions {
  /**
   * Directory where themes are located
   * @default 'themes'
   */
  themesDir?: string;

  /**
   * Whether to validate themes during registration
   * @default true
   */
  validateThemes?: boolean;
}

interface ThemeStructure {
  name: string;
  path: string;
  layouts: {
    doc?: string;
    page?: string;
    home?: string;
    [key: string]: string | undefined;
  };
  component: string;
  styles: string;
  valid: boolean;
}

/**
 * Convert utility ThemeStructure to plugin ThemeStructure
 */
function convertThemeStructure(utilsTheme: UtilsThemeStructure): ThemeStructure {
  const layouts: ThemeStructure['layouts'] = {};
  
  // Convert layouts object to expected format
  if (utilsTheme.layouts) {
    Object.entries(utilsTheme.layouts).forEach(([type, path]) => {
      layouts[type] = path;
    });
  }
  
  return {
    name: utilsTheme.name,
    path: utilsTheme.path,
    layouts,
    component: utilsTheme.layoutComponent,
    styles: utilsTheme.styleFile,
    valid: utilsTheme.isValid !== false
  };
}

/**
 * Plugin to manage theme registration and integration
 */
export function themeRegistryPlugin(options: ThemeRegistryPluginOptions = {}): Plugin {
  const themesDir = options.themesDir || 'themes';
  const validateThemes = options.validateThemes !== false;

  const themes = new Map<string, ThemeStructure>();

  // Function to register all available themes
  async function registerThemes() {
    const workspaceRoot = process.cwd();
    const themesFolderPath = path.join(workspaceRoot, themesDir);

    if (!fs.existsSync(themesFolderPath)) {
      logger.warn(`Themes directory not found at ${themesFolderPath}`);
      return;
    }

    try {
      // Use the findThemes utility to get validated themes
      const themeMap = await findThemes(themesFolderPath, {
        requireLayoutComponent: validateThemes,
        requireStyleFile: validateThemes,
        requireLayouts: validateThemes
      });
      
      // Convert and store themes
      themeMap.forEach((themeStructure, themeName) => {
        const convertedTheme = convertThemeStructure(themeStructure);
        themes.set(themeName, convertedTheme);
        
        if (convertedTheme.valid) {
          logger.info(`✅ Registered theme: ${themeName}`);
        } else {
          logger.warn(`⚠️ Theme "${themeName}" was registered but may be missing required files`);
        }
      });
      
      logger.info(`✅ Registered ${themes.size} themes: ${Array.from(themes.keys()).join(', ')}`);
    } catch (error) {
      logger.error(`Error registering themes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    name: 'theme-registry',

    async buildStart() {
      logger.info('📚 Theme Registry: Registering themes...');
      await registerThemes();
    },

    configureServer(server: any) {
      // Add theme information to server context
      server.context = server.context || {};
      server.context.themes = themes;

      // Add endpoints for theme registry
      server.addHandler({
        path: '/__bunpress/themes',
        method: 'GET',
        handler: (_req: Request) => {
          return new Response(
            JSON.stringify({
              themes: Array.from(themes.entries()).map(([name, theme]) => ({
                name,
                valid: theme.valid,
                layouts: Object.keys(theme.layouts),
              })),
              activeTheme: server.context.config?.themeConfig?.name || 'docs',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        },
      });
    },
  };
}

export default themeRegistryPlugin;
