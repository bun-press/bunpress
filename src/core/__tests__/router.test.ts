import { describe, expect, test, beforeAll } from 'bun:test';
import { generateRoutes, generateRoutesAsync } from '../router';
import * as fs from 'fs';
import path from 'path';
import { Plugin } from '../plugin';

// Use a real test directory with actual files
const TEST_PAGES_DIR = path.join(process.cwd(), 'test-input', 'pages');

describe('Router', () => {
  // Ensure test files exist before running tests
  beforeAll(() => {
    // Verify test files exist to ensure tests will work properly
    const files = [
      path.join(TEST_PAGES_DIR, 'index.md'),
      path.join(TEST_PAGES_DIR, 'about.md'),
      path.join(TEST_PAGES_DIR, 'blog', 'index.md'),
      path.join(TEST_PAGES_DIR, 'blog', 'post1.md'),
      path.join(TEST_PAGES_DIR, 'blog', 'post2.md'),
    ];

    for (const file of files) {
      if (!fs.existsSync(file)) {
        throw new Error(
          `Test file ${file} does not exist. Please ensure test files are set up correctly.`
        );
      }
    }
  });

  test('generates routes for simple directory structure', () => {
    // Use real file system for testing
    const routes = generateRoutes(TEST_PAGES_DIR);

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

  test('handles empty directory', () => {
    // Create a temporary empty directory
    const emptyDir = path.join(process.cwd(), 'test-input', 'empty');

    // Ensure the directory exists and is empty
    if (!fs.existsSync(emptyDir)) {
      fs.mkdirSync(emptyDir, { recursive: true });
    } else {
      // Clear any existing files
      const files = fs.readdirSync(emptyDir);
      for (const file of files) {
        const filePath = path.join(emptyDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        } else {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }

    const routes = generateRoutes(emptyDir);
    expect(Object.keys(routes).length).toBe(0);
  });

  test('generates routes asynchronously', async () => {
    // Use real file system for testing
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

  test('handles MDX files', () => {
    // Create a temporary test MDX file
    const mdxDir = path.join(process.cwd(), 'test-input', 'mdx');
    const mdxFilePath = path.join(mdxDir, 'component.mdx');

    // Ensure directory exists
    if (!fs.existsSync(mdxDir)) {
      fs.mkdirSync(mdxDir, { recursive: true });
    }

    // Create an MDX test file
    const mdxContent = `---
title: MDX Component
---

# MDX Component

This is a test MDX component with JSX.

<div className="test-component">
  <p>This is a JSX component</p>
</div>`;

    fs.writeFileSync(mdxFilePath, mdxContent);

    // Test MDX file processing
    const routes = generateRoutes(mdxDir);

    expect(Object.keys(routes).length).toBe(1);
    expect(routes['/component']).toBeDefined();
    expect(routes['/component'].frontmatter.title).toBe('MDX Component');

    // Clean up
    fs.unlinkSync(mdxFilePath);
    fs.rmdirSync(mdxDir);
  });
});
