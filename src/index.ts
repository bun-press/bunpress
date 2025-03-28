#!/usr/bin/env bun

// Re-export public API from lib.ts
export * from './lib';

// Export config helpers
export { defineConfig, definePlugin } from './config';

// Export specific plugins rather than all plugins to avoid conflicts
// Instead of: export * from './plugins';
import * as pluginsModule from './plugins';
export { pluginsModule as plugins };

// CLI code
import { startDevServer } from './core/dev-server';
import { loadConfig } from './core/config-loader';
import { buildSite } from './core/builder';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { Listr } from 'listr2';
import { processHTMLEntrypoints } from './core/bundler';
import { Glob } from 'bun';
import { ContentProcessor, ContentFile } from './core/content-processor';

// Version is read from package.json
const version = (() => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
    );
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
})();

// Add function to find HTML files recursively
function findHtmlFiles(dir: string, exclude: string[] = ['node_modules', 'dist']): string[] {
  const htmlFiles: string[] = [];

  const processDir = (directory: string) => {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    for (const file of files) {
      // Skip excluded directories
      if (file.isDirectory() && exclude.includes(file.name)) {
        continue;
      }

      const fullPath = path.join(directory, file.name);
      if (file.isDirectory()) {
        processDir(fullPath);
      } else if (file.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  };

  try {
    processDir(dir);
  } catch (error) {
    console.error('Error scanning for HTML files:', error);
  }

  return htmlFiles;
}

// Rename help function for consistency
function showHelp() {
  console.log(
    chalk.bold(
      `\n${chalk.blue('B')}${chalk.cyan('u')}${chalk.green('n')}${chalk.yellow('P')}${chalk.red('r')}${chalk.magenta('e')}${chalk.blue('s')}${chalk.cyan('s')} ${chalk.gray(`v${version}`)}`
    )
  );
  console.log('\nUsage:');
  console.log('  bunpress [command] [options]');
  console.log('\nCommands:');
  console.log('  init               Initialize a new BunPress project');
  console.log('  dev                Start development server');
  console.log('  build              Build site for production');
  console.log('  help               Show help information');
  console.log('\nOptions:');
  console.log('  --help, -h         Show help information');
  console.log('  --version, -v      Show version information');
  console.log('  --html             Use HTML-first bundling (with build command)');
  console.log('  --hybrid           Use hybrid bundling (HTML + Markdown with build command)');
  console.log('\nExamples:');
  console.log('  bunpress init      Initialize a new project');
  console.log('  bunpress dev       Start development server');
  console.log('  bunpress build     Build for production');
  console.log('');
}

// Rename init function for consistency
async function initializeProject(_args: string[] = []) {
  console.log(
    chalk.bold(
      `\n${chalk.blue('B')}${chalk.cyan('u')}${chalk.green('n')}${chalk.yellow('P')}${chalk.red('r')}${chalk.magenta('e')}${chalk.blue('s')}${chalk.cyan('s')} ${chalk.gray(`v${version}`)}`
    )
  );
  console.log(chalk.green('\n📚 Initializing new BunPress project...\n'));

  // Extract directory from args or use current directory
  const targetDir = _args[0] || '.';
  const absoluteTargetDir = path.resolve(process.cwd(), targetDir);

  // Create directory structure if needed
  if (targetDir !== '.' && !fs.existsSync(absoluteTargetDir)) {
    fs.mkdirSync(absoluteTargetDir, { recursive: true });
    console.log(chalk.green(`✅ Created project directory: ${targetDir}`));
  }

  // Define project structure
  const directories = ['pages', 'public', 'themes/default', 'components'];

  // Create directories
  for (const dir of directories) {
    const fullPath = path.join(absoluteTargetDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(chalk.green(`✅ Created directory: ${dir}`));
    }
  }

  // Create configuration file
  const configPath = path.join(absoluteTargetDir, 'bunpress.config.ts');
  if (!fs.existsSync(configPath)) {
    const configContent = `import { defineConfig } from 'bunpress';
import { 
  markdownItPlugin, 
  prismPlugin, 
  seoPlugin, 
  i18nPlugin, 
  imageOptimizerPlugin,
  searchIndexPlugin
} from 'bunpress/plugins';

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
      languages: ['javascript', 'typescript', 'html', 'css'],
    }),
    seoPlugin({
      generateSitemap: true,
      robotsTxt: true,
    }),
    imageOptimizerPlugin({
      formats: [
        { format: 'webp', quality: 80 },
        { format: 'avif', quality: 65 }
      ],
      sizes: [
        { width: 640 },
        { width: 828 },
        { width: 1200 },
        { width: 1920 }
      ]
    }),
    i18nPlugin({
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      prefixLocaleInUrl: true,
      forceDefaultLocalePrefix: false,
      generateLocaleRoutes: true
    }),
    searchIndexPlugin({
      filename: 'search-index.json',
      fields: ['title', 'description', 'content'],
      snippetLength: 160
    })
  ],
});
`;
    fs.writeFileSync(configPath, configContent);
    console.log(chalk.green(`✅ Created configuration file: bunpress.config.ts`));
  }

  // Create sample content
  const indexPath = path.join(absoluteTargetDir, 'pages', 'index.md');
  if (!fs.existsSync(indexPath)) {
    const indexContent = `---
title: Welcome to BunPress
description: A modern static site generator built with Bun
---

# Welcome to BunPress

This is a sample page created by BunPress. Edit this page to get started.

## Features

- ⚡️ **Fast** - Built on Bun for blazing fast performance
- 📝 **Markdown Support** - Write content in Markdown
- 🔌 **Plugin System** - Extend functionality with plugins
- 🎨 **Themes** - Customize the look and feel with themes
- 🔄 **Hot Reload** - See changes instantly during development
- 🖼️ **Image Optimization** - Automatically optimize images
- 🌐 **SEO Ready** - Built-in SEO optimization

\`\`\`javascript
// Example code
function hello() {
  console.log("Hello, BunPress!");
}
\`\`\`

## Getting Started

1. Edit the \`pages/index.md\` file
2. Run \`bunpress dev\` to see your changes
3. Build for production with \`bunpress build\`
`;
    fs.writeFileSync(indexPath, indexContent);
    console.log(chalk.green(`✅ Created sample page: pages/index.md`));
  }

  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(absoluteTargetDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const projectName = path.basename(absoluteTargetDir).toLowerCase().replace(/\s+/g, '-');
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      type: 'module',
      private: true,
      scripts: {
        dev: 'bunpress dev',
        build: 'bunpress build',
      },
      dependencies: {
        bunpress: 'latest',
      },
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green(`✅ Created package.json`));
  }

  // Create a default theme
  const themeFile = path.join(absoluteTargetDir, 'themes/default/layout.html');
  if (!fs.existsSync(themeFile)) {
    const themeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} | {{siteTitle}}</title>
  <meta name="description" content="{{description}}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">{{siteTitle}}</a>
      <div class="links">
        <a href="/">Home</a>
        <a href="/about">About</a>
      </div>
    </nav>
  </header>
  <main>
    <div class="container">
      {{content}}
    </div>
  </main>
  <footer>
    <div class="container">
      <p>&copy; {{currentYear}} {{siteTitle}}. Built with BunPress.</p>
    </div>
  </footer>
</body>
</html>`;
    fs.writeFileSync(themeFile, themeContent);
    console.log(chalk.green(`✅ Created default theme layout`));
  }

  // Create stylesheet
  const stylePath = path.join(absoluteTargetDir, 'public/styles.css');
  if (!fs.existsSync(stylePath)) {
    const cssContent = `/* Basic styles for BunPress */
:root {
  --primary-color: #3b82f6;
  --text-color: #333;
  --bg-color: #fff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  background-color: #f8f9fa;
  padding: 20px 0;
  border-bottom: 1px solid #e9ecef;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: var(--primary-color);
}

.links a {
  margin-left: 20px;
  text-decoration: none;
  color: #495057;
}

.links a:hover {
  color: var(--primary-color);
}

main {
  padding: 40px 0;
}

h1 {
  margin-bottom: 20px;
}

pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 20px 0;
}

code {
  font-family: monospace;
}

footer {
  background-color: #f8f9fa;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
  text-align: center;
  color: #6c757d;
}

@media (max-width: 768px) {
  .logo {
    font-size: 1.2rem;
  }
  
  .links a {
    margin-left: 10px;
  }
}
`;
    fs.writeFileSync(stylePath, cssContent);
    console.log(chalk.green(`✅ Created stylesheet: public/styles.css`));
  }

  console.log(chalk.green.bold('\n✨ Project initialization complete!\n'));
  console.log(chalk.blue('Next steps:'));

  if (targetDir !== '.') {
    console.log(chalk.cyan(`1. cd ${targetDir}`));
  }

  console.log(chalk.cyan('2. bun install'));
  console.log(chalk.cyan('3. bun run dev'));

  console.log(
    chalk.yellow('\nDevelopment server will start at ') + chalk.green('http://localhost:3000')
  );
}

// Helper function to get the local IP address for network access
function getLocalIpAddress(): string | null {
  try {
    const networkInterfaces = require('os').networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        // Skip internal, non-IPv4, and loopback interfaces
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get network interfaces:', error);
  }
  return null;
}

async function main() {
  try {
    // Track resources that need to be cleaned up
    const resources: Array<() => void> = [];

    // Process command-line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    // Handle help, version, and init commands first
    if (command === 'help' || args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }

    if (args.includes('--version') || args.includes('-v')) {
      console.log(`v${version}`);
      return;
    }

    if (command === 'init') {
      await initializeProject(args.slice(1));
      return;
    }

    // Load configuration and plugins for other commands
    const { config, pluginManager } = await loadConfig();

    // Resolve base paths
    const cwd = process.cwd();
    config.pagesDir = path.resolve(cwd, config.pagesDir || 'pages');
    config.outputDir = path.resolve(cwd, config.outputDir || 'dist');

    try {
      // Execute different commands based on input
      if (command === 'build') {
        // Check for bundling mode
        const useHtmlFirstBundling = args.includes('--html');
        const useHybridMode = args.includes('--hybrid');

        // Build site with enhanced listr2 tasks
        const tasks = new Listr<any>(
          [
            {
              title: 'Initializing build process',
              task: async task => {
                task.output = 'Setting up build environment...';
                await pluginManager.executeBuildStart();
                task.output = 'Build environment ready!';
              },
              rendererOptions: { persistentOutput: true },
            },
            {
              title: 'Processing content files',
              task: async task => {
                try {
                  // Use the proper ContentProcessor implementation instead of simulation
                  task.output = 'Scanning content directories...';

                  // Get content directory from config
                  const contentDir = path.resolve(process.cwd(), config.contentDir || 'content');
                  const pagesDir = path.resolve(process.cwd(), config.pagesDir || 'pages');
                  const outputDir = path.resolve(process.cwd(), config.outputDir || 'dist');

                  // Ensure output directory exists
                  fs.mkdirSync(outputDir, { recursive: true });

                  // Determine which directories to scan
                  const dirsToScan = [];

                  // Always include pages directory
                  if (fs.existsSync(pagesDir)) {
                    dirsToScan.push(pagesDir);
                  }

                  // Include content directory if it exists and is different from pages
                  if (fs.existsSync(contentDir) && contentDir !== pagesDir) {
                    dirsToScan.push(contentDir);
                  }

                  if (dirsToScan.length === 0) {
                    task.output = 'No content directories found. Creating pages directory...';
                    fs.mkdirSync(pagesDir, { recursive: true });
                    dirsToScan.push(pagesDir);
                  }

                  // Find all markdown files in all directories
                  task.output = `Finding markdown files in ${dirsToScan.join(', ')}...`;
                  const contentFiles = [];

                  for (const dir of dirsToScan) {
                    const contentPattern = path.join(dir, '**/*.{md,mdx}');
                    for await (const file of new Glob(contentPattern).scan()) {
                      contentFiles.push(file);
                    }
                  }

                  if (contentFiles.length === 0) {
                    task.output = 'No markdown content files found.';
                    return;
                  }

                  task.output = `Found ${contentFiles.length} content files. Processing...`;

                  // Create content processor with the plugin manager
                  const contentProcessor = new ContentProcessor({
                    plugins: pluginManager,
                  });

                  // Process each file
                  const processedFiles: ContentFile[] = [];
                  let processed = 0;
                  let errors = 0;

                  for (const filePath of contentFiles) {
                    try {
                      // Use the appropriate root directory depending on which directory the file is in
                      const rootDir =
                        dirsToScan.find(dir => filePath.startsWith(dir)) || contentDir;
                      const contentFile = await contentProcessor.processMarkdownContent(
                        filePath,
                        rootDir
                      );
                      processedFiles.push(contentFile);
                      processed++;

                      // Update progress
                      if (processed % 5 === 0 || processed === contentFiles.length) {
                        task.output = `Processed ${processed}/${contentFiles.length} files...`;
                      }
                    } catch (error: any) {
                      errors++;
                      console.error(`Error processing file ${filePath}: ${error.message}`);
                    }
                  }

                  if (errors > 0) {
                    task.output = `Processed ${processed} content files with ${errors} errors. Applying transformations...`;
                  } else {
                    task.output = `Processed ${processed} content files successfully. Applying transformations...`;
                  }

                  // Generate routes from content files
                  const routes = processedFiles.map(file => ({
                    path: file.route,
                    component: file.html,
                    meta: file.frontmatter,
                  }));

                  // Store routes for use in generating output
                  ctx.routes = routes;
                  ctx.processedFiles = processedFiles;
                } catch (error: any) {
                  console.error('Error in content processing:', error);
                  task.output = `Content processing failed: ${error.message}`;
                  throw error;
                }
              },
              rendererOptions: { persistentOutput: true },
            },
            {
              title: 'Building site',
              task: async task => {
                if (useHtmlFirstBundling || useHybridMode) {
                  task.output = 'Scanning for HTML entrypoints...';
                  // Scan for HTML files
                  let htmlFiles: string[] = [];

                  try {
                    const entrypoints = (config as any).entrypoints || [
                      'index.html',
                      'src/index.html',
                    ];

                    for (const entrypoint of entrypoints) {
                      const resolvedPath = path.resolve(process.cwd(), entrypoint);
                      if (fs.existsSync(resolvedPath)) {
                        htmlFiles.push(resolvedPath);
                      }
                    }

                    if (htmlFiles.length === 0) {
                      task.output =
                        'No HTML entrypoints found in specified locations. Scanning for all HTML files...';
                      htmlFiles = findHtmlFiles(process.cwd());
                    }
                  } catch (err: any) {
                    task.output = 'Error scanning for HTML files: ' + err.message;
                    throw err;
                  }

                  if (htmlFiles.length === 0) {
                    task.output = 'No HTML entrypoints found. Falling back to standard build.';
                    await buildSite(config, pluginManager);
                  } else {
                    task.output = `Found ${htmlFiles.length} HTML entrypoints. Processing...`;
                    // Process HTML entrypoints
                    const outputDir = path.resolve(process.cwd(), config.outputDir);
                    await processHTMLEntrypoints(htmlFiles, outputDir, {
                      minify: process.env.NODE_ENV === 'production',
                      sourcemap: process.env.NODE_ENV !== 'production',
                      target: 'browser',
                      splitting: true,
                    });
                    task.output = 'HTML entrypoints processed successfully!';

                    // In hybrid mode, also process markdown
                    if (useHybridMode) {
                      task.output = 'Processing markdown content...';
                      await buildSite(config, pluginManager);
                      task.output = 'Markdown content processed successfully!';
                    }
                  }
                } else {
                  task.output = 'Generating HTML files...';
                  await buildSite(config, pluginManager);
                  task.output = 'Site built successfully!';
                }
              },
              rendererOptions: { persistentOutput: true },
            },
            {
              title: 'Finalizing build',
              task: async (ctx, task) => {
                task.output = 'Running plugin buildEnd hooks...';
                await pluginManager.executeBuildEnd();

                // Calculate site statistics
                const outputDir = path.resolve(process.cwd(), config.outputDir);
                let fileCount = 0;
                let totalSize = 0;

                try {
                  const countFiles = (dir: string) => {
                    const files = fs.readdirSync(dir, { withFileTypes: true });
                    for (const file of files) {
                      const fullPath = path.join(dir, file.name);
                      if (file.isDirectory()) {
                        countFiles(fullPath);
                      } else {
                        fileCount++;
                        const stats = fs.statSync(fullPath);
                        totalSize += stats.size;
                      }
                    }
                  };

                  countFiles(outputDir);

                  // Format sizes
                  const formatSize = (size: number) => {
                    if (size < 1024) return `${size} B`;
                    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
                    return `${(size / 1024 / 1024).toFixed(2)} MB`;
                  };

                  ctx.stats = {
                    fileCount,
                    totalSize: formatSize(totalSize),
                    outputDir,
                  };
                } catch (error) {
                  console.error('Error calculating stats:', error);
                }

                task.output = 'Build finalized!';
              },
              rendererOptions: { persistentOutput: true },
            },
          ],
          {
            renderer: 'default',
            rendererOptions: {
              collapseSubtasks: false,
              showSubtasks: true,
              formatOutput: 'wrap',
            },
          }
        );

        const ctx = await tasks.run();

        console.log(
          chalk.green.bold('\n✨ Build completed successfully!\n') +
            chalk.blue(
              `📊 Stats: ${chalk.yellow(ctx.stats?.fileCount || 'unknown')} files (${chalk.yellow(ctx.stats?.totalSize || 'unknown')})\n`
            ) +
            chalk.blue(`📂 Output: ${chalk.yellow(ctx.stats?.outputDir || config.outputDir)}\n`)
        );
      } else if (command === 'dev' || !command) {
        // Start the development server with improved feedback
        console.log(chalk.yellow('\n🚀 Starting development server...\n'));

        // Execute build start hooks
        await pluginManager.executeBuildStart();

        try {
          // Get the IP address for network access
          const ipAddress = getLocalIpAddress();

          // Start the development server
          const devServerResult = await startDevServer(config, pluginManager);
          const { watcher } = devServerResult;

          // Add cleanup handler for the watcher
          resources.push(() => {
            if (watcher && typeof watcher.close === 'function') {
              watcher.close();
            }
          });

          // Add cleanup handler for the server
          resources.push(() => {
            if (devServerResult && typeof devServerResult.stop === 'function') {
              devServerResult.stop();
            }
          });

          // Show server startup message with local and network URLs
          const port = 3000; // This should match the port in startDevServer
          console.log(chalk.green('\n🌐 Server running at:'));
          console.log(`  ${chalk.cyan(`➜ Local:   http://localhost:${port}`)}`);
          if (ipAddress) {
            console.log(`  ${chalk.cyan(`➜ Network: http://${ipAddress}:${port}`)}`);
          }
          console.log(chalk.yellow('\n🔥 Hot Module Replacement enabled'));
          console.log(chalk.blue('\n👀 Watching for changes...'));

          // Handle server shutdown
          process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n🛑 Shutting down...'));

            // Execute build end hooks
            await pluginManager.executeBuildEnd();

            // Clean up resources
            for (const cleanup of resources) {
              try {
                cleanup();
              } catch (err) {
                console.error('Error during cleanup:', err);
              }
            }

            // Exit process
            console.log(chalk.green('✅ Server stopped. Goodbye! 👋\n'));
            process.exit(0);
          });
        } catch (error) {
          console.error('Failed to start development server:', error);
          // Clean up any resources that were created
          for (const cleanup of resources) {
            try {
              cleanup();
            } catch (err) {
              console.error('Error during cleanup:', err);
            }
          }
          process.exit(1);
        }
      } else {
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
      }
    } catch (error) {
      // Handle errors from commands and clean up resources
      console.error('Error executing command:', error);

      // Clean up resources
      for (const cleanup of resources) {
        try {
          cleanup();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to start BunPress:', error);
    process.exit(1);
  }
}

// Export themes
export * from '../themes';

// Only run the CLI code if this file is executed directly
if (import.meta.url === Bun.main) {
  main();
}
