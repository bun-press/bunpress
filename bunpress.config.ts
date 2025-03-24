export interface BunPressConfig {
  title: string;
  description: string;
  siteUrl: string;
  pagesDir: string;
  outputDir: string;
  themeConfig: {
    name: string;
    options?: Record<string, any>;
    type?: 'default' | 'docs';
    defaultLayout?: 'doc' | 'page' | 'home';
  };
  plugins: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
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

// Default configuration
const defaultConfig: BunPressConfig = {
  title: 'BunPress Site',
  description: 'A site built with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: './pages',
  outputDir: './dist',
  themeConfig: {
    name: 'default',
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