import { describe, expect, test, beforeAll, afterAll, afterEach } from 'bun:test';
import { processHtmlWithRewriter, bundleAssets } from '../bundler';
import fs from 'fs';
import path from 'path';

describe('Bundler', () => {
  const testDir = path.join(process.cwd(), 'test-bundler');
  const assetsDir = path.join(testDir, 'assets');
  const outputDir = path.join(testDir, 'dist');

  // Test configuration
  const testConfig = {
    title: 'Test Site',
    description: 'Test Description',
    siteUrl: 'https://example.com',
    pagesDir: path.join(testDir, 'pages'),
    outputDir: outputDir,
    themeConfig: {
      name: 'default',
      defaultLayout: 'doc' as 'doc' | 'page' | 'home',
    },
    plugins: [],
    navigation: [],
    sidebar: [],
  };

  // Set up test files
  beforeAll(() => {
    // Create test directory structure
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    // Create test script file
    fs.writeFileSync(
      path.join(assetsDir, 'main.js'),
      `
      // Test JavaScript file
      console.log('BunPress test script loaded');
      
      // Export a test function
      export function sayHello() {
        return 'Hello from BunPress';
      }
    `
    );

    // Create test CSS file
    fs.writeFileSync(
      path.join(assetsDir, 'styles.css'),
      `
      /* Test CSS file */
      body {
        font-family: sans-serif;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      h1 {
        color: #0070f3;
      }
    `
    );

    // Create test HTML file
    fs.writeFileSync(
      path.join(assetsDir, 'index.html'),
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>BunPress Test</title>
          <link rel="stylesheet" href="styles.css">
          <script src="main.js" defer></script>
        </head>
        <body>
          <h1>BunPress Test Page</h1>
          <img src="logo.png" alt="Logo">
          <p>This is a test page for BunPress bundler.</p>
        </body>
      </html>
    `
    );

    // Create a test image
    // We'll just create an empty file for the test
    fs.writeFileSync(path.join(assetsDir, 'logo.png'), 'MOCK_IMAGE_DATA');
  });

  // Clean up after each test
  afterEach(() => {
    // Clean up output directory but keep it
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      fs.rmSync(path.join(outputDir, file), { recursive: true, force: true });
    }
  });

  // Clean up test files
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('processHtmlWithRewriter extracts assets from HTML', async () => {
    const htmlPath = path.join(assetsDir, 'index.html');

    const { html, assets } = await processHtmlWithRewriter(htmlPath, {
      extractAssets: true,
      injectHMR: false,
    });

    // Verify HTML transformation
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>BunPress Test</title>');

    // Check that assets were extracted
    expect(assets).toHaveLength(3);

    // Verify script asset
    const scriptAsset = assets.find(a => a.type === 'script');
    expect(scriptAsset).toBeDefined();
    expect(scriptAsset?.path.endsWith('main.js')).toBe(true);
    expect(scriptAsset?.attrs.defer).toBe('true');

    // Verify style asset
    const styleAsset = assets.find(a => a.type === 'style');
    expect(styleAsset).toBeDefined();
    expect(styleAsset?.path.endsWith('styles.css')).toBe(true);

    // Verify image asset
    const imageAsset = assets.find(a => a.type === 'image');
    expect(imageAsset).toBeDefined();
    expect(imageAsset?.path.endsWith('logo.png')).toBe(true);
    expect(imageAsset?.attrs.alt).toBe('Logo');
  });

  test('processHtmlWithRewriter injects HMR script when enabled', async () => {
    const htmlPath = path.join(assetsDir, 'index.html');

    const { html } = await processHtmlWithRewriter(htmlPath, {
      extractAssets: false,
      injectHMR: true,
    });

    // Verify HMR script was injected
    expect(html).toContain('<script src="/__bunpress_hmr.js"></script>');
  });

  test('bundleAssets processes JS files in isolation', async () => {
    // Create a simple JS file for bundling
    const simpleSrcDir = path.join(testDir, 'simple-src');
    fs.mkdirSync(simpleSrcDir, { recursive: true });

    const simpleJsFile = path.join(simpleSrcDir, 'simple.js');
    fs.writeFileSync(
      simpleJsFile,
      `
      // Simple JavaScript file for testing bundling
      export function add(a, b) {
        return a + b;
      }
      
      console.log('Simple module loaded');
    `
    );

    // Create a small output directory for this test only
    const simpleOutputDir = path.join(outputDir, 'simple-output');
    fs.mkdirSync(simpleOutputDir, { recursive: true });

    // Run bundleAssets with a single JS file
    const result = await bundleAssets([simpleJsFile], simpleOutputDir, testConfig, {
      minify: false,
      sourcemap: false,
    });

    // Verify the bundle was created
    expect(result.success).toBe(true);
    expect(result.outputs.length).toBeGreaterThan(0);

    // Verify the output file exists
    const outputFiles = fs.readdirSync(simpleOutputDir);
    expect(outputFiles.length).toBeGreaterThan(0);

    // Check that at least one .js file was created
    const jsFiles = outputFiles.filter(file => file.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    // Read the content of the output file and verify it contains our code
    const outputContent = fs.readFileSync(path.join(simpleOutputDir, jsFiles[0]), 'utf-8');
    expect(outputContent).toContain('function add');
  });

  test('bundleAssets handles empty entrypoints', async () => {
    // Test bundling with no entrypoints
    const result = await bundleAssets([], outputDir, testConfig);

    // Should succeed but do nothing
    expect(result.success).toBe(true);
    expect(result.outputs).toHaveLength(0);
  });
});
