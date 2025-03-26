/**
 * BunPress Plugins System
 *
 * This file exports all available plugins for easy consumption.
 */

// Core plugin types
export * from '../core/plugin';

// Import plugins
import markdownItPlugin from './markdown-it';
import prismPlugin from './prism';
import analyticsPlugin from './analytics';
import seoPlugin from './seo';
import rssFeedPlugin from './rss-feed';
import searchIndexPlugin from './search-index';
import imageOptimizerPlugin from './image-optimizer';
import themeRegistryPlugin from './theme-registry';
import i18nPlugin from './i18n';
import { createIntegratedPlugin } from './integrated';

// Export plugins
export { markdownItPlugin };
export { prismPlugin };
export { analyticsPlugin };
export { seoPlugin };
export { rssFeedPlugin };
export { searchIndexPlugin };
export { imageOptimizerPlugin };
export { themeRegistryPlugin };
export { i18nPlugin };
export { createIntegratedPlugin };

// Core plugin collection
export const corePlugins = {
  markdownIt: markdownItPlugin,
  prism: prismPlugin,
  analytics: analyticsPlugin,
  seo: seoPlugin,
  rssFeed: rssFeedPlugin,
  searchIndex: searchIndexPlugin,
  imageOptimizer: imageOptimizerPlugin,
  themeRegistry: themeRegistryPlugin,
  i18n: i18nPlugin,
  integrated: createIntegratedPlugin,
};

export default corePlugins;
