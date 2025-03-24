---
title: Hello World with Optimized Images
date: 2023-05-15
---

# Hello World

This is a sample blog post demonstrating the image optimization plugin.

## Sample Images

Here's an image that will be optimized:

![Sample Photo 1](/images/photo1.jpg)

And another one:

![Sample Photo 2](/images/photo2.png "A nice photo")

## How It Works

When this content is processed by BunPress with the image optimizer plugin:

1. The images will be converted to WebP format (by default)
2. The markdown links will be updated to reference the optimized images
3. The build output will include the optimized images

## Result

After optimization, the image references will look like:

```md
![Sample Photo 1](/images/photo1.webp)
![Sample Photo 2](/images/photo2.webp "A nice photo")
```

And the image files will be smaller and faster to load!

## Responsive Images

If you configure responsive image sizes, the plugin will generate multiple
versions of each image at different resolutions, which can be used with
HTML `<picture>` elements or `srcset` attributes.

Check the plugin documentation for more advanced usage examples. 