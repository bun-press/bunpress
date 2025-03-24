import { readFileSync } from 'fs';
import matter from 'gray-matter';
import { marked } from 'marked';
import path from 'path';
import { PluginManager, DefaultPluginManager } from './plugin';

export interface ContentFile {
  path: string;
  route: string;
  content: string;
  frontmatter: Record<string, any>;
  html: string;
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
    // Read the file
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter
    const { data: frontmatter, content } = matter(fileContent);
    
    // Apply plugin transformations to the content
    const transformedContent = await this.pluginManager.executeTransform(content);
    
    // Convert markdown to HTML - use marked.parse as string
    const html = marked.parse(transformedContent) as string;
    
    // Generate route from file path
    const relativePath = path.relative(rootDir, filePath);
    const withoutExtension = relativePath.replace(/\.(md|mdx)$/, '');
    
    // Convert to URL path (handle index files specially)
    let route = withoutExtension.replace(/\\/g, '/');
    if (route.endsWith('/index')) {
      route = route.replace(/\/index$/, '');
    }
    if (route === 'index') {
      route = '/';
    } else if (!route.startsWith('/')) {
      route = `/${route}`;
    }
    
    return {
      path: filePath,
      route,
      content: transformedContent,
      frontmatter,
      html,
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

// Maintain backward compatibility with existing code
export function processMarkdownContent(filePath: string, rootDir: string): ContentFile {
  // Create a synchronous version that doesn't use plugins
  // Read the file
  const fileContent = readFileSync(filePath, 'utf-8');
  
  // Parse frontmatter
  const { data: frontmatter, content } = matter(fileContent);
  
  // Convert markdown to HTML - use marked.parse as string
  const html = marked.parse(content) as string;
  
  // Generate route from file path
  const relativePath = path.relative(rootDir, filePath);
  const withoutExtension = relativePath.replace(/\.(md|mdx)$/, '');
  
  // Convert to URL path (handle index files specially)
  let route = withoutExtension.replace(/\\/g, '/');
  if (route.endsWith('/index')) {
    route = route.replace(/\/index$/, '');
  }
  if (route === 'index') {
    route = '/';
  } else if (!route.startsWith('/')) {
    route = `/${route}`;
  }
  
  return {
    path: filePath,
    route,
    content,
    frontmatter,
    html,
  };
} 