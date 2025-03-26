import { DefaultThemeManager } from './src/core/theme-manager.js';
import fs from 'fs';
import path from 'path';

console.log(`Testing DefaultThemeManager`);
console.log(`Current directory: ${process.cwd()}`);

// Create an instance of theme manager with the current directory as workspace root
const themeManager = new DefaultThemeManager(process.cwd());

// Wait for theme loading to complete
setTimeout(async () => {
  // Get the available themes
  const themes = themeManager.getThemes();
  console.log(`Found ${themes.size} themes:`);
  
  for (const [name, theme] of themes.entries()) {
    console.log(`\nTheme: ${name}`);
    console.log(`  Path: ${theme.path}`);
    console.log(`  Layout component: ${theme.layoutComponent}`);
    console.log(`  Layout component exists: ${fs.existsSync(theme.layoutComponent)}`);
    console.log(`  Style file: ${theme.styleFile}`);
    console.log(`  Style file exists: ${fs.existsSync(theme.styleFile)}`);
    
    if (theme.layouts) {
      console.log(`  Layouts:`);
      for (const [layoutType, layoutPath] of Object.entries(theme.layouts)) {
        console.log(`    ${layoutType}: ${layoutPath} (exists: ${fs.existsSync(layoutPath)})`);
      }
    }
  }
  
  // Get the theme names
  const themeNames = themeManager.getAvailableThemes();
  console.log(`\nAvailable theme names: ${themeNames.join(', ')}`);
  
  // Test setting active theme
  if (themes.has('docs')) {
    console.log(`\nSetting active theme to 'docs'`);
    themeManager.setThemeFromConfig({
      title: 'Test',
      description: 'Test',
      siteUrl: 'https://example.com',
      pagesDir: './pages',
      outputDir: './dist',
      themeConfig: {
        name: 'docs',
        defaultLayout: 'doc',
        options: {}
      }
    });
    
    const activeTheme = themeManager.getActiveTheme();
    console.log(`Active theme: ${activeTheme?.name}`);
    
    // Get theme style content
    const styleContent = await themeManager.getThemeStyleContent();
    console.log(`Style content length: ${styleContent.length} characters`);
    console.log(`Style content: ${styleContent}`);
  }
}, 1000); 