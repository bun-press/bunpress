import { describe, expect, test } from 'bun:test';
import prismPlugin from '../index';

describe('Prism.js Plugin', () => {
  test('adds prism.js classes to code blocks', async () => {
    const plugin = prismPlugin();
    
    const markdown = `
# Code Example

Here's a JavaScript snippet:

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

And here's some CSS:

\`\`\`css
body {
  font-family: sans-serif;
  color: #333;
}
\`\`\`
`;
    
    // Ensure transform exists
    expect(plugin.transform).toBeDefined();
    
    if (plugin.transform) {
      const result = await plugin.transform(markdown);
      
      // Check that the plugin added the correct classes
      expect(result).toContain('class="language-javascript"');
      expect(result).toContain('data-prism="true"');
      expect(result).toContain('class="language-css"');
    }
  });
  
  test('handles code blocks without a language', async () => {
    const plugin = prismPlugin();
    
    const markdown = `
# Plain Code Block

\`\`\`
This is a plain code block
without a language specified.
\`\`\`
`;
    
    // Ensure transform exists
    expect(plugin.transform).toBeDefined();
    
    if (plugin.transform) {
      const result = await plugin.transform(markdown);
      
      // Should default to text language
      expect(result).toContain('class="language-text"');
      expect(result).toContain('data-prism="true"');
    }
  });
  
  test('respects plugin options', () => {
    const plugin = prismPlugin({
      theme: 'dark',
      languages: ['javascript', 'css'],
      lineNumbers: true,
    });
    
    // Verify that options are stored correctly
    expect(plugin.options).toEqual({
      theme: 'dark',
      languages: ['javascript', 'css'],
      lineNumbers: true,
    });
  });
}); 