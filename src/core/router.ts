import { ContentProcessor, ContentFile, processMarkdownContent } from './content-processor';
import { DefaultPluginManager, Plugin } from './plugin';
import { getAllFiles, directoryExists, filterFilesByExtension } from '../lib/fs-utils';
import { getNamespacedLogger } from '../lib/logger-utils';
import { tryCatch } from '../lib/error-utils';

// Create namespaced logger for router
const logger = getNamespacedLogger('router');

// Helper function to filter files by extension was moved to fs-utils.ts

interface Routes {
  [key: string]: ContentFile;
}

// Use the synchronous version for now since we're transitioning to async
export async function generateRoutes(pagesDir: string): Promise<Routes> {
  const routes: Routes = {};

  // Helper function to process files recursively
  async function processDirectory(directory: string) {
    return await tryCatch(
      async () => {
        // Check if directory exists
        if (!(await directoryExists(directory))) {
          logger.warn(`Directory ${directory} does not exist`);
          return;
        }

        // Get all files in directory
        const allFiles = await getAllFiles(directory);
        const markdownFiles = filterFilesByExtension(allFiles, ['.md', '.mdx']);

        for (const filePath of markdownFiles) {
          await tryCatch(
            async () => {
              // Process markdown files using the now async version
              const contentFile = await processMarkdownContent(filePath, pagesDir);
              if (contentFile.route) {
                routes[contentFile.route] = contentFile;
              } else {
                logger.warn(`Content file at ${filePath} has no route defined`);
              }
            },
            err => {
              logger.warn(`Error processing file ${filePath}: ${err}`);
            }
          );
        }
      },
      err => {
        logger.warn(`Could not read directory ${directory}: ${err}`);
      }
    );
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
    return await tryCatch(
      async () => {
        // Check if directory exists
        if (!(await directoryExists(directory))) {
          logger.warn(`Directory ${directory} does not exist`);
          return;
        }

        // Get all files in directory
        const allFiles = await getAllFiles(directory);
        const markdownFiles = filterFilesByExtension(allFiles, ['.md', '.mdx']);

        for (const filePath of markdownFiles) {
          await tryCatch(
            async () => {
              // Process markdown files with plugin support
              const contentFile = await processor.processMarkdownContent(filePath, pagesDir);
              if (contentFile.route) {
                routes[contentFile.route] = contentFile;

                // Register the content file with i18n plugin if available
                if (i18nPlugin && typeof (i18nPlugin as any).registerContentFile === 'function') {
                  (i18nPlugin as any).registerContentFile(contentFile);
                }
              } else {
                logger.warn(`Content file at ${filePath} has no route defined`);
              }
            },
            err => {
              logger.warn(`Error processing file ${filePath}: ${err}`);
            }
          );
        }
      },
      err => {
        logger.warn(`Could not read directory ${directory}: ${err}`);
      }
    );
  }

  // Start processing from the pages directory
  await processDirectory(pagesDir);

  return routes;
}
