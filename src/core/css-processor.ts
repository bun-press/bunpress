import path from 'path';
import fs from 'fs';
import type { BunPressConfig } from '../../bunpress.config';

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
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Default options based on environment
  const defaultOptions: CSSProcessOptions = {
    minify: !isDev,
    sourceMap: isDev,
    rewriteUrls: true
  };
  
  // Merge with provided options
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Get the CSS content
    const cssFile = Bun.file(cssPath);
    let cssContent = await cssFile.text();
    
    // Use the Bun transform API for transpiling CSS
    // This handles @import statements and other preprocessing
    const { transpile } = await import('bun');
    const result = await transpile({
      source: cssContent,
      loader: 'css',
      minify: opts.minify,
      sourcemap: opts.sourceMap ? 'inline' : false,
      filePath: cssPath
    });
    
    if (!result.success) {
      throw new Error(`Failed to process CSS: ${result.error?.message}`);
    }
    
    let output = result.code;
    
    // If needed, rewrite URLs to be relative to the output directory
    if (opts.rewriteUrls) {
      output = rewriteCSSUrls(output, cssPath, config.outputDir);
    }
    
    return output;
  } catch (error) {
    console.error(`Error processing CSS file ${cssPath}:`, error);
    throw error;
  }
}

/**
 * Rewrite URLs in CSS to be relative to the output directory
 * 
 * @param css CSS content
 * @param cssPath Path to the original CSS file
 * @param outputDir Output directory
 * @returns CSS with rewritten URLs
 */
function rewriteCSSUrls(css: string, cssPath: string, outputDir: string): string {
  const cssDir = path.dirname(cssPath);
  
  // Simple URL rewriting using regex
  // A more robust implementation would use a CSS parser
  return css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
    // Skip data URLs and absolute URLs
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/')) {
      return match;
    }
    
    // Resolve the original asset path
    const assetPath = path.resolve(cssDir, url);
    
    // Check if the file exists
    if (!fs.existsSync(assetPath)) {
      console.warn(`Asset not found: ${assetPath}`);
      return match;
    }
    
    // Generate a new path based on file hash
    const fileContent = fs.readFileSync(assetPath);
    const hash = Bun.hash(fileContent).toString(16).slice(0, 8);
    const ext = path.extname(url);
    const basename = path.basename(url, ext);
    const newFilename = `${basename}.${hash}${ext}`;
    
    // Determine the assets directory in the output
    const assetsDir = path.join(outputDir, 'assets');
    
    // Ensure the assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Copy the asset to the output
    const outputPath = path.join(assetsDir, newFilename);
    fs.copyFileSync(assetPath, outputPath);
    
    // Return the new URL
    return `url('/assets/${newFilename}')`;
  });
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
  if (entrypoints.length === 0) {
    return { success: true, message: 'No CSS files to bundle' };
  }
  
  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process each CSS file
    const cssContents = await Promise.all(
      entrypoints.map(cssPath => processCSS(cssPath, config, options))
    );
    
    // Combine all CSS content
    const bundleContent = cssContents.join('\n\n');
    
    // Write the bundle to the output file
    fs.writeFileSync(outputPath, bundleContent);
    
    return { success: true };
  } catch (error) {
    console.error('Error bundling CSS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 