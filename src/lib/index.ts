/**
 * Centralized utilities export 
 * This file exports all utilities from a single entry point to improve DRY principles
 */

// Re-export all utility modules
export * from './server-utils';
export * from './fs-utils';
export * from './plugin-utils';
export * from './path-utils';
export * from './hmr-utils';
export * from './error-utils';
export * from './watch-utils';
export * from './cache-utils';
export * from './content-processor-utils';
export * from './config-utils';
export * from './bunpress-config';
export * from './route-utils';

// Export common utility types from server-utils
export type { ServerConfig, RouteHandler as ServerRouteHandler } from './server-utils';

// Export types from watch-utils
export type { WatchOptions, FileChangeEvent, FileChangeHandler } from './watch-utils';

// Export types from plugin-utils
export type { Plugin } from './plugin-utils';

// Export types from cache-utils
export type { CacheOptions } from './cache-utils';

// Export types from content-processor-utils
export type { ContentProcessorOptions } from './content-processor-utils';

// Export types from config-utils
export type {
  ConfigSchema,
  ConfigOptions,
  ConfigValue,
  SchemaFieldOptions
} from './config-utils';

// Export types from bunpress-config
export type {
  BunPressConfig,
  ThemeConfig,
  DocumentationConfig,
  BundleConfig,
  NavigationItem,
  SidebarItem,
  PluginConfig
} from './bunpress-config';

// Export types from route-utils, avoiding name conflicts
export type {
  Route,
  RouteGroup,
  RouterOptions,
  RouteHandler,
  MiddlewareHandler
} from './route-utils';

// Export types from hmr-utils
export type {
  HmrContext,
  HmrClient,
  HmrEvent
} from './hmr-utils';

// Export types from error-utils
export type {
  ErrorCode,
  ErrorContext,
  ErrorHandler,
  BunPressError
} from './error-utils';

// Export servers
export { createDevServer, startDevServer } from '../core/dev-server';
export type { DevServerResult, DevServerConfig } from '../core/dev-server'; 