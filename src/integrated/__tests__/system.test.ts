import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileSystem, configManager, eventSystem } from '..';

describe('Integrated System', () => {
  // Create a temporary directory for testing file operations
  const tmpDir = path.join(os.tmpdir(), 'bunpress-integrated-test-' + Date.now());

  beforeAll(() => {
    // Create test directory
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'subdir'), { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('fileSystem', () => {
    const fsModule = fileSystem();

    test('reads and writes files', async () => {
      const testFilePath = path.join(tmpDir, 'test-file.txt');
      const content = 'This is test content';

      // Write file
      await fsModule.writeFile(testFilePath, content);

      // Read file without cache
      const readContent = await fsModule.readFile(testFilePath, { cache: false });
      expect(readContent).toBe(content);

      // Read file with cache
      const cachedContent = await fsModule.readFile(testFilePath, { cache: true });
      expect(cachedContent).toBe(content);
    });

    test('creates directories when writing files', async () => {
      const nestedFilePath = path.join(tmpDir, 'nested', 'deep', 'test-file.txt');
      const content = 'This is nested content';

      // Write should create directories
      await fsModule.writeFile(nestedFilePath, content);

      // Directory should exist
      expect(fs.existsSync(path.dirname(nestedFilePath))).toBe(true);

      // Read file
      const readContent = await fsModule.readFile(nestedFilePath);
      expect(readContent).toBe(content);
    });

    test('finds files matching pattern', async () => {
      // Create multiple test files
      const files = [
        path.join(tmpDir, 'test1.md'),
        path.join(tmpDir, 'test2.md'),
        path.join(tmpDir, 'subdir', 'test3.md'),
        path.join(tmpDir, 'test.txt'),
      ];

      for (const file of files) {
        await fsModule.writeFile(file, `Content of ${path.basename(file)}`);
      }

      // Find .md files
      const mdFiles = await fsModule.findFiles(tmpDir, /\.md$/);
      expect(mdFiles.length).toBe(3);
      expect(mdFiles.some(f => f.includes('test1.md'))).toBe(true);
      expect(mdFiles.some(f => f.includes('test2.md'))).toBe(true);
      expect(mdFiles.some(f => f.includes('test3.md'))).toBe(true);

      // Find files with string pattern
      const txtFiles = await fsModule.findFiles(tmpDir, '.txt');
      expect(txtFiles.length).toBe(3); // Including the ones from previous tests
      expect(txtFiles.some(f => f.includes('test-file.txt'))).toBe(true);

      // Find files with excludeDirs
      const nonSubdirFiles = await fsModule.findFiles(tmpDir, /\.md$/, { excludeDirs: ['subdir'] });
      expect(nonSubdirFiles.length).toBe(2);
      expect(nonSubdirFiles.every(f => !f.includes('subdir'))).toBe(true);

      // Find files non-recursively
      const rootFiles = await fsModule.findFiles(tmpDir, /\.md$/, { recursive: false });
      expect(rootFiles.length).toBe(2);
      expect(rootFiles.every(f => !f.includes('subdir'))).toBe(true);
    });
  });

  describe('configManager', () => {
    const config = configManager();

    test('sets and gets config values', () => {
      config.set('title', 'My Site');
      config.set('theme', 'dark');
      config.set('options', { debug: true, cache: false });

      expect(config.get('title')).toBe('My Site');
      expect(config.get('theme')).toBe('dark');
      expect(config.get('options')).toEqual({ debug: true, cache: false });
    });

    test('returns default value for missing keys', () => {
      expect(config.get('nonexistent')).toBeUndefined();
      expect(config.get('nonexistent', 'default')).toBe('default');
    });

    test('saves and loads config from file', async () => {
      const configFile = path.join(tmpDir, 'config.json');

      // Set some values
      config.set('site', 'BunPress');
      config.set('version', '1.0.0');

      // Save to file
      const saveResult = await config.saveToFile(configFile);
      expect(saveResult).toBe(true);

      // Reset config
      config.reset();
      expect(config.get('site')).toBeUndefined();

      // Load from file
      const loadResult = await config.loadFromFile(configFile);
      expect(loadResult).toBe(true);

      // Check loaded values
      expect(config.get('site')).toBe('BunPress');
      expect(config.get('version')).toBe('1.0.0');
    });

    test('getAll returns all config values', () => {
      config.reset();

      config.set('name', 'BunPress');
      config.set('version', '1.0.0');
      config.set('debug', true);

      const allConfig = config.getAll();
      expect(allConfig).toEqual({
        name: 'BunPress',
        version: '1.0.0',
        debug: true,
      });
    });

    test('reset clears all config values', () => {
      config.set('testKey', 'test value');
      expect(config.get('testKey')).toBe('test value');

      config.reset();
      expect(config.get('testKey')).toBeUndefined();
      expect(config.getAll()).toEqual({});
    });
  });

  describe('eventSystem', () => {
    const events = eventSystem();

    test('subscribes to and emits events', () => {
      const eventLog: string[] = [];

      // Subscribe to events
      events.on('test', data => {
        eventLog.push(`test:${data}`);
      });

      events.on('other', data => {
        eventLog.push(`other:${data}`);
      });

      // Emit events
      events.emit('test', 'hello');
      events.emit('other', 'world');
      events.emit('test', 'again');

      expect(eventLog).toEqual(['test:hello', 'other:world', 'test:again']);
    });

    test('returns unsubscribe function', () => {
      const eventLog: string[] = [];

      // Subscribe with returned unsubscribe function
      const unsubscribe = events.on('unsub-test', data => {
        eventLog.push(`received:${data}`);
      });

      // First event should be received
      events.emit('unsub-test', 'first');
      expect(eventLog).toEqual(['received:first']);

      // Unsubscribe
      unsubscribe();

      // Second event should not be received
      events.emit('unsub-test', 'second');
      expect(eventLog).toEqual(['received:first']);
    });

    test('off removes all handlers for an event', () => {
      const eventLog: string[] = [];

      // Add multiple handlers
      events.on('multi', () => {
        eventLog.push('handler1');
      });
      events.on('multi', () => {
        eventLog.push('handler2');
      });

      // First emit should trigger both
      events.emit('multi');
      expect(eventLog).toEqual(['handler1', 'handler2']);

      // Clear log and remove all handlers
      eventLog.length = 0;
      events.off('multi');

      // Second emit should trigger none
      events.emit('multi');
      expect(eventLog).toEqual([]);
    });

    test('subscriberCount returns correct count', () => {
      // Start with no subscribers
      events.off('counted');
      expect(events.subscriberCount('counted')).toBe(0);

      // Add subscribers
      events.on('counted', () => {});
      expect(events.subscriberCount('counted')).toBe(1);

      events.on('counted', () => {});
      events.on('counted', () => {});
      expect(events.subscriberCount('counted')).toBe(3);

      // Remove subscribers
      events.off('counted');
      expect(events.subscriberCount('counted')).toBe(0);
    });

    test('handles errors in event handlers', () => {
      const eventLog: string[] = [];

      // Add a handler that throws
      events.on('error-test', () => {
        throw new Error('Test error');
      });

      // Add a handler that should still run after error
      events.on('error-test', () => {
        eventLog.push('after-error');
      });

      // Should not throw, and second handler should still run
      events.emit('error-test');
      expect(eventLog).toEqual(['after-error']);
    });
  });
});
