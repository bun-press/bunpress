import type { Plugin } from '../../core/plugin';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface ImageFormat {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
}

export interface ImageSize {
  width?: number;
  height?: number;
}

export interface ImageOptimizerOptions {
  /**
   * Input directory for images relative to workspace root
   * @default 'public'
   */
  inputDir?: string;
  
  /**
   * Output directory for optimized images relative to workspace root
   * @default 'dist'
   */
  outputDir?: string;
  
  /**
   * Image formats to convert to
   * @default [{ format: 'webp', quality: 80 }]
   */
  formats?: ImageFormat[];
  
  /**
   * Image sizes to generate
   * @default undefined (original size only)
   */
  sizes?: ImageSize[];
  
  /**
   * Extensions to process
   * @default ['.jpg', '.jpeg', '.png']
   */
  extensions?: string[];
  
  /**
   * Whether to keep original files
   * @default true
   */
  keepOriginal?: boolean;
}

export default function imageOptimizerPlugin(options: ImageOptimizerOptions = {}): Plugin {
  const {
    inputDir = 'public',
    outputDir = 'dist',
    formats = [{ format: 'webp', quality: 80 }],
    sizes,
    extensions = ['.jpg', '.jpeg', '.png'],
    keepOriginal = true,
  } = options;
  
  // Track processed images for logging
  const processedImages: string[] = [];
  
  const processImage = async (filePath: string, basePath: string, outDir: string) => {
    const parsedPath = path.parse(filePath);
    const relativePath = path.relative(basePath, filePath);
    const outputBase = path.join(outDir, path.dirname(relativePath));
    
    // Create output directory if it doesn't exist
    if (!existsSync(outputBase)) {
      mkdirSync(outputBase, { recursive: true });
    }
    
    // Load the image
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Keep track of this image
    processedImages.push(relativePath);
    
    // Process sizes
    const imageSizes = sizes || [{ width: metadata.width, height: metadata.height }];
    
    // Process each size
    for (const size of imageSizes) {
      const resized = image.clone().resize({
        width: size.width,
        height: size.height,
        fit: 'inside',
        withoutEnlargement: true,
      });
      
      // Generate each format
      for (const format of formats) {
        const outputFileName = `${parsedPath.name}${size.width ? `-${size.width}w` : ''}${size.height ? `-${size.height}h` : ''}.${format.format}`;
        const outputPath = path.join(outputBase, outputFileName);
        
        await resized[format.format]({
          quality: format.quality,
        }).toFile(outputPath);
      }
    }
    
    // Copy original if requested
    if (keepOriginal) {
      const outputPath = path.join(outputBase, parsedPath.base);
      fs.copyFileSync(filePath, outputPath);
    }
  };
  
  return {
    name: 'image-optimizer',
    options,
    
    async buildStart() {
      console.log('Image optimizer: Starting image processing...');
    },
    
    async buildEnd() {
      const baseDir = path.resolve(process.cwd(), inputDir);
      const outDir = path.resolve(process.cwd(), outputDir);
      
      // Function to process a directory recursively
      const processDirectory = async (dirPath: string) => {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // Recursively process subdirectories
            await processDirectory(filePath);
          } else if (extensions.includes(path.extname(filePath).toLowerCase())) {
            // Process matching image files
            await processImage(filePath, baseDir, outDir);
          }
        }
      };
      
      // Start processing from the base directory
      if (fs.existsSync(baseDir)) {
        await processDirectory(baseDir);
      } else {
        console.log(`Image optimizer: Input directory ${baseDir} does not exist.`);
      }
      
      if (processedImages.length > 0) {
        console.log(`Image optimizer: Processed ${processedImages.length} images.`);
      } else {
        console.log('Image optimizer: No images processed.');
      }
    },
    
    transform(content: string) {
      // Replace image URLs in content if needed
      // This is a basic implementation that replaces image paths in markdown image syntax
      // A more advanced implementation would parse Markdown/HTML properly
      if (formats.length > 0 && formats[0].format !== 'jpeg' && formats[0].format !== 'png') {
        // Replace image URLs with the preferred format
        const preferredFormat = formats[0].format;
        
        return content.replace(
          /!\[(.*?)\]\((.*?)(\.jpg|\.jpeg|\.png)(\s+["'].*?["'])?\)/gi,
          (match, alt, src, ext, title) => {
            // Construct the new URL with the preferred format
            return `![${alt}](${src}.${preferredFormat}${title || ''})`;
          }
        );
      }
      
      return content;
    }
  };
} 