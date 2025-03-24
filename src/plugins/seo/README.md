# BunPress SEO Plugin

The SEO plugin helps improve your site's search engine optimization by adding appropriate meta tags, generating a sitemap, and implementing other SEO best practices.

## Features

- Adds OpenGraph meta tags for better social media sharing
- Adds Twitter Card meta tags for better Twitter sharing
- Generates a robots.txt file
- Generates a sitemap.xml file
- Adds canonical URLs to prevent duplicate content issues
- Supports schema.org JSON-LD structured data (optional)

## Installation

This plugin is included by default in BunPress, so you don't need to install it separately.

## Usage

Add the SEO plugin to your `bunpress.config.ts` file:

```typescript
import { defineConfig } from 'bunpress';
import { seoPlugin } from 'bunpress/plugins';

export default defineConfig({
  // ... other config
  plugins: [
    seoPlugin({
      siteTitle: 'Your Site Title',
      siteDescription: 'Your site description',
      siteUrl: 'https://yourdomain.com',
      defaultImage: '/images/social-share.png',
      twitterHandle: 'yourhandle',
      generateRobotsTxt: true,
      generateSitemap: true,
      addCanonicalUrls: true,
      addJsonLd: true
    })
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `siteTitle` | `string` | `undefined` | Default title for your site (used if page doesn't have title) |
| `siteDescription` | `string` | `undefined` | Default description for your site (used if page doesn't have description) |
| `siteUrl` | `string` | `undefined` | URL of your site (required for sitemap and canonical URLs) |
| `defaultImage` | `string` | `undefined` | Default image for social sharing (used if page doesn't have image) |
| `twitterHandle` | `string` | `undefined` | Twitter username (without @) |
| `generateRobotsTxt` | `boolean` | `true` | Whether to generate a robots.txt file |
| `generateSitemap` | `boolean` | `true` | Whether to generate a sitemap.xml file |
| `addCanonicalUrls` | `boolean` | `true` | Whether to add canonical URLs to pages |
| `addJsonLd` | `boolean` | `false` | Whether to add schema.org JSON-LD structured data |

## How It Works

The SEO plugin performs the following tasks:

1. During content transformation, it adds meta tags to pages that have a `<head>` element:
   - OpenGraph tags for Facebook and other platforms
   - Twitter Card tags
   - Canonical URL links (if enabled)
   - schema.org JSON-LD structured data (if enabled)

2. At the end of the build process, it generates:
   - A robots.txt file (if enabled)
   - A sitemap.xml file containing all pages (if enabled)

## Notes

- The plugin tracks all pages during the build process to include them in the sitemap.
- For best results, provide a `siteUrl` - this is required for sitemap.xml and canonical URLs.
- The plugin can use page-specific metadata if available, falling back to site-wide defaults if not.

## Example Output

### Meta Tags

```html
<head>
  <meta name="description" content="Your page description" />
  <meta property="og:title" content="Your Page Title" />
  <meta property="og:type" content="website" />
  <meta property="og:description" content="Your page description" />
  <meta property="og:url" content="https://yourdomain.com/page" />
  <meta property="og:image" content="https://yourdomain.com/images/social-share.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@yourhandle" />
  <meta name="twitter:title" content="Your Page Title" />
  <meta name="twitter:description" content="Your page description" />
  <meta name="twitter:image" content="https://yourdomain.com/images/social-share.png" />
  <link rel="canonical" href="https://yourdomain.com/page" />
  <!-- ... rest of your head content -->
</head>
```

### robots.txt

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2023-08-01</lastmod>
  </url>
  <url>
    <loc>https://yourdomain.com/about</loc>
    <lastmod>2023-08-01</lastmod>
  </url>
  <!-- ... other pages -->
</urlset>
``` 