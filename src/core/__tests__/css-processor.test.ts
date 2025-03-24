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
          } else if (path.endsWith('buttons.css')) {
            return `
              .button {
                background-color: green;
              }
            `;
          }
          return '';
        }
      };
    },
    build: () => {
      return { 
        success: true, 
        outputs: [
          { 
            path: '/tmp/output.css',
            text: async () => `:root {
              --primary-color: blue;
            }
            body { color: var(--primary-color); }
            .logo { background-image: url('./logo.png'); }`
          }
        ]
      };
    },
    hash: (_content: Buffer) => {
      return BigInt(12345);
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
    
    // Test the structure of the result from our mocked Bun.build
    expect(result).toContain('body { font-family: sans-serif; }');
  });
  
  test('processCSS with minification should produce minified CSS', async () => {
    const cssPath = path.join(tmpDir, 'styles', 'style.css');
    const result = await processCSS(cssPath, mockConfig as any, { 
      minify: true,
      sourceMap: false,
      rewriteUrls: false
    });
    
    // Test with minification option
    expect(result).toContain('body { font-family: sans-serif; }');
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
  });
}); 