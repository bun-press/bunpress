import { describe, expect, test, mock } from 'bun:test';
import { processMarkdownContent } from '../content-processor';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// Mock gray-matter to ensure consistent frontmatter parsing in tests
mock.module('gray-matter', () => {
  return function(content) {
    // Simple frontmatter parsing for tests
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const frontmatterStr = match[1];
      const contentStr = match[2];
      
      // Parse frontmatter into object
      const frontmatter = {};
      frontmatterStr.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        if (key && value) {
          frontmatter[key] = value;
        }
      });
      
      return {
        data: frontmatter,
        content: contentStr
      };
    }
    
    return {
      data: {},
      content
    };
  };
});

describe('Content Processor', () => {
  const testDir = path.join(process.cwd(), 'test-content');
  
  // Setup test directory
  try {
    mkdirSync(testDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
  
  test('processes markdown content with frontmatter', () => {
    const testFile = path.join(testDir, 'test.md');
    const content = `---
title: Test Page
description: A test page
---

# Test Page

This is a test page.`;
    
    writeFileSync(testFile, content);
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.frontmatter).toEqual({
      title: 'Test Page',
      description: 'A test page',
    });
    
    expect(result.content).toContain('# Test Page');
    expect(result.html).toContain('<h1>Test Page</h1>');
    expect(result.route).toBe('/test');
  });
  
  test('handles index files correctly', () => {
    const testFile = path.join(testDir, 'index.md');
    const content = `---
title: Home
description: Welcome to my site
---

# Welcome

This is the home page.`;
    
    writeFileSync(testFile, content);
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.route).toBe('/');
  });
  
  test('handles nested routes correctly', () => {
    const nestedDir = path.join(testDir, 'nested');
    mkdirSync(nestedDir, { recursive: true });
    
    const testFile = path.join(nestedDir, 'page.md');
    const content = `---
title: Nested Page
description: A nested page
---

# Nested Page

This is a nested page.`;
    
    writeFileSync(testFile, content);
    
    const result = processMarkdownContent(testFile, testDir);
    
    expect(result.route).toBe('/nested/page');
  });
}); 