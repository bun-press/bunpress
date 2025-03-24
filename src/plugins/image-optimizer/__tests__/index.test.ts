import { describe, test, expect } from 'bun:test';
import imageOptimizerPlugin from '../index';

describe('Image Optimizer Plugin', () => {
  test('should create plugin with default options', () => {
    const plugin = imageOptimizerPlugin();
    expect(plugin.name).toBe('image-optimizer');
    expect(plugin.options).toEqual({});
  });

  test('should transform markdown content to use webp format', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'webp', quality: 80 }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png "Title")';
    const transformed = plugin.transform?.(content) || '';
    
    expect(transformed).toContain('![Alt text](image.webp)');
    expect(transformed).toContain('![Another](path/to/image.webp "Title")');
  });

  test('should transform markdown content to use avif format', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'avif', quality: 70 }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png)';
    const transformed = plugin.transform?.(content) || '';
    
    expect(transformed).toContain('![Alt text](image.avif)');
    expect(transformed).toContain('![Another](path/to/image.avif)');
  });

  test('should not transform content when using jpeg format', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'jpeg', quality: 90 }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png)';
    const transformed = plugin.transform?.(content) || '';
    
    // No transformation should happen
    expect(transformed).toBe(content);
  });

  test('should not transform content when using png format', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'png' }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png)';
    const transformed = plugin.transform?.(content) || '';
    
    // No transformation should happen
    expect(transformed).toBe(content);
  });

  test('should handle multiple image formats in content', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'webp', quality: 85 }],
    });

    const content = `
      # Test Document
      
      ![Image 1](image1.jpg)
      ![Image 2](assets/image2.png "Description")
      ![Image 3](../images/image3.jpeg)
      
      Some text in between.
      
      ![Image 4](./path/to/image4.jpg)
    `;
    
    const transformed = plugin.transform?.(content) || '';
    
    expect(transformed).toContain('![Image 1](image1.webp)');
    expect(transformed).toContain('![Image 2](assets/image2.webp "Description")');
    expect(transformed).toContain('![Image 3](../images/image3.webp)');
    expect(transformed).toContain('![Image 4](./path/to/image4.webp)');
  });

  test('should not transform non-image content', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'webp', quality: 80 }],
    });

    const content = `
      # Test Document
      
      [Link 1](https://example.com)
      [Link 2](document.pdf)
      
      \`\`\`js
      const image = "image.jpg";
      \`\`\`
    `;
    
    const transformed = plugin.transform?.(content) || '';
    
    // Should not change links or code blocks
    expect(transformed).toBe(content);
  });
}); 