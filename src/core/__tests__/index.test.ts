import { describe, expect, test } from 'bun:test';
import * as coreExports from '../index';

describe('Core Index Exports', () => {
  test('exports all core components', () => {
    // Test for plugin exports
    expect(coreExports.DefaultPluginManager).toBeDefined();

    // Test for content processor exports
    expect(coreExports.ContentProcessor).toBeDefined();
    expect(coreExports.processMarkdownContent).toBeDefined();

    // Test for router exports
    expect(coreExports.generateRoutes).toBeDefined();
    expect(coreExports.generateRoutesAsync).toBeDefined();

    // Test for builder exports
    expect(coreExports.buildSite).toBeDefined();
    expect(coreExports.build).toBeDefined();

    // Test for config loader exports
    expect(coreExports.loadConfig).toBeDefined();

    // Test for theme manager exports
    expect(coreExports.DefaultThemeManager).toBeDefined();
  });

  test('exports necessary types', () => {
    // We can't directly test for type exports since they're erased at runtime,
    // but we can ensure the module exports are complete
    const exportNames = Object.keys(coreExports);

    // Check for minimum expected number of exports
    expect(exportNames.length).toBeGreaterThan(8);

    // Some type exports might be used by TypeScript even if they don't exist at runtime
    // The main goal here is to ensure the index file exports everything it should
  });
});
