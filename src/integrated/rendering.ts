/**
 * Integrated implementations for rendering in BunPress
 *
 * This file provides consolidated implementations for rendering-related
 * functionality that was previously scattered or only existed in tests.
 */

import type { ThemeManager } from '../core/theme-manager';
import type { PluginManager } from '../core/plugin';
import path from 'path';
import fs from 'fs';
import { createSlotSystem } from '../core/slot-system';
import {
  markdownToHtml,
  ContentFile as BaseContentFile,
  processMarkdownString
} from '../lib/content-utils';

// Extend the content file interface
export interface ContentFile extends BaseContentFile {}

// Interface for content processor
export interface ContentProcessor {
  processFile(filePath: string): Promise<ContentFile>;
  processContent(content: string, filePath: string): Promise<ContentFile>;
  getProcessedContent(filePath: string): ContentFile | null;
}

// Interface for file system operations used by content processor
export interface FileSystemOps {
  readFile: (filepath: string, options?: any) => Promise<string>;
  writeFile: (filepath: string, content: string) => Promise<boolean>;
  findFiles: (dir: string, pattern: RegExp | string, options?: any) => Promise<string[]>;
}

// Interface for the layout manager
export interface LayoutManager {
  getLayoutForContent(content: ContentFile): string;
  renderWithLayout(content: ContentFile): Promise<string>;
}

// Interface for the renderer
export interface Renderer {
  renderFile(filePath: string): Promise<string>;
  renderToOutput(filePath: string, outputPath: string): Promise<boolean>;
  renderAllContent(contentDir: string, outputDir: string): Promise<string[]>;
}

// Interface for the event system
export interface EventSystem {
  on: (eventName: string, handler: (...args: any[]) => void) => () => void;
  emit: (eventName: string, ...args: any[]) => void;
  off: (eventName: string) => void;
  subscriberCount: (eventName: string) => number;
}

/**
 * Creates a content processor with caching
 */
export function createContentProcessor({
  pluginManager,
  fileSystem,
  events,
}: {
  pluginManager: PluginManager;
  fileSystem: FileSystemOps;
  events: EventSystem;
}): ContentProcessor {
  // Cache of processed content
  const contentCache = new Map<string, ContentFile>();

  return {
    /**
     * Process a file from the filesystem
     */
    async processFile(filePath: string): Promise<ContentFile> {
      try {
        // Check cache
        if (contentCache.has(filePath)) {
          return contentCache.get(filePath)!;
        }

        // Read file
        const content = await fileSystem.readFile(filePath);

        // Process content
        const result = await this.processContent(content, filePath);

        // Cache result
        contentCache.set(filePath, result);

        // Emit event
        events.emit('content:processed', result, filePath);

        return result;
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        throw error;
      }
    },

    /**
     * Process content string
     */
    async processContent(content: string, filePath: string): Promise<ContentFile> {
      try {
        // Use the utility function to process the markdown
        // We use process.cwd() as a placeholder for the rootDir
        // Since we don't need route generation in this context
        const contentFile = processMarkdownString(content, filePath, process.cwd());

        // Apply plugin transformations if provided
        if (pluginManager) {
          contentFile.content = await pluginManager.executeTransform(contentFile.content);
          contentFile.html = markdownToHtml(contentFile.content);
        }

        return contentFile;
      } catch (error) {
        console.error(`Error processing content for ${filePath}:`, error);
        throw error;
      }
    },

    /**
     * Get processed content from cache
     */
    getProcessedContent(filePath: string): ContentFile | null {
      return contentCache.get(filePath) || null;
    },
  };
}

/**
 * Creates a layout manager that handles theme layouts
 */
