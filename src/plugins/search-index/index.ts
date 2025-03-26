import type { Plugin } from '../../core/plugin';
import type { ContentFile } from '../../core/content-processor';
import fs from 'fs';
import path from 'path';

export interface SearchIndexOptions {
  /**
   * Output filename for the search index
   * @default 'search-index.json'
   */
  filename?: string;

  /**
   * Output directory
   * @default 'dist'
   */
  outputDir?: string;

  /**
   * Fields to include in search index
   * @default ['title', 'description', 'content']
   */
  fields?: string[];

  /**
   * Function to filter content files
   * @default () => true
   */
  filterItems?: (item: ContentFile) => boolean;

  /**
   * Stopwords to exclude from indexing
   * @default common English stopwords
   */
  stopwords?: string[];

  /**
   * Maximum length of text snippet in search results
   * @default 160
   */
  snippetLength?: number;

  /**
   * File system module (for testing)
   * @internal
   */
  _fs?: any;
}

// Default English stopwords
const DEFAULT_STOPWORDS = [
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'if',
  'in',
  'into',
  'is',
  'it',
  'no',
  'not',
  'of',
  'on',
  'or',
  'such',
  'that',
  'the',
  'their',
  'then',
  'there',
  'these',
  'they',
  'this',
  'to',
  'was',
  'will',
  'with',
];

export interface SearchDocument {
  id: string;
  url: string;
  title?: string;
  description?: string;
  content?: string;
  excerpt: string;
  [key: string]: any;
}

/**
 * Create a search index plugin for BunPress
 *
 * The search index plugin generates a JSON file with searchable content
 * that can be used with client-side search implementations.
 */
export default function searchIndexPlugin(options: SearchIndexOptions = {}): Plugin {
  const {
    filename = 'search-index.json',
    outputDir = 'dist',
    fields = ['title', 'description', 'content'],
    filterItems = () => true,
    stopwords = DEFAULT_STOPWORDS,
    snippetLength = 160,
    _fs = fs,
  } = options;

  // Collection of all content files for search index generation
  const contentFiles: ContentFile[] = [];

  /**
   * Process text by removing HTML tags, lowercasing, and removing stopwords
   */
  function processText(text: string): string {
    if (!text) return '';

    // Remove HTML tags
    const plainText = text.replace(/<[^>]*>/g, ' ');

    // Remove special characters, convert to lowercase, and split into words
    const words = plainText
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopwords.includes(word));

    return words.join(' ');
  }

  /**
   * Extract excerpt from HTML content
   */
  function extractExcerpt(html: string, length: number = snippetLength): string {
    if (!html) return '';

    // Remove HTML tags
    const plainText = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to specified length
    return plainText.length > length ? plainText.substring(0, length) + '...' : plainText;
  }

  /**
   * Add content file to the search index collection
   */
  function addContentFile(file: ContentFile): void {
    contentFiles.push(file);
  }

  /**
   * Generate search index from collected content files
   */
  function generateSearchIndex(): SearchDocument[] {
    return contentFiles.filter(filterItems).map(file => {
      const { route, frontmatter, content, html } = file;

      // Create search document
      const document: SearchDocument = {
        id: route,
        url: route,
        excerpt: extractExcerpt(html),
      };

      // Add frontmatter fields
      if (frontmatter) {
        if (fields.includes('title') && frontmatter.title) {
          document.title = frontmatter.title;
        }

        if (fields.includes('description') && frontmatter.description) {
          document.description = frontmatter.description;
        }

        // Add other frontmatter fields if specified
        for (const field of fields) {
          if (
            field !== 'title' &&
            field !== 'description' &&
            field !== 'content' &&
            frontmatter[field]
          ) {
            document[field] = frontmatter[field];
          }
        }
      }

      // Add content if specified
      if (fields.includes('content')) {
        document.content = processText(content);
      }

      return document;
    });
  }

  return {
    name: 'search-index',
    options,

    // Exposing methods for testing and programmatic use
    __test__: {
      addContentFile,
      clearContentFiles: () => {
        contentFiles.length = 0;
      },
      getContentFiles: () => [...contentFiles],
      generateSearchIndex,
      processText,
      extractExcerpt,
    },

    async buildStart() {
      console.log('Search index plugin: Starting search index generation...');
      // Reset content files at the beginning of each build
      contentFiles.length = 0;
    },

    transform(content: string): string {
      // Don't modify the content
      return content;
    },

    /**
     * Process a content file after it has been processed by the content processor
     * This is a custom hook that must be called by the builder
     */
    processContentFile(file: ContentFile): void {
      addContentFile(file);
    },

    async buildEnd() {
      if (contentFiles.length === 0) {
        console.warn('Search index plugin: No content files were collected during build.');
        console.warn('Make sure the plugin is properly integrated with the content processor.');
        return;
      }

      // Generate the search index
      const searchIndex = generateSearchIndex();

      // Ensure output directory exists
      const outputPath = path.resolve(outputDir);
      if (!_fs.existsSync(outputPath)) {
        _fs.mkdirSync(outputPath, { recursive: true });
      }

      // Write search index to file
      const filePath = path.join(outputPath, filename);
      _fs.writeFileSync(filePath, JSON.stringify(searchIndex, null, 2));
      console.log(`Search index plugin: Generated ${filename} with ${searchIndex.length} items`);
    },
  } as Plugin & {
    processContentFile: (file: ContentFile) => void;
    __test__: {
      addContentFile: (file: ContentFile) => void;
      clearContentFiles: () => void;
      getContentFiles: () => ContentFile[];
      generateSearchIndex: () => SearchDocument[];
      processText: (text: string) => string;
      extractExcerpt: (html: string, length?: number) => string;
    };
  };
}
