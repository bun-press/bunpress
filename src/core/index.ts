/**
 * Core BunPress functionality
 * This file exports all core components in a unified API
 */

// Re-export core components from sub-modules
export * from './plugin';
export * from './content-processor';
export * from './slot-system';
export * from './theme-manager';
export * from './fullstack-server';
export * from './dev-server';
export * from './builder';
export * from './bundler';
export * from './router';
export * from './config-loader';
export * from './hmr';
export * from './css-processor';
export * from './path-aliases';
export * from './renderer';

// Default configuration
export const defaultConfig = {
  pagesDir: 'pages',
  outputDir: 'dist',
  publicDir: 'public',
  componentsDir: 'components',
  themesDir: 'themes',
  devServer: {
    port: 3000,
    host: 'localhost',
    hmrPort: 3030,
    hmrHost: 'localhost',
  },
  build: {
    minify: true,
    sourcemap: false,
    bundleAnalyzer: false,
  },
  plugins: [],
};
