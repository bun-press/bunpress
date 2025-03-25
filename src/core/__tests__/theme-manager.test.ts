import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { ThemeManager } from '../theme-manager';
import fs from 'fs';
import path from 'path';

describe('ThemeManager', () => {
  const testDir = path.join(process.cwd(), 'test-theme-manager');
  const themesDir = path.join(testDir, 'themes');
  
  // Set up test theme files
  beforeAll(() => {
    // Create test directory structure
    // Main themes directory
    fs.mkdirSync(themesDir, { recursive: true });
    
    // Create "docs" theme (default)
    const docsThemeDir = path.join(themesDir, 'docs');
    fs.mkdirSync(docsThemeDir, { recursive: true });
    
    // Create Layout.tsx and styles.css for docs theme
    fs.writeFileSync(path.join(docsThemeDir, 'Layout.tsx'), 'export default function DocsLayout() { return null; }');
    fs.writeFileSync(path.join(docsThemeDir, 'styles.css'), 'body { font-family: Arial; }');
    
    // Create "blog" theme
    const blogThemeDir = path.join(themesDir, 'blog');
    fs.mkdirSync(blogThemeDir, { recursive: true });
    
    // Create Layout.tsx and styles.css for blog theme
    fs.writeFileSync(path.join(blogThemeDir, 'Layout.tsx'), 'export default function BlogLayout() { return null; }');
    fs.writeFileSync(path.join(blogThemeDir, 'styles.css'), 'body { font-family: Georgia; }');
    
    // Create an incomplete theme (missing files)
    const incompleteThemeDir = path.join(themesDir, 'incomplete');
    fs.mkdirSync(incompleteThemeDir, { recursive: true });
    
    // Only create Layout.tsx, missing styles.css
    fs.writeFileSync(path.join(incompleteThemeDir, 'Layout.tsx'), 'export default function IncompleteLayout() { return null; }');
  });
  
  // Clean up test files
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  test('loads available themes', () => {
    const themeManager = new ThemeManager(testDir);
    const availableThemes = themeManager.getAvailableThemes();
    
    // Should find the two complete themes: docs and blog
    expect(availableThemes).toHaveLength(2);
    expect(availableThemes).toContain('docs');
    expect(availableThemes).toContain('blog');
    
    // Should not include the incomplete theme
    expect(availableThemes).not.toContain('incomplete');
  });
  
  test('sets active theme from config', () => {
    const themeManager = new ThemeManager(testDir);
    
    // Set to blog theme
    themeManager.setThemeFromConfig({
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: './pages',
      outputDir: './dist',
      themeConfig: {
        name: 'blog',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home'
      },
      plugins: [],
      navigation: [],
      sidebar: []
    });
    
    const activeTheme = themeManager.getActiveTheme();
    expect(activeTheme).not.toBeNull();
    expect(activeTheme?.name).toBe('blog');
  });
  
  test('falls back to default theme when requested theme not found', () => {
    const themeManager = new ThemeManager(testDir);
    
    // Try to set to non-existent theme
    themeManager.setThemeFromConfig({
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: './pages',
      outputDir: './dist',
      themeConfig: {
        name: 'non-existent',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home'
      },
      plugins: [],
      navigation: [],
      sidebar: []
    });
    
    const activeTheme = themeManager.getActiveTheme();
    expect(activeTheme).not.toBeNull();
    expect(activeTheme?.name).toBe('docs'); // Should fall back to default 'docs' theme
  });
  
  test('gets theme style content', () => {
    const themeManager = new ThemeManager(testDir);
    
    // Set to blog theme
    themeManager.setThemeFromConfig({
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: './pages',
      outputDir: './dist',
      themeConfig: {
        name: 'blog',
        defaultLayout: 'doc' as 'doc' | 'page' | 'home'
      },
      plugins: [],
      navigation: [],
      sidebar: []
    });
    
    const styleContent = themeManager.getThemeStyleContent();
    expect(styleContent).toBe('body { font-family: Georgia; }');
  });
  
  test('returns empty string for theme style when no active theme', () => {
    // Create ThemeManager with a directory that doesn't have themes
    const emptyDir = path.join(testDir, 'empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    
    const themeManager = new ThemeManager(emptyDir);
    const styleContent = themeManager.getThemeStyleContent();
    
    expect(styleContent).toBe('');
  });
});
