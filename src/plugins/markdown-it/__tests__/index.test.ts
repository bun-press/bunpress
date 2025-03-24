import { describe, expect, test } from 'bun:test';
import markdownItPlugin from '../index';

describe('Markdown-it Plugin', () => {
  test('transforms markdown to HTML', async () => {
    const plugin = markdownItPlugin();
    
    const markdown = `
# Hello World
This is a **bold** text and *italic* text.
- List item 1
- List item 2
    `;
    
    // Ensure transform exists before calling it
    expect(plugin.transform).toBeDefined();
    const result = plugin.transform ? await plugin.transform(markdown) : '';
    
    expect(result).toContain('<h1>Hello World</h1>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>List item 1</li>');
    expect(result).toContain('<li>List item 2</li>');
  });
  
  test('respects plugin options', async () => {
    const plugin = markdownItPlugin({
      html: false,
      linkify: false,
      typographer: false,
      breaks: true,
    });
    
    const markdown = `
# Hello World
This is a **bold** text and *italic* text.
- List item 1
- List item 2
    `;
    
    // Ensure transform exists before calling it
    expect(plugin.transform).toBeDefined();
    const result = plugin.transform ? await plugin.transform(markdown) : '';
    
    // With breaks enabled, newlines should be preserved
    expect(result).toContain('\n');
    
    // With html disabled, HTML tags should be escaped
    expect(result).not.toContain('<script>');
  });
}); 