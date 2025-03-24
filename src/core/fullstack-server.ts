/**
 * Fullstack development server with HTML import routes for BunPress
 * 
 * This module implements support for HTML imports as routes for the Bun.serve API,
 * enabling fullstack capabilities in BunPress sites.
 */

import type { Server, ServerWebSocket } from 'bun';
import { resolve, join, dirname } from 'path';
import { existsSync } from 'fs';

export interface RouteHandler {
  pattern: string | RegExp;
  handler: (req: Request, match: RegExpMatchArray | null) => Response | Promise<Response>;
}

export interface FullstackServerConfig {
  port?: number;
  hostname?: string;
  development?: boolean;
  htmlDir: string;
  apiDir?: string;
  publicDir?: string;
  routes?: RouteHandler[];
  websocketHandler?: (ws: ServerWebSocket) => void;
  notFoundHandler?: (req: Request) => Response | Promise<Response>;
}

/**
 * Default 404 handler for the fullstack server.
 */
function defaultNotFoundHandler(req: Request): Response {
  return new Response(`Not found: ${req.url}`, {
    status: 404,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

/**
 * Creates a fullstack server that supports HTML imports as routes.
 */
export function createFullstackServer(config: FullstackServerConfig): Server {
  const {
    port = 3000,
    hostname = 'localhost',
    development = true,
    htmlDir,
    apiDir,
    publicDir,
    routes = [],
    websocketHandler,
    notFoundHandler = defaultNotFoundHandler
  } = config;

  const htmlDirPath = resolve(htmlDir);
  const apiDirPath = apiDir ? resolve(apiDir) : null;
  const publicDirPath = publicDir ? resolve(publicDir) : null;

  // Function to serve HTML files
  async function serveHtml(path: string): Promise<Response | null> {
    const filePath = join(htmlDirPath, path.endsWith('/') ? `${path}index.html` : path);
    
    if (!existsSync(filePath)) {
      return null;
    }

    const file = Bun.file(filePath);
    const content = await file.text();
    
    const processedHtml = await processHtmlImports(content, dirname(filePath));
    
    return new Response(processedHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  // Function to serve static files
  function serveStatic(path: string): Response | null {
    if (!publicDirPath) {
      return null;
    }

    const filePath = join(publicDirPath, path);
    
    if (!existsSync(filePath)) {
      return null;
    }

    const file = Bun.file(filePath);
    return new Response(file);
  }

  // Function to handle API routes
  async function handleApiRoute(path: string, req: Request): Promise<Response | null> {
    if (!apiDirPath) {
      return null;
    }

    // Remove /api prefix
    const apiPath = path.startsWith('/api/') ? path.slice(4) : path;
    
    try {
      // Try to import the API handler
      const modulePath = join(apiDirPath, `${apiPath}.ts`);
      
      if (!existsSync(modulePath)) {
        return null;
      }
      
      const module = await import(`file://${modulePath}`);
      const handler = module.default;

      if (typeof handler !== 'function') {
        return new Response('API handler must export a default function', { status: 500 });
      }

      return await handler(req);
    } catch (error) {
      console.error(`Error handling API route ${path}:`, error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Process HTML imports in HTML content
  async function processHtmlImports(html: string, basePath: string): Promise<string> {
    let result = html;
    let imports: { tag: string; src: string }[] = [];

    // Use HTMLRewriter to scan for custom imports
    const rewriter = new HTMLRewriter();
    rewriter.on('import-html', {
      element(el: any) {
        const src = el.getAttribute('src');
        if (src) {
          imports.push({ tag: el.tagName, src });
        }
      }
    });

    await rewriter.transform(new Response(html)).text();

    // Process found imports
    for (const imp of imports) {
      const importPath = join(basePath, imp.src);
      
      if (existsSync(importPath)) {
        const importContent = await Bun.file(importPath).text();
        // Replace the import tag with the content
        const importTag = `<${imp.tag} src="${imp.src}"></${imp.tag}>`;
        result = result.replace(importTag, importContent);
      }
    }

    return result;
  }

  // Create and return the Bun server
  return Bun.serve({
    port,
    hostname,
    development,
    fetch: async (req) => {
      const url = new URL(req.url);
      const path = url.pathname;

      // 1. Check custom route handlers first
      for (const route of routes) {
        const pattern = route.pattern instanceof RegExp 
          ? route.pattern 
          : new RegExp(`^${route.pattern.replace(/\//g, '\\/').replace(/\*/g, '.*')}$`);
        
        const match = path.match(pattern);
        if (match) {
          try {
            return await route.handler(req, match);
          } catch (error) {
            console.error('Error in custom route handler:', error);
            return new Response('Error in custom route handler', { status: 500 });
          }
        }
      }

      // 2. Try to serve as API route if it starts with /api
      if (path.startsWith('/api/')) {
        const apiResponse = await handleApiRoute(path, req);
        if (apiResponse) {
          return apiResponse;
        }
      }

      // 3. Try to serve as static file
      const staticResponse = serveStatic(path);
      if (staticResponse) {
        return staticResponse;
      }

      // 4. Try to serve as HTML file
      const htmlResponse = await serveHtml(path);
      if (htmlResponse) {
        return htmlResponse;
      }

      // 5. Return 404 if no handler matched
      return notFoundHandler(req);
    },
    websocket: websocketHandler
      ? {
          message: websocketHandler,
        }
      : undefined,
  });
}

/**
 * Create middleware for the fullstack server
 */
export function createMiddleware(handler: (req: Request, next: () => Promise<Response>) => Promise<Response>) {
  return async (req: Request, next: () => Promise<Response>) => {
    return await handler(req, next);
  };
} 