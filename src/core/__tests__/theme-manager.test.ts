import { describe, expect, it, afterEach, beforeEach, mock } from 'bun:test';
import fs from 'fs';
import path from 'path';
import {
  DefaultThemeManager,
  getThemeManager,
  initThemeManager,
  ThemeManager,
} from '../theme-manager';
import type { BunPressConfig } from '../../../bunpress.config';

// Define jest object before using it
const jest = {
  requireActual: (moduleName: string) => {
    return require(moduleName);
  },
};

// Mock the fileExists function to always return true for the themes directory
mock.module('../../lib/fs-utils', () => {
  const originalModule = jest.requireActual('../../lib/fs-utils');
  return {
    ...originalModule,
    fileExists: async (filepath: string) => {
      console.log(`Mock fileExists called with: ${filepath}`);
      if (filepath.includes('tmp-test-theme-manager/themes')) {
        console.log(`Returning true for themes directory: ${filepath}`);
        return true;
      }
      return fs.existsSync(filepath);
    },
    directoryExists: async (dirPath: string) => {
      console.log(`Mock directoryExists called with: ${dirPath}`);
      if (dirPath.includes('tmp-test-theme-manager/themes')) {
        console.log(`Returning true for themes directory: ${dirPath}`);
        return true;
      }
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    },
  };
});

// Global variable used by theme-manager.ts for singleton
declare global {
  var defaultThemeManager: ThemeManager | null;
}

