/**
 * Development Server Implementation
 * Provides a local development server with HMR capabilities
 */

import { Server } from 'bun';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { EventEmitter } from 'events';

// Import from the centralized utilities
import {
  createHmrContext,
  setupFileWatcher,
  injectHmrScript,
  broadcastHmrUpdate,
  requestPageReload,
  createHmrClientScript,
  HmrContext,
  WatchOptions
} from '../lib/hmr-utils';

import {
  fileExists,
  readFileAsString
} from '../lib/fs-utils';

import {
  joinPaths,
  normalizePath
} from '../lib/path-utils';

import {
  ServerConfig,
  openBrowser
} from '../lib/server-utils';

import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import type { BunPressConfig } from '../../bunpress.config';
import { Plugin, PluginManager } from './plugin';
import { ContentFile } from './content-processor';

/**
 * Development server result
 */
export interface DevServerResult {
  fetch: (req: Request) => Promise<Response>;
  upgrade: (req: Request, options?: any) => { response: Response };
  publish: (topic: string, message: string) => void;
  port: number;
  hostname: string;
  stop: () => void;
  url: string;
  pendingWebsockets: any[];
  watcher: { close: () => void };
  websocket: any;
  
  // Custom properties for dev server
  config: DevServerConfig;
  hmrContext: HmrContext;
  reloadPage: () => void;
}

/**
 * Development server configuration options
 */
export interface DevServerConfig extends ServerConfig {
  watchDirs: string[];
  hmrScriptPath: string;
}

/**
 * Create a development server for BunPress
 *
 * @param config BunPress configuration
 * @param pluginManager Optional plugin manager for content transformations
 * @returns DevServerResult with server and watcher instances
 */
export async function createDevServer(
  config: BunPressConfig, 
  pluginManager?: PluginManager
): Promise<DevServerResult> {
  const devConfig = config.devServer || {};
  const workspaceRoot = process.cwd();
  
  // Default server configuration
  const serverConfig: DevServerConfig = {
    port: devConfig.port || 3000,
    hostname: devConfig.host || 'localhost',
    staticDir: config.outputDir,
    watchDirs: [
      config.pagesDir,
      config.contentDir || './content',
      path.join(workspaceRoot, 'themes', config.themeConfig?.name || 'default')
    ],
    hmrScriptPath: '/__bunpress_hmr.js',
    development: true,
    hmrPort: devConfig.hmrPort || (process.env.NODE_ENV === 'test' ? Math.floor(Math.random() * 10000) + 50000 : 3030),
    hmrHost: devConfig.hmrHost || 'localhost',
    open: devConfig.open !== false,
    cors: true
  };

  console.log(chalk.cyan(`Starting development server at http://${serverConfig.hostname}:${serverConfig.port}`));

  try {
    // Initialize HMR context
    const hmrContext = createHmrContext({
      port: serverConfig.hmrPort,
      hostname: serverConfig.hmrHost
    });
    
    // Update the hmrPort with the actual port assigned (when using dynamic port 0)
    serverConfig.hmrPort = hmrContext.websocket.port;
    
    // Generate initial routes
    let routes = await generateRoutes(config.pagesDir);
    
    // Regenerate routes asynchronously if plugin manager is available
    if (pluginManager) {
      // Get plugins from the plugin manager
      const plugins = pluginManager.plugins;
      try {
        routes = await generateRoutesAsync(config.pagesDir, plugins);
        console.log(chalk.green('Routes generated with plugin transformations'));
      } catch (error) {
        console.error(chalk.red('Error generating routes with plugins:'), error);
      }
    }

    // Create HMR client script
    const hmrClientScript = createHmrClientScript({
      port: serverConfig.hmrPort,
      hostname: serverConfig.hmrHost
    });

    // Create the server
    const server = Bun.serve({
      port: serverConfig.port,
      hostname: serverConfig.hostname,
      development: true,

      // Handle all HTTP requests
      async fetch(req) {
        const url = new URL(req.url);
        const pathname = decodeURIComponent(url.pathname);

        // Handle HMR client script request
        if (pathname === serverConfig.hmrScriptPath) {
          return new Response(hmrClientScript, {
            headers: { 'Content-Type': 'application/javascript' },
          });
        }
        
        // Handle routes from the router
        const route = Object.values(routes).find(r => r.route === pathname);
        if (route) {
          try {
            // Get workspace root for rendering
            const workspaceRoot = process.cwd();
            // Render the route content (markdown/mdx)
            return new Response(renderHtml(route, config, workspaceRoot), {
              headers: { 'Content-Type': 'text/html' }
            });
          } catch (error) {
            console.error(chalk.red(`Error rendering route ${pathname}:`), error);
            return new Response(`Error rendering page: ${error}`, { status: 500 });
          }
        }

        // Handle static files
        const filePath = joinPaths(serverConfig.staticDir, pathname);
        
        if (await fileExists(filePath)) {
          // For HTML files, inject HMR script
          if (filePath.endsWith('.html')) {
            try {
              const html = await readFileAsString(filePath);
              const injectedHtml = injectHmrScript(html, serverConfig.hmrScriptPath);
              return new Response(injectedHtml, {
                headers: { 'Content-Type': 'text/html' },
              });
            } catch (error) {
              console.error(chalk.red(`Error processing HTML file ${filePath}:`), error);
            }
          }
          
          // Serve the file normally
          return new Response(Bun.file(filePath));
        }
        
        // Check for directory index.html
        if (!path.extname(filePath)) {
          const indexPath = joinPaths(filePath, 'index.html');
          if (await fileExists(indexPath)) {
            try {
              const html = await readFileAsString(indexPath);
              const injectedHtml = injectHmrScript(html, serverConfig.hmrScriptPath);
              return new Response(injectedHtml, {
                headers: { 'Content-Type': 'text/html' },
              });
            } catch (error) {
              console.error(chalk.red(`Error processing HTML file ${indexPath}:`), error);
              return new Response(Bun.file(indexPath));
            }
          }
        }

        // Not found
        return new Response('Not Found', { status: 404 });
      }
    });
    
    // Create file watchers
    setupHMR(server, serverConfig);
    
    for (const dir of serverConfig.watchDirs) {
      if (fs.existsSync(dir)) {
        console.log(chalk.yellow(`Watching directory for changes: ${dir}`));
      }
    }
    
    // Add custom properties to server for access in tests and HMR
    const devServer = server as unknown as DevServerResult;
    devServer.config = serverConfig;
    devServer.hmrContext = hmrContext;
    devServer.reloadPage = () => requestPageReload(hmrContext);
    
    // Store the original stop method
    const originalStop = server.stop;
    
    // Define a new stop method that will close both the server and HMR server
    devServer.stop = () => {
      // Call the original stop method
      originalStop.call(server);
      
      // Stop the HMR server
      if (hmrContext && hmrContext.websocket) {
        hmrContext.websocket.stop();
      }
      
      // Close any file watchers
      if (devServer.watcher) {
        devServer.watcher.close();
      }
    };
    
    return devServer;
  } catch (error) {
    console.error(chalk.red('Error creating development server:'), error);
    throw error;
  }
}

