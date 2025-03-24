import { serve } from 'bun';
import { watch } from 'chokidar';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import type { BunPressConfig } from '../../bunpress.config';
import path from 'path';
import { statSync, readFileSync } from 'fs';
import { ContentProcessor } from './content-processor';
import { PluginManager } from './plugin';

export function startDevServer(config: BunPressConfig, pluginManager?: PluginManager) {
  // Get workspace root
  const workspaceRoot = process.cwd();
  console.log(`Workspace root: ${workspaceRoot}`);
  
  // Generate initial routes
  let routes = generateRoutes(config.pagesDir);
  
  // Create content processor with plugin manager if provided
  const processor = pluginManager ? new ContentProcessor({ plugins: pluginManager }) : undefined;
  
  // Regenerate routes asynchronously if we have a processor
  if (processor) {
    generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
      routes = asyncRoutes;
      console.log('Routes generated with plugin transformations');
    });
  }
  
  // Set up file watcher
  const watcher = watch(`${config.pagesDir}/**/*.{md,mdx}`, {
    persistent: true,
  });
  
  // Handle file changes
  watcher.on('change', (filePath) => {
    console.log(`File changed: ${filePath}`);
    if (processor) {
      generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
        routes = asyncRoutes;
        console.log('Routes regenerated with plugin transformations');
      });
    } else {
      routes = generateRoutes(config.pagesDir);
    }
  });
  
  // Handle file additions
  watcher.on('add', (filePath) => {
    console.log(`File added: ${filePath}`);
    if (processor) {
      generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
        routes = asyncRoutes;
        console.log('Routes regenerated with plugin transformations');
      });
    } else {
      routes = generateRoutes(config.pagesDir);
    }
  });
  
  // Handle file deletions
  watcher.on('unlink', (filePath) => {
    console.log(`File deleted: ${filePath}`);
    if (processor) {
      generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
        routes = asyncRoutes;
        console.log('Routes regenerated with plugin transformations');
      });
    } else {
      routes = generateRoutes(config.pagesDir);
    }
  });
  
  // Start the server
  const server = serve({
    port: 3000,
    fetch(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;
      
      // Serve static files
      if (pathname.startsWith('/public/')) {
        const publicPath = path.join('public', pathname.substring(8));
        
        try {
          const stat = statSync(publicPath);
          if (stat.isFile()) {
            const file = readFileSync(publicPath);
            const ext = path.extname(publicPath);
            let contentType = 'text/plain';
            
            // Set content type based on file extension
            if (ext === '.html') contentType = 'text/html';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.js') contentType = 'text/javascript';
            else if (ext === '.json') contentType = 'application/json';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            
            return new Response(file, {
              headers: {
                'Content-Type': contentType,
              },
            });
          }
        } catch (err) {
          // File not found or other error
        }
      }
      
      // Handle client-side routing
      let route = pathname;
      if (pathname.endsWith('/')) {
        route = pathname.slice(0, -1);
      }
      if (route === '') {
        route = '/';
      }
      
      // Check if route exists
      if (routes[route]) {
        const html = renderHtml(routes[route]!, config, workspaceRoot);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      // Route not found
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    },
  });
  
  console.log(`BunPress dev server running at http://localhost:3000`);
  
  return {
    server,
    watcher,
  };
} 