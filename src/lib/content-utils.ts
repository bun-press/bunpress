/**
 * Content Processing Utilities
 * Provides centralized utilities for content processing operations
 */

import matter from 'gray-matter';
import { marked } from 'marked';
import { readFileAsString } from './fs-utils';
import { joinPaths, normalizePath, getRelativePath } from './path-utils';

/**
 * Table of Contents item interface
 */
export interface TocItem {
  level: number;
  id: string;
  text: string;
}

/**
 * Interface for content file with processed data
 */
export interface ContentFile {
  path: string;
  route?: string;
  content: string;
  frontmatter: Record<string, any>;
  html: string;
  toc?: TocItem[];
}

/**
 * Read and parse a markdown file
 * 
 * @param filePath Path to the markdown file
 * @returns Object containing the parsed frontmatter and content
 */
export async function readMarkdownFile(filePath: string): Promise<{ 
  frontmatter: Record<string, any>; 
  content: string; 
}> {
  // Read file content
  const fileContent = await readFileAsString(filePath);
  
  // Parse frontmatter
  const { data: frontmatter, content } = matter(fileContent);
  
  return { frontmatter, content };
}

/**
 * Convert markdown content to HTML
 * 
 * @param markdown Markdown content to convert
 * @param options Custom options for markdown conversion
 * @returns Converted HTML string
 */
export function markdownToHtml(
  markdown: string,
  options: {
    headerIds?: boolean;
    gfm?: boolean;
    breaks?: boolean;
  } = {}
): string {
  // Create marked options object with properly typed options
  const markedOptions: {
    gfm?: boolean;
    breaks?: boolean;
    [key: string]: any;
  } = {
    gfm: options.gfm !== undefined ? options.gfm : true,
    breaks: options.breaks !== undefined ? options.breaks : false
  };

  // Apply headerIds option explicitly
  if (options.headerIds !== undefined) {
    markedOptions.headerIds = options.headerIds;
  } else {
    markedOptions.headerIds = true;
  }

  // Apply options directly to the parse call
  return marked.parse(markdown, markedOptions) as string;
}

/**
 * Extract table of contents items from HTML content
 * 
 * @param html HTML content to extract TOC from
 * @param minLevel Minimum heading level to include (default: 2)
 * @param maxLevel Maximum heading level to include (default: 4)
 * @returns Array of TOC items
 */
export function extractTocItems(
  html: string, 
  minLevel: number = 2,
  maxLevel: number = 4
): TocItem[] {
  const tocItems: TocItem[] = [];
  const headingRegex = /<h([2-6])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/g;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    
    // Skip headings outside the requested range
    if (level < minLevel || level > maxLevel) {
      continue;
    }
    
    const id = match[2];
    // Simple HTML tag stripping for the text
    const text = match[3].replace(/<[^>]*>/g, '');

    tocItems.push({ level, id, text });
  }

  return tocItems;
}

/**
 * Generate a URL route from a file path
 * 
 * @param filePath Path to the content file
 * @param rootDir Root directory for relative path calculation
 * @returns URL route for the content
 */
export function generateRoute(filePath: string, rootDir: string): string {
  // Generate route from file path
  const relPath = getRelativePath(filePath, rootDir);
  const withoutExtension = relPath.replace(/\.(md|mdx)$/, '');

  // Convert to URL path (handle index files specially)
  let route = normalizePath(withoutExtension);
  
  // Special handling for index files
  if (route.endsWith('/index')) {
    route = route.replace(/\/index$/, '');
  }
  
  // Special handling for root index
  if (route === 'index') {
    route = '/';
  } else if (!route.startsWith('/')) {
    route = `/${route}`;
  }

  return route;
}

/**
 * Process a markdown file into a ContentFile
 * 
 * @param filePath Path to the markdown file
 * @param rootDir Root directory for relative path calculation
 * @param extractToc Whether to extract table of contents (default: true)
 * @returns Processed ContentFile object
 */
export async function processMarkdownFileSync(
  filePath: string, 
  rootDir: string,
  extractToc: boolean = true
): Promise<ContentFile> {
  // Read and parse the markdown file
  const { frontmatter, content } = await readMarkdownFile(filePath);
  
  // Convert to HTML
  const html = markdownToHtml(content);
  
  // Generate route
  const route = generateRoute(filePath, rootDir);
  
  // Create the content file object
  const contentFile: ContentFile = {
    path: filePath,
    route,
    content,
    frontmatter,
    html
  };
  
  // Extract TOC if requested
  if (extractToc) {
    contentFile.toc = extractTocItems(html);
  }
  
  return contentFile;
}

/**
 * Process a markdown string into a ContentFile
 * 
 * @param markdown Markdown string to process
 * @param filePath Virtual path for the content (used for route generation)
 * @param rootDir Root directory for relative path calculation
 * @param extractToc Whether to extract table of contents (default: true)
 * @returns Processed ContentFile object
 */
export function processMarkdownString(
  markdown: string,
  filePath: string,
  rootDir: string,
  extractToc: boolean = true
): ContentFile {
  // Parse frontmatter
  const { data: frontmatter, content } = matter(markdown);
  
  // Convert to HTML
  const html = markdownToHtml(content);
  
  // Generate route
  const route = generateRoute(filePath, rootDir);
  
  // Create the content file object
  const contentFile: ContentFile = {
    path: filePath,
    route,
    content,
    frontmatter,
    html
  };
  
  // Extract TOC if requested
  if (extractToc) {
    contentFile.toc = extractTocItems(html);
  }
  
  return contentFile;
} 