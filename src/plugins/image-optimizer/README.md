# BunPress Image Optimizer Plugin

This plugin optimizes images in your BunPress project by:
- Converting images to modern formats (WebP, AVIF)
- Generating multiple sizes for responsive images
- Reducing file size while maintaining quality
- Automatically updating image references in your content

## Installation

```bash
bun add @bunpress/plugin-image-optimizer
```

## Usage

In your BunPress configuration file:

```ts
import { defineConfig } from 'bunpress';
import imageOptimizerPlugin from '@bunpress/plugin-image-optimizer';

export default defineConfig({
  // ... other config
  plugins: [
    imageOptimizerPlugin({
      // Options here (all optional)
      inputDir: 'public',
      outputDir: 'dist',
      formats: [
        { format: 'webp', quality: 80 },
        { format: 'avif', quality: 65 }
      ],
      sizes: [
        { width: 800 },
        { width: 1200 },
        { width: 1600 }
      ],
      extensions: ['.jpg', '.jpeg', '.png'],
      keepOriginal: true
    })
  ]
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputDir` | `string` | `'public'` | Directory containing source images |
| `outputDir` | `string` | `'dist'` | Directory for optimized images |
| `formats` | `ImageFormat[]` | `[{ format: 'webp', quality: 80 }]` | Formats to convert images to |
| `sizes` | `ImageSize[]` | `undefined` | Sizes to generate (undefined = original size only) |
| `extensions` | `string[]` | `['.jpg', '.jpeg', '.png']` | File extensions to process |
| `keepOriginal` | `boolean` | `true` | Whether to keep original files |

### ImageFormat
```ts
interface ImageFormat {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number; // 1-100
}
```

### ImageSize
```ts
interface ImageSize {
  width?: number;
  height?: number;
}
```

## How It Works

This plugin hooks into the BunPress build process to:

1. At `buildStart`: Prepare to process images
2. At `buildEnd`: 
   - Scan the input directory for image files
   - Process each image according to your configuration
   - Generate multiple formats and sizes
   - Save optimized images to the output directory
3. During content transformation:
   - Updates markdown image references to use the preferred format

## Example

Before:
```md
![My Image](images/photo.jpg)
```

After (with WebP format configured):
```md
![My Image](images/photo.webp)
```

## Advanced Usage

### Responsive Images

Generate multiple sizes for responsive images:

```ts
imageOptimizerPlugin({
  sizes: [
    { width: 320 },   // Small devices
    { width: 768 },   // Medium devices
    { width: 1200 },  // Large devices
    { width: 1600 }   // Extra large devices
  ]
})
```

This will produce files like:
- `image-320w.webp`
- `image-768w.webp`
- `image-1200w.webp`
- `image-1600w.webp`

### Multiple Formats

Support multiple formats simultaneously:

```ts
imageOptimizerPlugin({
  formats: [
    { format: 'webp', quality: 80 },
    { format: 'avif', quality: 65 },
    { format: 'jpeg', quality: 90 }
  ]
})
```

## Notes

- This plugin requires the `sharp` image processing library.
- Processing large image collections may impact build times.
- Consider using a CDN or image hosting service for production sites with many images. 