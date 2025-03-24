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
import chalk from 'chalk';
import { Listr } from 'listr2';

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
    
    // Log loaded plugins with chalk styling
    console.log(chalk.blue.bold(`\nBunPress: ${chalk.green(config.title || 'Untitled')}`));
    console.log(chalk.blue(`Loaded ${chalk.yellow(pluginManager.plugins.length.toString())} plugins:`));
    pluginManager.plugins.forEach(plugin => {
      console.log(chalk.green(`• ${plugin.name}`));
    });
    console.log(''); // Empty line for spacing
    
    // Execute different commands based on input
    if (command === 'build') {
      // Build site with listr2 tasks
      const tasks = new Listr(
        [
          {
            title: 'Initializing build process',
            task: async (_, task) => {
              task.output = 'Setting up build environment...';
              await pluginManager.executeBuildStart();
            },
          },
          {
            title: 'Building site',
            task: async () => {
              await buildSite(config, pluginManager);
            },
          },
        ],
        { 
          renderer: 'default',
          rendererOptions: { 
            collapseSubtasks: false,
            formatOutput: 'wrap' 
          }
        }
      );
      
      await tasks.run();
      console.log(chalk.green.bold('\n✨ Build completed successfully!\n'));
      
    } else if (command === 'dev' || !command) {
      // Execute build start hooks
      await pluginManager.executeBuildStart();
      
      // Start the development server
      console.log(chalk.yellow('Starting development server...\n'));
      const { watcher } = startDevServer(config, pluginManager);
      
      // Handle server shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nShutting down...'));
        
        // Execute build end hooks
        await pluginManager.executeBuildEnd();
        
        // Close watcher
        watcher.close();
        
        // Exit process
        console.log(chalk.green('Server stopped. Goodbye! 👋\n'));
        process.exit(0);
      });
    } else {
      console.log(chalk.red(`\n❌ Unknown command: ${command}`));
      printHelp();
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(chalk.blue.bold(`
BunPress - A static site generator built with Bun

${chalk.white('Usage:')}
  ${chalk.green('bunpress init')}          Initialize a new BunPress project
  ${chalk.green('bunpress dev')}           Start the development server (default)
  ${chalk.green('bunpress build')}         Build the site for production
  ${chalk.green('bunpress help')}          Display this help message

For more information, visit: ${chalk.cyan('https://github.com/bunpress/bunpress')}
`));
}

async function initProject() {
  console.log(chalk.blue.bold('\nInitializing a new BunPress project...'));
  
  const tasks = new Listr(
    [
      {
        title: 'Creating project structure',
        task: () => {
          // Create directories
          fs.mkdirSync('pages', { recursive: true });
          fs.mkdirSync('public', { recursive: true });
          return 'Created project directories';
        },
      },
      {
        title: 'Creating configuration file',
        task: () => {
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
          return 'Created configuration file';
        },
      },
      {
        title: 'Creating sample content',
        task: () => {
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
          return 'Created sample page';
        },
      },
    ],
    { 
      renderer: 'default',
      rendererOptions: { 
        collapseSubtasks: false,
        formatOutput: 'wrap' 
      }
    }
  );
  
  await tasks.run();
  console.log(chalk.green.bold('\n✨ Project initialized successfully!'));
  console.log(chalk.blue(`\nRun ${chalk.yellow('bunpress dev')} to start the development server.\n`));
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