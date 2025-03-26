/**
 * Asset Utilities
 * Helper functions for processing and handling various assets
 */

import { 
  createDirectory, 
  fileExists, 
  readFileAsString, 
  copyFile 
} from './fs-utils';
import { 
  joinPaths, 
  getExtname, 
  getBasename, 
  resolveRelativePath 
} from './path-utils';
import { tryCatch } from './error-utils';
import { getNamespacedLogger } from './logger-utils';

// Create namespaced logger for asset utilities
const logger = getNamespacedLogger('asset-utils');

/**
 * Process a URL reference to an asset, hashing the file contents and copying to the output directory
 * 
 * @param url The original URL reference
 * @param sourcePath The path of the source file containing the URL
 * @param outputDir The output directory where assets should be copied
 * @param assetsSubdir Optional subdirectory within the output directory (defaults to 'assets')
 * @returns Processed URL reference or original URL if processing failed
 */
export async function processAssetUrl(
  url: string,
  sourcePath: string,
  outputDir: string,
  assetsSubdir: string = 'assets'
): Promise<string> {
  // Skip data URLs and absolute URLs
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/')) {
    return url;
  }

  return await tryCatch(
    async () => {
      const sourceDir = resolveRelativePath(sourcePath, '..');
      
      // Resolve the original asset path
      const assetPath = resolveRelativePath(sourceDir, url);

      // Check if the file exists
      const exists = await fileExists(assetPath);
      if (!exists) {
        logger.warn(`Asset not found: ${assetPath}`);
        return url;
      }

      // Generate a new path based on file hash
      const fileContent = await readFileAsString(assetPath, 'binary');
      const hash = Bun.hash(fileContent).toString(16).slice(0, 8);
      const ext = getExtname(url);
      const basename = getBasename(url, ext);
      const newFilename = `${basename}.${hash}${ext}`;

      // Determine the assets directory in the output
      const assetsDir = joinPaths(outputDir, assetsSubdir);

      // Ensure the assets directory exists
      await createDirectory(assetsDir);

      // Copy the asset to the output
      const outputPath = joinPaths(assetsDir, newFilename);
      await copyFile(assetPath, outputPath);
      logger.debug(`Copied asset from ${assetPath} to ${outputPath}`);

      // Return the new URL
      return `/${assetsSubdir}/${newFilename}`;
    },
    (error) => {
      logger.warn(`Error processing URL ${url} in ${sourcePath}: ${error}`);
      return url;
    }
  );
}

/**
 * Process CSS content to rewrite URLs to assets
 * 
 * @param css CSS content with asset URLs
 * @param cssPath Path to the original CSS file
 * @param outputDir Output directory where processed assets will be copied
 * @returns CSS content with rewritten URLs
 */
export async function rewriteCssAssetUrls(
  css: string,
  cssPath: string,
  outputDir: string
): Promise<string> {
  // Use regex to find URL references in CSS
  const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  let match;
  let lastIndex = 0;
  let result = '';

  while ((match = urlRegex.exec(css)) !== null) {
    const [fullMatch, url] = match;
    const matchIndex = match.index;

    // Add text before the match
    result += css.substring(lastIndex, matchIndex);
    lastIndex = matchIndex + fullMatch.length;

    // Process the URL
    const processedUrl = await processAssetUrl(url, cssPath, outputDir);
    
    // Replace the URL in the result
    result += `url('${processedUrl}')`;
  }

  // Add any remaining text
  result += css.substring(lastIndex);
  return result;
}

/**
 * Generate a hash for a file
 * 
 * @param filePath Path to the file to hash
 * @returns Hex string hash of the file contents
 */
export async function generateFileHash(filePath: string): Promise<string> {
  try {
    const content = await readFileAsString(filePath, 'binary');
    return Bun.hash(content).toString(16).slice(0, 8);
  } catch (error) {
    logger.error(`Failed to generate hash for ${filePath}:`, { error });
    return Date.now().toString(16); // Fallback to timestamp-based hash
  }
}

/**
 * Creates a content-hashed filename from the original filename
 * 
 * @param filePath Original file path
 * @param hash Optional hash to use (will be generated if not provided)
 * @returns Filename with hash inserted before extension
 */
export async function createHashedFilename(
  filePath: string,
  hash?: string
): Promise<string> {
  const hashToUse = hash || await generateFileHash(filePath);
  const ext = getExtname(filePath);
  const basename = getBasename(filePath, ext);
  return `${basename}.${hashToUse}${ext}`;
} 