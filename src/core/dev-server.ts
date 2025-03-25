import { Server, serve } from 'bun';
import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import type { BunPressConfig } from '../../bunpress.config';
import path from 'path';
import fs from 'fs';
import { watch } from 'fs/promises';
import { PluginManager } from './plugin';
import { createHmrContext, broadcastHmrUpdate, HmrContext } from './hmr';

export interface DevServerResult {
  server: Server;
  watcher: { close: () => void };
  hmrContext: HmrContext;
}

/**
 * Server configuration options
 */
interface ServerConfig {
  port: number;
  hostname: string;
  directory: string;
  hmr?: boolean;
  open?: boolean;
  cors?: boolean;
}

/**
 * Client connection for HMR
 */
interface HMRClient {
  id: string;
  ws: WebSocket;
}

/**
 * File watcher options
 */
interface WatchOptions {
  ignored?: string[];
  debounce?: number;
}

// Store connected clients
const connectedClients: HMRClient[] = [];

/**
 * Create a development server for BunPress
 *
 * @param config BunPress configuration
 * @returns Bun server instance
 */
export async function createDevServer(config: BunPressConfig): Promise<Server> {
  const devConfig = config.devServer || {};

  // Default server configuration
  const serverConfig: ServerConfig = {
    port: devConfig.port || 3000,
    hostname: devConfig.host || 'localhost',
    directory: config.outputDir,
    hmr: devConfig.hmr !== false,
    open: devConfig.open !== false,
    cors: true,
  };

  console.log(`Starting dev server at http://${serverConfig.hostname}:${serverConfig.port}`);

  // Create the server
  const server = serve({
    port: serverConfig.port,
    hostname: serverConfig.hostname,
    development: true,

    // Serve static files from the output directory
    fetch(req) {
      const url = new URL(req.url);

      // Handle HMR client script
      if (url.pathname === '/__bunpress_hmr.js') {
        return new Response(hmrClientScript, {
          headers: { 'Content-Type': 'application/javascript' },
        });
      }

      // Handle static files
      let filePath = path.join(serverConfig.directory, url.pathname);

      // Default to index.html for directory requests
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      // Check if file exists
      if (fs.existsSync(filePath)) {
        const file = Bun.file(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Inject HMR script for HTML files if HMR is enabled
        if (serverConfig.hmr && filePath.endsWith('.html')) {
          const injectedHtml = injectHMRScript(content);
          return new Response(injectedHtml, {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        return new Response(file);
      }

      // Return 404 for missing files
      return new Response('Not Found', { status: 404 });
    },

    // WebSocket handler for HMR
    websocket: {
      message(ws: any, message: any) {
        // Handle client messages
        try {
          const data = JSON.parse(message as string);

          if (data.type === 'connect') {
            // Register new client
            const clientId = data.id || Math.random().toString(36).substring(2, 10);
            connectedClients.push({ id: clientId, ws });
            console.log(`HMR client connected: ${clientId}`);
          }
        } catch (err) {
          console.error('Error processing websocket message:', err);
        }
      },

      open(_ws: any) {
        // WebSocket connection opened
      },

      close(ws: any) {
        // Remove disconnected client
        const index = connectedClients.findIndex(client => client.ws === ws);
        if (index !== -1) {
          const client = connectedClients[index];
          console.log(`HMR client disconnected: ${client.id}`);
          connectedClients.splice(index, 1);
        }
      },
    },
  });

  // Setup file watching for HMR if enabled
  if (serverConfig.hmr) {
    await setupHMR(server, config);
  }

  // Open browser if requested
  if (serverConfig.open) {
    const url = `http://${serverConfig.hostname}:${serverConfig.port}`;
    console.log(`Opening browser at ${url}`);

    // Use the appropriate open command based on platform
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

  return server;
}

/**
 * Inject HMR client script into HTML
 *
 * @param html HTML content
 * @returns HTML with HMR client script injected
 */
function injectHMRScript(html: string): string {
  // Check if HMR script is already injected
  if (html.includes('__bunpress_hmr.js')) {
    return html;
  }

  // Inject before closing head tag
  return html.replace('</head>', '  <script src="/__bunpress_hmr.js"></script>\n  </head>');
}

/**
 * Set up file watching for Hot Module Replacement
 *
 * @param server Bun server instance
 * @param config BunPress configuration
 */
export async function setupHMR(
  server: Server,
  config: BunPressConfig,
  options: WatchOptions = {}
): Promise<() => void> {
  const watchDir = config.outputDir;

  // Default options
  const watchOptions: WatchOptions = {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/assets/**/*.map', // Ignore source maps to prevent double reloads
    ],
    debounce: 100,
    ...options,
  };

  console.log(`Watching directory: ${watchDir}`);

  // Improved state tracking for debounced changes
  const pendingChanges = new Map<
    string,
    {
      type: string;
      path: string;
      timestamp: number;
    }
  >();

  let changeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Define a more robust handler for changes
  const handleChanges = () => {
    // Update timeout
    changeTimeout = null;

    // Group changes by type to handle them more efficiently
    const cssChanges: string[] = [];
    const jsChanges: string[] = [];
    let needsFullReload = false;

    // Process all pending changes
    pendingChanges.forEach((change, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const relativePath = path.relative(watchDir, filePath).replace(/\\/g, '/');
      const publicPath = '/' + relativePath;

      console.log(`File changed (${change.type}): ${filePath}`);

      if (ext === '.css') {
        cssChanges.push(publicPath);
      } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        jsChanges.push(publicPath);
      } else {
        // HTML changes or unknown file types require a full reload
        needsFullReload = true;
      }
    });

    // Clear pending changes after processing
    pendingChanges.clear();

    // Send updates based on file types
    if (needsFullReload) {
      // For HTML or other files, reload the page
      reloadPage(server);
    } else {
      // Handle CSS updates
      if (cssChanges.length > 0) {
        server.publish(
          'hmr',
          JSON.stringify({
            type: 'css-update',
            paths: cssChanges,
            timestamp: Date.now(),
          })
        );
      }

      // Handle JS updates - for now, we just do a full reload for JS changes
      if (jsChanges.length > 0) {
        server.publish(
          'hmr',
          JSON.stringify({
            type: 'js-update',
            paths: jsChanges,
            timestamp: Date.now(),
          })
        );
      }
    }
  };

  // Improved file change handler with better debouncing
  const handleFileChange = (filePath: string, eventType: string) => {
    // Normalize path to use forward slashes consistently
    filePath = filePath.replace(/\\/g, '/');

    // Check if file should be ignored
    if (
      watchOptions.ignored &&
      watchOptions.ignored.some(pattern => minimatch(filePath, pattern))
    ) {
      return;
    }

    // Check if file exists (for modify events)
    if (eventType === 'modify' && !fs.existsSync(filePath)) {
      return;
    }

    // Add to pending changes
    pendingChanges.set(filePath, {
      type: eventType,
      path: filePath,
      timestamp: Date.now(),
    });

    // Setup debounce
    if (changeTimeout) {
      clearTimeout(changeTimeout);
    }

    changeTimeout = setTimeout(handleChanges, watchOptions.debounce);
  };

  // Use AbortController for better cleanup
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    // Watch the directory recursively
    const watcher = watch(watchDir, { recursive: true, signal });

    // Process events from the watcher
    (async () => {
      try {
        for await (const event of watcher) {
          // FileChangeInfo object contains { filename, eventType }
          const filename = event.filename || '';
          const eventType = event.eventType || 'modify';
          const filePath = path.join(watchDir, filename);
          handleFileChange(filePath, eventType);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error watching files:', err);
        }
      }
    })();
  } catch (err: any) {
    console.error('Failed to set up file watcher:', err);
  }

  // Return a cleanup function
  return () => {
    abortController.abort();
    if (changeTimeout) {
      clearTimeout(changeTimeout);
      changeTimeout = null;
    }
    pendingChanges.clear();
  };
}

/**
 * Send a full page reload message to all connected clients
 *
 * @param server Bun server instance
 */
export function reloadPage(server: Server): void {
  server.publish(
    'hmr',
    JSON.stringify({
      type: 'reload',
      timestamp: Date.now(),
    })
  );
}

/**
 * Simple implementation of minimatch for pattern matching
 *
 * @param filepath File path to check
 * @param pattern Glob pattern to match against
 * @returns Whether the path matches the pattern
 */
function minimatch(filepath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regex = new RegExp(
    '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '$'
  );

  return regex.test(filepath);
}

/**
 * HMR client script that will be injected into HTML pages
 */
const hmrClientScript = `
// BunPress HMR Client
(function() {
  const socketUrl = 'ws://' + location.host;
  let socket;
  let reconnectTimer;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const clientId = Math.random().toString(36).substring(2, 10);
  
  function connect() {
    console.log('[HMR] Connecting...');
    socket = new WebSocket(socketUrl);
    
    socket.addEventListener('open', () => {
      console.log('[HMR] Connected');
      clearTimeout(reconnectTimer);
      reconnectAttempts = 0;
      socket.send(JSON.stringify({ type: 'connect', id: clientId }));
    });
    
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'reload':
          console.log('[HMR] Full page reload');
          window.location.reload();
          break;
          
        case 'css-update':
          console.log('[HMR] Updating CSS', data.paths || data.path);
          
          // Handle multiple CSS updates
          if (data.paths && Array.isArray(data.paths)) {
            data.paths.forEach(path => updateCSS(path));
          } else if (data.path) {
            updateCSS(data.path);
          }
          break;
          
        case 'js-update':
          console.log('[HMR] JavaScript updated - reloading page');
          // For now, we just reload the page for JS changes
          // In the future, we could implement proper HMR for JS modules
          window.location.reload();
          break;
      }
    });
    
    socket.addEventListener('close', () => {
      console.log('[HMR] Disconnected. Attempting to reconnect...');
      clearTimeout(reconnectTimer);
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
        console.log('[HMR] Reconnecting in ' + delay + 'ms (attempt ' + reconnectAttempts + '/' + MAX_RECONNECT_ATTEMPTS + ')...');
        reconnectTimer = setTimeout(connect, delay);
      } else {
        console.log('[HMR] Maximum reconnection attempts reached. Reloading page...');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
    
    socket.addEventListener('error', (err) => {
      console.error('[HMR] Connection error:', err);
      socket.close();
    });
  }
  
  // Update a CSS file without refreshing the page
  function updateCSS(path) {
    if (!path) return;
    
    // Ensure we have the correct path format with leading slash
    if (path.charAt(0) !== '/') {
      path = '/' + path;
    }
    
    // Find existing link element for this stylesheet
    const links = document.getElementsByTagName('link');
    let found = false;
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.rel === 'stylesheet') {
        // Match the path considering query parameters and different URL formats
        const href = link.getAttribute('href');
        if (!href) continue;
        
        const linkPath = new URL(href, window.location.href).pathname;
        const comparePath = path.split('?')[0]; // Remove query parameters
        
        if (linkPath === comparePath || linkPath.endsWith(comparePath)) {
          // Update with a cache-busting query parameter
          const timestamp = Date.now();
          const newHref = href.split('?')[0] + '?t=' + timestamp;
          console.log('[HMR] Updating CSS link: ' + href + ' -> ' + newHref);
          link.href = newHref;
          found = true;
          break;
        }
      }
    }
    
    // If not found, append a new link element
    if (!found) {
      console.log('[HMR] Adding new CSS link: ' + path);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = path + '?t=' + Date.now();
      document.head.appendChild(link);
    }
  }
  
  // Start the connection
  connect();
})();
`;

export function startDevServer(
  config: BunPressConfig,
  pluginManager?: PluginManager
): DevServerResult {
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

  // Initialize HMR
  const hmrContext = createHmrContext();

  // Set up file watcher for content files using fs/promises watch
  let abortController = new AbortController();
  const watcher = {
    close: () => {
      abortController.abort();
    },
  };

  // Start watching the pages directory
  (async () => {
    try {
      const ac = abortController;
      for await (const event of watch(config.pagesDir, {
        recursive: true,
        signal: ac.signal,
      })) {
        // Only process .md and .mdx files
        if (!event.filename?.match(/\.(md|mdx)$/)) continue;

        console.log(`Content file changed: ${event.filename}`);

        // Regenerate routes
        if (pluginManager) {
          generateRoutesAsync(config.pagesDir).then(asyncRoutes => {
            routes = asyncRoutes;
            console.log('Routes regenerated with plugin transformations');

            // Notify HMR clients of the update
            broadcastHmrUpdate(hmrContext, event.filename || '');
          });
        } else {
          routes = generateRoutes(config.pagesDir);

          // Notify HMR clients of the update
          broadcastHmrUpdate(hmrContext, event.filename || '');
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

  // Watch theme directory for changes
  (async () => {
    try {
      const ac = abortController;
      for await (const event of watch(themeDir, {
        recursive: true,
        signal: ac.signal,
      })) {
        // Process scripts, styles, and HTML templates
        if (!event.filename) continue;

        const ext = path.extname(event.filename);
        if (['.js', '.ts', '.jsx', '.tsx', '.css', '.html'].includes(ext)) {
          console.log(`Theme file changed: ${event.filename}`);

          // Notify HMR clients of the update
          broadcastHmrUpdate(hmrContext, event.filename);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Theme file watcher stopped');
      } else {
        console.error('Error watching theme files:', error);
      }
    }
  })();

  // Check if we are using HTML with bundling
  let htmlEntrypoints: string[] = [];
  try {
    // Find HTML files in the theme directory
    function scanHtmlFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanHtmlFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          htmlEntrypoints.push(fullPath);
        }
      }
    }

    scanHtmlFiles(themeDir);
    console.log(`Found ${htmlEntrypoints.length} HTML entrypoints in theme directory`);
  } catch (error) {
    console.error('Error scanning for HTML entrypoints:', error);
  }

  // Start the server with Bun's built-in features
  const server = serve({
    port: config.devServer?.port || 3000,
    development: true, // Enable development mode for HMR and detailed errors

    // HTML imports as routes for fullstack dev server
    routes: {
      // Use HTML files directly as routes (for fullstack capabilities)
      ...Object.fromEntries(
        htmlEntrypoints.map(htmlPath => {
          const routePath = path
            .relative(themeDir, htmlPath)
            .replace(/\.html$/, '')
            .replace(/index$/, '');

          const finalPath = '/' + routePath;

          return [
            finalPath,
            htmlPath, // Bun will natively handle HTML imports as routes
          ];
        })
      ),

      // Dynamic API endpoints
      '/api/routes': {
        async GET() {
          // Generate list of available routes
          const routePaths = await scanContentDirectory(config.pagesDir);
          return Response.json(routePaths);
        },
      },

      // Route to get processed markdown content
      '/api/content/:path*': async req => {
        // Get the path from params
        const pathParam = req.params['path*'];
        const fullPath = path.join(config.pagesDir, pathParam || '');

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
          return new Response('Content not found', { status: 404 });
        } catch (error) {
          console.error('Error processing content:', error);
          return new Response('Error processing content', { status: 500 });
        }
      },

      // HMR client script
      '/bunpress-hmr.js': () => {
        return new Response(hmrClientScript, {
          headers: {
            'Content-Type': 'application/javascript',
          },
        });
      },
    },

    // Fallback for other requests
    fetch(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // Try to serve index.html for the root path with Bun.file for better performance
      if (pathname === '/') {
        const indexHtmlPath = path.join(themeDir, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          // Process HTML with HTMLRewriter to inject HMR script
          const html = fs.readFileSync(indexHtmlPath, 'utf-8');
          const processedHtml = injectHmrScript(html);

          return new Response(processedHtml, {
            headers: {
              'Content-Type': 'text/html',
            },
          });
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
        const processedHtml = injectHmrScript(html);

        return new Response(processedHtml, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      // Default 404 response
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    },
  });

  // Helper function to inject HMR script into HTML
  function injectHmrScript(html: string): string {
    // Simple string replacement to inject the HMR script
    const headEndPos = html.indexOf('</head>');

    if (headEndPos !== -1) {
      return (
        html.slice(0, headEndPos) +
        `<script src="/bunpress-hmr.js"></script>\n` +
        html.slice(headEndPos)
      );
    }

    // If no head tag, inject before end of body or just at the end
    const bodyEndPos = html.indexOf('</body>');
    if (bodyEndPos !== -1) {
      return (
        html.slice(0, bodyEndPos) +
        `<script src="/bunpress-hmr.js"></script>\n` +
        html.slice(bodyEndPos)
      );
    }

    // Last resort, append to the end
    return html + `<script src="/bunpress-hmr.js"></script>`;
  }

  const devServerUrl = `http://${config.devServer?.host || 'localhost'}:${config.devServer?.port || 3000}`;
  console.log(`BunPress dev server running at ${devServerUrl}`);

  return {
    server,
    watcher,
    hmrContext,
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
    console.error('Error scanning content directory:', error);
  }

  return contentPaths;
}
