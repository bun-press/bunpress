/**
 * Development Server Implementation
 * Provides a local development server with HMR capabilities
 */

import { ServerWebSocket } from 'bun';
import * as path from 'path';
import chalk from 'chalk';
import fs from 'fs';

// Import from the centralized utilities
import {
  createHmrContext,
  injectHmrScript,
  broadcastHmrUpdate,
  requestPageReload,
  createHmrClientScript,
  HmrContext,
  HmrUpdate
} from '../lib/hmr-utils';

import {
  fileExists,
  readFileAsString
} from '../lib/fs-utils';

import {
  joinPaths
} from '../lib/path-utils';

import {
  ServerConfig,
  openBrowser,
  handleStaticFileRequest
} from '../lib/server-utils';

import {
  createFileWatcher,
  FileWatcher
} from '../lib/watch-utils';

import {
  ErrorCode,
  tryCatch,
  BunPressError
} from '../lib/error-utils';

import {
  getNamespacedLogger
} from '../lib/logger-utils';

import { generateRoutes, generateRoutesAsync } from './router';
import { renderHtml } from './renderer';
import type { BunPressConfig } from '../../bunpress.config';
import { PluginManager } from './plugin';

// Create namespaced logger for dev server
const logger = getNamespacedLogger('dev-server');

// Define a type that represents what Bun.serve returns
type BunServer = {
  port: number;
  hostname: string;
  url: string;
  development: boolean;
  fetch: (req: Request) => Response | Promise<Response>;
  publish: (topic: string, message: string) => void;
  reload: (options?: { closeActiveConnections?: boolean }) => void;
  stop: (options?: { closeActiveConnections?: boolean }) => Promise<void>;
  upgrade: (req: Request, options?: any) => { response: Response };
  pendingRequests: Set<Request>;
  pendingWebsockets: Set<any>;
  websocket: any;
  [Symbol.dispose]?: () => void;
};

/**
 * WebSocket handler interface to match Bun's requirements
 */
interface WebSocketHandler {
  message: (ws: any, message: string | Uint8Array) => void;
  open?: (ws: any) => void;
  close?: (ws: any, code: number, reason: string) => void;
  drain?: (ws: any) => void;
  ping?: (ws: any, data: Uint8Array) => void;
  pong?: (ws: any, data: Uint8Array) => void;
}

/**
 * Development server result
 */
export interface DevServerResult extends BunServer {
  // Custom properties for dev server
  config: DevServerConfig;
  hmrContext: HmrContext;
  reloadPage: () => void;
  watcher: FileWatcher;
  websocket: WebSocketHandler;
  fetch: (req: Request) => Response | Promise<Response>;
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
  return await tryCatch(async () => {
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
        joinPaths(workspaceRoot, 'themes', config.themeConfig?.name || 'default')
      ],
      hmrScriptPath: '/__bunpress_hmr.js',
      development: true,
      hmrPort: devConfig.hmrPort || (process.env.NODE_ENV === 'test' ? Math.floor(Math.random() * 10000) + 50000 : 3030),
      hmrHost: devConfig.hmrHost || 'localhost',
      open: devConfig.open !== false,
      cors: true
    };

