import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { createPathAliasPlugin } from './path-aliases';
import { readFileAsString, createDirectory, writeFileString } from '../lib/fs-utils';
import { resolvePath, getRelativePath, joinPaths } from '../lib/path-utils';
import { ErrorCode, tryCatchWithCode, BunPressError } from '../lib/error-utils';
import { getNamespacedLogger } from '../lib/logger-utils';

// Create namespaced logger for bundler
const logger = getNamespacedLogger('bundler');

/**
 * Asset types that can be extracted from HTML
 */
type AssetType = 'script' | 'style' | 'image';

/**
 * Asset reference extracted from HTML
 */
interface AssetReference {
  type: AssetType;
  path: string;
  originalPath: string;
  attrs: Record<string, string>;
}

/**
 * Options for bundling
 */
interface BundleOptions {
  minify?: boolean;
  sourcemap?: boolean | 'external' | 'inline';
  target?: 'browser' | 'bun' | 'node';
  splitting?: boolean;
  publicPath?: string;
  define?: Record<string, string>;
}

/**
 * Options for processing HTML
 */
interface HTMLProcessOptions {
  injectHMR?: boolean;
  extractAssets?: boolean;
}

/**
 * Process HTML with HTMLRewriter to extract and transform assets
 *
 * @param htmlPath Path to HTML file
 * @param options Processing options
 * @returns Processed HTML and extracted assets
 */
export async function processHtmlWithRewriter(
  htmlPath: string,
  options: HTMLProcessOptions = {}
): Promise<{ html: string; assets: AssetReference[] }> {
  return await tryCatchWithCode(
    async () => {
      // Default options
      const opts = {
        injectHMR: process.env.NODE_ENV !== 'production',
        extractAssets: true,
        ...options,
      };

      // Read the HTML file
      const htmlContent = await readFileAsString(htmlPath);

      // Store extracted assets
      const assets: AssetReference[] = [];

      // Create a new HTML rewriter
      const rewriter = new HTMLRewriter();

      // Handle script tags
      rewriter.on('script', {
        element(el) {
          const src = el.getAttribute('src');
          if (src && !src.startsWith('http') && !src.startsWith('//')) {
            // Store the asset reference - use original path as the path to preserve filename
            assets.push({
              type: 'script',
              path: src, // Keep the original src value instead of using relPath
              originalPath: src,
              attrs: {
                type: el.getAttribute('type') || '',
                defer: el.hasAttribute('defer') ? 'true' : '',
                async: el.hasAttribute('async') ? 'true' : '',
                module: el.getAttribute('type') === 'module' ? 'true' : '',
              },
            });

            // Remove the src attribute if we're going to bundle
            if (opts.extractAssets) {
              el.removeAttribute('src');
            }
          }
        },
      });

      // Handle link tags (CSS)
      rewriter.on('link', {
        element(el) {
          const rel = el.getAttribute('rel');
          const href = el.getAttribute('href');

          if (rel === 'stylesheet' && href && !href.startsWith('http') && !href.startsWith('//')) {
            // Store the asset reference - use original href as the path
            assets.push({
              type: 'style',
              path: href, // Keep the original href value
              originalPath: href,
              attrs: {
                media: el.getAttribute('media') || '',
              },
            });

            // Remove the href attribute if we're going to bundle
            if (opts.extractAssets) {
              el.removeAttribute('href');
            }
          }
        },
      });

      // Handle image tags
      rewriter.on('img', {
        element(el) {
          const src = el.getAttribute('src');
          if (src && !src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('//')) {
            // Store the asset reference - use original src as the path
            assets.push({
              type: 'image',
              path: src, // Keep the original src value
              originalPath: src,
              attrs: {
                alt: el.getAttribute('alt') || '',
              },
            });
          }
        },
      });

      // Inject HMR client if needed
      rewriter.on('head', {
        element(el) {
          if (opts.injectHMR) {
            el.append('<script src="/__bunpress_hmr.js"></script>', { html: true });
          }
        },
      });

      // Transform the HTML
      const transformedHtml = await rewriter.transform(new Response(htmlContent)).text();

      logger.debug(`Processed HTML file: ${htmlPath}, extracted ${assets.length} assets`);

      return {
        html: transformedHtml,
        assets,
      };
    },
    ErrorCode.CONTENT_PARSE_ERROR,
    `Failed to process HTML file: ${htmlPath}`,
    { htmlPath }
  );
}

/**
 * Bundle assets using Bun.build
 *
 * @param entrypoints List of entry point files
 * @param outputDir Output directory
 * @param config BunPress configuration (optional, can be empty object)
 * @param options Bundling options
 * @returns Build result
 */
