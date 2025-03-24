import { defineConfig } from '../../../core/config';
import imageOptimizerPlugin from '../index';

export default defineConfig({
  title: 'My BunPress Site',
  description: 'A site with optimized images',
  
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
  ]
}); 