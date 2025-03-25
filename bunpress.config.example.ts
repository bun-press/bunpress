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
        containers: {
          tip: true,
          info: true,
          warning: true,
          danger: true,
          details: true,
          custom: [
            {
              name: 'demo',
              options: {
                validate: (params: string) => {
                  return params.trim().match(/^demo\s+(.*)$/);
                }
              }
            }
          ]
        },
        anchor: {
          level: [1, 2, 3, 4],
          permalink: true,
          permalinkSymbol: '#'
        },
        toc: {
          level: [2, 3], 
          containerClass: 'table-of-contents'
        },
        codeHighlight: {
          theme: 'github-dark'
        }
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
        siteTitle: 'My BunPress Site',
        siteDescription: 'A site built with BunPress and plugins',
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
      name: '@bunpress/rss-feed',
      options: {
        title: 'My BunPress Site',
        description: 'A site built with BunPress and plugins',
        siteUrl: 'https://example.com',
        filename: 'feed.xml',
        language: 'en',
        limit: 20,
        copyright: 'Copyright © 2023 BunPress',
      },
    },
    {
      name: '@bunpress/search-index',
      options: {
        filename: 'search-index.json',
        fields: ['title', 'description', 'content', 'tags'],
        snippetLength: 160,
        outputDir: 'dist',
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

export default config; 