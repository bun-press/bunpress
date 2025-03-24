// Export all built-in plugins
import analyticsPlugin from './analytics';
import i18nPlugin from './i18n';
import imageOptimizerPlugin from './image-optimizer';
import markdownItPlugin from './markdown-it';
import prismPlugin from './prism';
import rssFeedPlugin from './rss-feed';
import searchIndexPlugin from './search-index';
import seoPlugin from './seo';

// Re-export plugins
export {
  analyticsPlugin,
  i18nPlugin,
  imageOptimizerPlugin,
  markdownItPlugin,
  prismPlugin,
  rssFeedPlugin,
  searchIndexPlugin,
  seoPlugin
};

// Export types
export type { AnalyticsOptions } from './analytics';
export type { I18nOptions } from './i18n';
export type { 
  ImageFormat, 
  ImageSize, 
  ImageOptimizerOptions 
} from './image-optimizer'; 

export type {
  RssFeedOptions
} from './rss-feed';

export type {
  SearchIndexOptions
} from './search-index';

export type {
  SeoOptions
} from './seo'; 