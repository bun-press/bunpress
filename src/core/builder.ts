import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import { PluginManager } from './plugin';
import { bundleAssets } from './bundler';
// Import file system utilities
import {
  createDirectory,
  writeFileString,
  copyDirectory as fsUtilsCopyDirectory,
  directoryExists,
} from '../lib/fs-utils';

// Import error handling utilities
import { ErrorCode, tryCatch, tryCatchWithCode } from '../lib/error-utils';

// Import logger
import { getNamespacedLogger } from '../lib/logger-utils';

// Create namespaced logger for builder
const logger = getNamespacedLogger('builder');

// Extend the BunPressConfig interface with publicDir property
declare module '../../bunpress.config' {
  interface BunPressConfig {
    publicDir?: string;
  }
}

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
  return await tryCatch(
    async () => {
      // Get workspace root
      const workspaceRoot = process.cwd();
      logger.info(`Workspace root: ${workspaceRoot}`);

      // Execute plugin buildStart hooks if not already done by CLI
      if (pluginManager && !process.env.BUNPRESS_BUILD_STARTED) {
        await pluginManager.executeBuildStart();
        process.env.BUNPRESS_BUILD_STARTED = 'true';
      }

      // Generate output directory
      const outputDir = path.resolve(config.outputDir);

      // Make sure output directory exists
      if (!(await directoryExists(outputDir))) {
        await createDirectory(outputDir);
      }

      // Generate routes from pages - use async version if we have plugins
      const routes = pluginManager
        ? await generateRoutesAsync(config.pagesDir)
        : generateRoutes(config.pagesDir);

      // Process each route and write to output
      for (const [route, contentFile] of Object.entries(routes)) {
        await tryCatch(
          async () => {
            // Await the renderHtml promise since it's now an async function
            const html = await renderHtml(contentFile, config, workspaceRoot);

            // Determine output path
            let outputPath: string;
            if (route === '/') {
              outputPath = path.join(outputDir, 'index.html');
            } else {
              // Create directory for nested routes
              const routeDir = path.join(outputDir, route.substring(1));
              await createDirectory(routeDir);
              outputPath = path.join(routeDir, 'index.html');
            }

            // Write HTML file
            await writeFileString(outputPath, html);

            // Process content file with plugins via the plugin manager
            if (pluginManager) {
              await tryCatch(
                async () => {
                  await pluginManager.executeProcessContentFile(contentFile);
                },
                error => {
                  logger.error(`Error executing processContentFile hooks:`, error);
                }
              );
            }
          },
          error => {
            logger.error(`Error processing route ${route}:`, error);
          }
        );
      }

      // Process theme assets
      await tryCatch(
        async () => {
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
          logger.info('Assets bundled successfully');
        },
        error => {
          logger.error('Error bundling assets:', error);
        }
      );

      // Copy static assets from public directory
      const publicDir = config.publicDir || 'public';
      if (await directoryExists(publicDir)) {
        await tryCatch(
          async () => {
            await fsUtilsCopyDirectory(publicDir, path.join(outputDir, 'public'));
            logger.info('Static assets copied successfully');
          },
          error => {
            logger.error(`Error copying static assets from ${publicDir}:`, error);
          }
        );
      }

      // Generate sitemap.xml
      await tryCatch(
        async () => {
          await generateSitemap(routes, config);
          logger.info('Sitemap generated successfully');
        },
        error => {
          logger.error('Error generating sitemap:', error);
        }
      );

      // Execute plugin buildEnd hooks if not already done by CLI
      if (pluginManager && !process.env.BUNPRESS_BUILD_ENDED) {
        await pluginManager.executeBuildEnd();
        process.env.BUNPRESS_BUILD_ENDED = 'true';
      }

      logger.info(`Build completed successfully. Output directory: ${outputDir}`);
    },
    error => {
      logger.error('Build failed with error:', error);
      throw error;
    }
  );
}

/**
 * Generate a basic sitemap.xml file
 */
async function generateSitemap(routes: Record<string, any>, config: BunPressConfig) {
  return await tryCatchWithCode(
    async () => {
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

      await writeFileString(path.join(config.outputDir, 'sitemap.xml'), sitemap);
    },
    ErrorCode.FILE_WRITE_ERROR,
    'Error generating sitemap',
    { outputDir: config.outputDir }
  );
}

// For backward compatibility
export async function build(config: BunPressConfig): Promise<any> {
  return buildSite(config);
}
