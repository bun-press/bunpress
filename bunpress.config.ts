export interface BunPressConfig {
  title: string;
  description: string;
  siteUrl: string;
  pagesDir: string;
  outputDir: string;
  themeConfig: {
    name: string;
    options?: Record<string, any>;
  };
  plugins: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
}

// Default configuration
const defaultConfig: BunPressConfig = {
  title: 'BunPress Site',
  description: 'A site built with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: 'pages',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {},
  },
  plugins: [
    {
      name: '@bunpress/markdown-it',
      options: {
        html: true,
        linkify: true,
        typographer: true,
      },
    },
    {
      name: '@bunpress/prism',
      options: {
        theme: 'dark',
        languages: ['javascript', 'typescript', 'css', 'html', 'markdown'],
        lineNumbers: true,
      },
    },
    {
      name: '@bunpress/seo',
      options: {
        siteTitle: 'BunPress Site',
        siteDescription: 'A site built with BunPress - fast, lightweight, and extensible.',
        siteUrl: 'https://example.com',
        defaultImage: '/images/social-share.png',
        twitterHandle: 'bunpress',
        generateRobotsTxt: true,
        generateSitemap: true,
        addCanonicalUrls: true,
        addJsonLd: true
      },
    },
    {
      name: '@bunpress/image-optimizer',
      options: {
        inputDir: 'public',
        outputDir: 'dist',
        formats: [
          { format: 'webp', quality: 80 },
          { format: 'avif', quality: 70 }
        ],
        sizes: [
          { width: 640 },
          { width: 1280 },
          { width: 1920 }
        ],
        keepOriginal: true
      },
    },
  ],
};

export default defaultConfig; 