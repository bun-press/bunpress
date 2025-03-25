import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { processMarkdownContent, ContentProcessor } from '../content-processor';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import { DefaultPluginManager } from '../plugin';

describe('Content Processor', () => {
  const testDir = path.join(process.cwd(), 'test-content');
  
  // Setup test directory and files before all tests
  beforeAll(() => {
    // Ensure the test directory exists
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    
    // Create a nested directory for testing nested routes
    const nestedDir = path.join(testDir, 'nested');
    if (!existsSync(nestedDir)) {
      mkdirSync(nestedDir, { recursive: true });
    }
    
    // Create test files
    
    // Test page
    const testPageContent = `---
title: Test Page
description: A test page
---

# Test Page

This is a test page.`;
    writeFileSync(path.join(testDir, 'test.md'), testPageContent);
    
    // Index page
    const indexPageContent = `---
title: Home
description: Welcome to my site
---

# Welcome

This is the home page.`;
    writeFileSync(path.join(testDir, 'index.md'), indexPageContent);
    
    // Nested page
    const nestedPageContent = `---
title: Nested Page
description: A nested page
---

# Nested Page

This is a nested page.`;
    writeFileSync(path.join(nestedDir, 'page.md'), nestedPageContent);
    
    // HTML test page
    const htmlTestContent = `---
title: HTML Test
---

# HTML Test

This content has <script>alert('XSS')</script> tags that should be escaped.
Also has a <div class="test">div tag</div> that should be handled properly.`;
    writeFileSync(path.join(testDir, 'html-test.md'), htmlTestContent);
    
    // Complex frontmatter test
    const complexFrontmatterContent = `---
title: Complex Frontmatter
tags:
  - javascript
  - markdown
  - testing
author:
  name: Test Author
  email: test@example.com
published: true
date: 2023-04-01
---

# Complex Frontmatter Test

Testing complex frontmatter data.`;
    writeFileSync(path.join(testDir, 'complex-frontmatter.md'), complexFrontmatterContent);
  });
  
  // Clean up test directory after all tests
  afterAll(() => {
    // Remove test files and directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  test('processes markdown content with frontmatter', () => {
    const testFile = path.join(testDir, 'test.md');
    
    // Process the file using the real implementation
    const result = processMarkdownContent(testFile, testDir);
    
    // Check frontmatter was properly parsed
    expect(result.frontmatter.title).toBe('Test Page');
    expect(result.frontmatter.description).toBe('A test page');
    
    // Check content is as expected
    expect(result.content).toContain('# Test Page');
    expect(result.content).toContain('This is a test page.');
    
    // Check HTML conversion
    expect(result.html).toContain('<h1>');
    expect(result.html).toContain('Test Page');
    
    // Check route generation
    expect(result.route).toBe('/test');
  });
  
  test('handles index files correctly', () => {
    const testFile = path.join(testDir, 'index.md');
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.route).toBe('/');
    expect(result.frontmatter.title).toBe('Home');
  });
  
  test('handles nested routes correctly', () => {
    const testFile = path.join(testDir, 'nested', 'page.md');
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.route).toBe('/nested/page');
    expect(result.frontmatter.title).toBe('Nested Page');
  });
  
  test('handles HTML in markdown content', () => {
    const testFile = path.join(testDir, 'html-test.md');
    
    const result = processMarkdownContent(testFile, testDir);
    
    // Marked doesn't escape HTML by default, it passes it through
    // We're testing that the HTML is included in the output
    expect(result.html).toContain('<script>alert(\'XSS\')</script>');
    expect(result.html).toContain('<div class="test">');
    
    // The content should still contain the original HTML
    expect(result.content).toContain('<script>');
    expect(result.content).toContain('<div class="test">');
  });
  
  test('handles frontmatter with various data types', () => {
    const testFile = path.join(testDir, 'complex-frontmatter.md');
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.frontmatter.title).toBe('Complex Frontmatter');
    expect(Array.isArray(result.frontmatter.tags)).toBe(true);
    expect(result.frontmatter.tags).toContain('javascript');
    expect(result.frontmatter.tags).toContain('markdown');
    expect(result.frontmatter.author).toBeDefined();
    expect(result.frontmatter.author.name).toBe('Test Author');
    expect(result.frontmatter.published).toBe(true);
  });
  
  test('ContentProcessor class processes markdown content with plugins', async () => {
    // Create a test plugin for content transformation
    const testPlugin = {
      name: 'test-plugin',
      async transform(content: string): Promise<string> {
        return content + '\n\n<!-- Processed by TestPlugin -->';
      }
    };
    
    // Create plugin manager and add the test plugin
    const pluginManager = new DefaultPluginManager();
    pluginManager.addPlugin(testPlugin);
    
    // Create ContentProcessor instance with the plugin
    const processor = new ContentProcessor({ plugins: pluginManager });
    
    // Process test file
    const testFile = path.join(testDir, 'test.md');
    const result = await processor.processMarkdownContent(testFile, testDir);
    
    // Check plugin transform was applied
    expect(result.content).toContain('<!-- Processed by TestPlugin -->');
    expect(result.frontmatter.title).toBe('Test Page');
    expect(result.route).toBe('/test');
  });
}); 