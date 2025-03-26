import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { jest } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { themeRegistryPlugin } from '..';
import type { Plugin } from '../../../core/plugin';

// Type for theme structure used in the server context
interface ThemeStructure {
  name: string;
  path: string;
  layouts: Record<string, string>;
  component: string;
  styles: string;
  valid: boolean;
}

// Type for server context with themes
interface ServerContext {
  themes: Map<string, ThemeStructure>;
  [key: string]: any;
}

// Create a real test environment with actual file system
describe('Theme Registry Plugin', () => {
  // Set up absolute paths to ensure they exist
  const TEST_DIR = path.join(process.cwd(), 'tmp-test-theme-registry');
  const THEMES_DIR = path.join(TEST_DIR, 'themes');
  const VALID_THEME_DIR = path.join(THEMES_DIR, 'valid-theme');
  const INVALID_THEME_DIR = path.join(THEMES_DIR, 'invalid-theme');

  // Save original process.cwd
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Clean up any existing test directories to ensure fresh state
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Create test directories
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(THEMES_DIR, { recursive: true });
    fs.mkdirSync(VALID_THEME_DIR, { recursive: true });
    fs.mkdirSync(INVALID_THEME_DIR, { recursive: true });

    // Create layouts directory for valid theme
    fs.mkdirSync(path.join(VALID_THEME_DIR, 'layouts'), { recursive: true });

    // Create valid theme files
    fs.writeFileSync(
      path.join(VALID_THEME_DIR, 'index.tsx'),
      'export default function Layout() { return null; }'
    );
    fs.writeFileSync(path.join(VALID_THEME_DIR, 'styles.css'), 'body { color: black; }');
    fs.writeFileSync(
      path.join(VALID_THEME_DIR, 'layouts', 'DocLayout.tsx'),
      'export default function DocLayout() { return null; }'
    );

    // Create an invalid theme with missing files
    fs.writeFileSync(
      path.join(INVALID_THEME_DIR, 'index.tsx'),
      'export default function Layout() { return null; }'
    );

    // Override process.cwd to point to our test directory
    process.cwd = () => TEST_DIR;
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Restore original process.cwd
    process.cwd = originalCwd;
  });

  it('should register valid themes correctly', async () => {
    // Create the plugin
    const plugin = themeRegistryPlugin() as Plugin;

    // Call buildStart method
    await plugin.buildStart?.();

    // Create server context with mock addHandler
    const addHandlerSpy = jest.fn();
    const server = { 
      context: {} as ServerContext,
      addHandler: addHandlerSpy
    };
    
    // Configure server to populate themes in context
    plugin.configureServer?.(server);
    
    // Check the themes in the server context
    expect(server.context.themes).toBeDefined();
    
    // Convert the Map to an array of theme names
    const themeNames = Array.from(server.context.themes.keys());
    
    // Verify that valid-theme is registered
    expect(themeNames).toContain('valid-theme');
    
    // Get the valid theme info
    const validTheme = server.context.themes.get('valid-theme');
    expect(validTheme).toBeDefined();
    
    // Only test properties if validTheme is defined
    if (validTheme) {
      expect(validTheme.name).toBe('valid-theme');
      expect(validTheme.path).toBe(path.join(THEMES_DIR, 'valid-theme'));
      expect(validTheme.styles).toBe(path.join(THEMES_DIR, 'valid-theme', 'styles.css'));
      expect(validTheme.layouts.doc).toBe(path.join(VALID_THEME_DIR, 'layouts', 'DocLayout.tsx'));
    }
  });

  it('should warn about invalid themes', async () => {
    // Create the plugin with validation enabled
    const plugin = themeRegistryPlugin({ validateThemes: true }) as Plugin;

    // Call buildStart method
    await plugin.buildStart?.();

    // Create server context with mock addHandler
    const addHandlerSpy = jest.fn();
    const server = { 
      context: {} as ServerContext,
      addHandler: addHandlerSpy
    };
    
    // Configure server to populate themes in context
    plugin.configureServer?.(server);
    
    // Check the themes in the server context
    expect(server.context.themes).toBeDefined();
    
    // Convert the Map to an array of theme names
    const themeNames = Array.from(server.context.themes.keys());
    
    // Verify that only the valid theme is registered with validateThemes=true
    expect(themeNames).not.toContain('invalid-theme');
    expect(themeNames).toContain('valid-theme');
    expect(themeNames.length).toBe(1);
  });

  it('should configure server with themes endpoint', async () => {
    // Create the plugin
    const plugin = themeRegistryPlugin() as Plugin;

    // Mock server object with addHandler method
    const addHandlerSpy = jest.fn();
    const server = {
      context: {} as ServerContext,
      addHandler: addHandlerSpy,
    };

    // Call configureServer method
    plugin.configureServer?.(server);

    // Check that server context includes themes
    expect(server.context.themes).toBeDefined();

    // Check that handler was added for themes endpoint
    expect(addHandlerSpy).toHaveBeenCalledWith({
      path: '/__bunpress/themes',
      method: 'GET',
      handler: expect.any(Function),
    });
  });

  it('should handle custom themes directory', async () => {
    // Create custom themes directory
    const CUSTOM_THEMES_DIR = path.join(TEST_DIR, 'custom-themes');
    fs.mkdirSync(CUSTOM_THEMES_DIR, { recursive: true });

    // Create a valid theme in the custom directory
    const CUSTOM_THEME_DIR = path.join(CUSTOM_THEMES_DIR, 'custom-theme');
    fs.mkdirSync(CUSTOM_THEME_DIR, { recursive: true });
    fs.mkdirSync(path.join(CUSTOM_THEME_DIR, 'layouts'), { recursive: true });
    fs.writeFileSync(
      path.join(CUSTOM_THEME_DIR, 'index.tsx'),
      'export default function Layout() { return null; }'
    );
    fs.writeFileSync(path.join(CUSTOM_THEME_DIR, 'styles.css'), 'body { color: black; }');
    fs.writeFileSync(
      path.join(CUSTOM_THEME_DIR, 'layouts', 'DocLayout.tsx'),
      'export default function DocLayout() { return null; }'
    );

    // Create the plugin with custom themes directory
    const plugin = themeRegistryPlugin({ themesDir: 'custom-themes' }) as Plugin;

    // Call buildStart method
    await plugin.buildStart?.();

    // Create server context with mock addHandler
    const addHandlerSpy = jest.fn();
    const server = { 
      context: {} as ServerContext,
      addHandler: addHandlerSpy
    };
    
    // Configure server to populate themes in context
    plugin.configureServer?.(server);
    
    // Check the themes in the server context
    expect(server.context.themes).toBeDefined();
    
    // Convert the Map to an array of theme names
    const themeNames = Array.from(server.context.themes.keys());
    
    // Verify that custom-theme is registered
    expect(themeNames).toContain('custom-theme');
    
    // Get the custom theme info
    const customTheme = server.context.themes.get('custom-theme');
    expect(customTheme).toBeDefined();
    
    // Only test properties if customTheme is defined
    if (customTheme) {
      expect(customTheme.name).toBe('custom-theme');
      expect(customTheme.path).toBe(path.join(CUSTOM_THEMES_DIR, 'custom-theme'));
      expect(customTheme.styles).toBe(path.join(CUSTOM_THEMES_DIR, 'custom-theme', 'styles.css'));
    }
  });
});