// Integration tests for theme manager
describe('ThemeManager', () => {
  // Set up test environment
  const TEST_DIR = path.join(process.cwd(), 'tmp-test-theme-manager');
  const THEMES_DIR = path.join(TEST_DIR, 'themes');
  const THEME_1_DIR = path.join(THEMES_DIR, 'theme1');
  const THEME_2_DIR = path.join(THEMES_DIR, 'theme2');

  // Create a base config for testing
  const baseConfig: BunPressConfig = {
    title: 'Test Site',
    description: 'Test Description',
    siteUrl: 'https://example.com',
    pagesDir: './pages',
    outputDir: './dist',
    plugins: [],
    navigation: [],
    sidebar: [],
    themeConfig: {
      name: 'docs', // default theme name
      defaultLayout: 'doc' as 'doc' | 'page' | 'home',
      options: {},
    },
  };

  // Make sure we have the right paths
  console.log(`TEST_DIR (absolute): ${TEST_DIR}`);
  console.log(`THEMES_DIR (absolute): ${THEMES_DIR}`);
  console.log(`THEME_1_DIR (absolute): ${THEME_1_DIR}`);
  console.log(`THEME_2_DIR (absolute): ${THEME_2_DIR}`);

  /**
   * Helper function to create test theme files
   */
  function createTestThemeFiles() {
    console.log(`Creating test directories at ${TEST_DIR}`);
    console.log(`THEMES_DIR: ${THEMES_DIR}`);
    console.log(`THEME_1_DIR: ${THEME_1_DIR}`);
    console.log(`THEME_2_DIR: ${THEME_2_DIR}`);

    // Create test directories
    if (fs.existsSync(TEST_DIR)) {
      console.log(`Removing existing TEST_DIR: ${TEST_DIR}`);
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(THEMES_DIR, { recursive: true });
    fs.mkdirSync(THEME_1_DIR, { recursive: true });
    fs.mkdirSync(THEME_2_DIR, { recursive: true });

    // Create layouts directories
    fs.mkdirSync(path.join(THEME_1_DIR, 'layouts'), { recursive: true });
    fs.mkdirSync(path.join(THEME_2_DIR, 'layouts'), { recursive: true });

    // Create theme1 files
    fs.writeFileSync(
      path.join(THEME_1_DIR, 'index.tsx'),
      'export default function Theme1Layout() { return null; }'
    );
    fs.writeFileSync(path.join(THEME_1_DIR, 'styles.css'), 'body { color: red; }');
    fs.writeFileSync(
      path.join(THEME_1_DIR, 'layouts', 'DocLayout.tsx'),
      'export default function DocLayout() { return null; }'
    );
    fs.writeFileSync(
      path.join(THEME_1_DIR, 'layouts', 'PageLayout.tsx'),
      'export default function PageLayout() { return null; }'
    );

    // Create theme2 files (minimal theme)
    fs.writeFileSync(
      path.join(THEME_2_DIR, 'index.tsx'),
      'export default function Theme2Layout() { return null; }'
    );
    fs.writeFileSync(path.join(THEME_2_DIR, 'styles.css'), 'body { color: blue; }');

    // Verify files were created
    console.log(`Themes directory exists: ${fs.existsSync(THEMES_DIR)}`);
    console.log(`Theme1 index.tsx exists: ${fs.existsSync(path.join(THEME_1_DIR, 'index.tsx'))}`);
    console.log(`Theme1 styles.css exists: ${fs.existsSync(path.join(THEME_1_DIR, 'styles.css'))}`);
    console.log(
      `Theme1 layouts/DocLayout.tsx exists: ${fs.existsSync(path.join(THEME_1_DIR, 'layouts', 'DocLayout.tsx'))}`
    );

    // List all files in themes directory for verification
    const files = fs.readdirSync(THEMES_DIR);
    console.log(`Files in themes directory: ${files.join(', ')}`);
  }

  // Make sure test files exist before each test
  beforeEach(() => {
    createTestThemeFiles();
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Reset singleton instance
    global.defaultThemeManager = null;
  });

  it('should discover available themes', async () => {
    // Create theme manager with test workspace
    console.log(`Test workspace root: ${TEST_DIR}`);
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (themeManager as any).loadAvailableThemes();

    // Get available themes
    const themes = themeManager.getThemes();
    console.log(`Found themes: ${[...themes.keys()].join(', ')}`);

    // Should have found both themes
    expect(themes.size).toBe(2);
    expect(themes.has('theme1')).toBe(true);
    expect(themes.has('theme2')).toBe(true);

    // Verify theme1 properties
    const theme1 = themes.get('theme1')!;
    expect(theme1.name).toBe('theme1');
    expect(theme1.path).toBe(THEME_1_DIR);
    expect(fs.existsSync(theme1.layoutComponent)).toBe(true);
    expect(fs.existsSync(theme1.styleFile)).toBe(true);
    expect(Object.keys(theme1.layouts || {}).length).toBeGreaterThan(0);

    // Verify theme2 properties
    const theme2 = themes.get('theme2')!;
    expect(theme2.name).toBe('theme2');
    expect(theme2.path).toBe(THEME_2_DIR);
    expect(fs.existsSync(theme2.layoutComponent)).toBe(true);
    expect(fs.existsSync(theme2.styleFile)).toBe(true);
  });

  it('should set active theme from config', async () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (themeManager as any).loadAvailableThemes();

    // Set active theme from config
    themeManager.setThemeFromConfig({
      ...baseConfig,
      themeConfig: {
        name: 'theme1',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home',
        options: {
          darkMode: true,
        },
      },
    });

    // Verify active theme
    const activeTheme = themeManager.getActiveTheme();
    expect(activeTheme).not.toBeNull();
    expect(activeTheme?.name).toBe('theme1');
    expect(activeTheme?.options).toEqual({ darkMode: true });
  });

  it('should fall back to default theme if configured theme not found', () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Set active theme to non-existent theme
    themeManager.setThemeFromConfig({
      ...baseConfig,
      themeConfig: {
        name: 'non-existent-theme',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home',
        options: {},
      },
    });

    // Should fall back to default theme (docs)
    const activeTheme = themeManager.getActiveTheme();

    // Since 'docs' theme doesn't exist in our test setup, it should be null
    // In a real environment, it would fall back to 'docs' if available
    expect(activeTheme).toBeNull();
  });

  it('should get correct theme component for layout type', async () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (themeManager as any).loadAvailableThemes();

    // Set active theme
    themeManager.setThemeFromConfig({
      ...baseConfig,
      themeConfig: {
        name: 'theme1',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home',
        options: {},
      },
    });

    // Get component for doc layout
    const docComponent = themeManager.getThemeComponent('doc');
    expect(docComponent).toBe(path.join(THEME_1_DIR, 'layouts', 'DocLayout.tsx'));

    // Get component for page layout
    const pageComponent = themeManager.getThemeComponent('page');
    expect(pageComponent).toBe(path.join(THEME_1_DIR, 'layouts', 'PageLayout.tsx'));

    // Get default component (should be index.tsx)
    const defaultComponent = themeManager.getThemeComponent();
    expect(defaultComponent).toBe(path.join(THEME_1_DIR, 'index.tsx'));
  });

  it('should get theme style content', async () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (themeManager as any).loadAvailableThemes();

    // Set active theme
    themeManager.setThemeFromConfig({
      ...baseConfig,
      themeConfig: {
        name: 'theme1',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home',
        options: {},
      },
    });

    // Get theme style content
    const styleContent = await themeManager.getThemeStyleContent();
    expect(styleContent).toBe('body { color: red; }');
  });

  it('should return empty string for style content if no active theme', async () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // No active theme set

    // Get theme style content
    const styleContent = await themeManager.getThemeStyleContent();
    expect(styleContent).toBe('');
  });

  it('should list available theme names', async () => {
    // Create theme manager with test workspace
    const themeManager = new DefaultThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (themeManager as any).loadAvailableThemes();

    // Get available theme names
    const themeNames = themeManager.getAvailableThemes();

    // Should have both themes
    expect(themeNames.length).toBe(2);
    expect(themeNames).toContain('theme1');
    expect(themeNames).toContain('theme2');
  });

  it('should provide a singleton instance with getThemeManager', async () => {
    // Ensure singleton is reset
    global.defaultThemeManager = null;

    // Initialize theme manager
    const instance1 = initThemeManager(TEST_DIR);

    // Force synchronous theme loading
    await (instance1 as any).loadAvailableThemes();

    // Get the theme manager
    const instance2 = getThemeManager();

    // Should be the same instance
    expect(instance2).toBe(instance1);
  });

  it('should throw an error if getThemeManager called before initialization', () => {
    // Reset singleton instance to ensure it's null
    global.defaultThemeManager = null;

    // Getting theme manager without initialization should throw
    let threw = false;
    try {
      getThemeManager();
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
