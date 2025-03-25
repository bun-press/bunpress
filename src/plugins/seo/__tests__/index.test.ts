import { describe, test, expect, mock } from 'bun:test';
import seoPlugin from '../index';
import * as fs from 'fs';

// Simple mock for fs.writeFileSync to avoid filesystem interactions
mock.module('fs', () => {
  const originalFs = { ...fs };
  return {
    ...originalFs,
    writeFileSync: mock(() => {}),
    existsSync: mock(() => true),
    mkdirSync: mock(() => {}),
  };
});

describe('SEO Plugin', () => {
  test('should create plugin with default options', () => {
    const plugin = seoPlugin();
    expect(plugin.name).toBe('seo');
    expect(plugin.options).toEqual({});
  });

  test('should transform HTML content with meta tags', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test Site',
      siteDescription: 'Test Description',
      siteUrl: 'https://example.com',
      defaultImage: '/image.png',
      twitterHandle: 'testhandle',
    });

    const htmlContent = '<html><head></head><body>Test</body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Check meta tags
    expect(transformed).toContain('<meta property="og:title" content="Test Site" />');
    expect(transformed).toContain('<meta property="og:description" content="Test Description" />');
    expect(transformed).toContain('<meta property="og:url" content="https://example.com/" />');
    expect(transformed).toContain(
      '<meta property="og:image" content="https://example.com/image.png" />'
    );
    expect(transformed).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(transformed).toContain('<meta name="twitter:site" content="@testhandle" />');
    expect(transformed).toContain('<link rel="canonical" href="https://example.com/" />');
  });

  test('should respect page-specific metadata', () => {
    const plugin = seoPlugin({
      siteTitle: 'Default Title',
      siteDescription: 'Default Description',
      siteUrl: 'https://example.com',
    });

    const htmlContent = `
      <html>
      <head>
        <title>Page Title</title>
        <meta name="description" content="Page Description" />
      </head>
      <body></body>
      </html>
    `;

    const transformed = plugin.transform?.(htmlContent) || '';

    // Check if page-specific metadata was used
    expect(transformed).toContain('<meta property="og:title" content="Page Title" />');
    expect(transformed).toContain('<meta property="og:description" content="Page Description" />');
  });

  test('should add JSON-LD when enabled', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test Site',
      siteDescription: 'Test Description',
      siteUrl: 'https://example.com',
      addJsonLd: true,
    });

    const htmlContent = '<html><head></head><body></body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Check if JSON-LD was injected
    expect(transformed).toContain('<script type="application/ld+json">');
    expect(transformed).toContain('"@context": "https://schema.org"');
    expect(transformed).toContain('"@type": "WebPage"');
  });

  test('should not modify non-HTML content', () => {
    const plugin = seoPlugin();

    const markdownContent = '# Heading\n\nThis is some markdown content.';
    const transformed = plugin.transform?.(markdownContent) || '';

    // No changes should be made
    expect(transformed).toBe(markdownContent);
  });

  // Additional comprehensive tests

  test('should properly handle HTML content with existing meta tags', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test Site',
      siteDescription: 'Test Description',
      siteUrl: 'https://example.com',
    });

    const htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="index, follow">
        <title>Existing Title</title>
      </head>
      <body></body>
      </html>
    `;

    const transformed = plugin.transform?.(htmlContent) || '';

    // Should add SEO tags but not duplicate or remove existing ones
    expect(transformed).toContain('<meta charset="UTF-8">');
    expect(transformed).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
    expect(transformed).toContain('<meta name="robots" content="index, follow">');
    expect(transformed).toContain('<meta property="og:title" content="Existing Title" />');
  });

  test('should correctly handle absolute and relative image paths', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test Site',
      siteUrl: 'https://example.com',
      defaultImage: '/images/default.jpg',
    });

    const htmlContent = '<html><head></head><body></body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Should convert relative image path to absolute URL
    expect(transformed).toContain(
      '<meta property="og:image" content="https://example.com/images/default.jpg" />'
    );

    // Test with absolute image URL
    const pluginWithAbsoluteImage = seoPlugin({
      siteTitle: 'Test Site',
      siteUrl: 'https://example.com',
      defaultImage: 'https://cdn.example.com/images/default.jpg',
    });

    const transformedWithAbsoluteImage = pluginWithAbsoluteImage.transform?.(htmlContent) || '';

    // Should preserve absolute image URL
    expect(transformedWithAbsoluteImage).toContain(
      '<meta property="og:image" content="https://cdn.example.com/images/default.jpg" />'
    );
  });

  test('should handle special characters in metadata properly', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test & Demo Site',
      siteDescription: 'Testing < and > characters & "quotes"',
      siteUrl: 'https://example.com',
    });

    const htmlContent = '<html><head></head><body></body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Verify special characters are properly handled
    expect(transformed).toContain('<meta property="og:title" content="Test & Demo Site" />');
    expect(transformed).toContain(
      '<meta property="og:description" content="Testing < and > characters & "quotes"" />'
    );
  });

  test('should generate appropriate Twitter card tags', () => {
    const plugin = seoPlugin({
      siteTitle: 'Test Site',
      siteDescription: 'Test Description',
      siteUrl: 'https://example.com',
      defaultImage: '/image.png',
      twitterHandle: 'testhandle',
    });

    const htmlContent = '<html><head></head><body></body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Check Twitter card tags
    expect(transformed).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(transformed).toContain('<meta name="twitter:site" content="@testhandle" />');
    expect(transformed).toContain('<meta name="twitter:title" content="Test Site" />');
    expect(transformed).toContain('<meta name="twitter:description" content="Test Description" />');
    expect(transformed).toContain(
      '<meta name="twitter:image" content="https://example.com/image.png" />'
    );

    // Test with Twitter handle that already has @
    const pluginWithAtHandle = seoPlugin({
      twitterHandle: '@otherhandle',
    });

    const transformedWithAtHandle = pluginWithAtHandle.transform?.(htmlContent) || '';
    expect(transformedWithAtHandle).toContain(
      '<meta name="twitter:site" content="@otherhandle" />'
    );
  });

  test('should respect generateRobotsTxt and generateSitemap options', () => {
    // Test with disabled options
    const plugin = seoPlugin({
      siteUrl: 'https://example.com',
      generateRobotsTxt: false,
      generateSitemap: false,
    });

    // Plugin should exist with the correct options
    expect(plugin.options).toEqual({
      siteUrl: 'https://example.com',
      generateRobotsTxt: false,
      generateSitemap: false,
    });
  });

  test('should inject appropriate canonical URL', () => {
    const plugin = seoPlugin({
      siteUrl: 'https://example.com',
      addCanonicalUrls: true,
    });

    const htmlContent = '<html><head></head><body data-page-path="/test-page"></body></html>';
    const transformed = plugin.transform?.(htmlContent) || '';

    // Should add canonical URL for the specific page
    expect(transformed).toContain('<link rel="canonical" href="https://example.com/test-page" />');

    // Test with trailing slash in site URL
    const pluginWithTrailingSlash = seoPlugin({
      siteUrl: 'https://example.com/',
      addCanonicalUrls: true,
    });

    const transformedWithTrailingSlash = pluginWithTrailingSlash.transform?.(htmlContent) || '';

    // Should handle URL concatenation correctly
    expect(transformedWithTrailingSlash).toContain(
      '<link rel="canonical" href="https://example.com/test-page" />'
    );
    expect(transformedWithTrailingSlash).not.toContain('//test-page');
  });
});
