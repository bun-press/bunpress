# Image Optimizer Plugin Example

This directory contains an example of using the BunPress Image Optimizer Plugin.

## Structure

```
example/
├── bunpress.config.ts   # Configuration with image optimizer plugin
├── content/             # Sample content with images
│   └── blog/
│       └── hello.md     # Sample blog post with images
├── public/              # Public assets directory
│   └── images/          # Images to be optimized
│       ├── photo1.jpg   # Sample image
│       └── photo2.png   # Sample image
└── README.md            # This file
```

## How to Run

1. Create the directory structure as shown above
2. Place some images in the `public/images` directory
3. Run BunPress with this configuration:

```bash
bunpress build --config src/plugins/image-optimizer/example/bunpress.config.ts
```

## Expected Results

After running the build:

1. The `dist` directory will contain optimized images:
   - WebP versions of all images (default format)
   - Original images (if keepOriginal is true)
   - Various sizes (if configured)

2. Image references in markdown content will be updated to use the optimized format.

## Try Different Options

Edit the `bunpress.config.ts` file to uncomment the advanced configuration and experiment with different options. 