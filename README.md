# BunPress

A modern static site generator and fullstack framework built with Bun. BunPress delivers exceptional performance while maintaining flexibility and ease of use.

## Features

- **⚡ Blazing Fast**: Built on Bun's native performance capabilities
- **📝 Content-Focused**: Markdown and MDX processing with frontmatter support
- **🎨 Beautiful Themes**: Modern, customizable theme system
- **🧩 Plugin System**: Extensible architecture with lifecycle hooks
- **🌍 Internationalization**: Built-in i18n support
- **🔍 SEO Optimized**: Automatic metadata and sitemap generation
- **📱 Mobile-First**: Responsive layouts on all devices
- **🔄 HMR**: Hot Module Replacement for rapid development

## Quick Start

```bash
# Install BunPress
bun install bunpress

# Create a new project
bunpress init my-project

# Start the development server
cd my-project
bun run dev
```

## Documentation

Visit our [documentation site](https://bunpress.dev) to learn more about BunPress.

- [Getting Started](https://bunpress.dev/docs/getting-started)
- [Configuration](https://bunpress.dev/docs/configuration)
- [Themes](https://bunpress.dev/docs/themes)
- [Plugins](https://bunpress.dev/docs/plugins)
- [I18n](https://bunpress.dev/docs/i18n)

## Project Structure

```
my-project/
├── pages/             # Content source files
│   ├── index.md       # Home page
│   └── about.md       # About page
├── public/            # Static assets
├── i18n/              # Translations
│   ├── en/            # English translations
│   └── fr/            # French translations
├── bunpress.config.ts # Site configuration
└── package.json       # Project dependencies
```

## Configuration

BunPress is customizable through `bunpress.config.ts`:

```typescript
import { defineConfig } from 'bunpress';

export default defineConfig({
  title: 'My BunPress Site',
  description: 'Built with BunPress',
  themeConfig: {
    name: 'docs',
    defaultLayout: 'doc'
  },
  plugins: [
    {
      name: 'markdown-it',
      options: {
        html: true,
        linkify: true
      }
    },
    {
      name: 'i18n',
      options: {
        defaultLocale: 'en',
        locales: ['en', 'fr', 'es']
      }
    }
  ],
  navigation: [
    { title: 'Home', href: '/' },
    { title: 'Docs', href: '/docs/' }
  ],
  sidebar: [
    {
      title: 'Introduction',
      items: [
        { title: 'Getting Started', href: '/docs/getting-started' }
      ]
    }
  ]
});
```

## Creating Content

BunPress pages are written in Markdown with frontmatter:

```markdown
---
title: Welcome to BunPress
description: A VitePress alternative built with Bun
---

# Welcome to BunPress

Write your content in Markdown with support for:

- **Formatting** and _styling_
- Code blocks with syntax highlighting
- Internationalization with `{{t:translation.key}}`
```

## Internationalization

BunPress has built-in support for multiple languages:

1. Add translation files to the `i18n` directory
2. Use translation keys in your content with `{{t:key}}`
3. Configure supported languages in `bunpress.config.ts`
4. The language selector automatically appears in navigation

## Themes

BunPress includes built-in themes:

- **Docs**: Documentation-focused theme with navigation, sidebar and TOC
- **Blog**: Clean and minimal blog theme (coming soon)
- **Landing**: Marketing-focused theme with hero section (coming soon)

## Plugins

Extend BunPress functionality with plugins:

- **markdown-it**: Enhanced Markdown processing
- **prism**: Syntax highlighting
- **seo**: SEO optimization tools
- **image-optimizer**: Image optimization
- **i18n**: Internationalization support
- **rss-feed**: RSS feed generation
- **search-index**: Site search capabilities
- **analytics**: Analytics integration

## Comparison with VitePress

| Feature | BunPress | VitePress |
|---------|----------|-----------|
| Engine | Bun | Vite |
| Framework | React | Vue |
| Performance | 🚀🚀🚀 | 🚀🚀 |
| Theming | React components | Vue components |
| Plugins | Lifecycle-based | Limited |
| i18n | Built-in | Plugin-based |
| SSR | Supported | Supported |
| Mobile | First-class | First-class |

## Community & Support

- [GitHub Discussions](https://github.com/bunpress/bunpress/discussions)
- [Discord Community](https://discord.gg/bunpress)
- [Twitter](https://twitter.com/bunpress)

## License

[MIT](LICENSE)