/**
 * Fullstack Server Implementation
 * For use in both development and production
 */

import { Server, ServerWebSocket } from 'bun';
import path from 'path';
import chalk from 'chalk';
import { EventEmitter } from 'events';
import * as fs from 'fs';

import {
  ServerConfig,
  MiddlewareHandler,
  handleCORS,
} from '../lib/server-utils';

import {
  Route,
  RouteHandler,
} from '../lib/route-utils';

// Server options extending the base ServerConfig
export interface ServerOptions extends ServerConfig {
  apiDir?: string;
  compression?: boolean;
  cacheControl?: {
    [key: string]: string;
  };
  onError?: (error: Error, req: Request) => Response;
}

// Interface definition 
export interface IFullstackServer {
  start: (options?: Partial<ServerOptions>) => Promise<{ port: number; host: string }>;
  stop: () => Promise<void>;
  dev: (options?: Partial<ServerOptions>) => Promise<{ port: number; host: string; hmrPort?: number; hmrHost?: string }>;
  isRunning: () => boolean;
  addRoute: (pattern: RegExp | string, handler: RouteHandler) => void;
  addMiddleware: (handler: MiddlewareHandler) => void;
  getServer: () => Server | null;
  events: EventEmitter;
}

interface PluginManager {
  executeConfigureServer: (options: any) => Promise<any>;
}

// Implementation class
export class FullstackServer implements IFullstackServer {
  private server: Server | null = null;
  private routes: Route[] = [];
  private middleware: MiddlewareHandler[] = [];
  private options: ServerOptions = {
    port: 3000,
    hostname: 'localhost',
    staticDir: 'public',
    apiDir: 'api',
    development: false,
    hmrPort: 3030,
    hmrHost: 'localhost',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: [],
      credentials: true,
      maxAge: 86400,
    },
    compression: true,
    cacheControl: {
      'image/*': 'public, max-age=86400',
      'text/css': 'public, max-age=86400',
      'application/javascript': 'public, max-age=86400',
      'text/html': 'no-cache',
    },
    onError: (error: Error, _req: Request) => {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  };
  private pluginManager: PluginManager;
  public events: EventEmitter;
  private connections: Set<ServerWebSocket<unknown>> = new Set();

  constructor(options: { pluginManager: PluginManager; events: EventEmitter; config: any }) {
    this.pluginManager = options.pluginManager;
    this.events = options.events;
    
    // Initialize with config
    if (options.config.devServer) {
      this.options = {
        ...this.options,
        port: options.config.devServer.port || this.options.port,
        hostname: options.config.devServer.host || this.options.hostname,
        staticDir: options.config.publicDir || this.options.staticDir,
        hmrPort: options.config.devServer.hmrPort || this.options.hmrPort,
        hmrHost: options.config.devServer.hmrHost || this.options.hmrHost,
      };
    }
  }

  /**
   * Adds a route to the server
   */
  public addRoute(pattern: RegExp | string, handler: RouteHandler): void {
    if (typeof pattern === 'string') {
      // Convert string pattern to regex
      const regexPattern = new RegExp(`^${pattern.replace(/\//g, '\\/').replace(/\*/g, '.*')}$`);
      this.routes.push({
        pattern: regexPattern,
        handler,
      });
    } else {
      this.routes.push({
        pattern,
        handler,
      });
    }
  }

  /**
   * Adds middleware to the server
   */
  public addMiddleware(handler: MiddlewareHandler): void {
    this.middleware.push(handler);
  }

