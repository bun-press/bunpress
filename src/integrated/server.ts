/**
 * BunPress Integrated server Module
 *
 * This file consolidates related functionality from:
 * dev-server.ts, fullstack-server.ts, hmr.ts
 */

// Export from consolidated modules

export * from '../core/dev-server';
export * from '../core/fullstack-server';
export * from '../core/hmr';

/**
 * Integrated server implementation for BunPress
 *
 * This file provides the implementation for the fullstack server that handles
 * both static file serving and dynamic API routes.
 */

import { serve } from 'bun';
import type { Server as BunServer } from 'bun';
import path from 'path';
import fs from 'fs';
import type { PluginManager } from '../core/plugin';
import type { BunPressConfig } from '../../bunpress.config';
import type { Renderer, EventSystem, FileSystemOps } from './rendering';
import type { WebSocketServer, WebSocket as WSType } from 'ws';

// Interface for the server configuration
export interface FullstackServerConfig {
  fileSystem: FileSystemOps;
  config: BunPressConfig;
  pluginManager: PluginManager;
  events: EventSystem;
  renderer: Renderer;
}

// Interface for the fullstack server
export interface Server {
  start(options?: { port?: number; host?: string }): Promise<{ port: number; host: string }>;
  stop(): Promise<void>;
  dev(options?: {
    port?: number;
    host?: string;
    hmrPort?: number;
    hmrHost?: string;
    open?: boolean;
  }): Promise<{ port: number; host: string; hmrPort: number; hmrHost: string }>;
  isRunning(): boolean;
}

/**
 * Creates a fullstack server for BunPress
 */
