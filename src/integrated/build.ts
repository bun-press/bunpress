/**
 * BunPress Integrated build Module
 *
 * This file consolidates related functionality from:
 * builder.ts, bundler.ts, css-processor.ts
 */

// Export from consolidated modules

export * from '../core/builder';
export * from '../core/bundler';
export * from '../core/css-processor';

/**
 * Integrated build system implementation for BunPress
 *
 * This file provides the implementation for the build system that generates
 * the static site output.
 */

import path from 'path';
import fs from 'fs';

// Interface for the build system
export interface BuildSystem {
  build(options?: { outputDir?: string }): Promise<BuildResult>;
  clean(outputDir?: string): Promise<boolean>;
}

// Build result interface
export interface BuildResult {
  outputDir: string;
  filesGenerated: string[];
  timeElapsed: number;
  success: boolean;
  errors?: string[];
}

/**
 * Creates a build system for BunPress
 */
export function createBuildSystem({
  renderer,
  config,
  pluginManager,
  events,
}: {
  renderer: any;
  config: any;
  pluginManager: any;
  events: any;
}): BuildSystem {
  return {
    /**
     * Build the static site
     */
    async build(options?: { outputDir?: string }): Promise<BuildResult> {
      const startTime = Date.now();
      const outputDir = options?.outputDir || config.outputDir;
      const contentDir = config.contentDir || config.pagesDir;
      const errors: string[] = [];

      try {
        // Clean output directory first
        await this.clean(outputDir);

        // Trigger build start hooks
        await pluginManager.executeBuildStart();

        // Emit event
        events.emit('build:start', { outputDir, contentDir });

        // Create output directory
        await fs.promises.mkdir(outputDir, { recursive: true });

        // Copy static assets
        const publicDir = path.join(process.cwd(), 'public');
        await copyDirectory(publicDir, outputDir);

        // Generate content pages
        const filesGenerated = await renderer.renderAllContent(contentDir, outputDir);

        // Generate CSS file
        // TODO: Implement CSS generation and bundling
        const cssContent =
          '/* Base styles */\n* { box-sizing: border-box; }\nbody { font-family: sans-serif; }';
        await fs.promises.writeFile(path.join(outputDir, 'styles.css'), cssContent);
        filesGenerated.push(path.join(outputDir, 'styles.css'));

        // Generate JS file
        // TODO: Implement JS bundling
        const jsContent = '/* BunPress JS */\nconsole.log("BunPress site loaded");';
        await fs.promises.writeFile(path.join(outputDir, 'app.js'), jsContent);
        filesGenerated.push(path.join(outputDir, 'app.js'));

        // Trigger build end hooks
        await pluginManager.executeBuildEnd();

        // Emit event
        events.emit('build:complete', {
          outputDir,
          filesGenerated,
          timeElapsed: Date.now() - startTime,
        });

        return {
          outputDir,
          filesGenerated,
          timeElapsed: Date.now() - startTime,
          success: true,
        };
      } catch (error) {
        console.error('Build error:', error);

        // Emit event
        events.emit('build:error', { error });

        if (error instanceof Error) {
          errors.push(error.message);
        } else {
          errors.push(String(error));
        }

        return {
          outputDir,
          filesGenerated: [],
          timeElapsed: Date.now() - startTime,
          success: false,
          errors,
        };
      }
    },

    /**
     * Clean the output directory
     */
    async clean(outputDir?: string): Promise<boolean> {
      const dir = outputDir || config.outputDir;

      try {
        // Check if directory exists
        try {
          await fs.promises.access(dir);
        } catch {
          // Directory doesn't exist, nothing to clean
          return true;
        }

        // Emit event
        events.emit('build:clean', { outputDir: dir });

        // Remove directory contents
        await fs.promises.rm(dir, { recursive: true, force: true });

        return true;
      } catch (error) {
        console.error(`Error cleaning directory ${dir}:`, error);
        return false;
      }
    },
  };
}

/**
 * Helper to copy a directory recursively
 */
async function copyDirectory(source: string, destination: string): Promise<void> {
  try {
    // Check if source exists
    try {
      await fs.promises.access(source);
    } catch {
      // Source doesn't exist, nothing to copy
      return;
    }

    // Create destination if it doesn't exist
    await fs.promises.mkdir(destination, { recursive: true });

    // Get all entries in source
    const entries = await fs.promises.readdir(source, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying directory from ${source} to ${destination}:`, error);
    throw error;
  }
}
