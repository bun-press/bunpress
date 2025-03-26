/**
 * Router Example - Demonstrating the router-utils in a server implementation
 * This example shows how to implement a server with centralized routing
 */

import { serve } from 'bun';
import { join } from 'path';
import { 
  createRouter, 
  Router, 
  RouteHandler, 
  buildMiddlewareChain,
  getContentTypeFromExtension
} from '../lib/route-utils';
import { EventEmitter } from 'events';

/**
 * Example server configuration
 */
interface ExampleServerConfig {
  port: number;
  host: string;
  publicDir: string;
  apiDir: string;
  development: boolean;
}

/**
 * Example server implementation using the centralized Router
 */
export class RouterExampleServer {
  private server: ReturnType<typeof serve> | null = null;
  private router: Router;
  private events: EventEmitter;
  private config: ExampleServerConfig;

  constructor(config: Partial<ExampleServerConfig> = {}) {
    // Set up default configuration
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost',
      publicDir: config.publicDir || 'public',
      apiDir: config.apiDir || 'api',
      development: config.development || false
    };

    this.events = new EventEmitter();
    
    // Initialize router with options
    this.router = createRouter({
      trailingSlash: false,
      basePath: '',
      globalMiddleware: [
        // Example logging middleware
        async (req, next) => {
          console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
          const start = Date.now();
          const response = await next();
          const duration = Date.now() - start;
          console.log(`Completed in ${duration}ms with status ${response.status}`);
          return response;
        }
      ]
    });

    // Set up routes
    this.setupRoutes();
  }

  /**
   * Set up routes for the server
   */
  private setupRoutes() {
    // API routes group
    this.router.group('/api', (router) => {
      // Example API endpoint
      router.get('/hello', (req) => {
        return Response.json({ message: 'Hello from the router!' });
      });

      // Dynamic parameter example
      router.get('/users/:id', (req) => {
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        return Response.json({ userId: id });
      });
    });

    // Content type example
    this.router.get('/content-types', (_req) => {
      const types = {
        '.html': getContentTypeFromExtension('.html'),
        '.css': getContentTypeFromExtension('.css'),
        '.js': getContentTypeFromExtension('.js'),
        '.json': getContentTypeFromExtension('.json'),
        '.png': getContentTypeFromExtension('.png')
      };
      return Response.json(types);
    });

    // Static file handling
    this.router.addRoute('/*', this.router.createStaticFileHandler(this.config.publicDir, {
      cacheControl: {
        'image/*': 'public, max-age=86400',
        'text/css': 'public, max-age=86400',
        'application/javascript': 'public, max-age=86400',
        'text/html': 'no-cache'
      }
    }));
  }

  /**
   * Start the server
   */
  public async start(): Promise<{ port: number; host: string }> {
    if (this.server) {
      return { 
        port: this.server.port, 
        host: this.config.host 
      };
    }

    // Create the server
    this.server = serve({
      port: this.config.port,
      hostname: this.config.host,
      development: this.config.development,
      
      // Use router for request handling
      fetch: async (req) => {
        // Handle the request through the router
        const response = await this.router.handleRequest(req);
        
        // Return the response or a 404
        return response || new Response('Not Found', { status: 404 });
      }
    });

    console.log(`Server running at http://${this.config.host}:${this.config.port}`);
    this.events.emit('server:started', { 
      port: this.server.port, 
      host: this.config.host 
    });

    return {
      port: this.server.port,
      host: this.config.host
    };
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
      this.events.emit('server:stopped');
      console.log('Server stopped');
    }
  }

  /**
   * Check if the server is running
   */
  public isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Get the event emitter
   */
  public getEvents(): EventEmitter {
    return this.events;
  }
}

/**
 * Create a new router example server
 */
export function createRouterExampleServer(config: Partial<ExampleServerConfig> = {}): RouterExampleServer {
  return new RouterExampleServer(config);
}

// Example usage:
if (import.meta.main) {
  const server = createRouterExampleServer({
    development: true
  });
  
  server.start().catch(console.error);
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
} 