export async function bundleAssets(
  entrypoints: string[],
  outputDir: string,
  _config: Partial<BunPressConfig> = {},
  options: BundleOptions = {}
): Promise<any> {
  return await tryCatchWithCode(
    async () => {
      // Skip if no entrypoints
      if (!entrypoints.length) {
        logger.info('No entrypoints provided for bundling, skipping');
        return { success: true, outputs: [] };
      }

      // Ensure output directory exists
      await createDirectory(outputDir);

      // Default options
      const isDev = process.env.NODE_ENV !== 'production';
      const bundleOptions = {
        minify: !isDev,
        sourcemap: isDev ? 'linked' : 'none',
        target: 'browser',
        splitting: true,
        ...options,
      };

      logger.info(`Bundling ${entrypoints.length} entrypoints to ${outputDir}`);
      logger.debug(`Bundle options: ${JSON.stringify(bundleOptions)}`);

      // Create path alias plugin for imports from aliases
      const pathAliasPlugin = createPathAliasPlugin();

      // Map our sourcemap option to what Bun expects
      let sourcemapOption: 'none' | 'linked' | 'inline' | 'external';
      if (bundleOptions.sourcemap === 'none' || bundleOptions.sourcemap === false) {
        sourcemapOption = 'none';
      } else if (['linked', 'inline', 'external'].includes(bundleOptions.sourcemap as string)) {
        sourcemapOption = bundleOptions.sourcemap as 'linked' | 'inline' | 'external';
      } else if (bundleOptions.sourcemap === true) {
        sourcemapOption = 'inline';
      } else {
        sourcemapOption = 'none';
      }

      // Run Bun.build
      const result = await Bun.build({
        entrypoints,
        outdir: outputDir,
        minify: bundleOptions.minify,
        sourcemap: sourcemapOption,
        target: bundleOptions.target as any,
        splitting: bundleOptions.splitting,
        plugins: [pathAliasPlugin],
        define: bundleOptions.define || {},
      });

      if (!result.success) {
        const errors = result.logs
          .filter(log => log.level === 'error')
          .map(log => log.message)
          .join('\n');

        logger.error(`Bundling failed: ${errors}`);
        throw new BunPressError(
          ErrorCode.CONTENT_RENDER_ERROR,
          `Failed to bundle assets: ${errors}`,
          { entrypoints, outputDir }
        );
      }

      logger.info(`Successfully bundled ${result.outputs.length} files`);
      return result;
    },
    ErrorCode.CONTENT_RENDER_ERROR,
    `Failed to bundle assets to ${outputDir}`,
    { entrypoints, outputDir }
  );
}

/**
 * Process HTML entrypoints
 *
 * @param htmlFiles HTML files to process
 * @param outputDir Output directory
 * @param bundleOptions Bundling options
 * @returns Processing result
 */
export async function processHTMLEntrypoints(
  htmlFiles: string[],
  outputDir: string,
  bundleOptions: BundleOptions = {}
): Promise<any> {
  return await tryCatchWithCode(
    async () => {
      // Process each HTML file
      const results = [];

      logger.info(`Processing ${htmlFiles.length} HTML entrypoints`);

      for (const htmlFile of htmlFiles) {
        // Get relative output path
        const relPath = getRelativePath(process.cwd(), htmlFile);
        const outputPath = joinPaths(outputDir, relPath);

        // Create output directory
        await createDirectory(path.dirname(outputPath));

        // Process HTML
        const { html, assets } = await processHtmlWithRewriter(htmlFile, {
          injectHMR: process.env.NODE_ENV !== 'production',
          extractAssets: true,
        });

        // Write processed HTML
        await writeFileString(outputPath, html);

        // Bundle assets
        const scriptAssets = assets
          .filter(a => a.type === 'script')
          .map(a => resolvePath(path.dirname(htmlFile), a.path));
        const styleAssets = assets
          .filter(a => a.type === 'style')
          .map(a => resolvePath(path.dirname(htmlFile), a.path));

        // Bundle scripts
        let scriptResult = { success: true, outputs: [] };
        if (scriptAssets.length > 0) {
          const scriptsOutDir = joinPaths(outputDir, 'assets', 'js');
          scriptResult = await bundleAssets(scriptAssets, scriptsOutDir, {}, bundleOptions);
        }

        // Bundle styles
        let styleResult = { success: true, outputs: [] };
        if (styleAssets.length > 0) {
          const stylesOutDir = joinPaths(outputDir, 'assets', 'css');
          styleResult = await bundleAssets(
            styleAssets,
            stylesOutDir,
            {},
            {
              ...bundleOptions,
              target: 'browser',
            }
          );
        }

        // Store results
        results.push({
          htmlFile,
          outputPath,
          scriptResult,
          styleResult,
        });

        logger.info(`Processed HTML entrypoint: ${relPath}`);
      }

      return results;
    },
    ErrorCode.CONTENT_RENDER_ERROR,
    `Failed to process HTML entrypoints`,
    { htmlFiles, outputDir }
  );
}
