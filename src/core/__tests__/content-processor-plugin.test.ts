import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { ContentProcessor } from '../content-processor';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

describe('ContentProcessor with Plugins', () => {
  const testDir = path.join(process.cwd(), 'test-pages');
  const testFilePath = path.join(testDir, 'test.md');
  
  // Set up test directory and file
  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    
    // Create a test markdown file
    writeFileSync(testFilePath, `---
title: Test Page
---
# Heading

This is a **test** paragraph.
`);
  });
  
  // Clean up after tests
  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
  
  test('processes content without plugins', async () => {
    const processor = new ContentProcessor();
    const result = await processor.processMarkdownContent(testFilePath, testDir);
    
    expect(result.frontmatter.title).toBe('Test Page');
    expect(result.content).toContain('# Heading');
    expect(result.html).toContain('<h1>Heading</h1>');
    expect(result.html).toContain('<strong>test</strong>');
  });
  
  test('applies plugin transformations', async () => {
    const processor = new ContentProcessor();
    
    // Add a simple plugin that adds a footer
    processor.addPlugin({
      name: 'add-footer',
      transform: (content: string) => {
        return content + '\n\n---\n\nFooter added by plugin';
      },
    });
    
    const result = await processor.processMarkdownContent(testFilePath, testDir);
    
    expect(result.content).toContain('Footer added by plugin');
    expect(result.html).toContain('<hr>');
    expect(result.html).toContain('Footer added by plugin');
  });
  
  test('applies multiple plugins in order', async () => {
    const processor = new ContentProcessor();
    
    // Add plugins that add numbered markers
    processor.addPlugin({
      name: 'plugin-1',
      transform: (content: string) => {
        return content + '\n\n1';
      },
    });
    
    processor.addPlugin({
      name: 'plugin-2',
      transform: (content: string) => {
        return content + '\n\n2';
      },
    });
    
    processor.addPlugin({
      name: 'plugin-3',
      transform: (content: string) => {
        return content + '\n\n3';
      },
    });
    
    const result = await processor.processMarkdownContent(testFilePath, testDir);
    
    // The content should have markers in the correct order
    expect(result.content).toMatch(/1\s+2\s+3$/);
  });
  
  test('handles async plugins', async () => {
    const processor = new ContentProcessor();
    
    // Add an async plugin
    processor.addPlugin({
      name: 'async-plugin',
      transform: async (content: string) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return content + '\n\nAdded after delay';
      },
    });
    
    const result = await processor.processMarkdownContent(testFilePath, testDir);
    
    expect(result.content).toContain('Added after delay');
    expect(result.html).toContain('Added after delay');
  });
}); 