/**
 * BunPress Plugin System
 *
 * This file exports all available plugins for easy consumption.
 */

// Core plugin types
export * from '../core/plugin';

// Built-in plugins
export * from './markdown-it';
export * from './image-optimizer';
export * from './seo';
export * from './rss-feed';
export * from './search-index';
export * from './prism';
export * from './i18n';
export * from './analytics';

// Export types
export type { AnalyticsOptions } from './analytics';
export type { I18nOptions } from './i18n';
export type { ImageFormat, ImageSize, ImageOptimizerOptions } from './image-optimizer';

export type { MarkdownItOptions } from './markdown-it';

export type { RssFeedOptions } from './rss-feed';

export type { SearchIndexOptions } from './search-index';

export type { SeoOptions } from './seo';