  /**
   * Starts the server with provided options
   */
  public async start(options: Partial<ServerOptions> = {}): Promise<{ port: number; host: string }> {
    if (this.server) {
      await this.stop();
    }

    // Merge options
    this.options = {
      ...this.options,
      ...options,
    };

    // Apply plugin modifications to server options
    this.options = await this.pluginManager.executeConfigureServer(this.options);

    // Set up the request handler
    const requestHandler = async (request: Request): Promise<Response> => {
      // Extract URL and path
      const url = new URL(request.url);
      const reqPath = decodeURIComponent(url.pathname);
      
      // Apply CORS if enabled
      if (this.options.cors && request.method === 'OPTIONS') {
        return this.handleCORS(request);
      }
      
      // Create middleware chain
      const middlewareChain = async (index = 0): Promise<Response> => {
        if (index < this.middleware.length) {
          const currentMiddleware = this.middleware[index];
          return currentMiddleware(request, () => middlewareChain(index + 1));
        } else {
          // End of middleware chain, process request normally
          return this.handleRequest(request, reqPath);
        }
      };
      
      try {
        return await middlewareChain();
      } catch (error) {
        if (this.options.onError) {
          return this.options.onError(error as Error, request);
        }
        console.error('Unhandled server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    };

    // The error handler for Bun.serve
    const errorHandler = (error: Error): Response => {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    };

    // Start server
    this.server = Bun.serve({
      port: this.options.port,
      hostname: this.options.hostname,
      fetch: requestHandler,
      error: errorHandler,
      development: this.options.development,
      websocket: {
        open: (ws: ServerWebSocket<unknown>) => {
          this.connections.add(ws);
        },
        close: (ws: ServerWebSocket<unknown>) => {
          this.connections.delete(ws);
        },
        message: (ws: ServerWebSocket<unknown>, message: any) => {
          this.events.emit('ws:message', message, ws);
        },
      },
    });

    const info = { 
      port: this.server?.port || this.options.port || 3000, 
      host: this.options.hostname || 'localhost' 
    };
    
    this.events.emit('server:start', info);
    
    console.log(chalk.green(`Server running at http://${info.host}:${info.port}`));
    
    return info;
  }
  
  /**
   * Handle CORS preflight requests
   */
  private handleCORS(req: Request): Response {
    // Use the imported handleCORS function to ensure consistent CORS handling
    return handleCORS(req, this.options);
  }
  
  /**
   * Handle individual requests after middleware processing
   */
  private async handleRequest(req: Request, reqPath: string): Promise<Response> {
    // Check for API routes first
    for (const route of this.routes) {
      if (route.pattern.test(reqPath)) {
        return await route.handler(req);
      }
    }
    
    // Then check for static files
    if (this.options.staticDir) {
      const staticPath = path.join(process.cwd(), this.options.staticDir, reqPath);
      
      // Check if file exists and serve it
      try {
        const stat = fs.statSync(staticPath);
        
        if (stat.isFile()) {
          // Determine content type based on extension
          const ext = path.extname(staticPath).toLowerCase();
          const contentType = this.getContentType(ext);
          
          // Set up response headers
          const headers: HeadersInit = {
            'Content-Type': contentType,
          };
          
          // Add cache control headers if configured
          if (this.options.cacheControl) {
            const cacheControl = this.getCacheControl(contentType);
            if (cacheControl) {
              headers['Cache-Control'] = cacheControl;
            }
          }
          
          // Add Last-Modified header
          headers['Last-Modified'] = new Date(stat.mtime).toUTCString();
          
          // Check If-Modified-Since header for caching
          const ifModifiedSince = req.headers.get('If-Modified-Since');
          if (ifModifiedSince) {
            const ifModifiedSinceDate = new Date(ifModifiedSince);
            const modifiedDate = new Date(stat.mtime);
            
            if (modifiedDate <= ifModifiedSinceDate) {
              // Return 304 Not Modified if file hasn't changed
              return new Response(null, {
                status: 304,
                headers,
              });
            }
          }
          
          // Serve file with appropriate headers
          return new Response(Bun.file(staticPath), {
            headers,
          });
        }
      } catch (err) {
        // File doesn't exist or isn't readable
      }
    }
    
    // If we get here, return 404
    return new Response('Not Found', { status: 404 });
  }
  
  /**
   * Get content type based on file extension
   */
  private getContentType(ext: string): string {
    const contentTypes: { [key: string]: string } = {
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
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'font/otf',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Get cache control header based on content type
   */
  private getCacheControl(contentType: string): string | undefined {
    if (!this.options.cacheControl) return undefined;
    
    // Try exact content type match
    if (this.options.cacheControl[contentType]) {
      return this.options.cacheControl[contentType];
    }
    
    // Try wildcard matches
    for (const [pattern, value] of Object.entries(this.options.cacheControl)) {
      if (pattern.includes('*') && this.matchWildcard(contentType, pattern)) {
        return value;
      }
    }
    
    return undefined;
  }
  
  /**
   * Match content type against wildcard pattern
   */
  private matchWildcard(contentType: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(contentType);
  }

  /**
   * Stops the server
   */
  public async stop(): Promise<void> {
    if (this.server) {
      // Close all websocket connections
      this.connections.forEach(ws => {
        ws.close();
      });
      this.connections.clear();
      
      // Stop server
      this.server.stop();
      this.server = null;
      
      this.events.emit('server:stop');
    }
  }

  /**
   * Starts the development server with HMR support
   */
  public async dev(options: Partial<ServerOptions> = {}): Promise<{ port: number; host: string; hmrPort?: number; hmrHost?: string }> {
    const developmentOptions = {
      ...options,
      development: true,
    };
    
    const serverInfo = await this.start(developmentOptions);
    
    // Add development specific info
    const info = {
      ...serverInfo,
      hmrPort: this.options.hmrPort,
      hmrHost: this.options.hmrHost,
    };
    
    this.events.emit('server:dev', info);
    
    return info;
  }

  /**
   * Checks if the server is running
   */
  public isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Returns the server instance
   */
  public getServer(): Server | null {
    return this.server;
  }
}

/**
 * Creates a new Fullstack Server
 */
export function createFullstackServer(options: { pluginManager: PluginManager; events: EventEmitter; config: any }): IFullstackServer {
  return new FullstackServer(options);
}

// Export middleware creator for backwards compatibility
export function createMiddleware(handler: MiddlewareHandler): MiddlewareHandler {
  return handler;
}