export function createFullstackServer({
  renderer,
  config,
  pluginManager,
  events,
}: {
  renderer: any;
  config: any;
  pluginManager: any;
  events: any;
}) {
  // Server instance
  let server: BunServer | null = null;
  let hmrServer: WebSocketServer | null = null;

  // HMR connections
  const hmrConnections = new Set<WSType>();

  return {
    /**
     * Start the server in production mode
     */
    async start(options?: {
      port?: number;
      host?: string;
    }): Promise<{ port: number; host: string }> {
      const port = options?.port || config.devServer?.port || 3000;
      const host = options?.host || config.devServer?.host || 'localhost';

      // Emit event
      events.emit('server:starting', { port, host });

      // Allow plugins to configure server
      await pluginManager.executeConfigureServer({ port, host });

      // Create server
      server = serve({
        port,
        hostname: host,
        async fetch(req) {
          const url = new URL(req.url);
          const pathname = url.pathname;

          // Handle API routes
          if (pathname.startsWith('/api/')) {
            return await handleApiRoute(req, pathname);
          }

          // Handle static files
          return await handleStaticFile(req, pathname);
        },
      });

      // Emit event
      events.emit('server:started', { port, host });

      console.log(`Server started on http://${host}:${port}`);

      return { port, host };
    },

    /**
     * Stop the server
     */
    async stop(): Promise<void> {
      if (server) {
        // Emit event
        events.emit('server:stopping');

        // Close HMR server if running
        if (hmrServer) {
          await new Promise<void>(resolve => {
            hmrServer?.close(() => {
              hmrServer = null;
              resolve();
            });
          });

          // Clear connections
          hmrConnections.clear();
        }

        // Close main server
        server.stop();
        server = null;

        // Emit event
        events.emit('server:stopped');

        console.log('Server stopped');
      }
    },

    /**
     * Start the development server with HMR
     */
    async dev(options?: {
      port?: number;
      host?: string;
      hmrPort?: number;
      hmrHost?: string;
      open?: boolean;
    }): Promise<{ port: number; host: string; hmrPort: number; hmrHost: string }> {
      const port = options?.port || config.devServer?.port || 3000;
      const host = options?.host || config.devServer?.host || 'localhost';
      const hmrPort = options?.hmrPort || config.devServer?.hmrPort || 3001;
      const hmrHost = options?.hmrHost || config.devServer?.hmrHost || 'localhost';

      // Emit event
      events.emit('server:dev:starting', { port, host, hmrPort, hmrHost });

      // Allow plugins to configure server
      await pluginManager.executeConfigureServer({ port, host, hmrPort, hmrHost });

      // Set up file watcher
      const { watch } = await import('fs');
      const contentDir = config.contentDir || config.pagesDir;

      if (contentDir) {
        console.log(`Watching directory: ${contentDir}`);
        watch(contentDir, { recursive: true }, async (eventType, filename) => {
          if (filename) {
            console.log(`File changed (${eventType}): ${path.join(contentDir, filename)}`);
            // ... rest of the code
          }
        });
      }

      // Start HMR server
      const WebSocket = await import('ws');
      hmrServer = new WebSocket.WebSocketServer({ port: hmrPort });

      hmrServer.on('connection', (socket: WSType) => {
        // Add to connections
        hmrConnections.add(socket);

        // Remove on close
        socket.on('close', () => {
          hmrConnections.delete(socket);
        });

        // Send welcome message
        socket.send(
          JSON.stringify({
            type: 'connected',
            timestamp: Date.now(),
          })
        );
      });

      // Create main server for development
      server = serve({
        port,
        hostname: host,
        async fetch(req) {
          const url = new URL(req.url);
          const pathname = url.pathname;

          // HMR client script
          if (pathname === '/__hmr') {
            return new Response(createHmrClientScript(hmrPort, hmrHost), {
              headers: { 'Content-Type': 'application/javascript' },
            });
          }

          // Handle API routes
          if (pathname.startsWith('/api/')) {
            return await handleApiRoute(req, pathname);
          }

          // For content pages, try to render from content
          if (pathname.endsWith('.html') || pathname === '/' || !pathname.includes('.')) {
            try {
              // Normalize path to find the corresponding markdown file
              const normalizedPath = pathname === '/' ? '/index' : pathname;
              const mdPath = path.join(contentDir, `${normalizedPath.replace(/\.html$/, '')}.md`);

              // Check if file exists
              try {
                await fs.promises.access(mdPath);
              } catch {
                // Try MDX
                const mdxPath = mdPath.replace(/\.md$/, '.mdx');
                try {
                  await fs.promises.access(mdxPath);
                } catch {
                  // Not found, continue to static file handling
                  return await handleStaticFile(req, pathname);
                }
              }

              // Render the content
              const html = await renderer.renderFile(mdPath);

              // Inject HMR client
              const htmlWithHmr = html.replace('</head>', `<script src="/__hmr"></script></head>`);

              return new Response(htmlWithHmr, {
                headers: { 'Content-Type': 'text/html' },
              });
            } catch (error) {
              console.error('Error rendering page:', error);
            }
          }

          // Handle static files
          return await handleStaticFile(req, pathname);
        },
      });

      // Emit event
      events.emit('server:dev:started', { port, host, hmrPort, hmrHost });

      console.log(`Dev server started on http://${host}:${port}`);
      console.log(`HMR server running on ws://${hmrHost}:${hmrPort}`);

      // Open browser if requested
      if (options?.open) {
        try {
          const { default: open } = await import('open');
          await open(`http://${host}:${port}`);
        } catch (error) {
          console.warn("Couldn't open browser automatically. The 'open' package may not be installed.");
          console.log(`Please open http://${host}:${port} in your browser manually.`);
        }
      }

      return { port, host, hmrPort, hmrHost };
    },

    /**
     * Check if the server is running
     */
    isRunning(): boolean {
      return server !== null;
    },
  };

  /**
   * Handle API route requests
   */
  async function handleApiRoute(req: Request, pathname: string): Promise<Response> {
    // Get API directory
    const apiDir = path.join(process.cwd(), 'api');

    // Normalize path to find the corresponding API file
    const apiPath = pathname.replace(/^\/api/, '');
    const jsPath = path.join(apiDir, `${apiPath}.js`);
    const tsPath = path.join(apiDir, `${apiPath}.ts`);

    // Check which file exists
    let apiFilePath;
    try {
      await fs.promises.access(jsPath);
      apiFilePath = jsPath;
    } catch {
      try {
        await fs.promises.access(tsPath);
        apiFilePath = tsPath;
      } catch {
        // API route not found
        return new Response('API route not found', { status: 404 });
      }
    }

    try {
      // Import API handler
      const apiModule = await import(apiFilePath);
      const handler = apiModule.default;

      if (typeof handler !== 'function') {
        return new Response('API handler must export a default function', { status: 500 });
      }

      // Call handler
      return await handler(req);
    } catch (error) {
      console.error(`Error handling API route ${pathname}:`, error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Handle static file requests
   */
  async function handleStaticFile(req: Request, pathname: string): Promise<Response> {
    // Log the request for debugging
    console.log(`Static file request: ${req.method} ${pathname}`);
    // Check public directory first
    const publicDir = path.join(process.cwd(), 'public');
    const staticPath = path.join(publicDir, pathname);

    try {
      // Check if file exists
      await fs.promises.access(staticPath);

      // Read file
      const data = await fs.promises.readFile(staticPath);

      // Determine content type
      const contentType = getContentType(staticPath);

      return new Response(data, {
        headers: { 'Content-Type': contentType },
      });
    } catch {
      // File not found
      return new Response('Not Found', { status: 404 });
    }
  }

  /**
   * Get content type based on file extension
   */
  function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.md': 'text/markdown',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'font/otf',
      '.xml': 'application/xml',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Create HMR client script
   */
  function createHmrClientScript(hmrPort: number, hmrHost: string): string {
    return `
    // BunPress HMR Client
    (function() {
      const socket = new WebSocket('ws://${hmrHost}:${hmrPort}');
      let connected = false;
      
      socket.addEventListener('open', () => {
        console.log('[HMR] Connected');
        connected = true;
      });
      
      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'update') {
          console.log('[HMR] File updated:', data.path);
          window.location.reload();
        }
      });
      
      socket.addEventListener('close', () => {
        console.log('[HMR] Disconnected');
        connected = false;
        
        // Try to reconnect
        setTimeout(() => {
          console.log('[HMR] Attempting to reconnect...');
          window.location.reload();
        }, 2000);
      });
      
      // Keep-alive ping
      setInterval(() => {
        if (connected) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    })();
    `;
  }
}
