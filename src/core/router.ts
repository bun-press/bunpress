import { readdirSync, statSync } from 'fs';
import path from 'path';
import { ContentProcessor, ContentFile, processMarkdownContent } from './content-processor';
import { DefaultPluginManager } from './plugin';

interface Routes {
  [key: string]: ContentFile;
}

// Use the synchronous version for now since we're transitioning to async
export function generateRoutes(pagesDir: string): Routes {
  const routes: Routes = {};
  
  // Helper function to process files recursively
  function processDirectory(directory: string) {
    const files = readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        processDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        // Process markdown files using the synchronous version for now
        const contentFile = processMarkdownContent(filePath, pagesDir);
        routes[contentFile.route] = contentFile;
      }
    }
  }
  
  // Start processing from the pages directory
  processDirectory(pagesDir);
  
  return routes;
}

// Async version for future use
export async function generateRoutesAsync(pagesDir: string): Promise<Routes> {
  const routes: Routes = {};
  const processor = new ContentProcessor({ plugins: new DefaultPluginManager() });
  
  // Helper function to process files recursively
  async function processDirectory(directory: string) {
    const files = readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        // Process markdown files with plugin support
        const contentFile = await processor.processMarkdownContent(filePath, pagesDir);
        routes[contentFile.route] = contentFile;
      }
    }
  }
  
  // Start processing from the pages directory
  await processDirectory(pagesDir);
  
  return routes;
} 