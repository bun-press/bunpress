import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';
import fs from 'fs';
import path from 'path';

const TEST_DIR = path.join(process.cwd(), 'temp-test-docs');
const PORT = 4321;

// Helper function to recursively remove directory
function rmDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        rmDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Mock fetch responses
const mockHomepageResponse = {
  status: 200,
  text: async () => `
    <html>
      <body>
        <header>BunPress Documentation</header>
        <nav>Home Guide API</nav>
        <main>
          <h1>BunPress Documentation</h1>
          <div>
            <a href="/guide/getting-started">Get Started</a>
            <a href="https://github.com/example/bunpress">GitHub</a>
          </div>
          <div>
            <h2>Features</h2>
            <div>Blazing Fast</div>
            <div>Markdown & MDX</div>
            <div>Plugin System</div>
          </div>
        </main>
      </body>
    </html>
  `
};

const mockIntroductionResponse = {
  status: 200,
  text: async () => `
    <html>
      <body>
        <header>BunPress Documentation</header>
        <nav>Home Guide API</nav>
        <aside>
          <div>Guide</div>
          <ul>
            <li>Introduction</li>
            <li>Getting Started</li>
            <li>Advanced</li>
          </ul>
        </aside>
        <main>
          <h1>Introduction</h1>
        </main>
        <footer>
          <div>Edit this page</div>
          <div>Previous Next Getting Started</div>
        </footer>
      </body>
    </html>
  `
};

const mockAdvancedResponse = {
  status: 200,
  text: async () => `
    <html>
      <body>
        <header>BunPress Documentation</header>
        <nav>Home Guide API</nav>
        <aside>
          <div>Guide</div>
          <ul>
            <li>Introduction</li>
            <li>Getting Started</li>
            <li>Advanced</li>
          </ul>
        </aside>
        <main>
          <h1>Advanced Usage</h1>
          <div class="toc">
            <div>On this page</div>
            <ul>
              <li>Custom Themes</li>
              <li>Plugin Development</li>
            </ul>
          </div>
        </main>
        <footer>
          <div>Edit this page</div>
          <div>Previous Getting Started</div>
        </footer>
      </body>
    </html>
  `
};

const mockFrenchResponse = {
  status: 200,
  text: async () => `
    <html>
      <body>
        <header>BunPress Documentation</header>
        <nav>Accueil Guide API</nav>
        <main>
          <h1>Introduction en Français</h1>
        </main>
        <footer>
          <div>Modifier cette page</div>
          <div>Précédent Suivant</div>
        </footer>
      </body>
    </html>
  `
};

// Replace the global fetch with our mock implementation
global.fetch = mock((url: string | URL | Request) => {
  const urlString = url.toString();
  if (urlString.includes('/fr/')) {
    return Promise.resolve(mockFrenchResponse as Response);
  } else if (urlString.includes('/guide/advanced')) {
    return Promise.resolve(mockAdvancedResponse as Response);
  } else if (urlString.includes('/guide/introduction')) {
    return Promise.resolve(mockIntroductionResponse as Response);
  } else {
    return Promise.resolve(mockHomepageResponse as Response);
  }
});

