import { describe, expect, test } from 'bun:test';
import { processMarkdownContent } from '../content-processor';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

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