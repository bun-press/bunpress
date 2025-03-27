/**
 * Route utilities for centralized routing management
 * Provides unified handling for routes across server implementations
 */

import { join, extname } from 'path';
import { fileExists } from './fs-utils';

/**
 * HTTP method enum
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

// Define BunRequest type to match Bun's Request interface
type BunRequest = {
  method: string;
  url: string;
  headers: Headers;
  [key: string]: any;
};

/**
 * Route handler function type
 */
export type RouteHandler = (req: BunRequest) => Promise<Response> | Response;

/**
 * Middleware handler function type
 */
export type MiddlewareHandler = (
  req: BunRequest,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Route definition interface
 */
export interface Route {
  /**
   * Route pattern as RegExp
   */
  pattern: RegExp;

  /**
   * Route handler function
   */
  handler: RouteHandler;

  /**
   * Route method (GET, POST, etc.)
   */
  method?: string | string[];

  /**
   * Route metadata
   */
  meta?: Record<string, any>;
}

/**
 * Route group for organizing routes
 */
export interface RouteGroup {
  /**
   * Group prefix
   */
  prefix: string;

  /**
   * Routes in this group
   */
  routes: Route[];

  /**
   * Middleware for this group
   */
  middleware?: MiddlewareHandler[];
}

/**
 * Router configuration options
 */
export interface RouterOptions {
  /**
   * Base path for routes
   */
  basePath?: string;

  /**
   * Global middleware applied to all routes
   */
  globalMiddleware?: MiddlewareHandler[];

  /**
   * Whether to automatically convert string patterns to RegExp
   */
  autoPatternConversion?: boolean;

  /**
   * Whether to add trailing slash to routes
   */
  trailingSlash?: boolean;

  /**
   * Whether to automatically register files from a directory
   */
  autoRegisterFiles?: boolean;

  /**
   * Directory to auto-register routes from
   */
  routesDir?: string;

  /**
   * Custom route matcher function
   */
  routeMatcher?: (req: BunRequest, route: Route) => boolean;
}

/**
 * Centralized router for managing routes
 */
export class Router {
  /**
   * All registered routes
   */
  private routes: Route[] = [];

  /**
   * Route groups
   */
  private groups: RouteGroup[] = [];

  /**
   * Router options
   */
  private routerConfig: Required<RouterOptions>;

  /**
   * Create a new router
   */
  constructor(routerOptions: RouterOptions = {}) {
    this.routerConfig = {
      basePath: routerOptions.basePath || '',
      globalMiddleware: routerOptions.globalMiddleware || [],
      autoPatternConversion: routerOptions.autoPatternConversion !== false,
      trailingSlash: routerOptions.trailingSlash || false,
      autoRegisterFiles: routerOptions.autoRegisterFiles || false,
      routesDir: routerOptions.routesDir || 'routes',
      routeMatcher: routerOptions.routeMatcher || this.defaultRouteMatcher.bind(this),
    };

    // Auto-register routes if enabled
    if (this.routerConfig.autoRegisterFiles) {
      this.registerRoutesFromDirectory(this.routerConfig.routesDir);
    }
  }

  /**
   * Default route matcher function
   */
  private defaultRouteMatcher(req: BunRequest, route: Route): boolean {
    // Check method if specified
    if (route.method) {
      const methods = Array.isArray(route.method) ? route.method : [route.method];
      if (!methods.includes(req.method)) {
        return false;
      }
    }

    // Check URL pattern
    const url = new URL(req.url);
    const pathname = this.normalizePath(url.pathname);

    return route.pattern.test(pathname);
  }

  /**
   * Normalize path according to router options
   */
  private normalizePath(path: string): string {
    let normalizedPath = path;

    // Handle base path
    if (this.routerConfig.basePath && normalizedPath.startsWith(this.routerConfig.basePath)) {
      normalizedPath = normalizedPath.slice(this.routerConfig.basePath.length);
    }

    // Ensure leading slash
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    // Handle trailing slash
    if (this.routerConfig.trailingSlash) {
      if (!normalizedPath.endsWith('/') && !normalizedPath.includes('.')) {
        normalizedPath += '/';
      }
    } else {
      if (normalizedPath.endsWith('/') && normalizedPath !== '/') {
        normalizedPath = normalizedPath.slice(0, -1);
      }
    }

    return normalizedPath;
  }

  /**
   * Convert string pattern to RegExp
   */
  private patternToRegExp(pattern: string): RegExp {
    // Escape special characters except those used as path parameters
    let regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
      .replace(/\\\*/g, '.*') // Replace \* with .*
      .replace(/\\:/g, ':'); // Restore :

    // Handle path parameters (e.g., :id)
    regexPattern = regexPattern.replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)');

    // Handle optional trailing slash
    if (this.routerConfig.trailingSlash) {
      regexPattern = regexPattern.replace(/\/$/, '/?');
    }

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Add a route to the router
   */
  public addRoute(
    pattern: RegExp | string,
    handler: RouteHandler,
    routeOptions: {
      method?: string | string[];
      meta?: Record<string, any>;
    } = {}
  ): Router {
    const routePattern =
      typeof pattern === 'string' && this.routerConfig.autoPatternConversion
        ? this.patternToRegExp(pattern)
        : pattern instanceof RegExp
          ? pattern
          : new RegExp(`^${pattern}$`);

    this.routes.push({
      pattern: routePattern,
      handler,
      method: routeOptions.method,
      meta: routeOptions.meta,
    });

    return this; // For method chaining
  }

  /**
   * Add routes for common HTTP methods
   */
  public get(pattern: RegExp | string, handler: RouteHandler, meta?: Record<string, any>): Router {
    return this.addRoute(pattern, handler, { method: 'GET', meta });
  }

  public post(pattern: RegExp | string, handler: RouteHandler, meta?: Record<string, any>): Router {
    return this.addRoute(pattern, handler, { method: 'POST', meta });
  }

  public put(pattern: RegExp | string, handler: RouteHandler, meta?: Record<string, any>): Router {
    return this.addRoute(pattern, handler, { method: 'PUT', meta });
  }

  public delete(
    pattern: RegExp | string,
    handler: RouteHandler,
    meta?: Record<string, any>
  ): Router {
    return this.addRoute(pattern, handler, { method: 'DELETE', meta });
  }

  public patch(
    pattern: RegExp | string,
    handler: RouteHandler,
    meta?: Record<string, any>
  ): Router {
    return this.addRoute(pattern, handler, { method: 'PATCH', meta });
  }

  public options(
    pattern: RegExp | string,
    handler: RouteHandler,
    meta?: Record<string, any>
  ): Router {
    return this.addRoute(pattern, handler, { method: 'OPTIONS', meta });
  }

  /**
   * Create a route group with a common prefix
   */
  public group(
    prefix: string,
    callback: (router: Router) => void,
    middleware?: MiddlewareHandler[]
  ): Router {
    // Create a temporary router for the group
    const groupRouter = new Router({
      ...this.routerConfig,
      basePath: join(this.routerConfig.basePath, prefix),
    });

    // Define routes on the group router
    callback(groupRouter);

    // Add the group
    this.groups.push({
      prefix,
      routes: groupRouter.routes,
      middleware,
    });

    return this;
  }

  /**
   * Get all routes (including those in groups)
   */
  public getAllRoutes(): Route[] {
    const allRoutes = [...this.routes];

    // Add routes from groups
    for (const group of this.groups) {
      for (const route of group.routes) {
        allRoutes.push({
          ...route,
          // Update pattern to include group prefix
          pattern: new RegExp(
            route.pattern.source.replace(/^\^/, `^${group.prefix.replace(/\//g, '\\/')}`)
          ),
        });
      }
    }

    return allRoutes;
  }

  /**
   * Handle a request using registered routes
   */
  public async handleRequest(req: BunRequest): Promise<Response | null> {
    // Apply global middleware first
    if (this.routerConfig.globalMiddleware.length > 0) {
      let index = 0;

      const next = async (): Promise<Response> => {
        if (index < this.routerConfig.globalMiddleware.length) {
          const middleware = this.routerConfig.globalMiddleware[index++];
          return await middleware(req, next);
        }

        // After all middleware, process the route
        return (await this.processRoute(req)) || new Response('Not Found', { status: 404 });
      };

      return await next();
    }

    // Process the route directly if no global middleware
    return await this.processRoute(req);
  }

  /**
   * Process a request against all routes
   */
  private async processRoute(req: BunRequest): Promise<Response | null> {
    const allRoutes = this.getAllRoutes();

    // Find the matching route
    for (const route of allRoutes) {
      if (this.routerConfig.routeMatcher(req, route)) {
        try {
          // Execute the route handler
          return await route.handler(req);
        } catch (error) {
          console.error('Error handling route:', error);
          return new Response(`Internal Server Error: ${error}`, { status: 500 });
        }
      }
    }

    return null; // No matching route
  }

  /**
   * Register routes from a directory
   */
  public registerRoutesFromDirectory(dirPath: string): Router {
    try {
      console.info(`Registering routes from ${dirPath}`);
      // Implementation left empty since this is a utility method
      // In actual implementation, we would scan the directory and register routes
      return this;
    } catch (error) {
      console.error(`Failed to register routes from directory ${dirPath}:`, error);
      return this;
    }
  }

  /**
   * Static file handler
   */
  public createStaticFileHandler(
    staticDir: string,
    staticFileOptions: {
      cacheControl?: Record<string, string>;
      compression?: boolean;
      index?: string;
    } = {}
  ): RouteHandler {
    return async (req: BunRequest): Promise<Response> => {
      const url = new URL(req.url);
      const pathname = this.normalizePath(url.pathname);

      // Default options
      const fileHandlerConfig = {
        cacheControl: staticFileOptions.cacheControl || {},
        compression: staticFileOptions.compression !== false,
        index: staticFileOptions.index || 'index.html',
      };

      // Determine file path
      let filePath = join(staticDir, pathname);

      // Check if path exists
      const pathExists = await fileExists(filePath);

      // For directories, try to serve index file
      if (pathExists && filePath.endsWith('/')) {
        filePath = join(filePath, fileHandlerConfig.index);
      }

      // Serve the file if it exists
      if (await fileExists(filePath)) {
        // Determine content type based on extension
        const ext = extname(filePath).toLowerCase();
        const contentType = getContentTypeFromExtension(ext);

        // Set up response headers
        const headers: HeadersInit = {
          'Content-Type': contentType,
        };

        // Add cache control headers if configured
        if (fileHandlerConfig.cacheControl) {
          const cacheControl = getCacheControlForContentType(
            contentType,
            fileHandlerConfig.cacheControl
          );
          if (cacheControl) {
            headers['Cache-Control'] = cacheControl;
          }
        }

        // Return the file
        return new Response(Bun.file(filePath), { headers });
      }

      // File not found
      return new Response('Not Found', { status: 404 });
    };
  }
}

/**
 * Get content type from file extension
 */
export function getContentTypeFromExtension(ext: string): string {
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
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Get cache control header based on content type
 */
export function getCacheControlForContentType(
  contentType: string,
  cacheControlMap: Record<string, string>
): string | null {
  // Check exact matches
  if (cacheControlMap[contentType]) {
    return cacheControlMap[contentType];
  }

  // Check pattern matches (e.g., image/*)
  for (const [pattern, value] of Object.entries(cacheControlMap)) {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      if (new RegExp(`^${regexPattern}$`).test(contentType)) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Create middleware chain for execution
 * with a different name to avoid conflict with server-utils
 */
export function buildMiddlewareChain(
  middleware: MiddlewareHandler[],
  finalHandler: RouteHandler
): RouteHandler {
  return async (req: BunRequest): Promise<Response> => {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++];
        return await currentMiddleware(req, next);
      }

      return await finalHandler(req);
    };

    return await next();
  };
}

/**
 * Parse URL parameters from pattern and URL
 */
export function parseParams(pattern: RegExp, url: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Convert regex pattern to string with named capture groups
  const patternStr = pattern.toString();

  // Extract parameter names from the pattern string
  const paramNames: string[] = [];
  const paramRegex = /:([a-zA-Z0-9_]+)/g;
  let match;

  while ((match = paramRegex.exec(patternStr)) !== null) {
    paramNames.push(match[1]);
  }

  // Match the URL against the pattern
  const urlMatch = url.match(pattern);

  if (urlMatch && urlMatch.length > 1) {
    // Skip the first element (full match) and map the rest to param names
    for (let i = 0; i < paramNames.length && i + 1 < urlMatch.length; i++) {
      params[paramNames[i]] = urlMatch[i + 1];
    }
  }

  return params;
}

/**
 * Create a router instance
 */
export function createRouter(options?: RouterOptions): Router {
  return new Router(options);
}
