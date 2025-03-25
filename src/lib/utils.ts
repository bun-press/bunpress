/**
 * Shared utility functions used across the codebase
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with Tailwind's merge
 *
 * @param inputs Class name inputs to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safely access a nested property in an object
 *
 * @param obj The object to access
 * @param path The path to the property as a dot-separated string
 * @param defaultValue A default value if the property doesn't exist
 * @returns The property value or default value
 */
export function get<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue: T | null = null
): T | null {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === undefined || result === null || !result[key]) {
      return defaultValue;
    }
    result = result[key];
  }

  return result as T;
}

/**
 * Format a date string
 *
 * @param date Date string or Date object
 * @param locale Locale to use for formatting
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Slugify a string (for URLs, IDs, etc.)
 *
 * @param text Text to slugify
 * @returns Slugified text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Create a throttled function
 *
 * @param fn Function to throttle
 * @param delay Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Create a debounced function
 *
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Extracts the first paragraph from a string of markdown
 */
export function getExcerpt(content: string, maxLength = 160): string {
  // Remove HTML tags
  const text = content.replace(/<\/?[^>]+(>|$)/g, '');

  // Get first paragraph or truncate
  const excerpt = text.split('\n\n')[0] || text;

  if (excerpt.length <= maxLength) return excerpt;

  // Truncate to maxLength and ensure we don't cut words
  return (
    excerpt
      .slice(0, maxLength)
      .trim()
      .replace(/\s+\S*$/, '') + '...'
  );
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates the reading time of a text in minutes
 */
export function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
