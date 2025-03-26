/**
 * Watch utilities for file system monitoring
 * Centralizes file watching functionality for the dev server
 */

import { watch } from 'fs';
import { resolve, extname } from 'path';
import { ErrorCode, createFileSystemError, tryCatch } from './error-utils';
import { isFileIgnored } from './fs-utils';
import fs from 'fs';
import { EventEmitter } from 'events';
import { getNamespacedLogger } from './logger-utils';

// Try to import chokidar but make it optional
let chokidar: any;
try {
  // @ts-ignore
  chokidar = require('chokidar');
} catch (error) {
  // Chokidar not available, will fall back to native fs.watch
}

// Create namespaced logger for watch utils
const logger = getNamespacedLogger('watch-utils');

/**
 * Watch options for file watching
 */
export interface WatchOptions {
  /**
   * List of glob patterns to ignore
   */
  ignored?: string[];
  
  /**
   * Debounce time in milliseconds
   */
  debounceTime?: number;
  
  /**
   * Additional options for watch
   */
  options?: { recursive?: boolean; persistent?: boolean };
}

/**
 * Default watch options
 */
export const DEFAULT_WATCH_OPTIONS: WatchOptions = {
  ignored: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/*.js.map',
    '**/*.d.ts'
  ],
  debounceTime: 100,
  options: {
    recursive: true,
    persistent: true
  }
};

/**
 * File change event type
 */
export enum FileChangeType {
  ADDED = 'added',
  CHANGED = 'changed',
  REMOVED = 'removed'
}

/**
 * File change event
 */
export interface FileChangeEvent {
  /**
   * Type of file change
   */
  type: FileChangeType;
  
  /**
   * Path to the file that changed
   */
  path: string;
  
  /**
   * File extension
   */
  extension: string;
}

/**
 * File change handler function
 */
export type FileChangeHandler = (event: FileChangeEvent) => void | Promise<void>;

/**
 * Categorizes file changes based on extension
 */
export function categorizeFileChange(path: string, event: string): FileChangeEvent {
  const extension = extname(path).toLowerCase();
  let type: FileChangeType;
  
  if (event === 'rename') {
    // For rename events, we need to check if the file exists
    // Use fs.existsSync to avoid async complexity
    try {
      type = fs.existsSync(path) ? FileChangeType.ADDED : FileChangeType.REMOVED;
    } catch (error) {
      // If file can't be checked, assume it was removed
      type = FileChangeType.REMOVED;
    }
  } else {
    type = FileChangeType.CHANGED;
  }
  
  return { type, path, extension };
}

/**
 * Watch directory for file changes
 */
export async function watchDirectory(
  directoryPath: string,
  onFileChange: FileChangeHandler,
  options: WatchOptions = DEFAULT_WATCH_OPTIONS
): Promise<() => void> {
  const { ignored = [], debounceTime = 100 } = options;
  
  // Keep track of pending changes to debounce
  const pendingChanges = new Map<string, NodeJS.Timeout>();
  
  // Abort controller for cleanup
  const controller = new AbortController();
  const { signal } = controller;
  
  // Handle each file change
  const handleFileChange = (event: string, filename: string) => {
    if (!filename) return;
    
    // Normalize path
    const filePath = resolve(directoryPath, filename);
    
    // Skip ignored files
    if (ignored.length > 0 && isFileIgnored(filePath, ignored)) {
      return;
    }
    
    // Debounce changes to the same file
    if (pendingChanges.has(filePath)) {
      clearTimeout(pendingChanges.get(filePath));
    }
    
    pendingChanges.set(
      filePath,
      setTimeout(async () => {
        pendingChanges.delete(filePath);
        
        // Create file change event
        const changeEvent = categorizeFileChange(filePath, event);
        
        try {
          await onFileChange(changeEvent);
        } catch (error) {
          console.error(`Error handling file change: ${error}`);
        }
      }, debounceTime) as unknown as NodeJS.Timeout
    );
  };
  
  return await tryCatch(
    async () => {
      // Start watching the directory
      // Create proper WatchListener that handles null filename
      const watchListener = (event: string, filename: string | null) => {
        // Skip if no filename is provided
        if (!filename) return;
        
        handleFileChange(event, filename);
      };
      
      const watcher = watch(
        directoryPath,
        { recursive: true, ...options.options },
        watchListener
      );
      
      // Set up signal to abort
      signal.addEventListener('abort', () => {
        // Clear all pending timeouts
        pendingChanges.forEach(timeout => clearTimeout(timeout));
        pendingChanges.clear();
        
        // Close the watcher
        watcher.close();
      });
      
      // Return cleanup function
      return () => controller.abort();
    },
    (error) => {
      throw createFileSystemError(
        ErrorCode.PERMISSION_DENIED,
        `Failed to watch directory ${directoryPath}`,
        directoryPath,
        error
      );
    }
  );
}

