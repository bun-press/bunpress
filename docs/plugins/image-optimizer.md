# Image Optimizer Plugin

The BunPress Image Optimizer plugin is a powerful tool that automatically optimizes images in your BunPress projects. It leverages the high-performance [sharp](https://sharp.pixelplumbing.com/) library to convert images to modern formats, generate multiple sizes, and reduce file sizes without sacrificing quality.

## Features

- **Format Conversion**: Convert images to modern formats like WebP and AVIF for better performance
- **Responsive Images**: Generate multiple image sizes for responsive design
- **Quality Control**: Customize compression settings for each format
- **Markdown Integration**: Automatically update image references in your markdown content
- **Build Integration**: Process images during the build phase, with no runtime overhead

## Installation

```bash
bun add @bunpress/plugin-image-optimizer
```

## Basic Usage

Add the plugin to your BunPress configuration:

```ts
// bunpress.config.ts
import { defineConfig } from 'bunpress';
import imageOptimizerPlugin from '@bunpress/plugin-image-optimizer';

export default defineConfig({
  // ... other config
  plugins: [
    imageOptimizerPlugin()
  ]
});
```

With the default configuration, the plugin will:
- Look for images in the `public` directory
- Output processed images to the `dist` directory
- Convert images to WebP format with 80% quality
- Keep original images
- Process `.jpg`, `.jpeg`, and `.png` files

## Advanced Usage

Customize the plugin behavior with options:

```ts
imageOptimizerPlugin({
  // Custom input directory
  inputDir: 'assets/images',
  
  // Custom output directory
  outputDir: 'dist/img',
  
  // Generate multiple formats
  formats: [
    { format: 'webp', quality: 85 },
    { format: 'avif', quality: 70 }
  ],
  
  // Generate multiple sizes for responsive images
  sizes: [
    { width: 320 },
    { width: 768 },
    { width: 1200 },
    { width: 1600 }
  ],
  
  // Specify file extensions to process
  extensions: ['.jpg', '.jpeg', '.png', '.gif'],
  
  // Discard original files
  keepOriginal: false
})
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputDir` | `string` | `'public'` | Directory containing source images |
| `outputDir` | `string` | `'dist'` | Directory for optimized images |
| `formats` | `ImageFormat[]` | `[{ format: 'webp', quality: 80 }]` | Formats to convert images to |
| `sizes` | `ImageSize[]` | `undefined` | Sizes to generate (undefined = original size only) |
| `extensions` | `string[]` | `['.jpg', '.jpeg', '.png']` | File extensions to process |
| `keepOriginal` | `boolean` | `true` | Whether to keep original files |

### TypeScript Interfaces

```ts
interface ImageFormat {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number; // 1-100
}

interface ImageSize {
  width?: number;
  height?: number;
}
```

## How It Works

1. During the build process, the plugin scans the input directory for images
2. It processes each image, converting it to the specified formats and sizes
3. It updates image references in markdown content to use the preferred format
4. The optimized images are saved to the output directory

## Example: Before and After

### Before Optimization

```md
![My Profile Picture](images/profile.jpg)
```

### After Optimization

```md
![My Profile Picture](images/profile.webp)
```

## Performance Benefits

- **Smaller File Sizes**: WebP files are typically 25-35% smaller than JPEG/PNG
- **Faster Loading**: Smaller files mean faster page loads
- **Better SEO**: Page load time is a ranking factor for search engines
- **Reduced Bandwidth**: Less data transfer is better for users and hosting costs

## Best Practices

1. **Format Selection**:
   - WebP: Good balance of quality and size, supported by most modern browsers
   - AVIF: Best compression but less browser support
   - JPEG/PNG: Use for maximum compatibility

2. **Responsive Images**:
   - Choose sizes that match your design breakpoints
   - Consider mobile-first approach with smaller default sizes

3. **Quality Settings**:
   - 70-80% quality is often indistinguishable from 100% to human eyes
   - Test different values to find the right balance for your images

## Example Projects

For a complete working example, see the [example directory](https://github.com/yourusername/bunpress/tree/main/src/plugins/image-optimizer/example) in the BunPress repository. 