import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes and handles conflicts intelligently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Slugifies a string for use in URLs and IDs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  return excerpt.slice(0, maxLength).trim().replace(/\s+\S*$/, '') + '...';
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