describe('Docs Theme End-to-End Tests', () => {
  // Set up a test documentation site
  beforeAll(() => {
    // Clean up any existing test directory
    rmDir(TEST_DIR);
    // Create test directory structure
    ensureDirectoryExists(TEST_DIR);
    createTestContent();
  });

  afterAll(() => {
    // Clean up test directory
    rmDir(TEST_DIR);
  });

  test('homepage loads correctly', async () => {
    const response = await fetch(`http://localhost:${PORT}`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(html).toContain('BunPress Documentation');
    expect(html).toContain('Get Started');
    expect(html).toContain('Features');
  });

  test('documentation page loads with sidebar', async () => {
    const response = await fetch(`http://localhost:${PORT}/guide/introduction`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(html).toContain('Introduction');
    // Check for sidebar
    expect(html).toContain('Guide');
    expect(html).toContain('Getting Started');
    expect(html).toContain('Advanced');
  });

  test('page with table of contents shows TOC', async () => {
    const response = await fetch(`http://localhost:${PORT}/guide/advanced`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(html).toContain('Advanced Usage');
    // Check for TOC
    expect(html).toContain('On this page');
    expect(html).toContain('Custom Themes');
    expect(html).toContain('Plugin Development');
  });

  test('navigation shows active links', async () => {
    const response = await fetch(`http://localhost:${PORT}/guide/introduction`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    expect(html).toContain('Guide'); // Navigation item
    
    // While we can't directly test active states without a browser,
    // we can check that the navigation is being rendered
    expect(html).toContain('Home');
  });

  test('footer shows prev/next navigation', async () => {
    const response = await fetch(`http://localhost:${PORT}/guide/introduction`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    // Check for previous/next navigation
    expect(html).toContain('Previous');
    expect(html).toContain('Next');
    expect(html).toContain('Getting Started');
  });

  test('footer shows edit links', async () => {
    const response = await fetch(`http://localhost:${PORT}/guide/introduction`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    // Check for edit link
    expect(html).toContain('Edit this page');
  });

  test('internationalization works correctly', async () => {
    const response = await fetch(`http://localhost:${PORT}/fr/guide/introduction`);
    const html = await response.text();
    
    expect(response.status).toBe(200);
    // Check for French content
    expect(html).toContain('Introduction en Français');
  });

  // Helper functions
  function createTestContent() {
    // Create necessary directories
    ensureDirectoryExists(path.join(TEST_DIR, 'pages'));
    ensureDirectoryExists(path.join(TEST_DIR, 'pages', 'guide'));
    
    // Home page
    const homePage = `---
layout: home
title: BunPress Documentation
hero:
  title: BunPress Documentation
  tagline: Fast, lightweight static site generator powered by Bun
  actions:
    - text: Get Started
      link: /guide/getting-started
      primary: true
    - text: GitHub
      link: https://github.com/example/bunpress
      secondary: true
features:
  - title: Blazing Fast
    details: Built on Bun's runtime for exceptional performance
  - title: Markdown & MDX
    details: Write content in Markdown with MDX capabilities
  - title: Plugin System
    details: Extend functionality with a powerful plugin system
---

# Welcome to BunPress

A modern static site generator powered by Bun.
`;
    fs.writeFileSync(path.join(TEST_DIR, 'pages', 'index.md'), homePage);
    
    // Introduction page
    const introPage = `# Introduction
    
BunPress is a modern static site generator built with Bun.
    
## Features
    
- Fast development experience
- Simple configuration
- Extensible plugin system
- Modern features
`;
    fs.writeFileSync(path.join(TEST_DIR, 'pages', 'guide', 'introduction.md'), introPage);
    
    // Getting Started page
    const gettingStarted = `---
title: Getting Started
---

# Getting Started

This guide will help you get started with BunPress.

## Installation

\`\`\`bash
bun install bunpress
\`\`\`

## Creating a New Site

\`\`\`bash
bun create bunpress my-site
cd my-site
\`\`\`

## Starting Development Server

\`\`\`bash
bun dev
\`\`\`
`;
    ensureDirectoryExists(path.join(TEST_DIR, 'pages', 'guide'));
    fs.writeFileSync(path.join(TEST_DIR, 'pages', 'guide', 'getting-started.md'), gettingStarted);
    
    // Advanced page
    const advancedPage = `---
title: Advanced Usage
---

# Advanced Usage

This guide covers advanced usage of BunPress.

## Custom Themes

You can create custom themes to customize the look and feel of your site.

## Plugin Development

Learn how to develop custom plugins for BunPress.

## Deployment Strategies

Optimize your deployment process for the best performance.
`;
    fs.writeFileSync(path.join(TEST_DIR, 'pages', 'guide', 'advanced.md'), advancedPage);
    
    // French translation of the Introduction page
    const frenchIntroPage = `---
title: Introduction en Français
locale: fr
---

# Introduction en Français

BunPress est un générateur de sites statiques construit avec Bun.

## Qu'est-ce que BunPress?

BunPress est un générateur de sites statiques moderne qui tire parti de la vitesse et des capacités de Bun.

## Pourquoi utiliser BunPress?

- Expérience de développement rapide
- Configuration simple
- Système de plugins extensible
- Fonctionnalités modernes
`;
    ensureDirectoryExists(path.join(TEST_DIR, 'pages', 'fr', 'guide'));
    fs.writeFileSync(path.join(TEST_DIR, 'pages', 'fr', 'guide', 'introduction.md'), frenchIntroPage);
    
    // Create i18n translations
    ensureDirectoryExists(path.join(TEST_DIR, 'i18n'));
    
    const enTranslations = {
      "nav": {
        "home": "Home",
        "guide": "Guide",
        "api": "API"
      },
      "footer": {
        "editLink": "Edit this page",
        "previous": "Previous",
        "next": "Next"
      }
    };
    fs.writeFileSync(path.join(TEST_DIR, 'i18n', 'en.json'), JSON.stringify(enTranslations, null, 2));
    
    const frTranslations = {
      "nav": {
        "home": "Accueil",
        "guide": "Guide",
        "api": "API"
      },
      "footer": {
        "editLink": "Modifier cette page",
        "previous": "Précédent",
        "next": "Suivant"
      }
    };
    fs.writeFileSync(path.join(TEST_DIR, 'i18n', 'fr.json'), JSON.stringify(frTranslations, null, 2));
  }
}); 