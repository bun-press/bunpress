/**
 * BunPress Plugin System
 * 
 * This file exports all plugins and provides a unified API for plugin registration.
 */

import { Plugin } from '../core/plugin';
import { definePlugin } from '../config';

// Import all built-in plugins
import markdownItPlugin from './markdown-it';
import prismPlugin from './prism';
import seoPlugin from './seo';
import rssFeedPlugin from './rss-feed';
import imageOptimizerPlugin from './image-optimizer';
import searchIndexPlugin from './search-index';
import analyticsPlugin from './analytics';
import themeRegistryPlugin from './theme-registry';
import i18nPlugin from './i18n';
import { createIntegratedPlugin } from './integrated';

// Extract options types from plugins
type MarkdownPluginOptions = Parameters<typeof markdownItPlugin>[0];
type PrismPluginOptions = Parameters<typeof prismPlugin>[0];
type SeoPluginOptions = Parameters<typeof seoPlugin>[0];
type RssFeedPluginOptions = Parameters<typeof rssFeedPlugin>[0]; 
type ImageOptimizerPluginOptions = Parameters<typeof imageOptimizerPlugin>[0];
type SearchIndexPluginOptions = Parameters<typeof searchIndexPlugin>[0];
type AnalyticsPluginOptions = Parameters<typeof analyticsPlugin>[0];
type ThemeRegistryPluginOptions = Parameters<typeof themeRegistryPlugin>[0];
type I18nPluginOptions = Parameters<typeof i18nPlugin>[0];

/**
 * Plugin catalog for all built-in plugins
 */
export const plugins = {
  // Content Plugins
  markdownIt: markdownItPlugin,
  prism: prismPlugin,
  
  // SEO & Discovery
  seo: seoPlugin,
  rssFeed: rssFeedPlugin,
  searchIndex: searchIndexPlugin,
  
  // Performance & Media
  imageOptimizer: imageOptimizerPlugin,
  
  // Analytics
  analytics: analyticsPlugin,
  
  // Core functionality
  themeRegistry: themeRegistryPlugin,
  i18n: i18nPlugin,
  integrated: createIntegratedPlugin
};

// Helper types for autocomplete and type checking
export type PluginCreator<T> = (options?: T) => Plugin;

// Re-export plugin types for better DX
export type {
  MarkdownPluginOptions,
  PrismPluginOptions,
  SeoPluginOptions,
  RssFeedPluginOptions,
  ImageOptimizerPluginOptions,
  SearchIndexPluginOptions,
  AnalyticsPluginOptions,
  ThemeRegistryPluginOptions,
  I18nPluginOptions
};

// Re-export plugin creators with shorter names for convenience
export {
  markdownItPlugin,
  prismPlugin,
  seoPlugin,
  rssFeedPlugin,
  imageOptimizerPlugin,
  searchIndexPlugin,
  analyticsPlugin,
  themeRegistryPlugin,
  i18nPlugin
};

// Integrated plugins that combine multiple plugins
export { createIntegratedPlugin };

/**
 * Create a custom plugin with the proper type definitions
 */
export function createPlugin<T>(
  name: string,
  factory: (options?: T) => Plugin
): PluginCreator<T> {
  return (options?: T) => {
    const plugin = factory(options);
    return definePlugin({
      ...plugin,
      name: plugin.name || name,
    });
  };
}

/**
 * Plugin Manager - tracks registered plugins and handles execution
 */
export class PluginManager {
  private plugins: Plugin[] = [];
  
  /**
   * Register a plugin with the manager
   */
  register(plugin: Plugin): void {
    this.plugins.push(plugin);
  }
  
  /**
   * Register multiple plugins at once
   */
  registerAll(plugins: Plugin[]): void {
    this.plugins.push(...plugins);
  }
  
  /**
   * Execute the transform hook for all plugins
   */
  async executeTransform(content: string, _context: any = {}): Promise<string> {
    let result = content;
    
    // Execute transform hooks on all registered plugins
    for (const plugin of this.plugins) {
      if (plugin.transform) {
        result = await plugin.transform(result);
      }
    }
    
    return result;
  }
  
  /**
   * Execute the buildStart hook for all plugins
   */
  async executeBuildStart(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildStart) {
        await plugin.buildStart();
      }
    }
  }
  
  /**
   * Execute the buildEnd hook for all plugins
   */
  async executeBuildEnd(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildEnd) {
        await plugin.buildEnd();
      }
    }
  }
  
  /**
   * Execute the configureServer hook for all plugins
   */
  async executeConfigureServer(server: any): Promise<any> {
    let serverConfig = server;
    
    for (const plugin of this.plugins) {
      if (plugin.configureServer) {
        await plugin.configureServer(serverConfig);
      }
    }
    
    return serverConfig;
  }
  
  /**
   * Execute the processContentFile hook for all plugins
   */
  async executeProcessContentFile(file: any): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.processContentFile) {
        await plugin.processContentFile(file);
      }
    }
  }
  
  /**
   * Execute the registerThemes hook for all plugins
   */
  async executeRegisterThemes(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.registerThemes) {
        await plugin.registerThemes();
      }
    }
  }
  
  /**
   * Execute a specific hook for all plugins
   */
  async executeHook(hook: keyof Plugin, ...args: any[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const plugin of this.plugins) {
      const hookFn = plugin[hook];
      if (typeof hookFn === 'function') {
        // @ts-ignore - We're checking if it's a function above
        results.push(await hookFn(...args));
      }
    }
    
    return results;
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }
  
  /**
   * Get a plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find(plugin => plugin.name === name);
  }
}

/**
 * Create a new plugin manager
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}
