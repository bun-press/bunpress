import { describe, test, expect, spyOn } from 'bun:test';
import seoPlugin from '../index';

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
    expect(transformed).toContain('<meta property="og:image" content="https://example.com/image.png" />');
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
}); 