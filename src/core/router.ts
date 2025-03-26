import { readdirSync, statSync } from 'fs';
import path from 'path';
import { ContentProcessor, ContentFile, processMarkdownContent } from './content-processor';
import { DefaultPluginManager, Plugin } from './plugin';

interface Routes {
  [key: string]: ContentFile;
}

// Use the synchronous version for now since we're transitioning to async
export async function generateRoutes(pagesDir: string): Promise<Routes> {
  const routes: Routes = {};

  // Helper function to process files recursively
  async function processDirectory(directory: string) {
    try {
      const files = readdirSync(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        try {
          const stat = statSync(filePath);

          if (stat.isDirectory()) {
            // Recursively process subdirectories
            await processDirectory(filePath);
          } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            // Process markdown files using the now async version
            const contentFile = await processMarkdownContent(filePath, pagesDir);
            if (contentFile.route) {
              routes[contentFile.route] = contentFile;
            } else {
              console.warn(`Warning: Content file at ${filePath} has no route defined`);
            }
          }
        } catch (err) {
          console.warn(`Warning: Error processing file ${filePath}: ${err}`);
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not read directory ${directory}: ${err}`);
    }
  }

  // Start processing from the pages directory
  await processDirectory(pagesDir);

  return routes;
}

// Async version for future use
export async function generateRoutesAsync(
  pagesDir: string,
  plugins: Plugin[] = []
): Promise<Routes> {
  const routes: Routes = {};
  const pluginManager = new DefaultPluginManager();

  // Add all plugins to the manager
  plugins.forEach(plugin => pluginManager.addPlugin(plugin));

  const processor = new ContentProcessor({ plugins: pluginManager });

  // Find i18n plugin if it exists
  const i18nPlugin = pluginManager.getPlugin('i18n');

  // Helper function to process files recursively
  async function processDirectory(directory: string) {
    try {
      const files = readdirSync(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        try {
          const stat = statSync(filePath);

          if (stat.isDirectory()) {
            // Recursively process subdirectories
            await processDirectory(filePath);
          } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            // Process markdown files with plugin support
            const contentFile = await processor.processMarkdownContent(filePath, pagesDir);
            if (contentFile.route) {
              routes[contentFile.route] = contentFile;
              
              // Register the content file with i18n plugin if available
              if (i18nPlugin && typeof (i18nPlugin as any).registerContentFile === 'function') {
                (i18nPlugin as any).registerContentFile(contentFile);
              }
            } else {
              console.warn(`Warning: Content file at ${filePath} has no route defined`);
            }
          }
        } catch (err) {
          console.warn(`Warning: Error processing file ${filePath}: ${err}`);
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not read directory ${directory}: ${err}`);
    }
  }

  // Start processing from the pages directory
  await processDirectory(pagesDir);

  return routes;
}
