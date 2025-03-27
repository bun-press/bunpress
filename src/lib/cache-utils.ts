/**
 * Cache utilities for content and data caching
 * Centralizes caching functionality across the application
 */

import { getFileModTime } from './fs-utils';
import { ContentFile } from './content-utils';

/**
 * Cache entry with modification time tracking
 */
interface CacheEntry<T> {
  /**
   * The cached data
   */
  data: T;

  /**
   * Time when the data was last modified/cached
   */
  modifiedTime: Date;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * Maximum number of items to store in the cache
   * When exceeded, least recently used items are evicted
   */
  maxSize?: number;

  /**
   * Time-to-live in milliseconds
   * Items older than this will be considered stale
   */
  ttl?: number;
}

/**
 * Content cache implementation with time-based invalidation
 */
export class ContentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private options: Required<CacheOptions>;

  /**
   * Create a new content cache
   */
  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 100,
      ttl: options.ttl || 60000, // Default 1 minute TTL
    };
  }

  /**
   * Get an item from the cache
   *
   * @param key Cache key
   * @returns Cached item or undefined if not found or stale
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    // Return undefined if not in cache
    if (!entry) {
      return undefined;
    }

    // Check for TTL expiration
    if (this.isExpired(entry)) {
      this.remove(key);
      return undefined;
    }

    // Update access order for LRU tracking
    this.updateAccessOrder(key);

    return entry.data;
  }

  /**
   * Put an item in the cache
   *
   * @param key Cache key
   * @param data Data to cache
   * @param modifiedTime Optional modification time (defaults to now)
   */
  set(key: string, data: T, modifiedTime?: Date): void {
    // Ensure we have space in the cache
    this.ensureCapacity();

    // Store the item
    this.cache.set(key, {
      data,
      modifiedTime: modifiedTime || new Date(),
    });

    // Update access order
    this.updateAccessOrder(key);
  }

  /**
   * Check if a file-based cache entry is still fresh
   *
   * @param key Cache key
   * @param filePath Path to the file to check modification time
   * @returns True if the cache entry exists and is fresh
   */
  async isFresh(key: string, filePath: string): Promise<boolean> {
    const entry = this.cache.get(key);

    // Not in cache
    if (!entry) {
      return false;
    }

    // Check for TTL expiration
    if (this.isExpired(entry)) {
      this.remove(key);
      return false;
    }

    // Get file modification time
    const fileModTime = await getFileModTime(filePath);

    // File doesn't exist or can't get mod time
    if (!fileModTime) {
      this.remove(key);
      return false;
    }

    // Compare modification times
    if (fileModTime > entry.modifiedTime) {
      this.remove(key);
      return false;
    }

    // Update access order for LRU tracking
    this.updateAccessOrder(key);

    return true;
  }

  /**
   * Remove an item from the cache
   *
   * @param key Cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if cache has a key
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Check if an entry is expired based on TTL
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (this.options.ttl <= 0) {
      return false; // No TTL enforcement
    }

    const now = new Date();
    const age = now.getTime() - entry.modifiedTime.getTime();
    return age > this.options.ttl;
  }

  /**
   * Update the access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to the end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Ensure the cache doesn't exceed capacity
   */
  private ensureCapacity(): void {
    while (this.cache.size >= this.options.maxSize) {
      // Remove least recently used item
      const oldest = this.accessOrder[0];
      if (oldest) {
        this.remove(oldest);
      } else {
        break;
      }
    }
  }
}

/**
 * Cache specifically for ContentFile objects
 * Adds content-specific features to the base ContentCache
 */
export class MarkdownCache extends ContentCache<ContentFile> {
  /**
   * Create a cache key from a file path
   *
   * @param filePath Path to the file
   * @returns Cache key
   */
  static createCacheKey(filePath: string): string {
    return `content:${filePath}`;
  }

  /**
   * Check if a content file is in the cache and fresh
   *
   * @param filePath Path to the content file
   * @returns True if the file is cached and fresh
   */
  async isContentFresh(filePath: string): Promise<boolean> {
    const key = MarkdownCache.createCacheKey(filePath);
    return this.isFresh(key, filePath);
  }

  /**
   * Get content from cache
   *
   * @param filePath Path to the content file
   * @returns Cached content or undefined if not found
   */
  getContent(filePath: string): ContentFile | undefined {
    const key = MarkdownCache.createCacheKey(filePath);
    return this.get(key);
  }

  /**
   * Store content in cache
   *
   * @param filePath Path to the content file
   * @param content Content file to cache
   * @param modTime Optional modification time (defaults to now)
   */
  setContent(filePath: string, content: ContentFile, modTime?: Date): void {
    const key = MarkdownCache.createCacheKey(filePath);
    this.set(key, content, modTime);
  }

  /**
   * Remove content from cache
   *
   * @param filePath Path to the content file
   */
  removeContent(filePath: string): void {
    const key = MarkdownCache.createCacheKey(filePath);
    this.remove(key);
  }

  /**
   * Check if content is in the cache
   *
   * @param filePath Path to the content file
   * @returns True if the file is in the cache
   */
  hasContent(filePath: string): boolean {
    const key = MarkdownCache.createCacheKey(filePath);
    return this.has(key);
  }
}