    logger.info(chalk.cyan(`Starting development server at http://${serverConfig.hostname}:${serverConfig.port}`));

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
      await tryCatch(
        async () => {
          const plugins = pluginManager.plugins;
          routes = await generateRoutesAsync(config.pagesDir, plugins);
          logger.info(chalk.green('Routes generated with plugin transformations'));
        },
        (error) => {
          logger.error(chalk.red('Error generating routes with plugins:'), error);
        }
      );
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
          return await tryCatch(
            async () => {
              // Get workspace root for rendering
              const workspaceRoot = process.cwd();
              // Render the route content (markdown/mdx)
              const html = await renderHtml(route, config, workspaceRoot);
              return new Response(html, {
                headers: { 'Content-Type': 'text/html' }
              });
            },
            (error) => {
              logger.error(chalk.red(`Error rendering route ${pathname}:`), error);
              return new Response(`Error rendering page: ${error}`, { status: 500 });
            }
          );
        }

        // Handle static files
        const filePath = joinPaths(serverConfig.staticDir, pathname);
        
        if (await fileExists(filePath)) {
          // For HTML files, inject HMR script
          if (filePath.endsWith('.html')) {
            return await tryCatch(
              async () => {
                const html = await readFileAsString(filePath);
                const injectedHtml = injectHmrScript(html, serverConfig.hmrScriptPath);
                return new Response(injectedHtml, {
                  headers: { 'Content-Type': 'text/html' },
                });
              },
              (error) => {
                logger.error(chalk.red(`Error processing HTML file ${filePath}:`), error);
                return handleStaticFileRequest(filePath);
              }
            );
          }
          
          // Serve the file normally using server-utils
          return handleStaticFileRequest(filePath);
        }
        
        // Check for directory index.html
        if (!path.extname(filePath)) {
          const indexPath = joinPaths(filePath, 'index.html');
          if (await fileExists(indexPath)) {
            return await tryCatch(
              async () => {
                const html = await readFileAsString(indexPath);
                const injectedHtml = injectHmrScript(html, serverConfig.hmrScriptPath);
                return new Response(injectedHtml, {
                  headers: { 'Content-Type': 'text/html' },
                });
              },
              (error) => {
                logger.error(chalk.red(`Error processing HTML file ${indexPath}:`), error);
                return handleStaticFileRequest(indexPath);
              }
            );
          }
        }
        
        // Default 404 response
        return new Response('Not found', { status: 404 });
      },
      
      // Handle websocket upgrades for HMR
      websocket: {
        open: hmrContext.websocket.open,
        message: hmrContext.websocket.message || ((_ws: ServerWebSocket<unknown>, message: string | Uint8Array) => {
          try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            logger.debug('Received WebSocket message:', data);
          } catch (error) {
            logger.error('Failed to parse WebSocket message:', error as Record<string, any>);
          }
        }),
        close: hmrContext.websocket.close
      },

      // Handle errors
      error(error) {
        logger.error(chalk.red('Server error:'), error);
        return new Response(`Server Error: ${error.message}`, { status: 500 });
      }
    });

    // Set up file watcher using watch-utils
    const watcher = createFileWatcher(serverConfig.watchDirs, {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**'
      ],
      persistent: true
    });

    watcher.on('change', (filePath: string, stats: fs.Stats) => {
      logger.info(chalk.yellow(`File changed: ${filePath}`));
      const update: HmrUpdate = {
        type: 'update',
        path: filePath,
        timestamp: stats ? stats.mtimeMs : Date.now()
      };
      broadcastHmrUpdate(hmrContext, update);
    });

    watcher.on('add', (filePath: string) => {
      logger.info(chalk.green(`File added: ${filePath}`));
      requestPageReload(hmrContext);
    });

    watcher.on('unlink', (filePath: string) => {
      logger.info(chalk.red(`File deleted: ${filePath}`));
      requestPageReload(hmrContext);
    });

    // Open browser if configured (using server-utils)
    if (serverConfig.open) {
      openBrowser(`http://${serverConfig.hostname}:${serverConfig.port}`);
    }

    // Return dev server result
    const devServer: DevServerResult = {
      ...(server as unknown as BunServer),
      fetch: server.fetch,
      config: serverConfig,
      hmrContext,
      reloadPage: () => requestPageReload(hmrContext),
      watcher,
      websocket: hmrContext.websocket as any
    };
    
    return devServer;
  }, (error) => {
    logger.error('Failed to create dev server:', error);
    throw new BunPressError(
      ErrorCode.SERVER_START_ERROR,
      `Failed to start development server: ${error.message}`,
      { error }
    );
  });
}

/**
 * Start a development server
 */
export async function startDevServer(
  config: BunPressConfig,
  pluginManager?: PluginManager
): Promise<DevServerResult> {
  return await createDevServer(config, pluginManager);
}

/**
 * Setup Hot Module Replacement (HMR) for a server
 * @deprecated Use createDevServer instead which automatically sets up HMR
 */
export function setupHMR(): void {
  // HMR setup logic here
  logger.info('HMR initialized');
} 