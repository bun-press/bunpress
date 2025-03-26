/**
 * BunPress configuration utilities
 * Provides a type-safe configuration manager for BunPress
 */

import { join } from 'path';
import { createConfig, ConfigSchema, loadEnvFile } from './config-utils';
import { NavigationItem as BaseNavigationItem, SidebarItem as BaseSidebarItem, SidebarSubItem } from './ui-utils';

/**
 * BunPress development server configuration
 */
export interface DevServerConfig {
  /**
   * Port to run the development server on
   */
  port: number;
  
  /**
   * Hostname to bind to
   */
  hostname: string;
  
  /**
   * HMR port
   */
  hmrPort: number;
  
  /**
   * HMR hostname
   */
  hmrHostname: string;
  
  /**
   * Whether to open the browser automatically
   */
  open: boolean;
  
  /**
   * Whether to enable HMR
   */
  hmr: boolean;
}

/**
 * BunPress bundle configuration
 */
export interface BundleConfig {
  /**
   * Whether to minify assets
   */
  minify: boolean;
  
  /**
   * Whether to generate source maps
   */
  sourcemap: boolean;
  
  /**
   * Whether to enable code splitting
   */
  splitting: boolean;
  
  /**
   * Whether to hash asset filenames
   */
  assetHashing: boolean;
  
  /**
   * Public path for assets
   */
  publicPath: string;
  
  /**
   * Bundle target
   */
  target: 'browser' | 'bun' | 'node';
  
  /**
   * Bundle format
   */
  format: 'esm' | 'cjs' | 'iife';
  
  /**
   * Whether to enable CSS chunking
   */
  cssChunking: boolean;
}

/**
 * BunPress theme configuration
 */
export interface ThemeConfig {
  /**
   * Name of the theme
   */
  name: string;
  
  /**
   * Theme options
   */
  options?: Record<string, any>;
}

/**
 * BunPress documentation configuration
 */
export interface DocumentationConfig {
  /**
   * Whether to show the edit link
   */
  showEditLink: boolean;
  
  /**
   * Whether to show the last updated timestamp
   */
  showLastUpdated: boolean;
  
  /**
   * Whether to show navigation
   */
  showNavigation: boolean;
  
  /**
   * Whether to show the table of contents
   */
  showTOC: boolean;
  
  /**
   * Whether to show the sidebar
   */
  showSidebar: boolean;
  
  /**
   * Table of contents heading levels to include
   */
  tocLevels: [number, number];
  
  /**
   * Base URL for edit links
   */
  editLinkBase?: string;
}

/**
 * BunPress navigation item extending base navigation item
 */
export interface NavigationItem extends BaseNavigationItem {
  /**
   * Item text label
   */
  label: string;
  
  /**
   * Item URL
   */
  url: string;
  
  /**
   * Whether the item is active
   */
  active?: boolean;
  
  /**
   * Whether the link is external
   */
  external?: boolean;
  
  /**
   * Child items
   */
  items?: NavigationItem[];
}

/**
 * BunPress sidebar item extending base sidebar item
 */
export interface SidebarItem extends BaseSidebarItem {
  /**
   * Item URL (using url property from ui-utils)
   */
  url: string;
  
  /**
   * Whether the section is collapsed
   */
  collapsed?: boolean;
  
  /**
   * Whether the item is active
   */
  active?: boolean;
  
  /**
   * Whether the link is external
   */
  external?: boolean;
  
  /**
   * Child items
   */
  items?: SidebarSubItem[];
}

/**
 * BunPress plugin configuration
 */
export interface PluginConfig {
  /**
   * Plugin name
   */
  name: string;
  
  /**
   * Plugin options
   */
  options?: Record<string, any>;
}

/**
 * BunPress configuration
 */
export interface BunPressConfig {
  /**
   * Site title
   */
  title: string;
  
  /**
   * Site description
   */
  description: string;
  
  /**
   * Site URL
   */
  siteUrl: string;
  
  /**
   * Pages directory
   */
  pagesDir: string;
  
  /**
   * Content directory
   */
  contentDir?: string;
  
  /**
   * Output directory
   */
  outputDir: string;
  
  /**
   * Public directory
   */
  publicDir?: string;
  
  /**
   * Components directory
   */
  componentsDir?: string;
  
  /**
   * Theme configuration
   */
  themeConfig: ThemeConfig;
  
  /**
   * Plugins
   */
  plugins: PluginConfig[];
  
  /**
   * Development server configuration
   */
  devServer?: Partial<DevServerConfig>;
  
  /**
   * Bundle configuration
   */
  bundle?: Partial<BundleConfig>;
  
  /**
   * Navigation
   */
  navigation?: NavigationItem[];
  
  /**
   * Sidebar
   */
  sidebar?: SidebarItem[];
  
  /**
   * Documentation configuration
   */
  documentation?: Partial<DocumentationConfig>;
}

/**
 * Default configuration for BunPress
 */
