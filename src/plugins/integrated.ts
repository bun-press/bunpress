/**
 * Integrated Plugin for BunPress
 *
 * This plugin integrates all the core functionality of BunPress.
 */

import { Plugin } from '../core/plugin';
import { createIntegratedSystem } from '../integrated';
import type { BunPressConfig } from '../../bunpress.config';

/**
 * Create the integrated plugin
 */
export function createIntegratedPlugin(options?: { workspaceRoot?: string }): Plugin {
  // Store the integrated system
  let system: any = null;

  return {
    name: 'integrated',
    options,

    /**
     * Initialize the integrated system
     */
    onInit: async (config?: BunPressConfig) => {
      const workspaceRoot = options?.workspaceRoot || process.cwd();

      if (!config) {
        console.warn('No configuration provided to integrated plugin');
        return;
      }

      // Create the integrated system
      system = createIntegratedSystem(workspaceRoot, config);

      console.log('Integrated plugin initialized with workspace root:', workspaceRoot);
    },

    /**
     * Process content through the integrated system
     */
    transform: async content => {
      if (!system) {
        // If system isn't initialized, return content unchanged
        return content;
      }

      try {
        // Use the renderer from the integrated system
        const processedContent = await system.renderer.renderContent(content);
        return processedContent;
      } catch (error) {
        console.error('Error transforming content with integrated system:', error);
        return content;
      }
    },

    /**
     * Configure the development server
     */
    configureServer: async server => {
      if (!system) {
        console.warn('Integrated system not initialized when configuring server');
        return;
      }

      try {
        // Integrate with the server
        system.server.configure(server);
      } catch (error) {
        console.error('Error configuring server with integrated system:', error);
      }
    },

    /**
     * Process during build
     */
    onBuild: async () => {
      if (!system) {
        console.warn('Integrated system not initialized during build');
        return;
      }

      try {
        // Run the build process
        await system.builder.prepare();
      } catch (error) {
        console.error('Error during build with integrated system:', error);
      }
    },
  };
}

// Export plugin
export const plugins = {
  integrated: createIntegratedPlugin,
};

export default createIntegratedPlugin;
