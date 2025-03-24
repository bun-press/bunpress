// Export all built-in plugins
import imageOptimizerPlugin from './image-optimizer';
import markdownItPlugin from './markdown-it';
import prismPlugin from './prism';
import rssFeedPlugin from './rss-feed';
import searchIndexPlugin from './search-index';
import seoPlugin from './seo';

// Re-export plugins
export {
  imageOptimizerPlugin,
  markdownItPlugin,
  prismPlugin,
  rssFeedPlugin,
  searchIndexPlugin,
  seoPlugin
};

// Export types
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