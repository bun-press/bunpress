import { describe, test, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import { ThemeManager } from '../theme-manager';
import path from 'path';
import fs, { PathLike } from 'fs';

// Mock fs module
mock.module('fs', () => {
  return {
    existsSync: () => true,
    readdirSync: () => [{ name: 'default', isDirectory: () => true }],
    readFileSync: () => 'body { color: black; }',
  };
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let mockFs: any;
  
  beforeEach(() => {
    // Set up mocks
    mockFs = {
      existsSync: () => true,
      readdirSync: () => [{ name: 'default', isDirectory: () => true }],
      readFileSync: () => 'body { color: black; }',
    };
    
    // Spy on fs methods
    spyOn(fs, 'existsSync').mockImplementation(mockFs.existsSync);
    spyOn(fs, 'readdirSync').mockImplementation(mockFs.readdirSync);
    spyOn(fs, 'readFileSync').mockImplementation(mockFs.readFileSync);
    
    // Create theme manager
    themeManager = new ThemeManager('/test/workspace');
  });
  
  afterEach(() => {
    // Restore mocks
    mock.restore();
  });
  
  test('loads available themes', () => {
    // Setup mock for theme directory with default theme
    const availableThemes = themeManager.getAvailableThemes();
    expect(availableThemes).toContain('default');
  });
  
  test('sets active theme from config', () => {
    // Mock theme files exist
    spyOn(fs, 'existsSync').mockImplementation((path: PathLike) => {
      return true;
    });
    
    const config = {
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: 'pages',
      outputDir: 'dist',
      themeConfig: {
        name: 'default',
        options: {
          primaryColor: '#ff0000',
        },
      },
      plugins: [],
    };
    
    themeManager.setThemeFromConfig(config);
    const activeTheme = themeManager.getActiveTheme();
    
    expect(activeTheme).not.toBeNull();
    expect(activeTheme?.name).toBe('default');
    expect(activeTheme?.options?.primaryColor).toBe('#ff0000');
  });
  
  test('falls back to default theme when specified theme not found', () => {
    // Mock theme 'custom' not existing but 'default' does
    spyOn(fs, 'existsSync').mockImplementation((filePath: PathLike) => {
      const pathStr = filePath.toString();
      return pathStr.includes('default');
    });
    
    const config = {
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: 'pages',
      outputDir: 'dist',
      themeConfig: {
        name: 'custom', // This theme doesn't exist
        options: {},
      },
      plugins: [],
    };
    
    // Mock console for warning
    const originalWarn = console.warn;
    console.warn = () => {};
    
    themeManager.setThemeFromConfig(config);
    const activeTheme = themeManager.getActiveTheme();
    
    // Restore console
    console.warn = originalWarn;
    
    expect(activeTheme).not.toBeNull();
    expect(activeTheme?.name).toBe('default');
  });
  
  test('gets theme style content', () => {
    // Set active theme first
    const config = {
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'https://example.com',
      pagesDir: 'pages',
      outputDir: 'dist',
      themeConfig: {
        name: 'default',
        options: {},
      },
      plugins: [],
    };
    
    themeManager.setThemeFromConfig(config);
    
    // Should read the style file
    const styles = themeManager.getThemeStyleContent();
    expect(styles).toBe('body { color: black; }');
  });
  
  test('returns empty string for styles when no active theme', () => {
    // Don't set any active theme
    const styles = themeManager.getThemeStyleContent();
    expect(styles).toBe('');
  });
}); 