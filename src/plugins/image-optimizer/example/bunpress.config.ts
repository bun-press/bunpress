import { defineConfig } from '../../../../src/config';
import imageOptimizerPlugin from '../index';

export default defineConfig({
  title: 'Image Optimizer Example',
  description: 'An example site showing image optimization',
  siteUrl: 'https://example.com',
  pagesDir: 'content',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {},
  },
  // Configure plugins
  plugins: [
    // Basic usage with defaults
    imageOptimizerPlugin(),

    // Advanced usage with custom configuration
    // imageOptimizerPlugin({
    //   inputDir: 'public/images',
    //   outputDir: 'dist/img',
    //   formats: [
    //     { format: 'webp', quality: 85 },
    //     { format: 'avif', quality: 70 }
    //   ],
    //   sizes: [
    //     { width: 400 },
    //     { width: 800 },
    //     { width: 1200 }
    //   ],
    //   extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    //   keepOriginal: false
    // })
  ],
});
