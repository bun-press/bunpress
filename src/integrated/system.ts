/**
 * Integrated system implementation for BunPress
 *
 * This file provides consolidated implementations for system-related
 * functionality that was previously scattered or only existed in tests.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Implementation for file system operations
 */
export function fileSystem() {
  return {
    /**
     * Read file with caching
     */
    readFile: async (
      filepath: string,
      options?: { encoding?: BufferEncoding; cache?: boolean }
    ) => {
      const encoding = options?.encoding || 'utf-8';
      const useCache = options?.cache !== false;

      // Simple in-memory cache
      const cache: Record<string, { content: string; timestamp: number }> = {};

      if (useCache && cache[filepath]) {
        try {
          const stats = await fs.promises.stat(filepath);
          // Use cached version if file hasn't changed
          if (stats.mtimeMs <= cache[filepath].timestamp) {
            return cache[filepath].content;
          }
        } catch (error) {
          // Handle file not found or other errors
          console.error(`Error checking file stats: ${error}`);
        }
      }

      try {
        const content = await fs.promises.readFile(filepath, { encoding });
        // Update cache
        if (useCache) {
          const stats = await fs.promises.stat(filepath);
          cache[filepath] = {
            content: content as string,
            timestamp: stats.mtimeMs,
          };
        }
        return content;
      } catch (error) {
        console.error(`Error reading file ${filepath}: ${error}`);
        throw error;
      }
    },

    /**
     * Write file creating directories as needed
     */
    writeFile: async (filepath: string, content: string) => {
      const dir = path.dirname(filepath);

      try {
        // Ensure directory exists
        await fs.promises.mkdir(dir, { recursive: true });
        // Write file
        await fs.promises.writeFile(filepath, content);
        return true;
      } catch (error) {
        console.error(`Error writing file ${filepath}: ${error}`);
        throw error;
      }
    },

    /**
     * Recursively find files matching a pattern
     */
    findFiles: async (
      dir: string,
      pattern: RegExp | string,
      options?: { recursive?: boolean; excludeDirs?: string[] }
    ) => {
      const recursive = options?.recursive !== false;
      const excludeDirs = options?.excludeDirs || ['node_modules', '.git'];

      const results: string[] = [];

      const processDir = async (currentDir: string) => {
        let entries;
        try {
          entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        } catch (error) {
          console.error(`Error reading directory ${currentDir}: ${error}`);
          return;
        }

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Skip excluded directories
            if (excludeDirs.includes(entry.name)) {
              continue;
            }

            if (recursive) {
              await processDir(fullPath);
            }
          } else if (entry.isFile()) {
            const testPattern = pattern instanceof RegExp ? pattern : new RegExp(pattern);

            if (testPattern.test(entry.name)) {
              results.push(fullPath);
            }
          }
        }
      };

      await processDir(dir);
      return results;
    },
  };
}

/**
 * Implementation for configuration management
 */
export function configManager() {
  // In-memory configuration store
  const config: Record<string, any> = {};

  return {
    /**
     * Set configuration value
     */
    set: (key: string, value: any) => {
      config[key] = value;
    },

    /**
     * Get configuration value
     */
    get: (key: string, defaultValue?: any) => {
      return key in config ? config[key] : defaultValue;
    },

    /**
     * Load configuration from a file
     */
    loadFromFile: async (filepath: string) => {
      try {
        const content = await fs.promises.readFile(filepath, 'utf-8');
        const fileConfig = JSON.parse(content);

        // Merge with existing config
        Object.assign(config, fileConfig);
        return true;
      } catch (error) {
        console.error(`Error loading config from ${filepath}: ${error}`);
        return false;
      }
    },

    /**
     * Save configuration to a file
     */
    saveToFile: async (filepath: string) => {
      try {
        const content = JSON.stringify(config, null, 2);
        await fs.promises.writeFile(filepath, content);
        return true;
      } catch (error) {
        console.error(`Error saving config to ${filepath}: ${error}`);
        return false;
      }
    },

    /**
     * Get all configuration
     */
    getAll: () => {
      return { ...config };
    },

    /**
     * Reset configuration
     */
    reset: () => {
      Object.keys(config).forEach(key => delete config[key]);
    },
  };
}

/**
 * Implementation for event system
 */
export function eventSystem() {
  type EventHandler = (...args: any[]) => void;
  const handlers: Record<string, EventHandler[]> = {};

  return {
    /**
     * Subscribe to an event
     */
    on: (eventName: string, handler: EventHandler) => {
      if (!handlers[eventName]) {
        handlers[eventName] = [];
      }

      handlers[eventName].push(handler);

      // Return unsubscribe function
      return () => {
        const index = handlers[eventName].indexOf(handler);
        if (index !== -1) {
          handlers[eventName].splice(index, 1);
        }
      };
    },

    /**
     * Emit an event
     */
    emit: (eventName: string, ...args: any[]) => {
      if (!handlers[eventName]) {
        return;
      }

      handlers[eventName].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}: ${error}`);
        }
      });
    },

    /**
     * Remove all handlers for an event
     */
    off: (eventName: string) => {
      delete handlers[eventName];
    },

    /**
     * Get count of subscribers for an event
     */
    subscriberCount: (eventName: string) => {
      return handlers[eventName]?.length || 0;
    },
  };
}