/**
 * Watch event type
 */
export type WatchEvent = 'add' | 'change' | 'unlink';

/**
 * File watcher interface
 */
export interface FileWatcher extends EventEmitter {
  /**
   * Close the watcher
   */
  close: () => void;
}

// Create a class that extends EventEmitter with close method
class FileWatcherImpl extends EventEmitter implements FileWatcher {
  private cleanupFunctions: Array<() => void> = [];

  close(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  addCleanup(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }
}

/**
 * File watcher options
 */
export interface FileWatcherOptions {
  /**
   * List of glob patterns to ignore
   */
  ignored?: string[];
  
  /**
   * Whether to watch persistently
   */
  persistent?: boolean;
  
  /**
   * Delay in milliseconds between detecting a change and emitting an event
   */
  awaitWriteFinish?: number | boolean | { stabilityThreshold?: number; pollInterval?: number };
}

/**
 * Create a file watcher for multiple directories
 * Uses chokidar for robust cross-platform file watching
 * 
 * @param paths Directories or files to watch
 * @param options Watcher options
 * @returns File watcher instance
 */
export function createFileWatcher(
  paths: string | string[],
  options: FileWatcherOptions = {}
): FileWatcher {
  // Set default options
  const watchOptions = {
    persistent: options.persistent !== false,
    ignoreInitial: true,
    awaitWriteFinish: options.awaitWriteFinish || {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  };
  
  // Initialize watcher
  let watcher: any;
  
  try {
    // Create an emitter that will be our returned watcher
    const emitter = new FileWatcherImpl();
    
    logger.debug(`Creating file watcher for: ${Array.isArray(paths) ? paths.join(', ') : paths}`);
    
    if (typeof chokidar !== 'undefined') {
      // Use chokidar if available (more robust cross-platform watching)
      watcher = chokidar.watch(paths, {
        ...watchOptions,
        ignored: options.ignored
      });
      
      // Forward events from chokidar to our emitter
      watcher.on('add', (path: string, stats: fs.Stats) => {
        logger.debug(`File added: ${path}`);
        emitter.emit('add', path, stats);
      });
      
      watcher.on('change', (path: string, stats: fs.Stats) => {
        logger.debug(`File changed: ${path}`);
        emitter.emit('change', path, stats);
      });
      
      watcher.on('unlink', (path: string) => {
        logger.debug(`File removed: ${path}`);
        emitter.emit('unlink', path);
      });
      
      watcher.on('error', (error: Error) => {
        logger.error(`Watcher error: ${error.message}`);
        emitter.emit('error', error);
      });
      
      // Add close method to emitter
      emitter.addCleanup(() => watcher.close());
      
      return emitter;
    } else {
      // Fallback to simpler implementation if chokidar not available
      logger.warn('Chokidar not available, falling back to basic file watching');
      
      // Convert to array if not already
      const pathsArray = Array.isArray(paths) ? paths : [paths];
      
      // Watch each directory
      for (const dirPath of pathsArray) {
        // Set up watch for this directory
        watchDirectory(
          dirPath,
          (event) => {
            if (event.type === FileChangeType.ADDED) {
              emitter.emit('add', event.path);
            } else if (event.type === FileChangeType.CHANGED) {
              emitter.emit('change', event.path);
            } else if (event.type === FileChangeType.REMOVED) {
              emitter.emit('unlink', event.path);
            }
          },
          { 
            ignored: options.ignored,
            options: { 
              recursive: true, 
              persistent: options.persistent !== false 
            }
          }
        ).then(cleanup => {
          emitter.addCleanup(cleanup);
        }).catch(error => {
          logger.error(`Error setting up watcher for ${dirPath}:`, error);
        });
      }
      
      return emitter;
    }
  } catch (error) {
    logger.error('Error creating file watcher:', error as Record<string, any>);
    throw createFileSystemError(ErrorCode.PERMISSION_DENIED, 'Failed to create file watcher', String(error));
  }
}

/**
 * Create a basic file watcher for multiple directories
 * Uses native fs.watch for file watching
 * 
 * @param paths Directories or files to watch
 * @returns File watcher instance
 */
export function createBasicWatcher(
  paths: string | string[]
): FileWatcher {
  const watchDirs = Array.isArray(paths) ? paths : [paths];
  
  try {
    const watcher = new FileWatcherImpl();
    logger.debug(`Created file watcher for: ${watchDirs.join(', ')}`);
    return watcher;
  } catch (error) {
    logger.error('Error creating file watcher:', error as Record<string, any>);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createFileSystemError(
      ErrorCode.PERMISSION_DENIED,
      'Failed to create file watcher',
      errorMessage
    );
  }
} 