export function createLayoutManager({
  themeManager,
  events,
}: {
  themeManager: ThemeManager;
  events: EventSystem;
}) {
  // Use themeManager to prevent unused variable warning
  const themeName = themeManager ? themeManager.getActiveTheme?.() || 'default' : 'default';
  // The active theme name
  let activeTheme = themeName;

  // Helper function for navigation
  function renderNavLinks(navItems: Array<{ label: string; url: string }>) {
    return navItems.map(item => `<a href="${item.url}">${item.label}</a>`).join('\n');
  }

  return {
    /**
     * Get the appropriate layout for content based on frontmatter
     */
    getLayoutForContent(content: ContentFile): string {
      const defaultLayout = 'default';
      
      if (!content.frontmatter) {
        return defaultLayout;
      }

      // If frontmatter specifies a layout, use that
      if (content.frontmatter.layout) {
        return content.frontmatter.layout;
      }

      return defaultLayout;
    },

    /**
     * Render content with appropriate layout
     */
    async renderWithLayout(content: ContentFile): Promise<string> {
      if (!content.html) {
        throw new Error(`No HTML content available for ${content.path}`);
      }

      // TODO: Implement actual React server-side rendering
      // For now, return a simple HTML template
      const pageTitle = content.frontmatter.title || 'Untitled';
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | ${activeTheme}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="app">
    <div class="layout">
      <header>
        <h1>${activeTheme}</h1>
        <nav>${renderNavLinks([])}</nav>
      </header>
      <main>
        <div class="content">
          ${content.html}
        </div>
      </main>
      <footer>
        <p>&copy; ${new Date().getFullYear()} ${activeTheme}</p>
      </footer>
    </div>
  </div>
  <script src="/app.js"></script>
</body>
</html>`;

      events.emit('content:rendered', content, html);

      return html;
    },

    renderLayout(content: any, frontmatter: any): string {
      try {
        const pageTitle = frontmatter?.title || 'Untitled';
        const navItems = frontmatter?.navigation || [];
        
        // Basic template as fallback
        return `
<!DOCTYPE html>
<html>
<head>
  <title>${pageTitle} | BunPress</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow: auto; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <header>
    <nav>${renderNavLinks(navItems)}</nav>
  </header>
  <div class="container">${content}</div>
</body>
</html>`;
      } catch (error) {
        console.error('Error rendering layout:', error);
        return content;
      }
    },
  };
}

/**
 * Creates a renderer that processes and renders content
 */
export function createRenderer({
  contentProcessor,
  layoutManager,
  events,
}: {
  contentProcessor: ContentProcessor;
  layoutManager: LayoutManager;
  events: EventSystem;
}): Renderer {
  return {
    /**
     * Render a file to HTML
     */
    async renderFile(filePath: string): Promise<string> {
      // Process the file
      const contentFile = await contentProcessor.processFile(filePath);

      // Render with layout
      return layoutManager.renderWithLayout(contentFile);
    },

    /**
     * Render a file to an output path
     */
    async renderToOutput(filePath: string, outputPath: string): Promise<boolean> {
      try {
        // Render the file
        const html = await this.renderFile(filePath);

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.promises.mkdir(outputDir, { recursive: true });

        // Write to output
        await fs.promises.writeFile(outputPath, html);

        events.emit('file:rendered', filePath, outputPath);

        return true;
      } catch (error) {
        console.error(`Error rendering ${filePath} to ${outputPath}:`, error);
        return false;
      }
    },

    /**
     * Render all content from a directory to an output directory
     */
    async renderAllContent(contentDir: string, outputDir: string): Promise<string[]> {
      // Find all markdown files
      const files = await fs.promises.readdir(contentDir, { withFileTypes: true });
      const markdownFiles = files
        .filter(file => file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx')))
        .map(file => path.join(contentDir, file.name));

      const outputFiles: string[] = [];

      // Render each file
      for (const file of markdownFiles) {
        const relativePath = path.relative(contentDir, file);
        const outputPath = path.join(outputDir, relativePath.replace(/\.mdx?$/, '.html'));

        if (await this.renderToOutput(file, outputPath)) {
          outputFiles.push(outputPath);
        }
      }

      events.emit('content:allRendered', outputFiles);

      return outputFiles;
    },
  };
}

// Export the slot system functionality
export const slotSystem = createSlotSystem;

// Basic i18n implementation placeholder
export const i18n = () => {
  const translations: Record<string, Record<string, string>> = {};
  let currentLocale = 'en';
  
  return {
    t: (key: string) => {
      const translation = translations[currentLocale]?.[key];
      if (!translation) return key;
      
      return translation;
    },

    setLanguage: (lang: string) => {
      // TODO: Implement language switching
      console.log(`Setting language to ${lang}`);
    },

    getLanguage: () => {
      // TODO: Implement language detection
      return 'en';
    },
  };
};

// Export a renderer object with methods for backward compatibility
export const renderContent = async () => {
  return {
    render: (markdown: string, options?: { highlightCode?: boolean }) => {
      // Simple markdown-like rendering
      let html = markdown;
      
      // Process code blocks first (before paragraph processing)
      if (options?.highlightCode) {
        html = html.replace(/```(\w+)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      } else {
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
      }
      
      // Process headings
      html = html.replace(/^# (.*?)$/gm, '<h1 id="$1">$1</h1>');
      html = html.replace(/^## (.*?)$/gm, '<h2 id="$1">$1</h2>');
      html = html.replace(/^### (.*?)$/gm, '<h3 id="$1">$1</h3>');
      
      // Process paragraphs - but not inside code blocks
      html = html.replace(/^(?!<h[1-6]|<pre|<ul|<ol|<p)(.+)$/gm, '<p>$1</p>');
      
      // Process emphasis and links
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/`(.*?)`/g, '<code>$1</code>');
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
      
      return html;
    },

    extractFrontmatter: (markdown: string) => {
      const frontmatterRegex = /^---\s+([\s\S]*?)\s+---\s*([\s\S]*)$/;
      const match = markdown.match(frontmatterRegex);

      if (!match) {
        return { frontmatter: {}, content: markdown };
      }

      const [, frontmatterYaml, content] = match;
      const frontmatter: Record<string, any> = {};

      // Simple YAML parsing
      frontmatterYaml.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          const valueStr = valueParts.join(':').trim();
          
          // Basic type conversions
          if (valueStr === 'true') {
            frontmatter[key.trim()] = true;
          } else if (valueStr === 'false') {
            frontmatter[key.trim()] = false;
          } else if (!isNaN(Number(valueStr))) {
            frontmatter[key.trim()] = Number(valueStr);
          } else {
            frontmatter[key.trim()] = valueStr;
          }
        }
      });

      return { frontmatter, content: content.trim() };
    },

    extractTOC: (html: string) => {
      const headings: { id: string; text: string; level: number }[] = [];
      const headingRegex = /<h(\d+) id="([^"]+)">([^<]+)<\/h\1>/g;
      
      let match;
      while ((match = headingRegex.exec(html)) !== null) {
        const [, level, id, text] = match;
        headings.push({
          id,
          text,
          level: Number(level)
        });
      }

      return headings;
    }
  };
};
