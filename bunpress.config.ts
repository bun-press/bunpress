export interface DevServerConfig {
  port?: number;
  host?: string;
  hmrPort?: number;
  hmrHost?: string;
  open?: boolean;
  hmr?: boolean;
}

export interface BundleConfig {
  minify?: boolean;
  sourcemap?: boolean;
  splitting?: boolean;
  assetHashing?: boolean;
  publicPath?: string;
  target?: 'browser' | 'bun' | 'node';
  format?: 'esm' | 'cjs' | 'iife';
  cssChunking?: boolean;
  plugins?: any[]; // Plugin array
}

export interface ThemeConfig {
  name: string;
  options?: Record<string, any>;
  defaultLayout?: 'doc' | 'page' | 'home';
  tailwind?: boolean;
}

export interface BunPressConfig {
  title: string;
  description: string;
  siteUrl: string;
  pagesDir: string;
  contentDir?: string;
  outputDir: string;
  themeConfig: ThemeConfig;
  plugins: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
  devServer?: DevServerConfig;
  bundle?: BundleConfig;
  // Navigation and sidebar for documentation
  navigation?: Array<{
    title: string;
    href: string;
    items?: Array<{
      title: string;
      href: string;
      active?: boolean;
      external?: boolean;
    }>;
    active?: boolean;
    external?: boolean;
  }>;
  sidebar?: Array<{
    title: string;
    href?: string;
    items?: Array<{
      title: string;
      href?: string;
      items?: any[];
      collapsed?: boolean;
      active?: boolean;
      external?: boolean;
    }>;
    collapsed?: boolean;
    active?: boolean;
    external?: boolean;
  }>;
  // Advanced documentation options
  documentation?: {
    editLinkBase?: string;
    showEditLink?: boolean;
    showLastUpdated?: boolean;
    showNavigation?: boolean;
    showTOC?: boolean;
    showSidebar?: boolean;
    tocLevels?: [number, number];
  };
}

export function defineConfig(config: BunPressConfig): BunPressConfig {
  return {
    // Default config values
    ...config,
    // Ensure themeConfig has default values
    themeConfig: {
      ...config.themeConfig,
      name: config.themeConfig?.name || 'default',
    },
    // Ensure devServer has default values
    devServer: {
      port: 3000,
      host: 'localhost',
      hmrPort: 3001,
      hmrHost: 'localhost',
      open: false,
      ...config.devServer
    },
    // Ensure bundle has default values
    bundle: {
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
      splitting: true,
      assetHashing: process.env.NODE_ENV === 'production',
      publicPath: '/',
      target: 'browser',
      format: 'esm',
      cssChunking: true,
      ...config.bundle
    }
  };
}

export function definePlugin(name: string, options?: Record<string, any>) {
  return {
    name,
    options
  };
}

// Default configuration
const defaultConfig: BunPressConfig = {
  title: 'BunPress Site',
  description: 'A site built with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: './pages',
  contentDir: './content',
  outputDir: './dist',
  themeConfig: {
    name: 'docs',
    defaultLayout: 'doc'
  },
  plugins: [
    {
      name: 'markdown-it',
      options: {
        preset: 'default',
        html: true,
        linkify: true,
        typographer: true
      }
    },
    {
      name: 'prism',
      options: {
        theme: 'vs-dark'
      }
    },
    {
      name: 'seo',
      options: {
        generateSitemap: true,
        generateRobotsTxt: true
      }
    },
    {
      name: 'image-optimizer',
      options: {
        quality: 80,
        formats: ['webp', 'avif'],
        sizes: [640, 1280, 1920]
      }
    }
  ],
  // Default navigation
  navigation: [
    { 
      title: 'Home', 
      href: '/' 
    },
    { 
      title: 'Documentation', 
      href: '/docs/' 
    },
    { 
      title: 'Components', 
      href: '/components/',
      items: [
        { title: 'UI', href: '/components/ui/' },
        { title: 'Forms', href: '/components/forms/' },
        { title: 'Layout', href: '/components/layout/' }
      ]
    }
  ],
  // Default sidebar for documentation
  sidebar: [
    {
      title: 'Introduction',
      items: [
        { title: 'Getting Started', href: '/docs/getting-started/' },
        { title: 'Installation', href: '/docs/installation/' }
      ]
    },
    {
      title: 'Guides',
      collapsed: false,
      items: [
        { title: 'Basic Usage', href: '/docs/guides/basic-usage/' },
        { title: 'Configuration', href: '/docs/guides/configuration/' },
        { title: 'Themes', href: '/docs/guides/themes/' },
        { title: 'Plugins', href: '/docs/guides/plugins/' }
      ]
    }
  ],
  // Default documentation options
  documentation: {
    showEditLink: true,
    showLastUpdated: true,
    showNavigation: true,
    showTOC: true,
    showSidebar: true,
    tocLevels: [2, 3]
  }
};

export default defaultConfig; 