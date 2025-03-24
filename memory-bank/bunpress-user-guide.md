# BunPress User Guide

## Introduction

BunPress is a modern static site generator built with [Bun](https://bun.sh), designed to be fast, lightweight, and extensible. It's perfect for creating documentation sites, blogs, portfolios, or any type of static website.

## Getting Started

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 16.0.0 (for some dependencies)

### Installation

```bash
# Install globally
bun install -g bunpress

# Or as a project dependency
bun add bunpress
```

### Creating a New Site

```bash
# Create a new directory
mkdir my-site && cd my-site

# Initialize a BunPress site
bunpress init

# Start the development server
bunpress dev

# Build your site for production
bunpress build
```

The `bunpress init` command will create the following structure:

```
my-site/
├── bunpress.config.ts     # Configuration file
├── pages/                 # Content pages (Markdown/MDX)
│   ├── index.md           # Home page
│   └── about.md           # About page
└── public/                # Static assets
```

## Content Creation

### Page Structure

BunPress uses a file-based routing system. The directory structure in the `pages/` folder determines the URL structure of your site:

```
pages/
├── index.md               # /
├── about.md               # /about
├── blog/
│   ├── index.md           # /blog
│   └── first-post.md      # /blog/first-post
└── docs/
    ├── index.md           # /docs
    ├── getting-started.md # /docs/getting-started
    └── api/
        └── index.md       # /docs/api
```

### Frontmatter

Each Markdown or MDX file can include frontmatter metadata at the top:

```md
---
title: Getting Started
description: Learn how to use BunPress
layout: doc
sidebar: true
---

# Content starts here
```

Common frontmatter properties:

| Property | Description |
|----------|-------------|
| `title` | Page title (used in HTML title tag and navigation) |
| `description` | Page description (used for SEO) |
| `layout` | Page layout (doc, home, page) |
| `sidebar` | Whether to show the sidebar |
| `toc` | Whether to show table of contents |
| `date` | Publication date (for blog posts) |
| `tags` | Array of tags (for blog posts) |

### MDX Support

BunPress supports MDX, allowing you to use React components in your Markdown:

```mdx
---
title: Interactive Page
---

import { Button } from '../components/Button';

# Interactive Components

Click the button below:

<Button onClick={() => alert('Hello!')}>Click Me</Button>
```

## Configuration

BunPress is configured via a `bunpress.config.ts` file in your project root:

```typescript
import { defineConfig } from 'bunpress';

export default defineConfig({
  // Site metadata
  title: 'My BunPress Site',
  description: 'Created with BunPress',
  siteUrl: 'https://example.com',
  
  // Content directories
  pagesDir: 'pages',
  outputDir: 'dist',
  
  // Theme configuration
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
      navbar: {
        logo: '/logo.svg',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Docs', link: '/docs/' },
          { text: 'Blog', link: '/blog/' },
        ],
      },
      footer: {
        links: [
          {
            title: 'Docs',
            items: [
              { text: 'Getting Started', link: '/docs/getting-started' },
              { text: 'API', link: '/docs/api/' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()}`,
      },
    },
  },
  
  // Plugins
  plugins: [
    // Plugin configurations
  ],
});
```

## Themes

BunPress comes with a default theme that uses [Shadcn UI](https://ui.shadcn.com/) components. You can customize the theme by:

1. Modifying theme options in `bunpress.config.ts`
2. Creating a custom theme by extending the default theme

### Available Layouts

The default theme provides three main layouts:

1. **DocLayout**: For documentation pages with sidebar and table of contents
2. **HomeLayout**: For landing pages with hero section and feature cards
3. **PageLayout**: For simple content pages

You can specify the layout in your Markdown frontmatter:

```md
---
layout: doc
---
```

## Plugins

BunPress has a powerful plugin system that allows you to extend its functionality.

### Built-in Plugins

BunPress comes with several built-in plugins:

1. **SEO Plugin**: Generates meta tags, OpenGraph tags, sitemap, and robots.txt
2. **Image Plugin**: Optimizes images for web, converts formats, and resizes images
3. **RSS Plugin**: Generates RSS feeds for content syndication
4. **Analytics Plugin**: Integrates with various analytics providers
5. **Search Plugin**: Creates a search index for client-side search
6. **i18n Plugin**: Provides internationalization support

### Using Plugins

Configure plugins in your `bunpress.config.ts`:

```typescript
import { defineConfig } from 'bunpress';
import { 
  seoPlugin, 
  imagePlugin, 
  i18nPlugin 
} from 'bunpress/plugins';

export default defineConfig({
  // ... other config
  plugins: [
    seoPlugin({
      siteUrl: 'https://example.com',
      sitemap: true,
      robots: true,
    }),
    imagePlugin({
      optimize: true,
      formats: ['webp', 'avif'],
    }),
    i18nPlugin({
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      fallback: true,
    }),
  ],
});
```

## Internationalization (i18n)

BunPress supports multilingual content through the i18n plugin:

1. Configure the i18n plugin in `bunpress.config.ts`
2. Create translation files in the `i18n/` directory
3. Use translation keys in your content with the `{{t:key}}` syntax

### Translation Files

Create JSON files for each locale:

```json
// i18n/en.json
{
  "welcome": "Welcome to BunPress",
  "navigation": {
    "home": "Home",
    "docs": "Documentation"
  }
}
```

```json
// i18n/fr.json
{
  "welcome": "Bienvenue à BunPress",
  "navigation": {
    "home": "Accueil",
    "docs": "Documentation"
  }
}
```

### Using Translations

In your Markdown or MDX files:

```md
# {{t:welcome}}

Check out our {{t:navigation.docs}} section to learn more.

You can also use fallback text: {{t:missing_key|Fallback text}}
```

## Deployment

BunPress generates static files that can be deployed anywhere. The built files are located in the `dist/` directory (or your configured `outputDir`).

### Example Deployment Commands

```bash
# Build the site
bunpress build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to Vercel
vercel --prod dist

# Deploy to GitHub Pages
gh-pages -d dist
```

## CLI Commands

BunPress provides several CLI commands:

| Command | Description |
|---------|-------------|
| `bunpress init` | Initialize a new BunPress site |
| `bunpress dev` | Start the development server |
| `bunpress build` | Build the site for production |
| `bunpress preview` | Preview the built site locally |
| `bunpress clean` | Clean the output directory |

## Troubleshooting

### Common Issues

1. **Page not found**: Ensure your file is in the correct location in the `pages/` directory
2. **Styling issues**: Check your theme configuration and make sure Tailwind is properly configured
3. **Plugin errors**: Verify your plugin configuration in `bunpress.config.ts`
4. **Build errors**: Check your console for error messages and fix any syntax errors in your content

### Getting Help

- Check the [official documentation](https://bunpress.dev)
- Open an issue on [GitHub](https://github.com/bunpress/bunpress)
- Join the [Discord community](https://discord.gg/bunpress) 