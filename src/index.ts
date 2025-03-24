import { startDevServer } from './core/dev-server';
import { loadConfig } from './core/config-loader';
import { ContentProcessor } from './core/content-processor';
import { buildSite } from './core/builder';
import path from 'path';

async function main() {
  try {
    // Check for command-line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    // Load configuration and plugins
    const { config, pluginManager } = await loadConfig();
    
    // Initialize content processor with plugins
    const contentProcessor = new ContentProcessor({ plugins: pluginManager });
    
    // Log loaded plugins
    console.log(`Loaded ${pluginManager.plugins.length} plugins:`);
    pluginManager.plugins.forEach(plugin => {
      console.log(`- ${plugin.name}`);
    });
    
    // Execute different commands based on input
    if (command === 'build') {
      // Build site
      await buildSite(config, pluginManager);
    } else {
      // Default to dev server
      // Execute build start hooks
      await pluginManager.executeBuildStart();
      
      // Start the development server
      const { server, watcher } = startDevServer(config, pluginManager);
      
      // Handle server shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        
        // Execute build end hooks
        await pluginManager.executeBuildEnd();
        
        // Close watcher
        watcher.close();
        
        // Exit process
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Error starting BunPress:', error);
    process.exit(1);
  }
}

main(); 