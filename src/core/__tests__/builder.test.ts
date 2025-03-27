import { describe, expect, test, beforeAll, afterAll, afterEach } from 'bun:test';
import { buildSite } from '../builder';
import fs from 'fs';
import path from 'path';
import { DefaultPluginManager } from '../plugin';

describe('Builder', () => {
  const testDir = path.join(process.cwd(), 'test-builder');
  const pagesDir = path.join(testDir, 'pages');
  const outputDir = path.join(testDir, 'dist');
  const publicDir = path.join(testDir, 'public');

  // Test configuration
  const testConfig = {
    title: 'Test Site',
    description: 'Test Description',
    siteUrl: 'https://example.com',
    pagesDir: pagesDir,
    outputDir: outputDir,
    themeConfig: {
      name: 'default',
      defaultLayout: 'doc' as 'doc' | 'page' | 'home',
    },
    plugins: [],
    navigation: [
      { title: 'Home', href: '/' },
      { title: 'About', href: '/about' },
    ],
    sidebar: [
      {
        title: 'Introduction',
        items: [{ title: 'Getting Started', href: '/docs/getting-started' }],
      },
    ],
  };

  // Set up test files
  beforeAll(() => {
    // Create test directory structure
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'themes', 'default'), { recursive: true });
    fs.mkdirSync(publicDir, { recursive: true });

    // Create a sample page
    const indexPage = path.join(pagesDir, 'index.md');
    fs.writeFileSync(
      indexPage,
      `---
title: Home Page
description: Welcome to the test site
---

# Welcome to the Test Site

This is a sample home page for testing the builder.
`
    );

    // Create a sample about page in a subdirectory
    const aboutDir = path.join(pagesDir, 'about');
    fs.mkdirSync(aboutDir, { recursive: true });
    const aboutPage = path.join(aboutDir, 'index.md');
    fs.writeFileSync(
      aboutPage,
      `---
title: About Page
description: About the test site
---

# About the Test Site

This page is about the test site.
`
    );

    // Create a public asset
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), 'test favicon');

    // Create a basic theme file
    const layoutFile = path.join(testDir, 'themes', 'default', 'layout.ts');
    fs.writeFileSync(
      layoutFile,
      `
      // Simple layout component
      console.log('Layout component loaded');
      
      // Get layout parameters
      const app = document.getElementById('app');
      const params = JSON.parse(app.getAttribute('data-layout-params'));
      
      // Render content
      document.body.innerHTML = \`
        <header>
          <h1>\${params.frontmatter.title}</h1>
        </header>
        <main>\${params.content}</main>
        <footer>Test Footer</footer>
      \`;
    `
    );
  });

  // Clean up after each test
  afterEach(() => {
    // Clean up output directory
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  // Clean up all test files
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('builds a site with pages', async () => {
    // Create a mock plugin manager
    const pluginManager = new DefaultPluginManager();

    // Add spy methods to track hook execution
    let buildStartCalled = false;
    let buildEndCalled = false;

    pluginManager.executeBuildStart = async () => {
      buildStartCalled = true;
      return Promise.resolve();
    };

    pluginManager.executeBuildEnd = async () => {
      buildEndCalled = true;
      return Promise.resolve();
    };

    // Run the build
    await buildSite(testConfig, pluginManager);

    // Verify files were created
    expect(fs.existsSync(path.join(outputDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'about', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'sitemap.xml'))).toBe(true);

    // Verify content of files
    const indexHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<!DOCTYPE html>');
    expect(indexHtml).toContain('<title>Home Page</title>');
    expect(indexHtml).toContain('Welcome to the Test Site');

    const aboutHtml = fs.readFileSync(path.join(outputDir, 'about', 'index.html'), 'utf-8');
    expect(aboutHtml).toContain('<!DOCTYPE html>');
    expect(aboutHtml).toContain('<title>About Page</title>');
    expect(aboutHtml).toContain('About the Test Site');

    // Verify sitemap was created
    const sitemap = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf-8');
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('<loc>https://example.com/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/about</loc>');

    // Verify plugin hooks were called
    expect(buildStartCalled).toBe(true);
    expect(buildEndCalled).toBe(true);
  });

  test('copies public assets to output directory', async () => {
    // Create a public directory within the test directory instead of in cwd
    const publicDir = path.join(testDir, 'public');

    // Make sure it exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Create a test file in it
    fs.writeFileSync(path.join(publicDir, 'test-favicon.ico'), 'test favicon');

    // Update the test config to point to our test public directory
    const testConfigWithPublic = {
      ...testConfig,
      publicDir: publicDir,
    };

    try {
      // Run the build
      await buildSite(testConfigWithPublic);

      // Verify public directory was copied
      expect(fs.existsSync(path.join(outputDir, 'public', 'test-favicon.ico'))).toBe(true);

      // Verify content of copied file
      const favicon = fs.readFileSync(path.join(outputDir, 'public', 'test-favicon.ico'), 'utf-8');
      expect(favicon).toBe('test favicon');
    } finally {
      // No need to manually cleanup as afterAll will handle it
    }
  });
});
