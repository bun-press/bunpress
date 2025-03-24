import { serve, Server } from 'bun';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import type { BunPressConfig } from '../../bunpress.config';
import path from 'path';
import fs from 'fs';
import { watch } from 'fs/promises';
import { PluginManager } from './plugin';

export interface DevServerResult {
  server: Server;
  watcher: { close: () => void };
}

export function startDevServer(config: BunPressConfig, pluginManager?: PluginManager): DevServerResult {
  // Get workspace root
  const workspaceRoot = process.cwd();
  console.log(`Workspace root: ${workspaceRoot}`);
  
  // Generate initial routes
  let routes = generateRoutes(config.pagesDir);
  
  // Regenerate routes asynchronously if we have a plugin manager
  if (pluginManager) {
    generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
      routes = asyncRoutes;
      console.log('Routes generated with plugin transformations');
    });
  }
  
  // Find HTML templates in the theme directory
  const themeDir = path.join(workspaceRoot, 'themes', config.themeConfig.name);
  
  // Set up file watcher for content files using fs/promises watch
  let abortController = new AbortController();
  const watcher = {
    close: () => {
      abortController.abort();
    }
  };
  
  // Start watching the pages directory
  (async () => {
    try {
      const ac = abortController;
      for await (const event of watch(config.pagesDir, { 
        recursive: true, 
        signal: ac.signal 
      })) {
        // Only process .md and .mdx files
        if (!event.filename?.match(/\.(md|mdx)$/)) continue;
        
        console.log(`Content file changed: ${event.filename}`);
        
        // Regenerate routes
        if (pluginManager) {
          generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
            routes = asyncRoutes;
            console.log('Routes regenerated with plugin transformations');
          });
        } else {
          routes = generateRoutes(config.pagesDir);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('File watcher stopped');
      } else {
        console.error('Error watching files:', error);
      }
    }
  })();
  
  // Start the server with Bun's built-in features
  const server = serve({
    port: 3000,
    development: true, // Enable development mode for HMR and detailed errors
    
    // Use Bun's routes feature for API endpoints
    routes: {
      // Dynamic API endpoints
      "/api/routes": {
        async GET() {
          // Generate list of available routes
          const routePaths = await scanContentDirectory(config.pagesDir);
          return Response.json(routePaths);
        }
      },
      
      // Route to get processed markdown content
      "/api/content/:path*": async (req) => {
        // Get the path from params
        const pathParam = req.params["path*"];
        const fullPath = path.join(config.pagesDir, pathParam || "");
        
        try {
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Process content through plugin manager if available
            let processed = content;
            if (pluginManager) {
              // Apply content transformations through plugin manager
              processed = await pluginManager.executeTransform(content);
            }
            
            return Response.json({ content: processed });
          }
          return new Response("Content not found", { status: 404 });
        } catch (error) {
          console.error("Error processing content:", error);
          return new Response("Error processing content", { status: 500 });
        }
      }
    },
    
    // Fallback for other requests
    fetch(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;
      
      // Try to serve index.html for the root path with Bun.file for better performance
      if (pathname === '/') {
        const indexHtmlPath = path.join(themeDir, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          return new Response(Bun.file(indexHtmlPath));
        }
      }
      
      // Serve static files from public directory
      if (pathname.startsWith('/public/')) {
        const publicPath = path.join(workspaceRoot, 'public', pathname.substring(8));
        if (fs.existsSync(publicPath)) {
          return new Response(Bun.file(publicPath));
        }
      }
      
      // Serve theme assets (scripts, styles)
      if (pathname.startsWith('/scripts/') || pathname.startsWith('/styles/')) {
        const themePath = path.join(themeDir, pathname);
        if (fs.existsSync(themePath)) {
          return new Response(Bun.file(themePath));
        }
      }
      
      // Handle routes from the content files
      let routePath = pathname;
      if (pathname.endsWith('/')) {
        routePath = pathname.slice(0, -1);
      }
      if (routePath === '') {
        routePath = '/';
      }
      
      // Check if route exists
      if (routes[routePath]) {
        const html = renderHtml(routes[routePath]!, config, workspaceRoot);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      // Default 404 response
      return new Response("Not Found", { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  });
  
  console.log(`BunPress dev server running at http://localhost:3000`);
  console.log(`HMR enabled for fast development experience`);
  
  return {
    server,
    watcher,
  };
}

// Helper function to scan content directory
async function scanContentDirectory(directory: string): Promise<string[]> {
  const contentPaths: string[] = [];
  
  function scanDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
      
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        contentPaths.push(relPath);
      }
    }
  }
  
  try {
    scanDir(directory);
  } catch (error) {
    console.error("Error scanning content directory:", error);
  }
  
  return contentPaths;
} 