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

// Define options for bundling (should match bundler.ts interface)
interface BundleOptions {
  minify?: boolean;
  sourcemap?: boolean | 'external' | 'inline';
  target?: 'browser' | 'bun' | 'node';
  splitting?: boolean;
  publicPath?: string;
  define?: Record<string, string>;
  assetHashing?: boolean;
}

/**
 * Main build function for the site
 * @param config BunPress configuration
 * @param pluginManager Optional plugin manager
 * @param options Build options
 */
export async function buildSite(
  config: BunPressConfig,
  pluginManager?: PluginManager,
  options: BuildOptions = {}
): Promise<void> {
  try {
    // Get workspace root
    const workspaceRoot = process.cwd();
    console.log(`Workspace root: ${workspaceRoot}`);

    // Execute plugin buildStart hooks if not already done by CLI
    if (pluginManager && !process.env.BUNPRESS_BUILD_STARTED) {
      await pluginManager.executeBuildStart();
      process.env.BUNPRESS_BUILD_STARTED = 'true';
    }

    // Generate output directory
    const outputDir = path.resolve(config.outputDir);

    // Make sure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Generate routes from pages - use async version if we have plugins
    const routes = pluginManager
      ? await generateRoutesAsync(config.pagesDir)
      : generateRoutes(config.pagesDir);

    // Process each route and write to output
    for (const [route, contentFile] of Object.entries(routes)) {
      try {
        const html = renderHtml(contentFile, config, workspaceRoot);

        // Determine output path
        let outputPath: string;
        if (route === '/') {
          outputPath = path.join(outputDir, 'index.html');
        } else {
          // Create directory for nested routes
          const routeDir = path.join(outputDir, route.substring(1));
          mkdirSync(routeDir, { recursive: true });
          outputPath = path.join(routeDir, 'index.html');
        }

        // Write HTML file
        writeFileSync(outputPath, html);

        // Process content file with plugins via the plugin manager
        if (pluginManager) {
          try {
            await pluginManager.executeProcessContentFile(contentFile);
          } catch (error) {
            console.error(`Error executing processContentFile hooks:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing route ${route}:`, error);
      }
    }

    // Process theme assets
    try {
      // Set up bundle options
      const bundleOptions: BundleOptions = {
        minify: options.minify ?? process.env.NODE_ENV === 'production',
        sourcemap: options.sourcemap ?? process.env.NODE_ENV !== 'production',
        target: 'browser' as 'browser' | 'bun' | 'node',
        splitting: options.splitting,
        assetHashing: options.assetHashing,
      };

      await bundleAssets(
        [], // entrypoints
        outputDir, // outputDir
        config, // config
        bundleOptions
      );
      console.log('Assets bundled successfully');
    } catch (error) {
      console.error('Error bundling assets:', error);
    }

    // Copy static assets from public directory
    if (existsSync('public')) {
      try {
        copyDirectory('public', path.join(outputDir, 'public'));
        console.log('Static assets copied successfully');
      } catch (error) {
        console.error('Error copying static assets:', error);
      }
    }

    // Generate sitemap.xml
    try {
      generateSitemap(routes, config);
      console.log('Sitemap generated successfully');
    } catch (error) {
      console.error('Error generating sitemap:', error);
    }

    // Execute plugin buildEnd hooks if not already done by CLI
    if (pluginManager && !process.env.BUNPRESS_BUILD_ENDED) {
      await pluginManager.executeBuildEnd();
      process.env.BUNPRESS_BUILD_ENDED = 'true';
    }

    console.log(`Build completed successfully. Output directory: ${outputDir}`);
  } catch (error) {
    console.error('Build failed with error:', error);
    throw error;
  }
}

/**
 * Generate a basic sitemap.xml file
 */
function generateSitemap(routes: Record<string, any>, config: BunPressConfig) {
  try {
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
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

/**
 * Helper function to recursively copy a directory
 */
function copyDirectory(source: string, destination: string) {
  try {
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
  } catch (error) {
    console.error(`Error copying directory from ${source} to ${destination}:`, error);
    throw error;
  }
}

// For backward compatibility
export async function build(config: BunPressConfig): Promise<any> {
  return buildSite(config);
}
