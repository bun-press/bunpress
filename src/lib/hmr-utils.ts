/**
 * Hot Module Replacement (HMR) utilities
 * This module provides centralized functions for handling HMR across the codebase
 */

import { Server, ServerWebSocket } from 'bun';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { watch } from 'fs/promises';

import { shouldIgnorePath, minimatch } from './server-utils';
import { fileExists, readFileAsString } from './fs-utils';
import { normalizePath } from './path-utils';

/**
 * HMR context that holds the state of the HMR system
 */
export interface HmrContext {
  websocket: Server;
  clients: Set<ServerWebSocket<unknown>>;
  moduleDependencies: Map<string, Set<string>>;
  moduleLastUpdate: Map<string, number>;
  events: EventEmitter;
}

/**
 * HMR client connection
 */
export interface HmrClient {
  id: string;
  ws: ServerWebSocket<unknown>;
  connectedAt: number;
}

/**
 * HMR event types
 */
export enum HmrEventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  UPDATE = 'update',
  RELOAD = 'reload',
  CSS_UPDATE = 'css-update',
  JS_UPDATE = 'js-update',
  ERROR = 'error',
}

/**
 * HMR event interface
 */
export interface HmrEvent {
  type: HmrEventType | string;
  path?: string;
  paths?: string[];
  message?: string;
  timestamp: number;
  clientId?: string;
}

/**
 * File watcher options
 */
export interface WatchOptions {
  ignored?: string[];
  debounce?: number;
  extensions?: string[];
}

/**
 * Create an HMR context
 */
export function createHmrContext(options?: {
  port?: number;
  hostname?: string;
}): HmrContext {
  const port = options?.port || 3030;
  const hostname = options?.hostname || 'localhost';
  const events = new EventEmitter();
  const clients = new Set<ServerWebSocket<unknown>>();

  const websocket = Bun.serve({
    port,
    hostname,
    fetch: () => new Response('HMR Server', { status: 200 }),
    websocket: {
      open: (ws: ServerWebSocket<unknown>) => {
        clients.add(ws);
        events.emit('client:connect', ws);
      },
      message: (ws: ServerWebSocket<unknown>, message: string | Uint8Array) => {
        try {
          const data = JSON.parse(message.toString());
          events.emit('client:message', { ws, data });
        } catch (error) {
          console.error('Error processing HMR message:', error);
        }
      },
      close: (ws: ServerWebSocket<unknown>) => {
        clients.delete(ws);
        events.emit('client:disconnect', ws);
      },
    },
  });

  console.log(`HMR server started on ws://${hostname}:${port}`);

  return {
    websocket,
    clients,
    moduleDependencies: new Map(),
    moduleLastUpdate: new Map(),
    events
  };
}

/**
 * Create the HMR client script to be injected into HTML pages
 */
