/**
 * HMR (Hot Module Replacement) implementation for BunPress
 * Based on Bun's import.meta.hot API
 */

import { Server } from 'bun';

export interface HmrContext {
  websocket: Server;
  connectedClients: Set<any>;
  moduleDependencies: Map<string, Set<string>>;
  moduleLastUpdate: Map<string, number>;
}

// Event types that can be sent over the HMR WebSocket
export type HmrEventType = 'update' | 'error' | 'reload' | 'disconnect' | 'connect';

export interface HmrEvent {
  type: HmrEventType;
  path?: string;
  message?: string;
  timestamp?: number;
}

/**
 * Create a HMR client script that will be injected into HTML pages
 */
export function createHmrClientScript(websocketUrl: string): string {
  return `
// BunPress HMR Client
(function() {
  const socket = new WebSocket('${websocketUrl}');
  let isConnected = false;
  let pendingUpdates = [];
  let reconnectTimer;

  // Connection event handlers
  socket.addEventListener('open', () => {
    console.log('[HMR] Connected');
    isConnected = true;
    
    // Process any pending updates
    pendingUpdates.forEach(processUpdate);
    pendingUpdates = [];
    
    // Clear any reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.addEventListener('close', () => {
    console.log('[HMR] Disconnected. Attempting to reconnect...');
    isConnected = false;
    
    // Set a timer to reconnect
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  });

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'update') {
        processUpdate(message);
      } else if (message.type === 'error') {
        console.error('[HMR] Error', message.message);
      } else if (message.type === 'reload') {
        console.log('[HMR] Full page reload requested');
        window.location.reload();
      }
    } catch (error) {
      console.error('[HMR] Failed to process message:', error);
    }
  });

  function processUpdate(message) {
    // If not connected, queue the update
    if (!isConnected) {
      pendingUpdates.push(message);
      return;
    }
    
    if (message.path) {
      console.log(\`[HMR] Update detected: \${message.path}\`);
      
      // Attempt to use the import.meta.hot API if available
      if (window.__bunpress_hmr_modules && window.__bunpress_hmr_modules[message.path]) {
        const moduleInfo = window.__bunpress_hmr_modules[message.path];
        
        // Call any registered callbacks
        moduleInfo.callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error(\`[HMR] Error in module update callback: \${error}\`);
          }
        });
        
        console.log(\`[HMR] Module \${message.path} updated\`);
      } else {
        // If we can't find the module or it doesn't support HMR, reload the page
        console.log('[HMR] Module update requires full reload');
        window.location.reload();
      }
    }
  }

  // Export the HMR API for modules
  window.__bunpress_hmr = {
    accept: (modulePath, callback) => {
      if (!window.__bunpress_hmr_modules) {
        window.__bunpress_hmr_modules = {};
      }
      
      if (!window.__bunpress_hmr_modules[modulePath]) {
        window.__bunpress_hmr_modules[modulePath] = {
          callbacks: []
        };
      }
      
      if (callback) {
        window.__bunpress_hmr_modules[modulePath].callbacks.push(callback);
      }
    }
  };
  
  // Setup import.meta.hot API
  window.__bunpress_setup_hmr = (modulePath) => {
    return {
      accept: function(callback) {
        window.__bunpress_hmr.accept(modulePath, callback);
      },
      dispose: function(callback) {
        // Store disposal callbacks to be called before replacement
        if (!window.__bunpress_hmr_modules) {
          window.__bunpress_hmr_modules = {};
        }
        
        if (!window.__bunpress_hmr_modules[modulePath]) {
          window.__bunpress_hmr_modules[modulePath] = {
            callbacks: [],
            disposeCallbacks: []
          };
        }
        
        if (!window.__bunpress_hmr_modules[modulePath].disposeCallbacks) {
          window.__bunpress_hmr_modules[modulePath].disposeCallbacks = [];
        }
        
        window.__bunpress_hmr_modules[modulePath].disposeCallbacks.push(callback);
      },
      data: {},
      decline: function() {
        // Mark this module as not hot-updatable
        if (!window.__bunpress_hmr_modules) {
          window.__bunpress_hmr_modules = {};
        }
        
        window.__bunpress_hmr_modules[modulePath] = {
          declined: true,
          callbacks: []
        };
      }
    };
  };
})();
  `;
}

/**
 * Initialize the HMR context
 */
export function createHmrContext(): HmrContext {
  return {
    websocket: Bun.serve({
      port: 3001,
      fetch: () => new Response("Not Found", { status: 404 }),
      websocket: {
        open: () => {
          console.log('HMR WebSocket server running on port 3001');
        },
        message: () => {},
        close: () => {}
      }
    }),
    connectedClients: new Set(),
    moduleDependencies: new Map(),
    moduleLastUpdate: new Map()
  };
}

/**
 * Modify a JavaScript file to include HMR support
 */
export function addHmrToJavaScript(source: string, filePath: string): string {
  // Skip modification for node_modules
  if (filePath.includes('node_modules')) {
    return source;
  }
  
  const hmrWrapped = `
// HMR Support
import.meta.hot = window.__bunpress_setup_hmr("${filePath}");

${source}
`;
  
  return hmrWrapped;
}

/**
 * Broadcast an HMR update event to all connected clients
 */
export function broadcastHmrUpdate(context: HmrContext, filePath: string): void {
  const event: HmrEvent = {
    type: 'update',
    path: filePath,
    timestamp: Date.now()
  };
  
  // Update the module's last update timestamp
  context.moduleLastUpdate.set(filePath, event.timestamp!);
  
  // Find all dependent modules
  const dependents = new Set<string>();
  collectDependents(context, filePath, dependents);
  
  // Send the update to all connected clients
  for (const client of context.connectedClients) {
    client.send(JSON.stringify(event));
    
    // Also send updates for dependent modules
    for (const dependent of dependents) {
      const dependentEvent: HmrEvent = {
        type: 'update',
        path: dependent,
        timestamp: event.timestamp
      };
      client.send(JSON.stringify(dependentEvent));
    }
  }
}

/**
 * Recursively collect all modules that depend on the given module
 */
function collectDependents(
  context: HmrContext, 
  filePath: string, 
  collected: Set<string>
): void {
  for (const [module, dependencies] of context.moduleDependencies.entries()) {
    if (dependencies.has(filePath) && !collected.has(module)) {
      collected.add(module);
      collectDependents(context, module, collected);
    }
  }
}

/**
 * Register a module dependency
 */
export function registerModuleDependency(
  context: HmrContext, 
  module: string, 
  dependency: string
): void {
  if (!context.moduleDependencies.has(module)) {
    context.moduleDependencies.set(module, new Set());
  }
  
  context.moduleDependencies.get(module)!.add(dependency);
}

/**
 * Broadcast an error event to all connected clients
 */
export function broadcastHmrError(context: HmrContext, message: string): void {
  const event: HmrEvent = {
    type: 'error',
    message,
    timestamp: Date.now()
  };
  
  for (const client of context.connectedClients) {
    client.send(JSON.stringify(event));
  }
}

/**
 * Request a full page reload for all connected clients
 */
export function requestPageReload(context: HmrContext): void {
  const event: HmrEvent = {
    type: 'reload',
    timestamp: Date.now()
  };
  
  for (const client of context.connectedClients) {
    client.send(JSON.stringify(event));
  }
} 