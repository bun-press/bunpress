/**
 * Plugin utilities shared across the codebase
 */

import path from 'path';
import fs from 'fs';

/**
 * Types for plugin lifecycle hooks
 */
export type PluginInitHook = (options: any) => Promise<void> | void;
export type PluginContentHook = (content: any) => Promise<any> | any;
export type PluginBuildHook = (build: any) => Promise<any> | any;
export type PluginServerHook = (server: any) => Promise<any> | any;

/**
 * Plugin interface
 */
export interface Plugin {
  name: string;
  options?: Record<string, any>;
  onInit?: PluginInitHook;
  onContent?: PluginContentHook;
  onBuild?: PluginBuildHook;
  onServer?: PluginServerHook;
  [key: string]: any;
}

/**
 * Validate plugin configuration
 */
export function validatePlugin(plugin: any): plugin is Plugin {
  // Basic validation
  if (!plugin || typeof plugin !== 'object') {
    console.error('Invalid plugin: Plugin must be an object');
    return false;
  }

  // Name is required
  if (!plugin.name || typeof plugin.name !== 'string') {
    console.error('Invalid plugin: Plugin must have a name');
    return false;
  }

  // Lifecycle hooks must be functions if defined
  const hooks = ['onInit', 'onContent', 'onBuild', 'onServer'];
  for (const hook of hooks) {
    if (plugin[hook] !== undefined && typeof plugin[hook] !== 'function') {
      console.error(`Invalid plugin ${plugin.name}: ${hook} must be a function`);
      return false;
    }
  }

  return true;
}

/**
 * Normalize plugin options
 */
export function normalizePluginOptions(options: any): Record<string, any> {
  if (!options || typeof options !== 'object') {
    return {};
  }

  return options;
}

/**
 * Resolve plugin path - handles both built-in and external plugins
 */
export function resolvePluginPath(pluginName: string): string | null {
  // Handle built-in plugins (prefixed with @bunpress/)
  if (pluginName.startsWith('@bunpress/')) {
    const internalName = pluginName.replace('@bunpress/', '');
    const internalPath = path.join(process.cwd(), 'src', 'plugins', internalName);

    // Check internal path synchronously to avoid async complexity
    try {
      if (fs.existsSync(internalPath + '.ts') || fs.existsSync(internalPath + '/index.ts')) {
        return internalPath;
      }
    } catch (error) {
      // Ignore file system errors
    }
  }

  // Handle node_modules plugins
  try {
    // Try to resolve from node_modules
    const modulePath = require.resolve(pluginName, { paths: [process.cwd()] });
    return modulePath;
  } catch (error) {
    // Not found in node_modules
  }

  // Try local paths
  const localPaths = [
    // Absolute path
    pluginName,
    // Relative to current directory
    path.join(process.cwd(), pluginName),
    // Relative to plugins directory
    path.join(process.cwd(), 'plugins', pluginName),
  ];

  for (const localPath of localPaths) {
    try {
      if (
        fs.existsSync(localPath + '.ts') ||
        fs.existsSync(localPath + '.js') ||
        fs.existsSync(path.join(localPath, 'index.ts')) ||
        fs.existsSync(path.join(localPath, 'index.js'))
      ) {
        return localPath;
      }
    } catch (error) {
      // Ignore file system errors
    }
  }

  console.error(`Plugin not found: ${pluginName}`);
  return null;
}

/**
 * Execute plugin hook safely
 */
export async function executePluginHook<T>(
  plugin: Plugin,
  hookName: string,
  args: any
): Promise<T | undefined> {
  if (!plugin[hookName] || typeof plugin[hookName] !== 'function') {
    return undefined;
  }

  try {
    const result = await plugin[hookName](args);
    return result as T;
  } catch (error) {
    console.error(`Error executing ${hookName} hook in plugin ${plugin.name}:`, error);
    return undefined;
  }
}

/**
 * Execute multiple plugin hooks in sequence
 */
export async function executePluginHooks<T>(
  plugins: Plugin[],
  hookName: string,
  initialValue: T
): Promise<T> {
  let result = initialValue;

  for (const plugin of plugins) {
    if (plugin[hookName] && typeof plugin[hookName] === 'function') {
      try {
        const hookResult = await plugin[hookName](result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Error executing ${hookName} hook in plugin ${plugin.name}:`, error);
      }
    }
  }

  return result;
}

/**
 * Sort plugins by dependency order
 */
export function sortPluginsByDependencies(plugins: Plugin[]): Plugin[] {
  const sorted: Plugin[] = [];
  const visited = new Set<string>();

  // Helper function for topological sort
  function visit(plugin: Plugin) {
    if (visited.has(plugin.name)) {
      return;
    }

    visited.add(plugin.name);

    // Process dependencies if defined
    const dependencies = plugin.options?.dependencies || [];
    if (Array.isArray(dependencies)) {
      for (const depName of dependencies) {
        const depPlugin = plugins.find(p => p.name === depName);
        if (depPlugin) {
          visit(depPlugin);
        }
      }
    }

    sorted.push(plugin);
  }

  // Sort all plugins
  for (const plugin of plugins) {
    visit(plugin);
  }

  return sorted;
}
