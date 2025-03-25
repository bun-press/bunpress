import { describe, expect, test } from 'bun:test';
import markdownItPlugin from '../index';

// Add a custom slugify function to address the error in markdown-it-anchor
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

describe('Markdown-it Plugin', () => {
  test('transforms markdown to HTML', async () => {
    const plugin = markdownItPlugin({
      // Disable anchor which requires slugify
      anchor: false,
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

    expect(result).toContain('<h1>Hello World</h1>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>List item 1</li>');
    expect(result).toContain('<li>List item 2</li>');
  });

  test('supports anchor links with custom slugify', async () => {
    const plugin = markdownItPlugin({
      anchor: {
        slugify: slugify,
      },
    });

    const markdown = `
# Hello World
## Section 1
### Subsection 1.1
`;

    // Ensure transform exists before calling it
    expect(plugin.transform).toBeDefined();
    const result = plugin.transform ? await plugin.transform(markdown) : '';

    expect(result).toContain('<h1');
    expect(result).toContain('id="hello-world"');
  });

  test('respects plugin options', async () => {
    const plugin = markdownItPlugin({
      html: false,
      linkify: false,
      typographer: false,
      breaks: true,
      anchor: false, // Disable anchor which requires slugify
    });

    const markdown = `
# Hello World
This is a **bold** text and *italic* text.
This line should have a break after it.
Another line.`;

    // Ensure transform exists before calling it
    expect(plugin.transform).toBeDefined();
    const result = plugin.transform ? await plugin.transform(markdown) : '';

    // Verify basic transformations are still working
    expect(result).toContain('<h1>Hello World</h1>');
    expect(result).toContain('<strong>bold</strong>');

    // With breaks:true, single line breaks in paragraphs are preserved with <br>
    // but they're in the same <p> element - we need to check the raw HTML to verify
    const paragraphContent = result.match(/<p>(.*?)<\/p>/s)?.[1] || '';
    expect(paragraphContent).toContain('break after it');
    expect(paragraphContent).toContain('Another line');
    expect(paragraphContent).toContain('<br>');
  });
});