const DEFAULT_CONFIG: BunPressConfig = {
  title: 'BunPress Site',
  description: 'A site built with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: 'pages',
  contentDir: 'content',
  outputDir: 'dist',
  publicDir: 'public',
  componentsDir: 'components',
  themeConfig: {
    name: 'default'
  },
  plugins: [],
  devServer: {
    port: 3000,
    hostname: 'localhost',
    hmrPort: 3001,
    hmrHostname: 'localhost',
    open: false,
    hmr: true
  },
  bundle: {
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
    splitting: true,
    assetHashing: process.env.NODE_ENV === 'production',
    publicPath: '/',
    target: 'browser',
    format: 'esm',
    cssChunking: true
  },
  navigation: [
    { label: 'Home', url: '/' },
    { label: 'Documentation', url: '/docs/' }
  ],
  sidebar: [
    {
      title: 'Introduction',
      url: '/docs/introduction/',
      items: [
        { title: "Getting Started", url: "/docs/getting-started/" },
        { title: "Installation", url: "/docs/installation/" }
      ]
    },
    {
      title: 'Guides',
      url: '/docs/guides/',
      collapsed: false,
      items: [
        { title: "Basic Usage", url: "/docs/guides/basic-usage/" },
        { title: "Configuration", url: "/docs/guides/configuration/" },
        { title: "Themes", url: "/docs/guides/themes/" },
        { title: "Plugins", url: "/docs/guides/plugins/" }
      ]
    }
  ],
  documentation: {
    showEditLink: true,
    showLastUpdated: true,
    showNavigation: true,
    showTOC: true,
    showSidebar: true,
    tocLevels: [2, 3]
  }
};

/**
 * BunPress configuration schema
 */
const configSchema: ConfigSchema = {
  title: {
    type: 'string',
    required: true,
    default: DEFAULT_CONFIG.title,
    env: 'BUNPRESS_TITLE',
    description: 'Site title'
  },
  description: {
    type: 'string',
    required: true,
    default: DEFAULT_CONFIG.description,
    env: 'BUNPRESS_DESCRIPTION',
    description: 'Site description'
  },
  siteUrl: {
    type: 'string',
    required: true,
    default: DEFAULT_CONFIG.siteUrl,
    env: 'BUNPRESS_SITE_URL',
    description: 'Site URL'
  },
  pagesDir: {
    type: 'string',
    required: true,
    default: DEFAULT_CONFIG.pagesDir,
    env: 'BUNPRESS_PAGES_DIR',
    description: 'Pages directory'
  },
  contentDir: {
    type: 'string',
    default: DEFAULT_CONFIG.contentDir,
    env: 'BUNPRESS_CONTENT_DIR',
    description: 'Content directory'
  },
  outputDir: {
    type: 'string',
    required: true,
    default: DEFAULT_CONFIG.outputDir,
    env: 'BUNPRESS_OUTPUT_DIR',
    description: 'Output directory'
  },
  publicDir: {
    type: 'string',
    default: DEFAULT_CONFIG.publicDir,
    env: 'BUNPRESS_PUBLIC_DIR',
    description: 'Public directory'
  },
  componentsDir: {
    type: 'string',
    default: DEFAULT_CONFIG.componentsDir,
    env: 'BUNPRESS_COMPONENTS_DIR',
    description: 'Components directory'
  },
  themeConfig: {
    type: 'object',
    required: true,
    default: DEFAULT_CONFIG.themeConfig,
    description: 'Theme configuration'
  },
  plugins: {
    type: 'array',
    default: DEFAULT_CONFIG.plugins,
    description: 'Plugins'
  },
  devServer: {
    type: 'object',
    default: DEFAULT_CONFIG.devServer,
    description: 'Development server configuration'
  },
  bundle: {
    type: 'object',
    default: DEFAULT_CONFIG.bundle,
    description: 'Bundle configuration'
  },
  navigation: {
    type: 'array',
    default: DEFAULT_CONFIG.navigation,
    description: 'Navigation'
  },
  sidebar: {
    type: 'array',
    default: DEFAULT_CONFIG.sidebar,
    description: 'Sidebar'
  },
  documentation: {
    type: 'object',
    default: DEFAULT_CONFIG.documentation,
    description: 'Documentation configuration'
  }
};

/**
 * Initialize BunPress configuration
 * 
 * @param options Configuration options
 * @returns Configuration manager
 */
export async function initBunPressConfig() {
  // Load .env file first
  await loadEnvFile();
  
  // Create configuration manager
  const configManager = createConfig<BunPressConfig>(configSchema, {
    configPath: join(process.cwd(), 'bunpress.config.json'),
    loadEnv: true,
    envPrefix: 'BUNPRESS_'
  });
  
  // Try to load configuration
  try {
    await configManager.load();
  } catch (error) {
    console.warn('Failed to load configuration:', error);
    console.info('Using default configuration');
  }
  
  return configManager;
}

/**
 * Get the BunPress configuration
 * This is a singleton instance of the configuration manager
 */
let configInstance: ReturnType<typeof createConfig<BunPressConfig>> | null = null;

/**
 * Get the BunPress configuration
 * This will initialize the configuration if it hasn't been initialized yet
 * 
 * @returns Configuration manager
 */
export async function getBunPressConfig() {
  if (!configInstance) {
    configInstance = await initBunPressConfig();
  }
  
  return configInstance;
} 