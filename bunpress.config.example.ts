import type { BunPressConfig } from './bunpress.config';

const config: BunPressConfig = {
  title: 'My BunPress Site',
  description: 'A site built with BunPress and plugins',
  siteUrl: 'https://example.com',
  pagesDir: 'pages',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
    },
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

export default config; 