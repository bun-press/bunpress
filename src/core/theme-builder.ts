import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';
import type { BunPressConfig } from '../../bunpress.config';

/**
 * Theme structure with assets and layouts
 */
export interface Theme {
  name: string;
  dir: string;
  indexPath: string;
  layouts: Record<string, string>;
  styles: string[];
  scripts: string[];
  assets: string[];
}

/**
 * Load a theme from the themes directory
 * 
 * @param config BunPress configuration
 * @returns Theme object with paths to all assets
 */
export async function loadTheme(config: BunPressConfig): Promise<Theme> {
  const themeName = config.themeConfig?.name || 'default';
  const themeDir = path.join(process.cwd(), 'themes', themeName);
  
  // Check if theme exists
  if (!fs.existsSync(themeDir)) {
    throw new Error(`Theme "${themeName}" not found in themes directory`);
  }
  
  // Find the theme's index.html
  const indexPath = path.join(themeDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in theme "${themeName}"`);
  }
  
  // Find all layouts
  const layoutsDir = path.join(themeDir, 'layouts');
  const layouts: Record<string, string> = {};
  
  if (fs.existsSync(layoutsDir)) {
    const layoutFiles = await glob('**/*.html', { cwd: layoutsDir });
    
    for (const layoutFile of layoutFiles) {
      const layoutName = path.basename(layoutFile, '.html');
      const layoutPath = path.join(layoutsDir, layoutFile);
      const layoutContent = await Bun.file(layoutPath).text();
      layouts[layoutName] = layoutContent;
    }
  }
  
  // If no layouts were found, add a default one
  if (Object.keys(layouts).length === 0) {
    layouts.default = '{{ content }}';
  }
  
  // Find all style files
  const stylesGlob = path.join(themeDir, '**/*.{css,scss,sass,less}');
  const styles = await glob(stylesGlob);
  
  // Find all script files
  const scriptsGlob = path.join(themeDir, '**/*.{js,ts,jsx,tsx}');
  const scripts = await glob(scriptsGlob);
  
  // Find all other asset files
  const assetsGlob = path.join(themeDir, '**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,eot}');
  const assets = await glob(assetsGlob);
  
  return {
    name: themeName,
    dir: themeDir,
    indexPath,
    layouts,
    styles,
    scripts,
    assets
  };
}

/**
 * Build a theme by processing its HTML and bundling assets
 * 
 * @param theme Theme object
 * @param config BunPress configuration
 * @returns Build result
 */
export async function buildTheme(
  theme: Theme,
  config: BunPressConfig
): Promise<any> {
  // Import bundler functions (import dynamically to avoid circular dependencies)
  const { processHTMLEntrypoints } = await import('./bundler');
  
  // Create the theme output directory
  const themeOutputDir = path.join(config.outputDir, 'theme');
  if (!fs.existsSync(themeOutputDir)) {
    fs.mkdirSync(themeOutputDir, { recursive: true });
  }
  
  // Process the theme's HTML files
  const htmlFiles = [theme.indexPath];
  
  // Build theme
  const result = await processHTMLEntrypoints(
    htmlFiles,
    themeOutputDir,
    config,
    {
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production' ? 'inline' : false,
      target: 'browser'
    }
  );
  
  return result;
}

/**
 * Apply a theme layout to content
 * 
 * @param content HTML content to wrap in a layout
 * @param layoutName Name of the layout to use
 * @param theme Theme object
 * @param data Additional data to pass to the layout
 * @returns Processed HTML with the layout applied
 */
export function applyThemeLayout(
  content: string,
  layoutName: string,
  theme: Theme,
  data: Record<string, any> = {}
): string {
  // Get the layout content
  const layout = theme.layouts[layoutName] || theme.layouts.default || '{{ content }}';
  
  // Replace the content placeholder
  let result = layout.replace('{{ content }}', content);
  
  // Replace other placeholders
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{ ${key} }}`, 'g'), String(value));
  }
  
  return result;
}

/**
 * Clone the theme's assets to the output directory
 * 
 * @param theme Theme object
 * @param config BunPress configuration
 */
export async function copyThemeAssets(
  theme: Theme,
  config: BunPressConfig
): Promise<void> {
  const assetOutputDir = path.join(config.outputDir, 'theme', 'assets');
  
  // Ensure the output directory exists
  if (!fs.existsSync(assetOutputDir)) {
    fs.mkdirSync(assetOutputDir, { recursive: true });
  }
  
  // Copy all asset files
  for (const asset of theme.assets) {
    const relativePath = path.relative(theme.dir, asset);
    const outputPath = path.join(assetOutputDir, relativePath);
    
    // Ensure the target directory exists
    const targetDir = path.dirname(outputPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(asset, outputPath);
  }
} 