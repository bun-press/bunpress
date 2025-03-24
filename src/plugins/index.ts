// Export all built-in plugins
import imageOptimizerPlugin from './image-optimizer';
import markdownItPlugin from './markdown-it';
import prismPlugin from './prism';

// Re-export plugins
export {
  imageOptimizerPlugin,
  markdownItPlugin,
  prismPlugin
};

// Export types
export type { 
  ImageFormat, 
  ImageSize, 
  ImageOptimizerOptions 
} from './image-optimizer'; 