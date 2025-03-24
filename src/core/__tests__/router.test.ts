import { describe, expect, test, spyOn, mock } from 'bun:test';
import { generateRoutes, generateRoutesAsync } from '../router';
import * as fs from 'fs';
import { PathLike } from 'fs';
import * as contentProcessor from '../content-processor';

// Create mock data
/* Commented out as these are not directly used but are helpful for reference
const mockFiles = {
  '/mock/pages': ['index.md', 'about.md', 'blog'],
  '/mock/pages/blog': ['index.md', 'post1.md', 'post2.md'],
  '/mock/empty': []
};

const mockStats = {
  '/mock/pages/index.md': { isDirectory: () => false, isFile: () => true },
  '/mock/pages/about.md': { isDirectory: () => false, isFile: () => true },
  '/mock/pages/blog': { isDirectory: () => true, isFile: () => false },
  '/mock/pages/blog/index.md': { isDirectory: () => false, isFile: () => true },
  '/mock/pages/blog/post1.md': { isDirectory: () => false, isFile: () => true },
  '/mock/pages/blog/post2.md': { isDirectory: () => false, isFile: () => true },
  '/mock/pages/component.mdx': { isDirectory: () => false, isFile: () => true }
};
*/

// Mock content files corresponding to each file
const mockContentFiles: Record<string, any> = {
  '/mock/pages/index.md': {
    route: '/',
    frontmatter: { title: 'Mock title for /' },
    content: '# Mock content for /',
    html: '<h1>Mock content for /</h1>'
  },
  '/mock/pages/about.md': {
    route: '/about',
    frontmatter: { title: 'Mock title for /about' },
    content: '# Mock content for /about',
    html: '<h1>Mock content for /about</h1>'
  },
  '/mock/pages/blog/index.md': {
    route: '/blog/',
    frontmatter: { title: 'Mock title for /blog/' },
    content: '# Mock content for /blog/',
    html: '<h1>Mock content for /blog/</h1>'
  },
  '/mock/pages/blog/post1.md': {
    route: '/blog/post1',
    frontmatter: { title: 'Mock title for /blog/post1' },
    content: '# Mock content for /blog/post1',
    html: '<h1>Mock content for /blog/post1</h1>'
  },
  '/mock/pages/blog/post2.md': {
    route: '/blog/post2',
    frontmatter: { title: 'Mock title for /blog/post2' },
    content: '# Mock content for /blog/post2',
    html: '<h1>Mock content for /blog/post2</h1>'
  },
  '/mock/pages/component.mdx': {
    route: '/component',
    frontmatter: { title: 'Mock title for /component' },
    content: '# Mock content for /component',
    html: '<h1>Mock content for /component</h1>'
  }
};

