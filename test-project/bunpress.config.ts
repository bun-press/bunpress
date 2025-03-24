import { defineConfig } from 'bunpress';
import { markdownItPlugin, prismPlugin, seoPlugin } from 'bunpress/plugins';

export default defineConfig({
  title: 'My BunPress Site',
  description: 'Created with BunPress',
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
    markdownItPlugin({
      html: true,
      linkify: true,
    }),
    prismPlugin({
      theme: 'dark',
      languages: ['javascript', 'typescript', 'html', 'css'],
    }),
    seoPlugin({
      generateSitemap: true,
      robotsTxt: true,
    }),
  ],
});
