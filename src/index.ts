#!/usr/bin/env bun

// Re-export public API from lib.ts
export * from './lib';

// Export config helpers
export { defineConfig, definePlugin } from './config';

// CLI code
import { startDevServer } from './core/dev-server';
import { loadConfig } from './core/config-loader';
import { buildSite } from './core/builder';
import path from 'path';
import fs from 'fs';

async function main() {
  try {
    // Check for command-line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    // Handle init command first
    if (command === 'init') {
      await initProject();
      return;
    }
    
    // Load configuration and plugins for other commands
    const { config, pluginManager } = await loadConfig();
    
    // Log loaded plugins
    console.log(`Loaded ${pluginManager.plugins.length} plugins:`);
    pluginManager.plugins.forEach(plugin => {
      console.log(`- ${plugin.name}`);
    });
    
    // Execute different commands based on input
    if (command === 'build') {
      // Build site
      await buildSite(config, pluginManager);
    } else if (command === 'dev' || !command) {
      // Default to dev server
      // Execute build start hooks
      await pluginManager.executeBuildStart();
      
      // Start the development server
      const { watcher } = startDevServer(config, pluginManager);
      
      // Handle server shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        
        // Execute build end hooks
        await pluginManager.executeBuildEnd();
        
        // Close watcher
        watcher.close();
        
        // Exit process
        process.exit(0);
      });
    } else {
      console.log(`Unknown command: ${command}`);
      printHelp();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
BunPress - A static site generator built with Bun

Usage:
  bunpress init          Initialize a new BunPress project
  bunpress dev           Start the development server (default)
  bunpress build         Build the site for production
  bunpress help          Display this help message

For more information, visit: https://github.com/bunpress/bunpress
`);
}

async function initProject() {
  console.log('Initializing a new BunPress project...');
  
  // Create directories
  fs.mkdirSync('pages', { recursive: true });
  fs.mkdirSync('public', { recursive: true });
  
  // Create config file
  const configContent = `import { defineConfig } from 'bunpress';
import { markdownItPlugin, prismPlugin } from 'bunpress/plugins';

export default defineConfig({
  title: 'My BunPress Site',
  description: 'Created with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: 'pages',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
    },
  },
  plugins: [
    markdownItPlugin({
      html: true,
      linkify: true,
    }),
    prismPlugin({
      theme: 'dark',
      languages: ['javascript', 'typescript'],
    }),
  ],
});
`;
  fs.writeFileSync('bunpress.config.ts', configContent);
  
  // Create a sample page
  const indexContent = `---
title: Welcome to BunPress
---

# Welcome to BunPress

This is a sample page created by BunPress. Edit this page to get started.

## Features

- Fast static site generation
- Markdown support
- Plugin system
- And more!

\`\`\`javascript
// Example code
function hello() {
  console.log("Hello, BunPress!");
}
\`\`\`
`;
  fs.writeFileSync(path.join('pages', 'index.md'), indexContent);
  
  console.log('Project initialized successfully! Run "bunpress dev" to start the development server.');
}

// Only run the CLI code if this file is executed directly (not imported)
if (import.meta.url === Bun.main) {
  // Check if called with "help" command
  if (process.argv.includes('help')) {
    printHelp();
  } else {
    main();
  }
} 