/**
 * Start the development server
 * Convenience wrapper around createDevServer
 */
export async function startDevServer(
  config: BunPressConfig,
  pluginManager?: PluginManager
): Promise<DevServerResult> {
  return await createDevServer(config, pluginManager);
}

/**
 * Setup Hot Module Replacement (HMR) for a server
 */
export function setupHMR(server: Server, config: DevServerConfig): void {
  const workspaceRoot = process.cwd();
  // Cast server to any first to avoid type errors
  const devServer = server as any;
  
  // In tests, devServer.hmrContext might already be set up from createDevServer
  const hmrContext = devServer.hmrContext || {
    clients: new Set(),
    websocket: devServer.websocket,
    moduleDependencies: new Map(),
    moduleLastUpdate: new Map(),
    events: new EventEmitter()
  };
  
  // Set up file watching for content directories
  const watchOptions: WatchOptions = {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/assets/**/*.map',
    ],
    debounce: 100,
    extensions: ['.md', '.mdx', '.html', '.css', '.js', '.jsx', '.ts', '.tsx']
  };
  
  // Ensure config.watchDirs is an array
  const watchDirs = Array.isArray(config.watchDirs) ? config.watchDirs : [];
  
  const watchers = watchDirs.map(dir => {
    if (!fs.existsSync(dir)) {
      return { close: () => {} }; // Return a dummy watcher if directory doesn't exist
    }
    
    return setupFileWatcher(dir, (filePath, eventType) => {
      console.log(chalk.yellow(`File changed (${eventType}): ${path.relative(workspaceRoot, filePath)}`));
      
      // Different handling based on file type
      const ext = path.extname(filePath).toLowerCase();
      
      if (['.md', '.mdx'].includes(ext)) {
        // Content files - regenerate routes
        generateRoutes(watchDirs[0]) // Use the pages directory (first entry)
          .then(newRoutes => {
            broadcastHmrUpdate(hmrContext, filePath);
          })
          .catch(error => {
            console.error(chalk.red('Error regenerating routes:'), error);
          });
      } else if (ext === '.css') {
        // CSS files - send CSS update
        broadcastHmrUpdate(hmrContext, filePath, 'css-update');
      } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        // JS files - send JS update or reload
        broadcastHmrUpdate(hmrContext, filePath, 'js-update');
      } else if (ext === '.html') {
        // HTML - trigger full reload
        requestPageReload(hmrContext);
      } else {
        // Other files - reload to be safe
        requestPageReload(hmrContext);
      }
    }, watchOptions);
  });
  
  // Create a single watcher object with a close method that closes all watchers
  const combinedWatcher = {
    close: () => {
      watchers.forEach(watcher => watcher.close());
    }
  };
  
  // Assign the watcher to the server for cleanup
  devServer.watcher = combinedWatcher;
  
  // Open browser if configured
  if (config.open) {
    const url = `http://${config.hostname}:${config.port}`;
    console.log(chalk.cyan(`Opening browser at ${url}`));
    openBrowser(url);
  }
  
  console.log(chalk.green(`File watcher setup complete for ${watchers.length} directories`));
}

/**
 * Helper function to reload all connected clients
 */
export function reloadPage(server: Server): void {
  // Cast server to any first to avoid type errors
  const devServer = server as any;
  if (devServer.hmrContext) {
    requestPageReload(devServer.hmrContext);
  }
} 