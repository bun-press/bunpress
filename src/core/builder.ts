import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import { PluginManager } from './plugin';
import { bundleAssets } from './bundler';

export interface BuildOptions {
  minify?: boolean;
  sourcemap?: boolean | 'inline' | 'external';
  splitting?: boolean;
  assetHashing?: boolean;
}

export async function buildSite(config: BunPressConfig, pluginManager?: PluginManager) {
  // Get workspace root
  const workspaceRoot = process.cwd();
  console.log(`Workspace root: ${workspaceRoot}`);

  // Execute plugin buildStart hooks if not already done by CLI
  if (pluginManager && !process.env.BUNPRESS_BUILD_STARTED) {
    await pluginManager.executeBuildStart();
    process.env.BUNPRESS_BUILD_STARTED = 'true';
  }

  // Make sure output directory exists
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }

  // Generate routes from pages - use async version if we have plugins
  const routes = pluginManager
    ? await generateRoutesAsync(config.pagesDir)
    : generateRoutes(config.pagesDir);

  // Process each route and write to output
  for (const [route, contentFile] of Object.entries(routes)) {
    const html = renderHtml(contentFile, config, workspaceRoot);

    // Determine output path
    let outputPath: string;
    if (route === '/') {
      outputPath = path.join(config.outputDir, 'index.html');
    } else {
      // Create directory for nested routes
      const routeDir = path.join(config.outputDir, route.substring(1));
      mkdirSync(routeDir, { recursive: true });
      outputPath = path.join(routeDir, 'index.html');
    }

    // Write HTML file
    writeFileSync(outputPath, html);
  }

  try {
    // Process theme assets
    await bundleAssets(
      [], // entrypoints
      config.outputDir, // outputDir
      config, // config
      {
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        target: 'browser',
      }
    );

    console.log('Assets bundled successfully');
  } catch (error) {
    console.error('Error bundling assets:', error);
  }

  // Copy static assets from public directory
  if (existsSync('public')) {
    copyDirectory('public', path.join(config.outputDir, 'public'));
  }

  // Generate sitemap.xml
  generateSitemap(routes, config);

  // Execute plugin buildEnd hooks if not already done by CLI
  if (pluginManager && !process.env.BUNPRESS_BUILD_ENDED) {
    await pluginManager.executeBuildEnd();
    process.env.BUNPRESS_BUILD_ENDED = 'true';
  }
}

/**
 * Generate a basic sitemap.xml file
 */
function generateSitemap(routes: Record<string, any>, config: BunPressConfig) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(routes)
  .map(
    route => `  <url>
    <loc>${config.siteUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  writeFileSync(path.join(config.outputDir, 'sitemap.xml'), sitemap);
}

/**
 * Helper function to recursively copy a directory
 */
function copyDirectory(source: string, destination: string) {
  // Create destination directory if it doesn't exist
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  // Read the contents of the source directory
  const files = readdirSync(source);

  // Process each file/directory
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      copyFileSync(sourcePath, destPath);
    }
  }
}

export async function build(config: BunPressConfig): Promise<any> {
  // Get workspace root
  const workspaceRoot = process.cwd();
  console.log(`Workspace root: ${workspaceRoot}`);

  // Generate output directory
  const outputDir = path.resolve(config.outputDir);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate routes
  const routes = generateRoutes(config.pagesDir);

  // Import bundler functions
  const { bundleAssets } = await import('./bundler');

  // Bundle all assets
  console.log('Bundling assets...');
  try {
    // Process theme assets
    await bundleAssets(
      [], // entrypoints
      outputDir, // outputDir
      config, // config
      {
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        target: 'browser',
      }
    );
  } catch (error) {
    console.error('Error bundling assets:', error);
  }

  // Copy static assets from public directory
  if (existsSync('public')) {
    copyDirectory('public', path.join(config.outputDir, 'public'));
  }

  // Generate sitemap.xml
  generateSitemap(routes, config);
}
