/**
 * Server utilities shared across development and production servers
 */

/**
 * Server configuration options used by both dev and production servers
 */
export interface ServerConfig {
  port: number;
  hostname: string;
  staticDir: string;
  development?: boolean;
  hmrPort?: number;
  hmrHost?: string;
  cors?: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  } | boolean;
  open?: boolean;
  middleware?: MiddlewareHandler[];
}

/**
 * Types for server middleware and route handlers
 */
export type MiddlewareHandler = (req: Request, next: () => Promise<Response>) => Promise<Response>;
export type RouteHandler = (req: Request) => Promise<Response> | Response;

/**
 * Route definition
 */
export interface Route {
  pattern: RegExp;
  handler: RouteHandler;
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(req: Request, options: ServerConfig): Response {
  // Default CORS settings
  const defaultCors = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
    credentials: true,
    maxAge: 86400,
  };

  // Use provided CORS settings or defaults
  const corsOptions = typeof options.cors === 'object' ? options.cors : defaultCors;
  
  // Build headers
  const headers = new Headers();
  
  // Set origin
  if (typeof corsOptions.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', corsOptions.origin);
  } else if (Array.isArray(corsOptions.origin)) {
    const origin = req.headers.get('Origin');
    if (origin && corsOptions.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // Set other CORS headers
  if (corsOptions.methods) {
    headers.set('Access-Control-Allow-Methods', Array.isArray(corsOptions.methods) 
      ? corsOptions.methods.join(', ') 
      : corsOptions.methods);
  }
  
  if (corsOptions.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', Array.isArray(corsOptions.allowedHeaders) 
      ? corsOptions.allowedHeaders.join(', ') 
      : corsOptions.allowedHeaders);
  }
  
  if (corsOptions.exposedHeaders) {
    headers.set('Access-Control-Expose-Headers', Array.isArray(corsOptions.exposedHeaders) 
      ? corsOptions.exposedHeaders.join(', ') 
      : corsOptions.exposedHeaders);
  }
  
  if (corsOptions.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (corsOptions.maxAge) {
    headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
  }
  
  return new Response(null, { 
    status: 204, 
    headers
  });
}

/**
 * Determine the content type based on file extension
 */
export function getContentType(ext: string): string {
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
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };
  
  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Get cache control header value based on content type
 */
export function getCacheControl(contentType: string, cacheControlMap: Record<string, string> = {}): string | undefined {
  // Default cache control settings if none provided
  const defaultCacheControl: Record<string, string> = {
    'image/*': 'public, max-age=86400',
    'text/css': 'public, max-age=86400',
    'application/javascript': 'public, max-age=86400',
    'text/html': 'no-cache',
  };
  
  const cacheMap = Object.keys(cacheControlMap).length ? cacheControlMap : defaultCacheControl;
  
  // Look for exact match
  if (cacheMap[contentType]) {
    return cacheMap[contentType];
  }
  
  // Look for wildcard match
  for (const pattern in cacheMap) {
    if (pattern.includes('*') && matchWildcard(contentType, pattern)) {
      return cacheMap[pattern];
    }
  }
  
  return undefined;
}

/**
 * Match a content type against a wildcard pattern
 */
export function matchWildcard(contentType: string, pattern: string): boolean {
  const regexPattern = pattern.replace('*', '.*');
  return new RegExp(`^${regexPattern}$`).test(contentType);
}

/**
 * Inject HMR client script into HTML
 */
export function injectHMRScript(html: string): string {
  // Check if HMR script is already injected
  if (html.includes('__bunpress_hmr.js')) {
    return html;
  }

  // Inject before closing head tag
  return html.replace('</head>', '  <script src="/__bunpress_hmr.js"></script>\n  </head>');
}

/**
 * Check if a path should be ignored by the file watcher
 */
export function shouldIgnorePath(filepath: string, ignoredPatterns: string[] = []): boolean {
  const defaultIgnored = [
    '**/.git/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.cache/**',
  ];
  
  const patterns = [...defaultIgnored, ...ignoredPatterns];
  
  for (const pattern of patterns) {
    if (minimatch(filepath, pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Simple implementation of minimatch for path pattern matching
 */
export function minimatch(filepath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  let regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/{{GLOBSTAR}}/g, '.*');
  
  // Make sure pattern matches the entire string
  if (!regexPattern.startsWith('^')) {
    regexPattern = '^' + regexPattern;
  }
  if (!regexPattern.endsWith('$')) {
    regexPattern = regexPattern + '$';
  }
  
  // Test the filepath against the pattern
  return new RegExp(regexPattern).test(filepath);
}

/**
 * Create middleware chain executor
 */
export function createMiddlewareChain(
  middleware: MiddlewareHandler[],
  finalHandler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const executeChain = async (index = 0): Promise<Response> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index];
        return currentMiddleware(req, () => executeChain(index + 1));
      } else {
        // End of middleware chain, process request normally
        return finalHandler(req);
      }
    };
    
    return executeChain();
  };
}

/**
 * Open browser with the given URL
 */
export function openBrowser(url: string): void {
  const platform = process.platform;
  let openCommand = '';

  if (platform === 'darwin') {
    openCommand = `open "${url}"`;
  } else if (platform === 'win32') {
    openCommand = `start "${url}"`;
  } else {
    openCommand = `xdg-open "${url}"`;
  }

  Bun.spawn(['sh', '-c', openCommand]);
} 