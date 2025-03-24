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
  ],
};

export default defaultConfig; 