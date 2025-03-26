import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { generateRoutes, generateRoutesAsync } from '../router';
import * as fs from 'fs';
import path from 'path';
import { Plugin } from '../plugin';

// Create a temporary test directory in the system temp folder
const TEST_DIR = path.join(process.cwd(), 'tmp-test-router');
const TEST_PAGES_DIR = path.join(TEST_DIR, 'pages');
const TEST_EMPTY_DIR = path.join(TEST_DIR, 'empty');
const TEST_MDX_DIR = path.join(TEST_DIR, 'mdx');

// Test content for files
const testFiles = {
  'index.md': `---
title: Home Page
---

# Home Page

This is the home page content for testing the router.`,

  'about.md': `---
title: About Page
---

# About Page

This is the about page content for testing the router.`,

  'blog/index.md': `---
title: Blog Index
---

# Blog Index

This is the blog index content for testing the router.`,

  'blog/post1.md': `---
title: First Post
---

# First Post

This is the first blog post content for testing the router.`,

  'blog/post2.md': `---
title: Second Post
---

# Second Post

This is the second blog post content for testing the router.`,
};

describe('Router', () => {
  // Set up test files before running tests
  beforeAll(() => {
    // Clean any existing test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Create test directories
    fs.mkdirSync(TEST_PAGES_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEST_PAGES_DIR, 'blog'), { recursive: true });
    fs.mkdirSync(TEST_EMPTY_DIR, { recursive: true });
    fs.mkdirSync(TEST_MDX_DIR, { recursive: true });

    // Create test files
    for (const [filePath, content] of Object.entries(testFiles)) {
      const fullPath = path.join(TEST_PAGES_DIR, filePath);
      fs.writeFileSync(fullPath, content);
    }
  });

  // Clean up test files after all tests are complete
  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('generates routes for simple directory structure', async () => {
    // Use programmatically created test files
    const routes = await generateRoutes(TEST_PAGES_DIR);

    expect(Object.keys(routes).length).toBe(5);
    expect(routes['/']).toBeDefined();
    expect(routes['/about']).toBeDefined();
    expect(routes['/blog']).toBeDefined();
    expect(routes['/blog/post1']).toBeDefined();
    expect(routes['/blog/post2']).toBeDefined();

    // Check route content matches the actual files
    expect(routes['/'].frontmatter.title).toBe('Home Page');
    expect(routes['/about'].frontmatter.title).toBe('About Page');
    expect(routes['/blog'].frontmatter.title).toBe('Blog Index');
    expect(routes['/blog/post1'].frontmatter.title).toBe('First Post');
    expect(routes['/blog/post2'].frontmatter.title).toBe('Second Post');
  });

  test('handles empty directory', async () => {
    const routes = await generateRoutes(TEST_EMPTY_DIR);
    expect(Object.keys(routes).length).toBe(0);
  });

  test('generates routes asynchronously', async () => {
    const routes = await generateRoutesAsync(TEST_PAGES_DIR);

    expect(Object.keys(routes).length).toBe(5);
    expect(routes['/']).toBeDefined();
    expect(routes['/about']).toBeDefined();
    expect(routes['/blog']).toBeDefined();
    expect(routes['/blog/post1']).toBeDefined();
    expect(routes['/blog/post2']).toBeDefined();

    // Verify content matches actual files
    expect(routes['/'].frontmatter.title).toBe('Home Page');
    expect(routes['/blog/post1'].frontmatter.title).toBe('First Post');
  });

  test('generateRoutesAsync works with plugins', async () => {
    // Define a simple test plugin
    class TestPlugin implements Plugin {
      name = 'test-plugin';

      async transform(content: string): Promise<string> {
        // Simple transformation: add a test marker to the content
        return content + '\n\n<!-- Processed by TestPlugin -->';
      }
    }

    const routes = await generateRoutesAsync(TEST_PAGES_DIR, [new TestPlugin()]);

    // Check that plugin transform was applied
    expect(routes['/']).toBeDefined();
    expect(routes['/'].content).toContain('<!-- Processed by TestPlugin -->');

    // Verify other routes were also processed
    expect(Object.keys(routes).length).toBe(5);
    expect(routes['/about'].content).toContain('<!-- Processed by TestPlugin -->');
  });

  test('handles MDX files', async () => {
    // Create an MDX test file programmatically
    const mdxFilePath = path.join(TEST_MDX_DIR, 'component.mdx');

    // Create an MDX test file content
    const mdxContent = `---
title: MDX Component
---

# MDX Component

This is a test MDX component with JSX.

<div className="test-component">
  <p>This is a JSX component</p>
</div>`;

    // Write the test file
    fs.writeFileSync(mdxFilePath, mdxContent);

    // Test MDX file processing
    const routes = await generateRoutes(TEST_MDX_DIR);

    expect(Object.keys(routes).length).toBe(1);
    expect(routes['/component']).toBeDefined();
    expect(routes['/component'].frontmatter.title).toBe('MDX Component');
  });
});