describe('Router', () => {
  test('generates routes for simple directory structure', () => {
    // Setup mocks for this test
    const mockReaddirSync = spyOn(fs, 'readdirSync');
    const mockStatSync = spyOn(fs, 'statSync');
    const mockProcessMarkdownContent = spyOn(contentProcessor, 'processMarkdownContent');
    
    // Configure mock behavior for readdir
    mockReaddirSync.mockImplementation(((dir: PathLike) => {
      const dirPath = dir.toString();
      if (dirPath === '/mock/pages') {
        return ['index.md', 'about.md', 'blog'];
      } else if (dirPath === '/mock/pages/blog') {
        return ['index.md', 'post1.md', 'post2.md'];
      }
      return [];
    }) as any);
    
    // Configure mock behavior for stat
    mockStatSync.mockImplementation(((filePath: PathLike) => {
      const filePathStr = filePath.toString();
      if (filePathStr.endsWith('blog')) {
        return { isDirectory: () => true, isFile: () => false } as fs.Stats;
      }
      return { isDirectory: () => false, isFile: () => true } as fs.Stats;
    }) as any);
    
    // Configure mock behavior for processMarkdownContent
    mockProcessMarkdownContent.mockImplementation((filePath: string, _rootDir?: string) => {
      return mockContentFiles[filePath.toString()];
    });
    
    // Mock the content processor module
    mock.module('../content-processor', () => {
      const mockProcessor = {
        async processMarkdownContent(filePath: string, _rootDir?: string) {
          return mockContentFiles[filePath.toString()];
        }
      };
      
      return {
        ...contentProcessor,
        ContentProcessor: class MockContentProcessor {
          constructor() { return mockProcessor; }
        }
      };
    });
    
    const routes = generateRoutes('/mock/pages');
    
    expect(Object.keys(routes).length).toBe(5);
    expect(routes['/']).toBeDefined();
    expect(routes['/about']).toBeDefined();
    expect(routes['/blog/']).toBeDefined();
    expect(routes['/blog/post1']).toBeDefined();
    expect(routes['/blog/post2']).toBeDefined();
    
    // Check route content
    expect(routes['/'].frontmatter.title).toBe('Mock title for /');
    expect(routes['/blog/post1'].frontmatter.title).toBe('Mock title for /blog/post1');
    
    // Reset mocks
    mockReaddirSync.mockRestore();
    mockStatSync.mockRestore();
    mockProcessMarkdownContent.mockRestore();
    mock.restore();
  });
  
  test('handles empty directory', () => {
    // Setup mocks for this test
    const mockReaddirSync = spyOn(fs, 'readdirSync');
    const mockStatSync = spyOn(fs, 'statSync');
    
    // Return empty array for any directory
    mockReaddirSync.mockImplementation((() => {
      return [];
    }) as any);
    
    const routes = generateRoutes('/mock/empty');
    expect(Object.keys(routes).length).toBe(0);
    
    // Reset mocks
    mockReaddirSync.mockRestore();
    mockStatSync.mockRestore();
  });
  
  test('handles directories without markdown files', () => {
    // Setup mocks for this test
    const mockReaddirSync = spyOn(fs, 'readdirSync');
    const mockStatSync = spyOn(fs, 'statSync');
    
    // Configure mock behavior for this test
    mockReaddirSync.mockImplementation(((dir: PathLike) => {
      const dirPath = dir.toString();
      if (dirPath === '/mock/pages') {
        return ['assets', 'images'];
      }
      return [];
    }) as any);
    
    mockStatSync.mockImplementation((() => {
      return { isDirectory: () => true, isFile: () => false } as fs.Stats;
    }) as any);
    
    const routes = generateRoutes('/mock/pages');
    expect(Object.keys(routes).length).toBe(0);
    
    // Reset mocks
    mockReaddirSync.mockRestore();
    mockStatSync.mockRestore();
  });
  
  test('generates routes asynchronously', async () => {
    // Setup mocks for this test
    const mockReaddirSync = spyOn(fs, 'readdirSync');
    const mockStatSync = spyOn(fs, 'statSync');
    
    // Configure mock behavior for readdir
    mockReaddirSync.mockImplementation(((dir: PathLike) => {
      const dirPath = dir.toString();
      if (dirPath === '/mock/pages') {
        return ['index.md', 'about.md', 'blog'];
      } else if (dirPath === '/mock/pages/blog') {
        return ['index.md', 'post1.md', 'post2.md'];
      }
      return [];
    }) as any);
    
    // Configure mock behavior for stat
    mockStatSync.mockImplementation(((filePath: PathLike) => {
      const filePathStr = filePath.toString();
      if (filePathStr.endsWith('blog')) {
        return { isDirectory: () => true, isFile: () => false } as fs.Stats;
      }
      return { isDirectory: () => false, isFile: () => true } as fs.Stats;
    }) as any);
    
    // Mock the content processor module
    mock.module('../content-processor', () => {
      const mockProcessor = {
        async processMarkdownContent(filePath: string, _rootDir?: string) {
          return mockContentFiles[filePath.toString()];
        }
      };
      
      return {
        ...contentProcessor,
        ContentProcessor: class MockContentProcessor {
          constructor() { return mockProcessor; }
        }
      };
    });
    
    const routes = await generateRoutesAsync('/mock/pages');
    
    expect(Object.keys(routes).length).toBe(5);
    expect(routes['/']).toBeDefined();
    expect(routes['/about']).toBeDefined();
    expect(routes['/blog/']).toBeDefined();
    expect(routes['/blog/post1']).toBeDefined();
    expect(routes['/blog/post2']).toBeDefined();
    
    // Reset mocks
    mockReaddirSync.mockRestore();
    mockStatSync.mockRestore();
    mock.restore();
  });
  
  test('handles MDX files', () => {
    // Setup mocks for this test
    const mockReaddirSync = spyOn(fs, 'readdirSync');
    const mockStatSync = spyOn(fs, 'statSync');
    const mockProcessMarkdownContent = spyOn(contentProcessor, 'processMarkdownContent');
    
    // Configure mock behavior for this test
    mockReaddirSync.mockImplementation(((dir: PathLike) => {
      const dirPath = dir.toString();
      if (dirPath === '/mock/pages') {
        return ['index.md', 'component.mdx'];
      }
      return [];
    }) as any);
    
    mockStatSync.mockImplementation((() => {
      return { isDirectory: () => false, isFile: () => true } as fs.Stats;
    }) as any);
    
    mockProcessMarkdownContent.mockImplementation((filePath: string, _rootDir?: string) => {
      return mockContentFiles[filePath.toString()];
    });
    
    const routes = generateRoutes('/mock/pages');
    
    expect(Object.keys(routes).length).toBe(2);
    expect(routes['/']).toBeDefined();
    expect(routes['/component']).toBeDefined();
    
    // Reset mocks
    mockReaddirSync.mockRestore();
    mockStatSync.mockRestore();
    mockProcessMarkdownContent.mockRestore();
  });
}); 