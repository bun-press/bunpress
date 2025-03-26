import React, { useMemo } from 'react';
import { cn } from '@bunpress/lib/utils';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Source URL for the image
   */
  src: string;

  /**
   * Alt text for the image
   */
  alt: string;

  /**
   * Width of the image
   */
  width?: number;

  /**
   * Height of the image
   */
  height?: number;

  /**
   * Whether to lazy load the image
   * @default true
   */
  lazy?: boolean;

  /**
   * Whether to generate responsive sizes
   * @default true
   */
  responsive?: boolean;

  /**
   * Image formats to include in srcset
   * @default ['webp', 'original']
   */
  formats?: ('webp' | 'avif' | 'jpeg' | 'png' | 'original')[];

  /**
   * Sizes attribute value
   * @default "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
   */
  sizes?: string;

  /**
   * Responsive widths to generate
   * @default [640, 750, 828, 1080, 1200, 1920]
   */
  widths?: number[];

  /**
   * Optional classname
   */
  className?: string;
}

/**
 * Optimized image component that integrates with BunPress image optimizer plugin
 */
export function Image({
  src,
  alt,
  width,
  height,
  lazy = true,
  responsive = true,
  formats = ['webp', 'original'],
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  widths = [640, 750, 828, 1080, 1200, 1920],
  className,
  ...props
}: ImageProps) {
  const isExternal = src.startsWith('http') || src.startsWith('//');
  
  // For external images, just render a regular image tag
  if (isExternal) {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
        loading={lazy ? "lazy" : undefined}
        className={className}
        {...props}
      />
    );
  }
  
  // Base path for the image without extension
  const basePath = useMemo(() => {
    const pathWithoutExtension = src.replace(/\.(jpe?g|png|gif|svg|webp|avif)$/, '');
    return pathWithoutExtension;
  }, [src]);
  
  // Get the original extension
  const originalExtension = useMemo(() => {
    const match = src.match(/\.(jpe?g|png|gif|svg|webp|avif)$/);
    return match ? match[1] : 'jpg';
  }, [src]);
  
  // Generate srcset for responsive images
  const srcSet = useMemo(() => {
    if (!responsive) return undefined;
    
    const sets: string[] = [];
    
    // Add each format
    formats.forEach(format => {
      if (format === 'original') {
        // For original format, use the original extension
        widths.forEach(w => {
          if (!width || w <= width) {
            sets.push(`${basePath}-${w}w.${originalExtension} ${w}w`);
          }
        });
      } else {
        // For other formats, use the specified format
        widths.forEach(w => {
          if (!width || w <= width) {
            sets.push(`${basePath}-${w}w.${format} ${w}w`);
          }
        });
      }
    });
    
    return sets.join(', ');
  }, [responsive, formats, widths, basePath, width, originalExtension]);
  
  // Find the best format for the src attribute
  const bestSrc = useMemo(() => {
    if (formats.includes('webp')) {
      return `${basePath}.webp`;
    } else if (formats.includes('avif')) {
      return `${basePath}.avif`;
    } else {
      return src;
    }
  }, [formats, basePath, src]);
  
  return (
    <img
      src={bestSrc}
      srcSet={srcSet}
      sizes={responsive ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={lazy ? "lazy" : undefined}
      className={cn(className)}
      {...props}
    />
  );
} 