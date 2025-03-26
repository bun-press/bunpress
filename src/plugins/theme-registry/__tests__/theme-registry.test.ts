import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { spyOn } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { themeRegistryPlugin } from '..';
import type { Plugin } from '../../../core/plugin';

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

  it('should register valid themes correctly', () => {
    // Create a console spy
    const consoleLogSpy = spyOn(console, 'log');

    // Create the plugin
    const plugin = themeRegistryPlugin() as Plugin;

    // Call buildStart method
    plugin.buildStart?.();

    // Verify logs indicate theme registration
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Theme Registry: Registering themes')
    );

    // Valid theme should be registered
    const validThemeRegistered = consoleLogSpy.mock.calls.some(
      call => typeof call[0] === 'string' && call[0].includes('✅ Registered theme: valid-theme')
    );
    expect(validThemeRegistered).toBe(true);

    // Check for registered themes summary
    const themesRegisteredSummary = consoleLogSpy.mock.calls.some(
      call => typeof call[0] === 'string' && call[0].includes('Registered 2 themes')
    );
    expect(themesRegisteredSummary).toBe(true);

    // Restore spy
    consoleLogSpy.mockRestore();
  });

  it('should warn about invalid themes', () => {
    // Create a console spy
    const consoleWarnSpy = spyOn(console, 'warn');

    // Create the plugin with validation enabled
    const plugin = themeRegistryPlugin({ validateThemes: true }) as Plugin;

    // Call buildStart method
    plugin.buildStart?.();

    // Verify warning about missing styles.css
    const stylesMissingWarning = consoleWarnSpy.mock.calls.some(
      call => typeof call[0] === 'string' && call[0].includes('does not have a styles.css file')
    );
    expect(stylesMissingWarning).toBe(true);

    // Restore spy
    consoleWarnSpy.mockRestore();
  });

  it('should configure server with themes endpoint', () => {
    // Create the plugin
    const plugin = themeRegistryPlugin() as Plugin;

    // Mock server object with addHandler method
    const addHandlerSpy = spyOn({ addHandler: () => {} }, 'addHandler');
    const server = {
      context: {} as Record<string, any>,
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

    // Restore spy
    addHandlerSpy.mockRestore();
  });

  it('should handle custom themes directory', () => {
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

    // Create a console spy
    const consoleLogSpy = spyOn(console, 'log');

    // Create the plugin with custom themes directory
    const plugin = themeRegistryPlugin({ themesDir: 'custom-themes' }) as Plugin;

    // Call buildStart method
    plugin.buildStart?.();

    // Verify logs indicate theme registration from custom directory
    const customThemeRegistered = consoleLogSpy.mock.calls.some(
      call => typeof call[0] === 'string' && call[0].includes('✅ Registered theme: custom-theme')
    );
    expect(customThemeRegistered).toBe(true);

    // Restore spy
    consoleLogSpy.mockRestore();
  });
});