export function createHmrClientScript(options?: {
  port?: number;
  hostname?: string;
}): string {
  const port = options?.port || 3030;
  const hostname = options?.hostname || window.location.hostname;
  const wsUrl = `ws://${hostname}:${port}`;

  return `
// BunPress HMR Client
(function() {
  const socketUrl = '${wsUrl}';
  let socket;
  let reconnectTimer;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const clientId = Math.random().toString(36).substring(2, 10);
  
  function connect() {
    console.log('[HMR] Connecting to ${wsUrl}...');
    socket = new WebSocket(socketUrl);
    
    socket.addEventListener('open', () => {
      console.log('[HMR] Connected');
      clearTimeout(reconnectTimer);
      reconnectAttempts = 0;
      socket.send(JSON.stringify({ type: 'connect', id: clientId }));
    });
    
    socket.addEventListener('message', (event) => {
      try {
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
            
          case 'error':
            console.error('[HMR] Error:', data.message);
            break;
        }
      } catch (err) {
        console.error('[HMR] Failed to parse message:', err);
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
}

/**
 * Inject HMR client script into HTML
 */
export function injectHmrScript(html: string, scriptUrl: string = '/__hmr.js'): string {
  // Check if HMR script is already injected
  if (html.includes(scriptUrl)) {
    return html;
  }

  // Inject before closing head tag
  return html.replace('</head>', `  <script src="${scriptUrl}"></script>\n  </head>`);
}

/**
 * Set up file watcher for HMR
 */
export function setupFileWatcher(
  watchDir: string,
  callback: (filePath: string, eventType: string) => void,
  options: WatchOptions = {}
): { close: () => void } {
  // Default options
  const watchOptions: WatchOptions = {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/assets/**/*.map',
    ],
    debounce: 100,
    extensions: ['.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.md', '.mdx'],
    ...options,
  };

  console.log(`Watching directory for changes: ${watchDir}`);

  // Track pending changes
  const pendingChanges = new Map<
    string,
    {
      type: string;
      path: string;
      timestamp: number;
    }
  >();

  let changeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Process all changes at once
  const processChanges = () => {
    // Reset timeout
    changeTimeout = null;

    // Process all pending changes
    pendingChanges.forEach((change, filePath) => {
      callback(filePath, change.type);
    });

    // Clear pending changes
    pendingChanges.clear();
  };

  // File change handler with debounce
  const handleFileChange = (filePath: string, eventType: string) => {
    // Normalize path
    filePath = normalizePath(filePath);

    // Check if file should be ignored
    if (shouldIgnorePath(filePath, watchOptions.ignored || [])) {
      return;
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (watchOptions.extensions && !watchOptions.extensions.includes(ext)) {
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

    changeTimeout = setTimeout(processChanges, watchOptions.debounce);
  };

  // Use AbortController for cleanup
  const abortController = new AbortController();
  const { signal } = abortController;

  // Watch the directory
  try {
    const watcher = watch(watchDir, { recursive: true, signal });

    // Process events
    (async () => {
      try {
        for await (const event of watcher) {
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
  } catch (err) {
    console.error('Failed to set up file watcher:', err);
  }

  // Return cleanup function
  return {
    close: () => {
      abortController.abort();
      if (changeTimeout) {
        clearTimeout(changeTimeout);
        changeTimeout = null;
      }
      pendingChanges.clear();
      console.log('File watcher closed');
    },
  };
}

/**
 * Broadcast an update to all HMR clients
 */
export function broadcastHmrUpdate(
  context: HmrContext,
  filePath: string,
  updateType: 'css-update' | 'js-update' | 'reload' = 'reload'
): void {
  const ext = path.extname(filePath).toLowerCase();
  const normalizedPath = normalizePath(filePath);
  const relativePath = '/' + normalizedPath.split('/').pop() || '';

  // Determine update type based on file extension if not specified
  if (updateType === 'reload') {
    if (ext === '.css') {
      updateType = 'css-update';
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      updateType = 'js-update';
    }
  }

  // Broadcast to all clients
  const message: HmrEvent = {
    type: updateType,
    path: relativePath,
    timestamp: Date.now(),
  };

  // Use server publish if available
  if (context.websocket && typeof context.websocket.publish === 'function') {
    context.websocket.publish('hmr', JSON.stringify(message));
  } else {
    // Fall back to iterating over clients
    context.clients.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }

  console.log(`HMR update broadcasted: ${updateType} for ${relativePath}`);
}

/**
 * Request a full page reload from all clients
 */
export function requestPageReload(context: HmrContext): void {
  const message: HmrEvent = {
    type: HmrEventType.RELOAD,
    timestamp: Date.now(),
  };

  // Use server publish if available
  if (context.websocket && typeof context.websocket.publish === 'function') {
    context.websocket.publish('hmr', JSON.stringify(message));
  } else {
    // Fall back to iterating over clients
    context.clients.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }

  console.log('Full page reload requested');
}

/**
 * Broadcast an error to all HMR clients
 */
export function broadcastHmrError(context: HmrContext, errorMessage: string): void {
  const message: HmrEvent = {
    type: HmrEventType.ERROR,
    message: errorMessage,
    timestamp: Date.now(),
  };

  // Use server publish if available
  if (context.websocket && typeof context.websocket.publish === 'function') {
    context.websocket.publish('hmr', JSON.stringify(message));
  } else {
    // Fall back to iterating over clients
    context.clients.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }

  console.error(`HMR error: ${errorMessage}`);
} 