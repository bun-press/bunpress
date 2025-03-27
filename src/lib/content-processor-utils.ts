/**
 * Content processor utilities
 * Centralizes content processing with caching capabilities
 */

import {
  readMarkdownFile,
  markdownToHtml,
  extractTocItems,
  generateRoute,
  ContentFile,
} from './content-utils';
import { MarkdownCache, CacheOptions } from './cache-utils';
import { ErrorCode, createFileSystemError, tryCatch } from './error-utils';
import { fileExists } from './fs-utils';

/**
 * Content processor options
 */
export interface ContentProcessorOptions {
  /**
   * Root directory for content files (used for route generation)
   */
  rootDir: string;

  /**
   * Whether to extract table of contents
   */
  extractToc?: boolean;

  /**
   * Cache options
   */
  cacheOptions?: CacheOptions;

  /**
   * Whether to enable caching (default: true)
   */
  enableCache?: boolean;
}

/**
 * Content processor with caching capabilities
 */
export class EnhancedContentProcessor {
  private options: Required<ContentProcessorOptions>;
  private cache: MarkdownCache;

  /**
   * Create a new content processor
   */
  constructor(options: ContentProcessorOptions) {
    this.options = {
      rootDir: options.rootDir,
      extractToc: options.extractToc !== undefined ? options.extractToc : true,
      cacheOptions: options.cacheOptions || {},
      enableCache: options.enableCache !== undefined ? options.enableCache : true,
    };

    this.cache = new MarkdownCache(this.options.cacheOptions);
  }

  /**
   * Process a markdown file with caching
   *
   * @param filePath Path to the markdown file
   * @returns Processed content file
   */
  async processFile(filePath: string): Promise<ContentFile> {
    return await tryCatch(
      async () => {
        // Check if file exists
        const exists = await fileExists(filePath);
        if (!exists) {
          throw createFileSystemError(
            ErrorCode.FILE_NOT_FOUND,
            `File not found: ${filePath}`,
            filePath
          );
        }

        // Check cache first if enabled
        if (this.options.enableCache) {
          // Check if the file is fresh in cache
          const isFresh = await this.cache.isContentFresh(filePath);
          if (isFresh) {
            const cachedContent = this.cache.getContent(filePath);
            if (cachedContent) {
              return cachedContent;
            }
          }
        }

        // Process the file
        const { frontmatter, content } = await readMarkdownFile(filePath);
        const html = markdownToHtml(content);
        const route = generateRoute(filePath, this.options.rootDir);

        // Create the content file object
        const contentFile: ContentFile = {
          path: filePath,
          route,
          content,
          frontmatter,
          html,
        };

        // Extract TOC if requested
        if (this.options.extractToc) {
          contentFile.toc = extractTocItems(html);
        }

        // Cache the result if enabled
        if (this.options.enableCache) {
          this.cache.setContent(filePath, contentFile);
        }

        return contentFile;
      },
      error => {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Failed to process file ${filePath}: ${error}`);
      }
    );
  }

  /**
   * Process multiple files in parallel
   *
   * @param filePaths Array of file paths to process
   * @returns Array of processed content files
   */
  async processFiles(filePaths: string[]): Promise<ContentFile[]> {
    return Promise.all(filePaths.map(path => this.processFile(path)));
  }

  /**
   * Clear the content cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: this.cache.keys(),
    };
  }

  /**
   * Get the content cache
   */
  getCache(): MarkdownCache {
    return this.cache;
  }
}
