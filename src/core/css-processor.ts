import type { BunPressConfig } from '../../bunpress.config';
import { 
  readFileAsString, 
  writeFileString, 
  createDirectory
} from '../lib/fs-utils';
import { 
  getDirname
} from '../lib/path-utils';
import { getNamespacedLogger } from '../lib/logger-utils';
import { 
  tryCatchWithCode, 
  ErrorCode 
} from '../lib/error-utils';
import { rewriteCssAssetUrls } from '../lib/asset-utils';

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

      // Default options based on environment
      const defaultOptions: CSSProcessOptions = {
        minify: !isDev,
        sourceMap: isDev,
        rewriteUrls: true,
      };

      // Merge with provided options
      const opts = { ...defaultOptions, ...options };

      // Get the CSS content
      const cssContent = await readFileAsString(cssPath);
      logger.debug(`Processing CSS file: ${cssPath}`);

      // Use Bun's built-in transformer for CSS
      const result = await Bun.build({
        entrypoints: [cssPath],
        target: 'browser',
        minify: opts.minify,
        sourcemap: opts.sourceMap ? 'inline' : 'none',
      });

      if (!result.success) {
        throw new Error(`Failed to process CSS`);
      }

      // Get the CSS output
      const cssOutput = (await result.outputs[0]?.text()) || cssContent;
      let output = cssOutput;

      // If needed, rewrite URLs to be relative to the output directory
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
    await writeFileString(outputPath, bundleContent);
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
