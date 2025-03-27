import type { BunPressConfig } from '../../bunpress.config';
import { createDirectory } from '../lib/fs-utils';
import { getDirname } from '../lib/path-utils';
import { getNamespacedLogger } from '../lib/logger-utils';
import { tryCatchWithCode, ErrorCode } from '../lib/error-utils';
import { rewriteCssAssetUrls } from '../lib/asset-utils';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import path from 'path';
import fs from 'fs/promises';

// Create namespaced logger for CSS processor
const logger = getNamespacedLogger('css-processor');

/**
 * Options for CSS processing
 */
interface CSSProcessOptions {
  /**
   * Whether to minify the CSS
   * @default false in development, true in production
   */
  minify?: boolean;

  /**
   * Whether to include source maps
   * @default true in development, false in production
   */
  sourceMap?: boolean;

  /**
   * Whether to rewrite URLs to resolve relative paths
   * @default true
   */
  rewriteUrls?: boolean;
}

async function processImports(cssContent: string, filePath: string) {
  const importRegex = /@import\s+(?:url\()?['"]([^'"]+)['"]\)?;/g;
  let processedCSS = cssContent;
  let match;
  
  while ((match = importRegex.exec(cssContent)) !== null) {
    const importPath = path.resolve(path.dirname(filePath), match[1]);
    try {
      const importedContent = await fs.readFile(importPath, 'utf-8');
      processedCSS = processedCSS.replace(match[0], importedContent);
    } catch (error) {
      console.warn(`Failed to import CSS file: ${importPath}`);
    }
  }
  
  return processedCSS;
}

/**
 * Process a CSS file using Bun's transform API
 *
 * @param cssPath Path to the CSS file
 * @param config BunPress configuration
 * @param options CSS processing options
 * @returns Processed CSS content
 */
export async function processCSS(
  cssPath: string,
  config: BunPressConfig,
  options: CSSProcessOptions = {}
): Promise<string> {
  return await tryCatchWithCode(
    async () => {
      const isDev = process.env.NODE_ENV !== 'production';
      const opts = { 
        minify: !isDev,
        sourceMap: isDev,
        rewriteUrls: true,
        ...options
      };

      let cssContent = await fs.readFile(cssPath, 'utf-8');
      logger.debug(`Processing CSS file: ${cssPath}`);

      // Process CSS imports first
      cssContent = await processImports(cssContent, cssPath);

      // Configure PostCSS plugins
      const plugins = [];
      plugins.push(autoprefixer());
      if (opts.minify) {
        plugins.push(cssnano({ preset: 'default' }));
      }

      // Process with PostCSS
      const result = await postcss(plugins).process(cssContent, {
        from: cssPath,
        to: path.join(config.outputDir, path.basename(cssPath)),
        map: opts.sourceMap ? { inline: true } : false
      });

      let output = result.css;

      if (opts.rewriteUrls) {
        output = await rewriteCssAssetUrls(output, cssPath, config.outputDir);
      }

      return output;
    },
    ErrorCode.CSS_PROCESSING_ERROR,
    `Failed to process CSS file: ${cssPath}`,
    { cssPath }
  );
}

/**
 * Bundle multiple CSS files into a single output file
 *
 * @param entrypoints List of CSS files to bundle
 * @param outputPath Path to the output bundle
 * @param config BunPress configuration
 * @param options CSS processing options
 * @returns Object indicating success and any messages
 */
export async function bundleCSS(
  entrypoints: string[],
  outputPath: string,
  config: BunPressConfig,
  options: CSSProcessOptions = {}
): Promise<{ success: boolean; message?: string }> {
  try {
    if (entrypoints.length === 0) {
      logger.info('No CSS files to bundle');
      return { success: true, message: 'No CSS files to bundle' };
    }

    // Ensure the output directory exists
    const outputDir = getDirname(outputPath);
    await createDirectory(outputDir);
    logger.debug(`Created output directory: ${outputDir}`);

    // Process each CSS file
    logger.info(`Bundling ${entrypoints.length} CSS files`);
    const cssContents = await Promise.all(
      entrypoints.map(cssPath => processCSS(cssPath, config, options))
    );

    // Combine all CSS content
    const bundleContent = cssContents.join('\n\n');

    // Write the bundle to the output file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, bundleContent);
    logger.info(`CSS bundle written to ${outputPath}`);

    return { success: true };
  } catch (error) {
    logger.error('Error bundling CSS:', { error });
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
