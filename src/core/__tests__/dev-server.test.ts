import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { createDevServer, setupHMR, reloadPage } from '../dev-server';
import { BunServer } from 'bun';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock the Bun server
mock.module('bun', () => {
  return {
    serve: (options: any) => {
      const server = {
        stop: () => {},
        reload: () => {},
        upgrade: (req: any) => {},
        publish: (channel: string, message: string) => {},
        _connections: new Map(),
        _handlers: new Map(),
        pendingWebsockets: []
      };
      
      // Store the fetch handler
      if (options.fetch) {
        server._handlers.set('fetch', options.fetch);
      }
      
      // Store the websocket handler
      if (options.websocket) {
        server._handlers.set('websocket', options.websocket);
      }
      
      return server;
    },
    file: (path: string) => {
      return {
        text: () => {
          if (path.endsWith('.html')) {
            return `<!DOCTYPE html><html><body>Test</body></html>`;
          }
          if (path.endsWith('.js')) {
            return `console.log('Test');`;
          }
          if (path.endsWith('.css')) {
            return `body { color: blue; }`;
          }
          return '';
        }
      };
    }
  };
});

// Mock process
mock.module('process', () => {
  return {
    env: {
      NODE_ENV: 'development'
    }
  };
});

describe('Dev Server', () => {
  const tmpDir = path.join(os.tmpdir(), 'bunpress-test-server-' + Date.now());
  const originalCwd = process.cwd();
  let mockConfig: any;
  let devServer: any;
  
  beforeEach(() => {
    // Create temp directories
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true });
    
    // Create test files
    fs.writeFileSync(
      path.join(tmpDir, 'dist', 'index.html'),
      `<!DOCTYPE html><html><body><div id="app"></div></body></html>`
    );
    fs.writeFileSync(
      path.join(tmpDir, 'dist', 'style.css'),
      `body { margin: 0; }`
    );
    fs.writeFileSync(
      path.join(tmpDir, 'dist', 'bundle.js'),
      `console.log('Loaded');`
    );
    
    // Change working directory
    process.chdir(tmpDir);
    
    // Create mock config
    mockConfig = {
      title: 'Test Site',
      pagesDir: 'pages',
      outputDir: path.join(tmpDir, 'dist'),
      devServer: {
        port: 3000,
        host: 'localhost',
        hmr: true,
        open: false
      }
    };
  });
  
  afterEach(() => {
    // Clean up server if it exists
    if (devServer && typeof devServer.stop === 'function') {
      devServer.stop();
    }
    
    // Restore working directory
    process.chdir(originalCwd);
    
    // Clean up
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (err) {
      console.error('Error cleaning up temp directory', err);
    }
  });
  
  test('createDevServer should return a Bun server instance', async () => {
    devServer = await createDevServer(mockConfig);
    
    expect(devServer).toBeDefined();
    expect(typeof devServer.stop).toBe('function');
    expect(devServer._handlers.has('fetch')).toBe(true);
    
    // If HMR is enabled, websocket handler should be registered
    expect(devServer._handlers.has('websocket')).toBe(true);
  });
  
  test('createDevServer should serve static files from output directory', async () => {
    devServer = await createDevServer(mockConfig);
    const fetchHandler = devServer._handlers.get('fetch');
    
    // Create a mock request
    const req = new Request('http://localhost:3000/index.html');
    const response = await fetchHandler(req);
    
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain('<div id="app">');
    
    // HMR client script should be injected when HMR is enabled
    expect(text).toContain('<script src="/__bunpress_hmr.js"');
  });
  
  test('setupHMR should handle file changes correctly', async () => {
    devServer = await createDevServer(mockConfig);
    const spy = spyOn(devServer, 'publish');
    
    // Simulate file change events
    const cssChange = {
      file: path.join(tmpDir, 'dist', 'style.css'),
      content: 'body { margin: 10px; }'
    };
    
    // Call the HMR handler
    await setupHMR(devServer, mockConfig);
    
    // Trigger file change by writing to the CSS file
    fs.writeFileSync(cssChange.file, cssChange.content);
    
    // Wait a moment for file watcher to detect change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // HMR should send a message to reload CSS
    expect(spy).toHaveBeenCalled();
    const args = spy.calls[0].args;
    expect(args[0]).toBe('hmr');
    const message = JSON.parse(args[1]);
    expect(message.type).toBe('css-update');
    expect(message.path).toContain('style.css');
  });
  
  test('reloadPage should send reload message to all clients', async () => {
    devServer = await createDevServer(mockConfig);
    const spy = spyOn(devServer, 'publish');
    
    // Call the reload function
    reloadPage(devServer);
    
    // Should publish a reload message
    expect(spy).toHaveBeenCalled();
    expect(spy.calls[0].args[0]).toBe('hmr');
    const message = JSON.parse(spy.calls[0].args[1]);
    expect(message.type).toBe('reload');
  });
  
  test('createDevServer should handle 404 correctly', async () => {
    devServer = await createDevServer(mockConfig);
    const fetchHandler = devServer._handlers.get('fetch');
    
    // Create a mock request for a non-existent file
    const req = new Request('http://localhost:3000/not-found.html');
    const response = await fetchHandler(req);
    
    expect(response.status).toBe(404);
  });
}); 