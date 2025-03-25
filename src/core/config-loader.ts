import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { Plugin, PluginManager, DefaultPluginManager } from './plugin';

export interface ConfigLoaderOptions {
  configPath?: string;
  rootDir?: string;
}

export async function loadConfig(options: ConfigLoaderOptions = {}): Promise<{
  config: BunPressConfig;
  pluginManager: PluginManager;
}> {
  const rootDir = options.rootDir || process.cwd();
  const configPath = options.configPath || path.join(rootDir, 'bunpress.config.ts');
  
  // Import the config file
  let config: BunPressConfig;
  try {
    const importedConfig = await import(configPath);
    // Handle both default export and named export
    config = (importedConfig.default || importedConfig) as BunPressConfig;
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    throw new Error(`Failed to load configuration from ${configPath}`);
  }
  
  // Create a plugin manager
  const pluginManager = new DefaultPluginManager();
  
  // Load and initialize the plugins
  for (const pluginConfig of config.plugins) {
    try {
      // Determine if it's a built-in plugin or an external one
      let plugin: Plugin;
      
      if (pluginConfig.name.startsWith('@bunpress/')) {
        // Built-in plugin with @bunpress/ prefix
        const pluginName = pluginConfig.name.replace('@bunpress/', '');
        const pluginModule = await import(`../plugins/${pluginName}`);
        
        // Initialize the plugin with options
        plugin = pluginModule.default(pluginConfig.options || {});
      } else if (pluginConfig.name === 'prism') {
        // Special case for prism plugin which exports as prismPlugin
        const pluginModule = await import('../plugins/prism');
        plugin = pluginModule.default(pluginConfig.options || {});
      } else {
        try {
          // Try to load as a built-in plugin first
          const pluginModule = await import(`../plugins/${pluginConfig.name}`);
          plugin = pluginModule.default(pluginConfig.options || {});
        } catch (error) {
          // If that fails, try to load as an external plugin from node_modules
          const pluginModule = await import(pluginConfig.name);
          plugin = pluginModule.default(pluginConfig.options || {});
        }
      }
      
      // Add the plugin to the manager
      pluginManager.addPlugin(plugin);
      console.log(`Loaded plugin: ${pluginConfig.name}`);
    } catch (error) {
      console.error(`Error loading plugin ${pluginConfig.name}:`, error);
      throw new Error(`Failed to load plugin: ${pluginConfig.name}`);
    }
  }
  
  return {
    config,
    pluginManager,
  };
} 