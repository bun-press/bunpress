import fs from 'fs';
import path from 'path';
import { Plugin } from '../../core/plugin';

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
 * Plugin to manage theme registration and integration
 */
export function themeRegistryPlugin(options: ThemeRegistryPluginOptions = {}): Plugin {
  const themesDir = options.themesDir || 'themes';
  const validateThemes = options.validateThemes !== false;

  const themes = new Map<string, ThemeStructure>();

  // Function to register a single theme
  function registerTheme(themeName: string, themePath: string) {
    // Find the main component file - check both Layout.tsx and index.tsx
    let mainComponent = path.join(themePath, 'Layout.tsx');
    if (!fs.existsSync(mainComponent)) {
      mainComponent = path.join(themePath, 'index.tsx');
      if (!fs.existsSync(mainComponent)) {
        if (validateThemes) {
          console.warn(`Theme "${themeName}" does not have a Layout.tsx or index.tsx file`);
        }
        return;
      }
    }

    // Find theme's style file
    const styleFile = path.join(themePath, 'styles.css');
    if (!fs.existsSync(styleFile) && validateThemes) {
      console.warn(`Theme "${themeName}" does not have a styles.css file`);
    }

    // Find layout components in the layouts directory
    const layoutsDir = path.join(themePath, 'layouts');
    const layouts: ThemeStructure['layouts'] = {};

    if (fs.existsSync(layoutsDir)) {
      // Get all layout files (e.g., DocLayout.tsx, PageLayout.tsx, etc.)
      const layoutFiles = fs
        .readdirSync(layoutsDir)
        .filter(file => file.endsWith('.tsx') && !file.endsWith('.test.tsx'));

      for (const layoutFile of layoutFiles) {
        const layoutName = layoutFile.replace(/Layout\.tsx$/, '').toLowerCase();
        layouts[layoutName] = path.join(layoutsDir, layoutFile);
      }
    }

    // Check if we have required layouts
    const valid =
      fs.existsSync(mainComponent) &&
      (fs.existsSync(styleFile) || !validateThemes) &&
      (Object.keys(layouts).length > 0 || !validateThemes);

    // Register the theme
    themes.set(themeName, {
      name: themeName,
      path: themePath,
      layouts,
      component: mainComponent,
      styles: fs.existsSync(styleFile) ? styleFile : '',
      valid,
    });

    if (valid) {
      console.log(`✅ Registered theme: ${themeName}`);
    } else {
      console.warn(`⚠️ Theme "${themeName}" was registered but may be missing required files`);
    }
  }

  // Function to register all available themes
  function registerThemes() {
    const workspaceRoot = process.cwd();
    const themesFolderPath = path.join(workspaceRoot, themesDir);

    if (!fs.existsSync(themesFolderPath)) {
      console.warn(`Themes directory not found at ${themesFolderPath}`);
      return;
    }

    const themeDirectories = fs
      .readdirSync(themesFolderPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const themeName of themeDirectories) {
      const themePath = path.join(themesFolderPath, themeName);
      registerTheme(themeName, themePath);
    }

    console.log(`✅ Registered ${themes.size} themes: ${Array.from(themes.keys()).join(', ')}`);
  }

  return {
    name: 'theme-registry',

    buildStart() {
      console.log('📚 Theme Registry: Registering themes...');
      registerThemes();
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
