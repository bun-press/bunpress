import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import { PluginManager } from './plugin';

export async function buildSite(config: BunPressConfig, pluginManager?: PluginManager) {
  console.log('Building site...');
  
  // Execute plugin buildStart hooks
  if (pluginManager) {
    await pluginManager.executeBuildStart();
    console.log('Executed plugin buildStart hooks');
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
    const html = renderHtml(contentFile, config);
    
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
    console.log(`Generated: ${outputPath}`);
  }
  
  // Copy static assets from public directory
  if (existsSync('public')) {
    copyDirectory('public', path.join(config.outputDir, 'public'));
    console.log('Copied public assets');
  }
  
  // Generate sitemap.xml
  generateSitemap(routes, config);
  
  // Execute plugin buildEnd hooks
  if (pluginManager) {
    await pluginManager.executeBuildEnd();
    console.log('Executed plugin buildEnd hooks');
  }
  
  console.log('Build completed successfully!');
}

/**
 * Generate a basic sitemap.xml file
 */
function generateSitemap(routes: Record<string, any>, config: BunPressConfig) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(routes)
  .map(route => `  <url>
    <loc>${config.siteUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`)
  .join('\n')}
</urlset>`;
  
  writeFileSync(path.join(config.outputDir, 'sitemap.xml'), sitemap);
  console.log('Generated: sitemap.xml');
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