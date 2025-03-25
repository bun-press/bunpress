import type { BunPressConfig } from '../bunpress.config';
import type { Plugin } from './core/plugin';

/**
 * Helper function to define a BunPress configuration with type checking
 */
export function defineConfig(config: BunPressConfig): BunPressConfig {
  return config;
}

/**
 * Helper function to define a BunPress plugin with type checking
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}
