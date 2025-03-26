/**
 * Watch utilities for file system monitoring
 * Centralizes file watching functionality for the dev server
 */

import { watch } from 'fs';
import { resolve, extname } from 'path';
import { ErrorCode, createFileSystemError, tryCatch } from './error-utils';
import { isFileIgnored, fileExists } from './fs-utils';

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
    type = fileExists(path) ? FileChangeType.ADDED : FileChangeType.REMOVED;
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
      }, debounceTime)
    );
  };
  
  return await tryCatch(
    async () => {
      // Start watching the directory
      const watcher = watch(
        directoryPath,
        { recursive: true, ...options.options },
        handleFileChange
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