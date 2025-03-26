import { PluginManager, DefaultPluginManager } from './plugin';
import {
  readMarkdownFile,
  markdownToHtml,
  generateRoute,
  extractTocItems,
  ContentFile as ContentFileBase
} from '../lib/content-utils';

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

    // Return the processed content file
    return {
      path: filePath,
      route,
      content: transformedContent,
      frontmatter,
      html,
      toc
    };
  }

  // Methods for plugin management
  addPlugin(plugin: any) {
    this.pluginManager.addPlugin(plugin);
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
  // Use the utility function that does all the work for us
  const contentFile = await readMarkdownFile(filePath);
  const html = markdownToHtml(contentFile.content);
  const route = generateRoute(filePath, rootDir);
  const toc = extractTocItems(html);
  
  return {
    path: filePath,
    route,
    content: contentFile.content,
    frontmatter: contentFile.frontmatter,
    html,
    toc
  };
}
