import type { Plugin } from '../../core/plugin';
import type { ContentFile } from '../../core/content-processor';

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
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
  'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
  'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
  'this', 'to', 'was', 'will', 'with'
];

export default function searchIndexPlugin(options: SearchIndexOptions = {}): Plugin {
  const {
    filename = 'search-index.json',
    outputDir = 'dist',
    fields = ['title', 'description', 'content'],
    filterItems = () => true,
    stopwords = DEFAULT_STOPWORDS,
    snippetLength = 160,
    _fs = null
  } = options;

  // Use provided fs or require the real one
  const fs = _fs || require('fs');
  const path = require('path');

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
    const plainText = html.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit to specified length
    return plainText.length > length
      ? plainText.substring(0, length) + '...'
      : plainText;
  }

  /**
   * Generate search index from content files
   */
  function generateSearchIndex(): any[] {
    return contentFiles
      .filter(filterItems)
      .map(file => {
        const { route, frontmatter, content, html } = file;
        
        // Create search document
        const document: any = {
          id: route,
          url: route,
          excerpt: extractExcerpt(html)
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
            if (field !== 'title' && field !== 'description' && field !== 'content' && frontmatter[field]) {
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

  const plugin = {
    name: 'search-index',
    options,

    async buildStart() {
      console.log('Search index plugin: Starting search index generation...');
      // Reset content files
      contentFiles.length = 0;
    },

    transform(content: string, _id?: string) {
      // This transform hook doesn't modify content
      // It's here to conform to the plugin interface
      return content;
    },

    async buildEnd() {
      // In a real implementation, we'd already have content files collected
      // during the build process.
      if (contentFiles.length === 0) {
        console.log('Search index plugin: No content files found, simulating content...');
        simulateContentFiles(contentFiles);
      }
      
      // Generate the search index
      const searchIndex = generateSearchIndex();
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write search index to file
      fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(searchIndex, null, 2)
      );
      
      console.log(`Search index plugin: Generated ${filename} with ${searchIndex.length} documents`);
    },
    
    // Exposing methods for testing
    __test__: {
      addContentFile: (file: ContentFile) => contentFiles.push(file),
      clearContentFiles: () => contentFiles.splice(0, contentFiles.length),
      getContentFiles: () => [...contentFiles],
      generateSearchIndex,
      processText,
      extractExcerpt
    }
  };
  
  return plugin as Plugin & {
    __test__: {
      addContentFile: (file: ContentFile) => void;
      clearContentFiles: () => void;
      getContentFiles: () => ContentFile[];
      generateSearchIndex: () => any[];
      processText: (text: string) => string;
      extractExcerpt: (html: string, length?: number) => string;
    }
  };
}

// For demonstration purposes only - in a real implementation, we'd get this data
// from processing actual content files during the build
function simulateContentFiles(contentFiles: ContentFile[]) {
  // Sample content
  const pages = [
    {
      path: '/path/to/index.md',
      route: '/',
      frontmatter: {
        title: 'BunPress - Fast Static Site Generator',
        description: 'Create lightning-fast static sites with BunPress, powered by Bun'
      },
      content: '# BunPress\n\nA fast static site generator built with Bun.',
      html: '<h1>BunPress</h1><p>A fast static site generator built with Bun.</p>'
    },
    {
      path: '/path/to/docs/getting-started.md',
      route: '/docs/getting-started',
      frontmatter: {
        title: 'Getting Started with BunPress',
        description: 'Learn how to create your first BunPress site',
        tags: ['tutorial', 'beginner']
      },
      content: '# Getting Started\n\nFollow these steps to create your first BunPress site.\n\n## Installation\n\nInstall BunPress using npm:\n\n```bash\nnpm install -g bunpress\n```',
      html: '<h1>Getting Started</h1><p>Follow these steps to create your first BunPress site.</p><h2>Installation</h2><p>Install BunPress using npm:</p><pre><code class="language-bash">npm install -g bunpress</code></pre>'
    },
    {
      path: '/path/to/docs/plugins.md',
      route: '/docs/plugins',
      frontmatter: {
        title: 'BunPress Plugins',
        description: 'Learn how to use and create plugins for BunPress',
        tags: ['plugins', 'advanced']
      },
      content: '# Plugins\n\nBunPress has a powerful plugin system that allows you to extend functionality.\n\n## Using Plugins\n\nAdd plugins to your `bunpress.config.ts` file.',
      html: '<h1>Plugins</h1><p>BunPress has a powerful plugin system that allows you to extend functionality.</p><h2>Using Plugins</h2><p>Add plugins to your <code>bunpress.config.ts</code> file.</p>'
    },
    {
      path: '/path/to/blog/introduction.md',
      route: '/blog/introduction',
      frontmatter: {
        title: 'Introducing BunPress',
        description: 'Meet BunPress, the fastest static site generator for Bun',
        date: '2023-05-01',
        author: 'BunPress Team',
        tags: ['announcement', 'release']
      },
      content: '# Introducing BunPress\n\nWe are excited to announce BunPress, a new static site generator built with Bun.',
      html: '<h1>Introducing BunPress</h1><p>We are excited to announce BunPress, a new static site generator built with Bun.</p>'
    }
  ];
  
  // Add sample pages to content files
  contentFiles.push(...pages as ContentFile[]);
} 