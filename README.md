# BunPress

A modern, high-performance static site generator and fullstack framework built with Bun.

## Features

- 🚀 **Performance**: Built with Bun for fast builds and development
- ⚡ **HMR**: Hot module replacement for a seamless development experience
- 📝 **Markdown Support**: Write content in Markdown with frontmatter
- 🧩 **Plugin System**: Extend functionality with a powerful plugin API
- 🎨 **Theme Support**: Build beautiful sites with customizable themes
- 🌐 **Fullstack**: Combine static generation with dynamic API routes
- 🔄 **i18n**: Built-in internationalization support
- 🔍 **SEO**: Optimized for search engines out of the box

## Installation

Make sure you have [Bun](https://bun.sh/) installed, then run:

```bash
# Install BunPress globally
bun install -g bunpress

# Or use it directly with bunx
bunx bunpress
```

## Quick Start

Create a new BunPress project:

```bash
# Create a new project
bunpress init my-website
cd my-website

# Start the development server
bunpress dev

# Build for production
bunpress build
```

## Project Structure

A typical BunPress project looks like this:

```
my-website/
├── pages/            # Content pages (Markdown)
├── public/           # Static assets
├── components/       # Custom components
├── themes/           # Themes
│   └── default/      # Default theme
├── bunpress.config.ts  # Configuration
└── package.json
```

## Configuration

Configure your site in `bunpress.config.ts`:

```typescript
import { defineConfig } from 'bunpress';
import { 
  markdownItPlugin,
  seoPlugin
} from 'bunpress/plugins';

export default defineConfig({
  title: 'My Website',
  description: 'Built with BunPress',
  pagesDir: 'pages',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
    }
  },
  plugins: [
    markdownItPlugin(),
    seoPlugin({
      generateSitemap: true,
      robotsTxt: true
    })
  ]
});
```

## Creating Content

Create Markdown files in the `pages` directory:

```markdown
---
title: Getting Started
description: Learn how to use BunPress
layout: doc
---

# Getting Started with BunPress

Welcome to BunPress! This guide will help you get started.

## Installation

First, make sure you have Bun installed...
```

## Plugins

BunPress comes with several built-in plugins:

- **markdownIt**: Enhanced Markdown processing
- **prism**: Syntax highlighting
- **seo**: SEO optimization tools
- **rss**: RSS feed generation
- **imageOptimizer**: Image optimization
- **analytics**: Analytics integration
- **searchIndex**: Search functionality
- **i18n**: Internationalization support

Example usage:

```typescript
import { defineConfig } from 'bunpress';
import { 
  markdownItPlugin, 
  prismPlugin, 
  seoPlugin, 
  imageOptimizerPlugin 
} from 'bunpress/plugins';

export default defineConfig({
  // Site config...
  plugins: [
    markdownItPlugin({
      html: true,
      linkify: true
    }),
    prismPlugin({
      theme: 'dark',
      languages: ['javascript', 'typescript', 'css']
    }),
    seoPlugin({
      generateSitemap: true
    }),
    imageOptimizerPlugin({
      formats: ['webp', 'avif'],
      quality: 80
    })
  ]
});
```

## Themes

BunPress supports customizable themes. Create your own theme or customize the default one:

```typescript
// bunpress.config.ts
export default defineConfig({
  // Site config...
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
      navbar: {
        logo: '/logo.svg',
        items: [
          { text: 'Home', link: '/' },
          { text: 'About', link: '/about' },
          { text: 'Contact', link: '/contact' }
        ]
      },
      sidebar: {
        '/docs/': [
          {
            text: 'Introduction',
            items: [
              { text: 'Getting Started', link: '/docs/getting-started' },
              { text: 'Configuration', link: '/docs/configuration' }
            ]
          }
        ]
      }
    }
  }
});
```

## API Routes

Create dynamic API routes in the `api` directory:

```typescript
// api/hello.ts
export default function(req: Request) {
  return new Response(JSON.stringify({ message: 'Hello, world!' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## CLI Commands

BunPress comes with a CLI for common tasks:

- `bunpress init [dir]`: Create a new project
- `bunpress dev`: Start the development server
- `bunpress build`: Build for production
- `bunpress preview`: Preview the production build

## Development

To contribute to BunPress:

```bash
# Clone the repository
git clone https://github.com/bun-press/bunpress.git
cd bunpress

# Install dependencies
bun install

# Start development
bun run dev

# Run tests
bun test
```

## License

MIT