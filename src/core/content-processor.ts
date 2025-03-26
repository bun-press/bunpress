import { PluginManager, DefaultPluginManager } from './plugin';
import {
  readMarkdownFile,
  markdownToHtml,
  generateRoute,
  extractTocItems,
  ContentFile as ContentFileBase
} from '../lib/content-utils';

// Import error handling utilities
import {
  ErrorCode,
  tryCatchWithCode
} from '../lib/error-utils';

// Import logger
import { getNamespacedLogger } from '../lib/logger-utils';

// Create namespaced logger for content processor
const logger = getNamespacedLogger('content-processor');

/**
 * Extended content file interface with additional properties
 */
export interface ContentFile extends ContentFileBase {
  // Any additional properties specific to this implementation
}

export interface ContentProcessorOptions {
  plugins?: PluginManager;
}

export class ContentProcessor {
  private pluginManager: PluginManager;

  constructor(options: ContentProcessorOptions = {}) {
    this.pluginManager = options.plugins || new DefaultPluginManager();
  }

  async processMarkdownContent(filePath: string, rootDir: string): Promise<ContentFile> {
    return await tryCatchWithCode(
      async () => {
        logger.debug(`Processing markdown file: ${filePath}`);
        
        // Read and parse the markdown file
        const { frontmatter, content } = await readMarkdownFile(filePath);

        // Apply plugin transformations to the content
        const transformedContent = await this.pluginManager.executeTransform(content);

        // Convert markdown to HTML
        const html = markdownToHtml(transformedContent);

        // Generate route from file path
        const route = generateRoute(filePath, rootDir);

        // Extract TOC items
        const toc = extractTocItems(html);

        logger.debug(`Processed markdown file: ${filePath}, route: ${route}`);

        // Return the processed content file
        return {
          path: filePath,
          route,
          content: transformedContent,
          frontmatter,
          html,
          toc
        };
      },
      ErrorCode.CONTENT_PARSE_ERROR,
      `Failed to process markdown content: ${filePath}`,
      { filePath, rootDir }
    );
  }

  // Methods for plugin management
  addPlugin(plugin: any) {
    this.pluginManager.addPlugin(plugin);
    logger.debug(`Added plugin to content processor`);
  }

  getPluginManager() {
    return this.pluginManager;
  }
}

/**
 * Synchronous version that doesn't use plugins
 * Maintained for backward compatibility but now async
 */
export async function processMarkdownContent(filePath: string, rootDir: string): Promise<ContentFile> {
  return await tryCatchWithCode(
    async () => {
      logger.debug(`Processing markdown file (legacy method): ${filePath}`);
      
      // Use the utility function that does all the work for us
      const contentFile = await readMarkdownFile(filePath);
      const html = markdownToHtml(contentFile.content);
      const route = generateRoute(filePath, rootDir);
      const toc = extractTocItems(html);
      
      logger.debug(`Processed markdown file (legacy method): ${filePath}, route: ${route}`);
      
      return {
        path: filePath,
        route,
        content: contentFile.content,
        frontmatter: contentFile.frontmatter,
        html,
        toc
      };
    },
    ErrorCode.CONTENT_PARSE_ERROR,
    `Failed to process markdown content: ${filePath}`,
    { filePath, rootDir }
  );
}
