import { describe, test, expect, beforeEach } from 'bun:test';
import rssFeedPlugin from '../index';
import path from 'path';
import type { Plugin } from '../../../core/plugin';
import type { ContentFile } from '../../../core/content-processor';

// Define the extended plugin interface with test helpers
interface RssFeedPluginWithTest extends Plugin {
  __test__: {
    addContentFile: (file: ContentFile) => void;
    clearContentFiles: () => void;
    getContentFiles: () => ContentFile[];
    generateFeed: () => string;
  }
}

describe('RSS Feed Plugin', () => {
  // Mock file system functions
  const mockFs = {
    existsSync: () => true,
    mkdirSync: (() => {}) as any,
    writeFileSync: (() => {}) as any
  };

  beforeEach(() => {
    // Reset mocks
    mockFs.existsSync = () => true;
    mockFs.mkdirSync = (() => {}) as any;
    mockFs.writeFileSync = (() => {}) as any;
  });
  
  test('should create plugin with default options', () => {
    const plugin = rssFeedPlugin();
    expect(plugin.name).toBe('rss-feed');
    expect(plugin.options).toEqual({});
  });
  
  test('should generate RSS feed with default settings', () => {
    // Create plugin with mock filesystem
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      description: 'Test Feed Description',
      siteUrl: 'https://example.com',
      _fs: mockFs
    }) as RssFeedPluginWithTest;
    
    // Clear any existing content files and add a test file
    plugin.__test__.clearContentFiles();
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: {
        title: 'Test Page',
        description: 'Test page description',
        date: '2023-01-01'
      },
      content: '# Test Page\n\nThis is a test page.',
      html: '<h1>Test Page</h1><p>This is a test page.</p>'
    });
    
    // Generate the feed
    const feedContent = plugin.__test__.generateFeed();
    
    // Check basic feed properties
    expect(feedContent).toContain('<title>Test Feed</title>');
    expect(feedContent).toContain('<description>Test Feed Description</description>');
    expect(feedContent).toContain('<link>https://example.com</link>');
    expect(feedContent).toContain('<language>en</language>');
    
    // Check if it has items
    expect(feedContent).toContain('<item>');
    expect(feedContent).toContain('<title>Test Page</title>');
    expect(feedContent).toContain('<description>Test page description</description>');
    
    // Check if it has the XML declaration
    expect(feedContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    
    // Check if it has the correct RSS version
    expect(feedContent).toContain('<rss version="2.0"');
  });
  
  test('should skip feed generation if siteUrl is not provided', async () => {
    // Spy on writeFileSync to ensure it's not called
    let writeFileCalled = false;
    mockFs.writeFileSync = () => { writeFileCalled = true; };
    
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      _fs: mockFs
    });
    
    await plugin.buildStart?.();
    await plugin.buildEnd?.();
    
    // writeFileSync should not be called
    expect(writeFileCalled).toBe(false);
  });
  
  test('should skip feed generation if title is not provided', async () => {
    // Spy on writeFileSync to ensure it's not called
    let writeFileCalled = false;
    mockFs.writeFileSync = () => { writeFileCalled = true; };
    
    const plugin = rssFeedPlugin({
      siteUrl: 'https://example.com',
      _fs: mockFs
    });
    
    await plugin.buildStart?.();
    await plugin.buildEnd?.();
    
    // writeFileSync should not be called
    expect(writeFileCalled).toBe(false);
  });
  
  test('should create output directory if it does not exist', async () => {
    // Spy on existsSync and mkdirSync
    mockFs.existsSync = () => false;
    let mkdirCalled = false;
    mockFs.mkdirSync = () => { mkdirCalled = true; };
    
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      description: 'Test Feed Description',
      siteUrl: 'https://example.com',
      _fs: mockFs
    });
    
    await plugin.buildStart?.();
    await plugin.buildEnd?.();
    
    // mkdirSync should be called
    expect(mkdirCalled).toBe(true);
  });
  
  test('should use custom filename if provided', async () => {
    // Spy on writeFileSync to check filename
    const customFilename = 'custom-feed.xml';
    let writtenFilename = '';
    
    mockFs.writeFileSync = (filePath: string) => {
      writtenFilename = path.basename(filePath);
    };
    
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      description: 'Test Feed Description',
      siteUrl: 'https://example.com',
      filename: customFilename,
      _fs: mockFs
    });
    
    await plugin.buildStart?.();
    await plugin.buildEnd?.();
    
    // Should use the custom filename
    expect(writtenFilename).toBe(customFilename);
  });
  
  test('should respect sortItems option', () => {
    // Create a custom sort function that sorts by title alphabetically
    const customSortItems = (a: any, b: any) => {
      return a.frontmatter.title.localeCompare(b.frontmatter.title);
    };
    
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      description: 'Test Feed Description',
      siteUrl: 'https://example.com',
      sortItems: customSortItems,
      _fs: mockFs
    }) as RssFeedPluginWithTest;
    
    // Clear any existing content files and add test files in non-alphabetical order
    plugin.__test__.clearContentFiles();
    plugin.__test__.addContentFile({
      path: '/test/c.md',
      route: '/page-c',
      frontmatter: { title: 'C Page' },
      content: '',
      html: ''
    });
    
    plugin.__test__.addContentFile({
      path: '/test/a.md',
      route: '/page-a',
      frontmatter: { title: 'A Page' },
      content: '',
      html: ''
    });
    
    plugin.__test__.addContentFile({
      path: '/test/b.md',
      route: '/page-b',
      frontmatter: { title: 'B Page' },
      content: '',
      html: ''
    });
    
    // Generate the feed
    const feedContent = plugin.__test__.generateFeed();
    
    // Extract item titles (excluding the feed title)
    const titleMatches = [...feedContent.matchAll(/<title>(.*?)<\/title>/g)];
    const titles = titleMatches.map(match => match[1]).filter(title => title !== 'Test Feed');
    
    // The titles should be in alphabetical order (A, B, C)
    expect(titles).toEqual(['A Page', 'B Page', 'C Page']);
  });
  
  test('should respect the limit option', () => {
    const plugin = rssFeedPlugin({
      title: 'Test Feed',
      description: 'Test Feed Description',
      siteUrl: 'https://example.com',
      limit: 1, // Only include 1 item
      _fs: mockFs
    }) as RssFeedPluginWithTest;
    
    // Clear any existing content files and add multiple test files
    plugin.__test__.clearContentFiles();
    plugin.__test__.addContentFile({
      path: '/test/a.md',
      route: '/page-a',
      frontmatter: { title: 'A Page' },
      content: '',
      html: ''
    });
    
    plugin.__test__.addContentFile({
      path: '/test/b.md',
      route: '/page-b',
      frontmatter: { title: 'B Page' },
      content: '',
      html: ''
    });
    
    // Generate the feed
    const feedContent = plugin.__test__.generateFeed();
    
    // Count the number of items
    const itemCount = (feedContent.match(/<item>/g) || []).length;
    
    // Should only have 1 item due to the limit
    expect(itemCount).toBe(1);
  });
}); 