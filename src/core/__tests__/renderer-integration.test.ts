import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { renderHtml } from '../renderer';
import { initThemeManager } from '../theme-manager';
import type { BunPressConfig } from '../../../bunpress.config';
import { JSDOM } from 'jsdom';

// End-to-end tests for renderer with theme integration
describe('Renderer Integration Tests', () => {
  // Set up test environment
  const TEST_DIR = path.join(process.cwd(), 'test-renderer');
  const THEMES_DIR = path.join(TEST_DIR, 'themes');
  const THEME_DIR = path.join(THEMES_DIR, 'test-theme');

  // Create a test config
  const testConfig: BunPressConfig = {
    title: 'Test Site',
    description: 'Test Description',
    siteUrl: 'https://example.com',
    pagesDir: './pages',
    outputDir: './dist',
    plugins: [],
    navigation: [
      { title: 'Home', href: '/' },
      { title: 'Docs', href: '/docs' },
    ],
    sidebar: [
      { title: 'Introduction', href: '/docs/intro' },
      { title: 'Getting Started', href: '/docs/getting-started' },
    ],
    themeConfig: {
      name: 'test-theme',
      defaultLayout: 'doc' as 'doc' | 'page' | 'home',
      options: {
        darkMode: true,
      },
    },
  };

  // Test content data
  const testContent = {
    html: `
      <h1 id="test-heading">Test Heading</h1>
      <p>This is a test paragraph.</p>
      <h2 id="section-1">Section 1</h2>
      <p>Content for section 1.</p>
      <h2 id="section-2">Section 2</h2>
      <p>Content for section 2.</p>
    `,
    frontmatter: {
      title: 'Test Page',
      description: 'A test page',
      layout: 'doc',
    },
    toc: [
      { level: 1, id: 'test-heading', text: 'Test Heading' },
      { level: 2, id: 'section-1', text: 'Section 1' },
      { level: 2, id: 'section-2', text: 'Section 2' }
    ]
  };

  beforeEach(() => {
    // Create test directories
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(THEMES_DIR, { recursive: true });
    fs.mkdirSync(THEME_DIR, { recursive: true });

    // Create layouts directory for the theme
    const layoutsDir = path.join(THEME_DIR, 'layouts');
    fs.mkdirSync(layoutsDir, { recursive: true });

    // Create theme files
    fs.writeFileSync(
      path.join(THEME_DIR, 'index.tsx'),
      `
      import React from 'react';
      import DocLayout from './layouts/DocLayout';
      export default function Layout(props) {
        return <DocLayout {...props} />;
      }
      `
    );

    // Create layouts with correct property names
    fs.writeFileSync(
      path.join(layoutsDir, 'DocLayout.tsx'),
      `
      import React from 'react';
      export default function DocLayout({ frontmatter, content, navItems, sidebarItems, tocItems, children }) {
        return (
          <div className="doc-layout">
            <header>
              <h1>{frontmatter.title}</h1>
              <nav>
                {navItems?.map((item, i) => (
                  <a key={i} href={item.href}>{item.title}</a>
                ))}
              </nav>
            </header>
            <div className="layout">
              <aside className="sidebar">
                {sidebarItems?.map((item, i) => (
                  <a key={i} href={item.href}>{item.title}</a>
                ))}
              </aside>
              <main>{children}</main>
              <div className="toc">
                {tocItems?.map((item, i) => (
                  <a key={i} href={\`#\${item.id}\`}>{item.text}</a>
                ))}
              </div>
            </div>
          </div>
        );
      }
      `
    );

    // Add HomeLayout.tsx to ensure it's available
    fs.writeFileSync(
      path.join(layoutsDir, 'HomeLayout.tsx'),
      `
      import React from 'react';
      export default function HomeLayout({ frontmatter, children }) {
        return (
          <div className="home-layout">
            <div className="hero">
              <h1>{frontmatter.title}</h1>
            </div>
            <main>{children}</main>
          </div>
        );
      }
      `
    );

    // Create styles.css
    fs.writeFileSync(
      path.join(THEME_DIR, 'styles.css'),
      `
      body { 
        font-family: sans-serif;
        color: #333;
      }
      .doc-layout {
        display: flex;
        flex-direction: column;
      }
      .layout {
        display: flex;
      }
      main {
        flex: 1;
        padding: 20px;
      }
      .home-layout {
        display: flex;
        flex-direction: column;
      }
      .hero {
        background: #f0f0f0;
        padding: 50px;
      }
      `
    );
  });

  afterEach(() => {
    // Clean up test directories
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should render HTML with theme', () => {
    // Initialize theme manager for testing
    initThemeManager(TEST_DIR);

    // Render the HTML
    const renderOptions = {
      layout: 'doc',
    };

    const html = renderHtml(testContent, testConfig, TEST_DIR, renderOptions);

    // Validate the rendered HTML
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en" class="bunpress-theme theme-test-theme dark">');
    expect(html).toContain('<title>Test Page</title>');
    expect(html).toContain('<meta name="description" content="A test page">');

    // Check for theme styles inclusion
    expect(html).toContain('<style id="theme-styles">');
    expect(html).toContain('font-family: sans-serif');

    // Check for content inclusion
    expect(html).toContain('Test Heading');
    expect(html).toContain('This is a test paragraph.');

    // Check for navigation and sidebar items with title instead of text
    expect(html).toContain('Home');
    expect(html).toContain('Docs');
    expect(html).toContain('Introduction');
    expect(html).toContain('Getting Started');
  });

  it('should extract and include TOC items', () => {
    // Initialize theme manager for testing
    initThemeManager(TEST_DIR);

    // Render the HTML
    const html = renderHtml(testContent, testConfig, TEST_DIR);

    // Use JSDOM to parse the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get the layout params data from the script
    const appElement = document.getElementById('app');
    const params = JSON.parse(appElement?.getAttribute('data-layout-params') || '{}');

    // Check if TOC items were extracted correctly
    expect(params.tocItems).toBeDefined();
    expect(params.tocItems.length).toBe(3); // h1 + 2 h2 headings

    // Verify TOC items content
    expect(params.tocItems[0].text).toBe('Test Heading');
    expect(params.tocItems[0].id).toBe('test-heading');
    expect(params.tocItems[0].level).toBe(1);

    expect(params.tocItems[1].text).toBe('Section 1');
    expect(params.tocItems[1].id).toBe('section-1');
    expect(params.tocItems[1].level).toBe(2);

    expect(params.tocItems[2].text).toBe('Section 2');
    expect(params.tocItems[2].id).toBe('section-2');
    expect(params.tocItems[2].level).toBe(2);
  });

  it('should use different layout types based on frontmatter', () => {
    // Initialize theme manager for testing
    initThemeManager(TEST_DIR);

    // Register the layouts directory in the theme manager
    const themeManager = initThemeManager(TEST_DIR);
    const themes = themeManager.getThemes();
    const testTheme = themes.get('test-theme');
    if (testTheme) {
      // Ensure the theme has layouts registered
      testTheme.layouts = {
        doc: path.join(THEME_DIR, 'layouts', 'DocLayout.tsx'),
        home: path.join(THEME_DIR, 'layouts', 'HomeLayout.tsx')
      };
    }

    // Set active theme
    themeManager.setThemeFromConfig(testConfig);

    // Content with home layout
    const homeContent = {
      html: '<h1 id="welcome">Welcome</h1><p>Home page content.</p>',
      frontmatter: {
        title: 'Home Page',
        description: 'Welcome to the site',
        layout: 'home'
      }
    };

    // Render with home layout
    const html = renderHtml(homeContent, testConfig, TEST_DIR);

    // Check for home layout specific elements in the rendered HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Check that home layout is used in the params
    const appElement = document.getElementById('app');
    const params = JSON.parse(appElement?.getAttribute('data-layout-params') || '{}');

    expect(params.frontmatter.layout).toBe('home');

    // Check for the home page title
    expect(html).toContain('Home Page');
    expect(html).toContain('Welcome');
    expect(html).toContain('Home page content.');
  });

  it('should fall back to a basic template if theme is not found', () => {
    // Create a config with non-existent theme
    const invalidConfig = {
      ...testConfig,
      themeConfig: {
        name: 'non-existent-theme',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home',
        options: {}
      }
    };

    // Initialize theme manager with the test directory
    initThemeManager(TEST_DIR);

    // Render with invalid theme
    const html = renderHtml(testContent, invalidConfig, TEST_DIR);

    // Should fall back to simple template
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Test Page</title>');
    expect(html).toContain('<meta name="description" content="A test page">');
    expect(html).toContain('<h1>Test Page</h1>');
    expect(html).toContain('Test Heading');
    expect(html).toContain('This is a test paragraph.');
    expect(html).toContain('Built with BunPress');

    // Should not contain theme-specific elements
    expect(html).not.toContain('doc-layout');
    expect(html).not.toContain('home-layout');
  });
});
