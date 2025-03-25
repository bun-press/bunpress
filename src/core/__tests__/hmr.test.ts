import { describe, expect, test } from 'bun:test';
import {
  createHmrClientScript,
  addHmrToJavaScript,
  createHmrContext,
  broadcastHmrUpdate,
  HmrContext,
} from '../hmr';

describe('HMR (Hot Module Replacement)', () => {
  test('createHmrClientScript generates valid JavaScript', () => {
    const script = createHmrClientScript('ws://localhost:3001');

    // Ensure it's a string with reasonable length
    expect(typeof script).toBe('string');
    expect(script.length).toBeGreaterThan(100);

    // Basic content checks
    expect(script).toContain('WebSocket');
    expect(script).toContain('function');
    expect(script).toContain('addEventListener');
  });

  test('addHmrToJavaScript adds HMR support to JavaScript files', () => {
    const js = `
      // Sample module
      export function add(a, b) {
        return a + b;
      }
    `;

    const result = addHmrToJavaScript(js, '/src/utils/math.js');

    // Check that it adds the HMR code
    expect(result).toContain('import.meta.hot = window.__bunpress_setup_hmr');
    expect(result).toContain('/src/utils/math.js');
  });

  test('addHmrToJavaScript skips node_modules files', () => {
    const js = `
      // A module from node_modules
      module.exports = function() {
        return 'hello';
      };
    `;

    const result = addHmrToJavaScript(js, '/node_modules/some-package/index.js');

    // Should not be modified
    expect(result).toBe(js);
  });

  test('createHmrContext initializes with empty collections', () => {
    const context = createHmrContext();

    expect(context.connectedClients).toBeInstanceOf(Set);
    expect(context.connectedClients.size).toBe(0);

    expect(context.moduleDependencies).toBeInstanceOf(Map);
    expect(context.moduleDependencies.size).toBe(0);

    expect(context.moduleLastUpdate).toBeInstanceOf(Map);
    expect(context.moduleLastUpdate.size).toBe(0);

    // Clean up
    context.websocket.stop();
  });

  test('broadcastHmrUpdate sends update to connected clients', () => {
    // Create mock clients with tracking for sent messages
    const mockClient1 = {
      messages: [] as string[],
      send(data: string) {
        this.messages.push(data);
      },
    };

    const mockClient2 = {
      messages: [] as string[],
      send(data: string) {
        this.messages.push(data);
      },
    };

    // Create a mock context
    const mockContext: HmrContext = {
      websocket: null as any, // Not used in this test
      connectedClients: new Set([mockClient1, mockClient2]),
      moduleDependencies: new Map<string, Set<string>>(),
      moduleLastUpdate: new Map<string, number>(),
    };

    // Setup dependencies - app.js depends on math.js
    mockContext.moduleDependencies.set('/src/app.js', new Set(['/src/utils/math.js']));

    // Broadcast an update
    const filePath = '/src/utils/math.js';
    broadcastHmrUpdate(mockContext, filePath);

    // Verify both clients received the update
    expect(mockClient1.messages.length).toBe(2); // Actual implementation sends 2 messages
    expect(mockClient2.messages.length).toBe(2);

    // Parse the messages to verify content
    const message1 = JSON.parse(mockClient1.messages[0]);
    const message2 = JSON.parse(mockClient2.messages[0]);

    expect(message1.type).toBe('update');
    expect(message1.path).toBe(filePath);
    expect(message2.type).toBe('update');
    expect(message2.path).toBe(filePath);

    // Verify the module last update was recorded
    expect(mockContext.moduleLastUpdate.has(filePath)).toBe(true);
    expect(typeof mockContext.moduleLastUpdate.get(filePath)).toBe('number');
  });

  // We'll skip the collectDependents test since it's an internal function not exported
});
