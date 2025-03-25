import type { Plugin } from '../../core/plugin';
import type { ContentFile } from '../../core/content-processor';

export interface RssFeedOptions {
  /**
   * Feed title
   * @default undefined
   */
  title?: string;

  /**
   * Feed description
   * @default undefined
   */
  description?: string;

  /**
   * Site URL
   * @default undefined
   */
  siteUrl?: string;

  /**
   * Feed language
   * @default 'en'
   */
  language?: string;

  /**
   * Number of items to include in the feed
   * @default 20
   */
  limit?: number;

  /**
   * Custom feed filename
   * @default 'rss.xml'
   */
  filename?: string;

  /**
   * Function to sort content files (default sorts by date in frontmatter, newest first)
   */
  sortItems?: (a: ContentFile, b: ContentFile) => number;

  /**
   * Function to filter content files
   */
  filterItems?: (item: ContentFile) => boolean;

  /**
   * Custom copyright text
   * @default undefined (uses current year and title)
   */
  copyright?: string;

  /**
   * Custom generator text
   * @default 'BunPress RSS Feed'
   */
  generator?: string;

  /**
   * Content namespace for RSS feed
   * @default 'http://purl.org/rss/1.0/modules/content/'
   */
  contentNamespace?: string;

  /**
   * Output directory
   * @default 'dist'
   */
  outputDir?: string;

  /**
   * File system module (for testing)
   * @internal
   */
  _fs?: any;
}

