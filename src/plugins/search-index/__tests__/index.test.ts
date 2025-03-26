import { describe, test, expect, beforeEach } from 'bun:test';
import searchIndexPlugin from '../index';
import type { Plugin } from '../../../core/plugin';
import type { ContentFile } from '../../../core/content-processor';

// Define the extended plugin interface with test helpers
interface SearchIndexPluginWithTest extends Plugin {
  __test__: {
    addContentFile: (file: ContentFile) => void;
    clearContentFiles: () => void;
    getContentFiles: () => ContentFile[];
    generateSearchIndex: () => any[];
    processText: (text: string) => string;
    extractExcerpt: (html: string, length?: number) => string;
  };
}

describe('Search Index Plugin', () => {
  // Mock file system functions
  const mockFs = {
    existsSync: () => true,
    mkdirSync: (() => {}) as any,
    writeFileSync: (() => {}) as any,
  };

  let mockWritePath = '';
  let mockWriteContent = '';

  beforeEach(() => {
    // Reset mocks
    mockFs.existsSync = () => true;
    mockFs.mkdirSync = (() => {}) as any;
    mockFs.writeFileSync = ((path: string, content: string) => {
      mockWritePath = path;
      mockWriteContent = content;
    }) as any;
    mockWritePath = '';
    mockWriteContent = '';
  });

  test('should create plugin with default options', () => {
    const plugin = searchIndexPlugin();
    expect(plugin.name).toBe('search-index');
    expect(plugin.options).toEqual({});
  });

  test('should process text correctly', () => {
    const plugin = searchIndexPlugin() as SearchIndexPluginWithTest;

    // Test removing HTML tags
    expect(plugin.__test__.processText('<p>Hello <strong>world</strong></p>')).toBe('hello world');

    // Test removing stopwords
    expect(plugin.__test__.processText('This is a test')).toBe('test');

    // Test with punctuation
    expect(plugin.__test__.processText('Hello, world! This is a test.')).toBe('hello world test');
  });

  test('should extract excerpts correctly', () => {
    const plugin = searchIndexPlugin({
      snippetLength: 10,
    }) as SearchIndexPluginWithTest;

    // Test basic excerpt
    expect(plugin.__test__.extractExcerpt('<p>Short text</p>')).toBe('Short text');

    // Test truncation
    expect(
      plugin.__test__.extractExcerpt('<p>This is a longer text that should be truncated</p>', 10)
    ).toBe('This is a ...');

    // Test with HTML
    expect(
      plugin.__test__.extractExcerpt(
        '<h1>Title</h1><p>Content with <strong>bold</strong> text.</p>',
        20
      )
    ).toBe('Title Content with b...');
  });

  test('should generate search index correctly', () => {
    const plugin = searchIndexPlugin({
      _fs: mockFs,
    }) as SearchIndexPluginWithTest;

    // Clear any existing content files
    plugin.__test__.clearContentFiles();

    // Add a test file
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: {
        title: 'Test Page',
        description: 'Test page description',
        tags: ['test', 'example'],
      },
      content: '# Test Page\n\nThis is a test page.',
      html: '<h1>Test Page</h1><p>This is a test page.</p>',
    });

    // Generate the search index
    const searchIndex = plugin.__test__.generateSearchIndex();

    // Check search index content
    expect(searchIndex.length).toBe(1);
    expect(searchIndex[0].id).toBe('/test-page');
    expect(searchIndex[0].url).toBe('/test-page');
    expect(searchIndex[0].title).toBe('Test Page');
    expect(searchIndex[0].description).toBe('Test page description');
    expect(searchIndex[0].content).toBe('test page test page');
    expect(searchIndex[0].excerpt).toBe('Test Page This is a test page.');
  });

  test('should respect field configuration', () => {
    const plugin = searchIndexPlugin({
      fields: ['title', 'tags'], // Exclude description and content
      _fs: mockFs,
    }) as SearchIndexPluginWithTest;

    // Clear any existing content files
    plugin.__test__.clearContentFiles();

    // Add a test file
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: {
        title: 'Test Page',
        description: 'Test page description',
        tags: ['test', 'example'],
      },
      content: '# Test Page\n\nThis is a test page.',
      html: '<h1>Test Page</h1><p>This is a test page.</p>',
    });

    // Generate the search index
    const searchIndex = plugin.__test__.generateSearchIndex();

    // Check search index content
    expect(searchIndex[0].title).toBe('Test Page');
    expect(searchIndex[0].tags).toEqual(['test', 'example']);
    expect(searchIndex[0].description).toBeUndefined();
    expect(searchIndex[0].content).toBeUndefined();
  });

  test('should filter content files', () => {
    const plugin = searchIndexPlugin({
      filterItems: item => item.route === '/include-page',
      _fs: mockFs,
    }) as SearchIndexPluginWithTest;

    // Clear any existing content files
    plugin.__test__.clearContentFiles();

    // Add test files
    plugin.__test__.addContentFile({
      path: '/test/include.md',
      route: '/include-page',
      frontmatter: { title: 'Include Page' },
      content: 'Include this page',
      html: '<p>Include this page</p>',
    });

    plugin.__test__.addContentFile({
      path: '/test/exclude.md',
      route: '/exclude-page',
      frontmatter: { title: 'Exclude Page' },
      content: 'Exclude this page',
      html: '<p>Exclude this page</p>',
    });

    // Generate the search index
    const searchIndex = plugin.__test__.generateSearchIndex();

    // Check search index content
    expect(searchIndex.length).toBe(1);
    expect(searchIndex[0].title).toBe('Include Page');
  });

  test('should write search index to file', async () => {
    const plugin = searchIndexPlugin({
      filename: 'custom-search.json',
      outputDir: 'custom-dir',
      _fs: mockFs,
    }) as SearchIndexPluginWithTest;

    // Make sure we start fresh
    plugin.__test__.clearContentFiles();

    // Add a test file to generate content before buildStart
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: { title: 'Test Page' },
      content: 'Test content',
      html: '<p>Test content</p>',
    });

    // First check contentFiles is not empty
    expect(plugin.__test__.getContentFiles().length).toBe(1);

    await plugin.buildStart?.();
    // Add file again after buildStart (which clears the array)
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: { title: 'Test Page' },
      content: 'Test content',
      html: '<p>Test content</p>',
    });
    await plugin.buildEnd?.();

    // Check that writeFileSync was called with the correct path
    expect(mockWritePath).toContain('custom-dir');
    expect(mockWritePath).toContain('custom-search.json');

    // Check that the content is valid JSON
    expect(() => JSON.parse(mockWriteContent)).not.toThrow();
  });

  test('should create output directory if it does not exist', async () => {
    let mkdirCalled = false;
    mockFs.existsSync = () => false;
    mockFs.mkdirSync = () => {
      mkdirCalled = true;
    };

    const plugin = searchIndexPlugin({
      _fs: mockFs,
    }) as SearchIndexPluginWithTest;

    // Make sure we start fresh
    plugin.__test__.clearContentFiles();

    // Add a test file to generate content
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: { title: 'Test Page' },
      content: 'Test content',
      html: '<p>Test content</p>',
    });

    // First check contentFiles is not empty
    expect(plugin.__test__.getContentFiles().length).toBe(1);

    await plugin.buildStart?.();
    // Add file again after buildStart (which clears the array)
    plugin.__test__.addContentFile({
      path: '/test/file.md',
      route: '/test-page',
      frontmatter: { title: 'Test Page' },
      content: 'Test content',
      html: '<p>Test content</p>',
    });
    await plugin.buildEnd?.();

    // Check that mkdirSync was called
    expect(mkdirCalled).toBe(true);
  });
});
