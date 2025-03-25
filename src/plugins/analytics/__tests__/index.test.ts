import { describe, test, expect } from 'bun:test';
import analyticsPlugin from '../index';
import type { Plugin } from '../../../core/plugin';

// Type with the transform method as implemented in our plugin
interface AnalyticsPlugin extends Plugin {
  transform: (content: string, id?: string) => string;
}

describe('Analytics Plugin', () => {
  test('adds Google Analytics code', () => {
    const plugin = analyticsPlugin({
      type: 'google-analytics',
      googleAnalyticsId: 'G-XXXXXXXXXX',
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain('googletagmanager.com/gtag/js');
    expect(transformedContent).toContain('G-XXXXXXXXXX');
    expect(transformedContent).toContain('window.dataLayer = window.dataLayer || []');
  });

  test('adds Google Tag Manager code', () => {
    const plugin = analyticsPlugin({
      type: 'google-tag-manager',
      googleTagManagerId: 'GTM-XXXXXXX',
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain('googletagmanager.com/gtm.js');
    expect(transformedContent).toContain('GTM-XXXXXXX');
  });

  test('adds Fathom Analytics code', () => {
    const plugin = analyticsPlugin({
      type: 'fathom',
      fathomSiteId: 'ABCDEF',
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain('usefathom.com/script.js');
    expect(transformedContent).toContain('data-site="ABCDEF"');
  });

  test('adds Plausible Analytics code', () => {
    const plugin = analyticsPlugin({
      type: 'plausible',
      plausibleDomain: 'example.com',
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain('plausible.io/js/script.js');
    expect(transformedContent).toContain('data-domain="example.com"');
  });

  test('adds Umami Analytics code', () => {
    const plugin = analyticsPlugin({
      type: 'umami',
      umamiWebsiteId: '12345-67890',
      umamiSrcUrl: 'https://custom.umami.is/script.js',
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain('data-website-id="12345-67890"');
    expect(transformedContent).toContain('src="https://custom.umami.is/script.js"');
  });

  test('adds custom analytics code', () => {
    const customCode = '<script>console.log("Custom analytics");</script>';
    const plugin = analyticsPlugin({
      type: 'custom',
      customCode,
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toContain(customCode);
  });

  test('does not add analytics code for non-HTML files', () => {
    const plugin = analyticsPlugin({
      type: 'google-analytics',
      googleAnalyticsId: 'G-XXXXXXXXXX',
    }) as AnalyticsPlugin;

    const inputContent = 'body { color: black; }';
    const transformedContent = plugin.transform(inputContent, 'style.css');

    expect(transformedContent).toBe(inputContent);
  });

  test('does not add code when no ID is provided', () => {
    const plugin = analyticsPlugin({
      type: 'google-analytics',
      // No ID provided
    }) as AnalyticsPlugin;

    const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
    const transformedContent = plugin.transform(inputHtml, 'test.html');

    expect(transformedContent).toBe(inputHtml);
  });

  test('respects includeDevelopment setting', () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      // Set to development
      process.env.NODE_ENV = 'development';

      // With includeDevelopment = false (default)
      const pluginDefault = analyticsPlugin({
        type: 'google-analytics',
        googleAnalyticsId: 'G-XXXXXXXXXX',
      }) as AnalyticsPlugin;

      const inputHtml = '<html><head><title>Test</title></head><body>Test content</body></html>';
      let transformedContent = pluginDefault.transform(inputHtml, 'test.html');

      // Should not include analytics in development mode by default
      expect(transformedContent).toBe(inputHtml);

      // With includeDevelopment = true
      const pluginWithDev = analyticsPlugin({
        type: 'google-analytics',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        includeDevelopment: true,
      }) as AnalyticsPlugin;

      transformedContent = pluginWithDev.transform(inputHtml, 'test.html');

      // Should include analytics in development mode when enabled
      expect(transformedContent).toContain('googletagmanager.com/gtag/js');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
