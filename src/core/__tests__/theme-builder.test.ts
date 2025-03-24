import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { loadTheme, buildTheme } from '../theme-builder';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock the bundler and css-processor modules
mock.module('../bundler', () => ({
  bundleAssets: async (entrypoints: string[], outputDir: string, config: any, opts: any) => {
    // Mock implementation that simulates bundled assets
    return {
      success: true,
      outputs: [
        { path: path.join(outputDir, 'bundle.js') },
        { path: path.join(outputDir, 'styles.css') }
      ]
    };
  }
}));

mock.module('../css-processor', () => ({
  processCSS: async (cssPath: string, config: any, opts: any) => {
    // Return mock processed CSS
    return `.processed { color: blue; }`;
  },
  bundleCSS: async (entrypoints: string[], outputPath: string, config: any, opts: any) => {
    // Write mock bundled CSS to the output file
    fs.writeFileSync(outputPath, `.bundled { color: red; }`);
    return { success: true };
  }
}));

describe('Theme Builder', () => {
  const tmpDir = path.join(os.tmpdir(), 'bunpress-test-theme-' + Date.now());
  const originalCwd = process.cwd();
  let mockConfig: any;
  
  beforeEach(() => {
    // Create temp directories
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'themes'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'themes', 'default'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'themes', 'default', 'layouts'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'themes', 'default', 'styles'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'themes', 'default', 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
    
    // Create theme files
    fs.writeFileSync(
      path.join(tmpDir, 'themes', 'default', 'index.html'),
      `<!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./styles/main.css">
          <script src="./scripts/main.js" defer></script>
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>`
    );
    
    fs.writeFileSync(
      path.join(tmpDir, 'themes', 'default', 'layouts', 'default.html'),
      `<main>{{ content }}</main>`
    );
    
    fs.writeFileSync(
      path.join(tmpDir, 'themes', 'default', 'styles', 'main.css'),
      `body { margin: 0; }`
    );
    
    fs.writeFileSync(
      path.join(tmpDir, 'themes', 'default', 'scripts', 'main.js'),
      `console.log('Theme loaded');`
    );
    
    // Change working directory
    process.chdir(tmpDir);
    
    // Create mock config
    mockConfig = {
      title: 'Test Site',
      pagesDir: 'pages',
      outputDir: path.join(tmpDir, 'dist'),
      themeConfig: {
        name: 'default'
      }
    };
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
  
  test('loadTheme should properly load theme from the themes directory', async () => {
    const theme = await loadTheme(mockConfig);
    
    expect(theme).toBeDefined();
    expect(theme.name).toBe('default');
    expect(theme.dir).toContain('themes/default');
    expect(theme.indexPath).toContain('index.html');
    expect(theme.layouts).toBeDefined();
    expect(theme.layouts.default).toBeDefined();
    expect(theme.layouts.default).toContain('{{ content }}');
    
    // Verify styles and scripts are found
    expect(theme.styles).toBeDefined();
    expect(theme.styles).toContain(path.join('themes', 'default', 'styles', 'main.css'));
    expect(theme.scripts).toBeDefined();
    expect(theme.scripts).toContain(path.join('themes', 'default', 'scripts', 'main.js'));
  });
  
  test('loadTheme should throw an error if theme does not exist', async () => {
    const invalidConfig = {
      ...mockConfig,
      themeConfig: {
        name: 'nonexistent'
      }
    };
    
    // Should throw an error when theme doesn't exist
    await expect(() => loadTheme(invalidConfig)).rejects.toThrow();
  });
  
  test('buildTheme should process and bundle theme assets', async () => {
    const theme = await loadTheme(mockConfig);
    const result = await buildTheme(theme, mockConfig);
    
    expect(result.success).toBe(true);
    expect(result.outputs).toBeDefined();
    expect(result.outputs).toHaveLength(2);
    expect(result.outputs[0].path).toContain('bundle.js');
    expect(result.outputs[1].path).toContain('styles.css');
    
    // Check if output files were created
    const jsOutputPath = path.join(tmpDir, 'dist', 'theme', 'bundle.js');
    const cssOutputPath = path.join(tmpDir, 'dist', 'theme', 'styles.css');
    
    expect(fs.existsSync(jsOutputPath)).toBe(true);
    expect(fs.existsSync(cssOutputPath)).toBe(true);
  });
  
  test('buildTheme should handle theme without assets', async () => {
    // Create an empty theme
    fs.mkdirSync(path.join(tmpDir, 'themes', 'empty'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'themes', 'empty', 'index.html'),
      `<!DOCTYPE html><html><body></body></html>`
    );
    
    const emptyConfig = {
      ...mockConfig,
      themeConfig: {
        name: 'empty'
      }
    };
    
    const theme = await loadTheme(emptyConfig);
    const result = await buildTheme(theme, emptyConfig);
    
    expect(result.success).toBe(true);
    expect(result.outputs).toBeDefined();
    expect(result.outputs.length).toBe(0);
  });
}); 