export default function rssFeedPlugin(options: RssFeedOptions = {}): Plugin {
  const {
    title,
    description,
    siteUrl,
    language = 'en',
    limit = 20,
    filename = 'rss.xml',
    copyright,
    generator = 'BunPress RSS Feed',
    sortItems = defaultSortItems,
    filterItems = () => true,
    contentNamespace = 'http://purl.org/rss/1.0/modules/content/',
    outputDir = 'dist',
    _fs = null,
  } = options;

  // Use provided fs or require the real one
  const fs = _fs || require('fs');
  const path = require('path');

  // Collection of all content files for RSS generation
  const contentFiles: ContentFile[] = [];

  // Default sort function (by date, newest first)
  function defaultSortItems(a: ContentFile, b: ContentFile) {
    const dateA = a.frontmatter?.date ? new Date(a.frontmatter.date) : new Date(0);
    const dateB = b.frontmatter?.date ? new Date(b.frontmatter.date) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  }

  // Format a date according to RFC 822
  function formatRFC822Date(date: Date): string {
    return date.toUTCString();
  }

  // Generate the RSS feed XML
  function generateFeed(): string {
    // Filter, sort, and limit content files
    const feedItems = contentFiles.filter(filterItems).sort(sortItems).slice(0, limit);

    // Build the RSS feed XML
    const now = new Date();
    const buildDate = formatRFC822Date(now);
    const copyrightText = copyright || `Copyright ${now.getFullYear()} ${title || ''}`;

    let feedContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="${contentNamespace}">
  <channel>
    <title>${escapeXml(title || '')}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(description || '')}</description>
    <language>${language}</language>
    <copyright>${escapeXml(copyrightText)}</copyright>
    <pubDate>${buildDate}</pubDate>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>${escapeXml(generator)}</generator>
    <atom:link href="${new URL(filename, siteUrl).toString()}" rel="self" type="application/rss+xml" />
`;

    // Add feed items
    for (const item of feedItems) {
      const { frontmatter, route, content, html } = item;
      const itemUrl = new URL(route, siteUrl).toString();
      const itemDate = frontmatter.date ? formatRFC822Date(new Date(frontmatter.date)) : buildDate;
      const itemTitle = frontmatter.title || route;
      const itemDescription = frontmatter.description || extractExcerpt(content);

      feedContent += `
    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <pubDate>${itemDate}</pubDate>
      <description>${escapeXml(itemDescription)}</description>
${frontmatter.author ? `      <author>${escapeXml(frontmatter.author)}</author>` : ''}
${frontmatter.categories ? generateCategories(frontmatter.categories) : ''}
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`;
    }

    // Close the feed
    feedContent += `
  </channel>
</rss>`;

    return feedContent;
  }

  const plugin = {
    name: 'rss-feed',
    options,

    async buildStart() {
      console.log('RSS feed plugin: Starting RSS feed generation...');
      // Reset content files
      contentFiles.length = 0;

      // In a real implementation, we'd need to hook into the content processor
      // to collect all content files. For now, this is a placeholder.
      // This would typically require extending the ContentProcessor to emit
      // events when content is processed, which we can listen to.
    },

    transform(content: string, _id?: string) {
      // This transform hook doesn't modify content, but in a real implementation
      // it would collect information about the content file being processed.
      // For now, we'll simulate this in the buildEnd hook.
      return content;
    },

    configureServer(_server: any) {
      // Setup server routes for the RSS feed if needed
      console.log('RSS feed plugin: Configuring server...');
      // In a real implementation, we'd add routes to the server
      // to serve the RSS feed dynamically during development.
    },

    async buildEnd() {
      if (!siteUrl) {
        console.log('RSS feed plugin: Site URL not provided, skipping RSS feed generation.');
        return;
      }

      if (!title) {
        console.log('RSS feed plugin: Feed title not provided, skipping RSS feed generation.');
        return;
      }

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // In a real implementation, we'd already have content files collected
      // during the build process. For demonstration, we'll create some sample content.
      // This simulates what we'd get from processing markdown files.
      if (contentFiles.length === 0) {
        simulateContentFiles(contentFiles);
      }

      // Generate the feed
      const feedContent = generateFeed();

      // Write the feed file
      fs.writeFileSync(path.join(outputDir, filename), feedContent);
      console.log(
        `RSS feed plugin: Generated ${filename} with ${contentFiles.filter(filterItems).length} items`
      );
    },

    // Exposing methods for testing
    __test__: {
      addContentFile: (file: ContentFile) => contentFiles.push(file),
      clearContentFiles: () => contentFiles.splice(0, contentFiles.length),
      getContentFiles: () => [...contentFiles],
      generateFeed,
    },
  };

  return plugin as Plugin & {
    __test__: {
      addContentFile: (file: ContentFile) => void;
      clearContentFiles: () => void;
      getContentFiles: () => ContentFile[];
      generateFeed: () => string;
    };
  };
}

// For demonstration purposes only - in a real implementation, we'd get this data
// from processing actual content files during the build
function simulateContentFiles(contentFiles: ContentFile[]) {
  // Sample blog posts
  const posts = [
    {
      path: '/path/to/blog/getting-started-with-bunpress.md',
      route: '/blog/getting-started-with-bunpress',
      frontmatter: {
        title: 'Getting Started with BunPress',
        description: 'Learn how to create your first BunPress site',
        date: '2023-05-15',
        author: 'BunPress Team',
        categories: ['Tutorial', 'BunPress'],
      },
      content: `# Getting Started with BunPress\n\nWelcome to BunPress, the fastest static site generator built with Bun!`,
      html: '<h1>Getting Started with BunPress</h1><p>Welcome to BunPress, the fastest static site generator built with Bun!</p>',
    },
    {
      path: '/path/to/blog/creating-plugins.md',
      route: '/blog/creating-plugins',
      frontmatter: {
        title: 'Creating Plugins for BunPress',
        description: 'Learn how to extend BunPress with custom plugins',
        date: '2023-06-10',
        author: 'BunPress Team',
        categories: ['Advanced', 'Plugins', 'BunPress'],
      },
      content: `# Creating Plugins for BunPress\n\nPlugins allow you to extend BunPress with custom functionality.`,
      html: '<h1>Creating Plugins for BunPress</h1><p>Plugins allow you to extend BunPress with custom functionality.</p>',
    },
    {
      path: '/path/to/blog/optimizing-performance.md',
      route: '/blog/optimizing-performance',
      frontmatter: {
        title: 'Optimizing Performance in BunPress',
        description: 'Tips and tricks for optimizing your BunPress site',
        date: '2023-07-20',
        author: 'BunPress Team',
        categories: ['Performance', 'BunPress'],
      },
      content: `# Optimizing Performance in BunPress\n\nLearn how to make your BunPress site even faster!`,
      html: '<h1>Optimizing Performance in BunPress</h1><p>Learn how to make your BunPress site even faster!</p>',
    },
  ];

  // Add sample posts to content files
  contentFiles.push(...(posts as ContentFile[]));
}

// Utility functions

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract a plain text excerpt from markdown content
 */
function extractExcerpt(content: string, length: number = 200): string {
  // Remove frontmatter if present
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---/, '').trim();

  // Remove markdown headings, links, images, etc.
  const plainText = contentWithoutFrontmatter
    .replace(/#+\s+/g, '') // Remove headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just the text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with one
    .trim();

  // Limit to specified length
  return plainText.length > length ? plainText.substring(0, length) + '...' : plainText;
}

/**
 * Generate category tags for RSS
 */
function generateCategories(categories: string | string[]): string {
  if (!categories) return '';

  const categoryArray = Array.isArray(categories) ? categories : [categories];
  return categoryArray
    .map(category => `      <category>${escapeXml(category)}</category>`)
    .join('\n');
}
