import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { processCSS, bundleCSS } from '../css-processor';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock Bun transform API
mock.module('bun', () => {
  return {
    file: (path: string) => {
      return {
        text: () => {
          if (path.endsWith('style.css')) {
            return `
              @import './variables.css';
              body { color: var(--primary-color); }
              .logo { background-image: url('./logo.png'); }
            `;
          } else if (path.endsWith('variables.css')) {
            return `
              :root {
                --primary-color: blue;
              }
            `;
          }
          return '';
        }
      };
    },
    transform: (css: string, options: any) => {
      // Mock CSS transform
      if (options.loader === 'css') {
        // Process @import
        let result = css;
        if (css.includes('@import')) {
          result = `
            :root {
              --primary-color: blue;
            }
            body { color: var(--primary-color); }
            .logo { background-image: url('./logo.png'); }
          `;
        }
        
        // Apply minification if requested
        if (options.minify) {
          result = result
            .replace(/\s+/g, ' ')
            .replace(/:\s+/g, ':')
            .replace(/;\s+/g, ';')
            .replace(/{\s+/g, '{')
            .replace(/\s+}/g, '}')
            .trim();
        }
        
        // Add sourcemap if requested
        if (options.sourcemap === 'inline') {
          result += '\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXX0= */';
        }
        
        return {
          success: true,
          code: result
        };
      }
      
      return {
        success: false,
        error: new Error('Not implemented')
      };
    },
    hash: (content: Buffer) => {
      // Mock hash function, always return the same hash for testing
      return BigInt(123456789);
    }
  };
});

describe('CSS Processor', () => {
  const tmpDir = path.join(os.tmpdir(), 'bunpress-test-css-' + Date.now());
  const originalCwd = process.cwd();
  const mockConfig = {
    title: 'Test Site',
    pagesDir: 'pages',
    outputDir: path.join(tmpDir, 'dist'),
    themeConfig: {
      name: 'default'
    }
  };
  
  beforeEach(() => {
    // Create temp directories
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'styles'), { recursive: true });
    
    // Create test CSS files
    const styleContent = `
      @import './variables.css';
      body { color: var(--primary-color); }
      .logo { background-image: url('./logo.png'); }
    `;
    fs.writeFileSync(path.join(tmpDir, 'styles', 'style.css'), styleContent);
    
    const variablesContent = `
      :root {
        --primary-color: blue;
      }
    `;
    fs.writeFileSync(path.join(tmpDir, 'styles', 'variables.css'), variablesContent);
    
    // Create a logo image file
    const logoContent = Buffer.from('fake image data');
    fs.writeFileSync(path.join(tmpDir, 'styles', 'logo.png'), logoContent);
    
    // Change working directory
    process.chdir(tmpDir);
  });
  
  afterEach(() => {
    // Restore working directory
    process.chdir(originalCwd);
    
    // Clean up
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (err) {
      console.error('Error cleaning up temp directory', err);
    }
  });
  
  test('processCSS should handle CSS imports and produce bundled CSS', async () => {
    const cssPath = path.join(tmpDir, 'styles', 'style.css');
    const result = await processCSS(cssPath, mockConfig as any, { rewriteUrls: false });
    
    // Verify the CSS content includes imported variables
    expect(result).toContain('--primary-color: blue');
    expect(result).toContain('body { color: var(--primary-color); }');
    
    // By default, development mode should include sourcemap
    expect(result).toContain('sourceMappingURL=data:application/json;base64');
  });
  
  test('processCSS with minification should produce minified CSS', async () => {
    const cssPath = path.join(tmpDir, 'styles', 'style.css');
    const result = await processCSS(cssPath, mockConfig as any, { 
      minify: true,
      sourceMap: false,
      rewriteUrls: false
    });
    
    // Verify minified output has no unnecessary whitespace
    expect(result).not.toContain('  ');
    expect(result).toContain('--primary-color:blue');
    
    // Minified should not include sourcemap when sourceMap is false
    expect(result).not.toContain('sourceMappingURL');
  });
  
  test('bundleCSS should combine multiple CSS files', async () => {
    // Create another CSS file
    const additionalContent = `
      .button {
        background-color: green;
      }
    `;
    fs.writeFileSync(path.join(tmpDir, 'styles', 'buttons.css'), additionalContent);
    
    const entrypoints = [
      path.join(tmpDir, 'styles', 'style.css'),
      path.join(tmpDir, 'styles', 'buttons.css')
    ];
    
    const outputPath = path.join(tmpDir, 'dist', 'bundle.css');
    
    await bundleCSS(entrypoints, outputPath, mockConfig as any, {
      rewriteUrls: false
    });
    
    // Verify the output file exists
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Check the content includes both CSS files
    const bundleContent = fs.readFileSync(outputPath, 'utf-8');
    expect(bundleContent).toContain('--primary-color: blue');
    expect(bundleContent).toContain('body { color: var(--primary-color); }');
    expect(bundleContent).toContain('.button');
    
    // Files should be separated with a newline
    expect(bundleContent).toContain('\n');
  });
}); 