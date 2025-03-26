import path from 'path';
import type { BunPressConfig } from '../../bunpress.config';
import { Plugin, PluginManager, DefaultPluginManager } from './plugin';

// Import error handling utilities
import {
  ErrorCode,
  tryCatchWithCode,
  BunPressError
} from '../lib/error-utils';

// Import logger
import { getNamespacedLogger } from '../lib/logger-utils';

// Import config utilities
import { 
  validateConfig,
  mergeConfigWithDefaults
} from '../lib/config-utils';

// Create namespaced logger for config loader
const logger = getNamespacedLogger('config-loader');

export interface ConfigLoaderOptions {
  configPath?: string;
  rootDir?: string;
}

export async function loadConfig(options: ConfigLoaderOptions = {}): Promise<{
  config: BunPressConfig;
  pluginManager: PluginManager;
}> {
  return await tryCatchWithCode(
    async () => {
      const rootDir = options.rootDir || process.cwd();
      const configPath = options.configPath || path.join(rootDir, 'bunpress.config.ts');
      
      logger.info(`Loading config from ${configPath}`);

      // Import the config file
      let config: BunPressConfig;
      try {
        const importedConfig = await import(configPath);
        // Handle both default export and named export
        config = (importedConfig.default || importedConfig) as BunPressConfig;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Error loading config from ${configPath}:`, { error: errorMsg });
        throw new BunPressError(
          ErrorCode.CONFIG_NOT_FOUND,
          `Failed to load configuration from ${configPath}`,
          { configPath, error }
        );
      }

      // Validate and merge with defaults if config utils are available
      try {
        const mergedConfig = mergeConfigWithDefaults(config);
        const validatedConfig = validateConfig(mergedConfig);
        
        // Create a plugin manager with plugins from the configuration 
        const pluginManager = new DefaultPluginManager();
        
        // Register plugins if they exist in the config
        if (validatedConfig.plugins && Array.isArray(validatedConfig.plugins)) {
          for (const pluginConfig of validatedConfig.plugins) {
            // Create a plugin instance from config
            const plugin: Plugin = {
              name: pluginConfig.name,
              options: pluginConfig.options || {}
            };
            
            // Add the plugin to the manager
            pluginManager.addPlugin(plugin);
          }
        }

        // Return the fully processed configuration and plugin manager
        return {
          config: validatedConfig,
          pluginManager,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn('Error validating or merging config, using as-is:', { error: errorMsg });
        
        // Return the original config as a fallback
        return {
          config: config as any,
          pluginManager: new DefaultPluginManager(),
        };
      }
    },
    ErrorCode.CONFIG_PARSE_ERROR,
    'Failed to load and parse configuration',
    options
  );
}
