import path from 'path';
import fs from 'fs';
import type { BunPressConfig } from '../../bunpress.config';
import { createPathAliasPlugin } from './path-aliases';

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
  // Default options
  const opts = {
    injectHMR: process.env.NODE_ENV !== 'production',
    extractAssets: true,
    ...options,
  };

  // Read the HTML file
  const htmlContent = await Bun.file(htmlPath).text();
  const htmlDir = path.dirname(htmlPath);

  // Store extracted assets
  const assets: AssetReference[] = [];

  // Create a new HTML rewriter
  const rewriter = new HTMLRewriter();

  // Handle script tags
  rewriter.on('script', {
    element(el) {
      const src = el.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        // Convert relative path to absolute
        const absolutePath = path.resolve(htmlDir, src);
        const relativePath = path.relative(process.cwd(), absolutePath);

        // Store the asset reference
        assets.push({
          type: 'script',
          path: relativePath,
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
        // Convert relative path to absolute
        const absolutePath = path.resolve(htmlDir, href);
        const relativePath = path.relative(process.cwd(), absolutePath);

        // Store the asset reference
        assets.push({
          type: 'style',
          path: relativePath,
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
        // Convert relative path to absolute
        const absolutePath = path.resolve(htmlDir, src);
        const relativePath = path.relative(process.cwd(), absolutePath);

        // Store the asset reference
        assets.push({
          type: 'image',
          path: relativePath,
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

  return {
    html: transformedHtml,
    assets,
  };
}

/**
 * Bundle assets using Bun.build
 *
 * @param entrypoints List of entry point files
 * @param outputDir Output directory
 * @param config BunPress configuration
 * @param options Bundling options
 * @returns Build result
 */
export async function bundleAssets(
  entrypoints: string[],
  outputDir: string,
  config: BunPressConfig,
  options: BundleOptions = {}
): Promise<any> {
  // Skip if no entrypoints
  if (!entrypoints.length) {
    return { success: true, outputs: [] };
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Default options
  const isDev = process.env.NODE_ENV !== 'production';
  const bundleOptions = {
    minify: !isDev,
    sourcemap: isDev ? 'inline' : false,
    target: 'browser',
    splitting: false,
    ...options,
  };

  try {
    // Separate entrypoints by type
    const scriptEntries = entrypoints.filter(entry => {
      const ext = path.extname(entry).toLowerCase();
      return ['.js', '.ts', '.jsx', '.tsx'].includes(ext);
    });

    const styleEntries = entrypoints.filter(entry => {
      const ext = path.extname(entry).toLowerCase();
      return ['.css', '.scss', '.sass', '.less'].includes(ext);
    });

    const imageEntries = entrypoints.filter(entry => {
      const ext = path.extname(entry).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
    });

    // Process scripts with Bun.build
    const scriptBundle = scriptEntries.length
      ? await Bun.build({
          entrypoints: scriptEntries,
          outdir: outputDir,
          minify: bundleOptions.minify,
          sourcemap:
            bundleOptions.sourcemap === true
              ? 'inline'
              : bundleOptions.sourcemap === false
                ? 'none'
                : (bundleOptions.sourcemap as
                    | 'none'
                    | 'linked'
                    | 'inline'
                    | 'external'
                    | undefined),
          target: bundleOptions.target as any,
          splitting: bundleOptions.splitting,
          publicPath: bundleOptions.publicPath,
          define: bundleOptions.define,
          plugins: [createPathAliasPlugin()],
        })
      : { success: true, outputs: [] };

    // Process styles (using the css-processor module)
    let styleOutputs: any[] = [];
    if (styleEntries.length) {
      // Import dynamically to avoid circular dependencies
      const { bundleCSS } = await import('./css-processor');
      const cssOutputPath = path.join(outputDir, 'styles.css');
      const cssResult = await bundleCSS(styleEntries, cssOutputPath, config);

      if (cssResult.success) {
        styleOutputs = [{ path: cssOutputPath }];
      }
    }

    // Process images (simple copy for now)
    const imageOutputs = await Promise.all(
      imageEntries.map(async imagePath => {
        const filename = path.basename(imagePath);
        const fileContent = fs.readFileSync(imagePath);
        const hash = Bun.hash(fileContent).toString(16).slice(0, 8);
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const newFilename = `${basename}.${hash}${ext}`;
        const outputPath = path.join(outputDir, 'images', newFilename);

        // Ensure the directory exists
        const imageDir = path.dirname(outputPath);
        if (!fs.existsSync(imageDir)) {
          fs.mkdirSync(imageDir, { recursive: true });
        }

        // Copy the file
        fs.copyFileSync(imagePath, outputPath);

        return { path: outputPath };
      })
    );

    // Combine all outputs
    const allOutputs = [...(scriptBundle.outputs || []), ...styleOutputs, ...imageOutputs];

    return {
      success: true,
      outputs: allOutputs,
    };
  } catch (error) {
    console.error('Error bundling assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process HTML files and bundle their assets
 *
 * @param htmlFiles List of HTML files to process
 * @param outputDir Output directory
 * @param config BunPress configuration
 * @param bundleOptions Bundle options
 * @returns Build result
 */
export async function processHTMLEntrypoints(
  htmlFiles: string[],
  outputDir: string,
  config: BunPressConfig,
  bundleOptions: BundleOptions = {}
): Promise<any> {
  // Process each HTML file
  const results = await Promise.all(
    htmlFiles.map(async htmlPath => {
      // Extract assets from HTML
      const { html, assets } = await processHtmlWithRewriter(htmlPath, {
        injectHMR: process.env.NODE_ENV !== 'production',
      });

      // Get asset paths for bundling
      const assetPaths = assets.map(asset => asset.path);

      // Bundle the assets
      const bundleResult = await bundleAssets(
        assetPaths,
        path.join(outputDir, 'assets'),
        config,
        bundleOptions
      );

      // Write the processed HTML to the output directory
      const basename = path.basename(htmlPath);
      const outputHtmlPath = path.join(outputDir, basename);

      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Update HTML to reference bundled assets
      let processedHtml = html;

      // Add bundled script reference
      const scriptOutputs = bundleResult.outputs.filter(
        (output: any) => output.path.endsWith('.js') || output.path.endsWith('.mjs')
      );

      if (scriptOutputs.length) {
        const scriptPath = '/assets/' + path.basename(scriptOutputs[0].path);
        processedHtml = processedHtml.replace(
          '</head>',
          `  <script src="${scriptPath}" defer></script>\n  </head>`
        );
      }

      // Add bundled style reference
      const styleOutputs = bundleResult.outputs.filter((output: any) =>
        output.path.endsWith('.css')
      );

      if (styleOutputs.length) {
        const stylePath = '/assets/' + path.basename(styleOutputs[0].path);
        processedHtml = processedHtml.replace(
          '</head>',
          `  <link rel="stylesheet" href="${stylePath}">\n  </head>`
        );
      }

      // Write the final HTML
      fs.writeFileSync(outputHtmlPath, processedHtml);

      return {
        htmlPath: outputHtmlPath,
        bundleResult,
      };
    })
  );

  return {
    success: true,
    results,
  };
}
