# BunPress

A modern static site generator built with Bun's native capabilities for blazing-fast performance.

[![npm version](https://img.shields.io/npm/v/bunpress.svg)](https://www.npmjs.com/package/bunpress)
[![License](https://img.shields.io/npm/l/bunpress.svg)](https://github.com/bunpress/bunpress/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/built%20with-bun-yellow)](https://bun.sh)

## Features

- 🚀 **Built for Bun**: Leverages Bun's native tools for maximum performance
- 🔌 **Plugin System**: Extend functionality with a powerful plugin architecture
- 📄 **Markdown Support**: First-class support for Markdown content
- 🎨 **Theme System**: Customize your site with flexible theming
- 🧩 **React Components**: Use React components in your content with MDX
- 💻 **Dev Server**: Fast development server with hot module replacement
- 📦 **Static Output**: Generate static sites for deployment anywhere
- 🌗 **Dark/Light Mode**: Integrated theme toggle with system preference detection

## Bun Optimizations

BunPress leverages Bun's powerful built-in features:

- **HTML-first Bundling**: BunPress uses Bun's HTML-first bundling approach for optimal performance
- **Automatic CSS Processing**: CSS imports are automatically bundled and optimized
- **Hot Module Replacement**: Fast development with Bun's built-in HMR support
- **TypeScript/JSX Support**: First-class support for TypeScript and JSX without configuration
- **Plugin System**: Tailwind CSS and other plugins work seamlessly
- **Fast Server**: Bun's fast HTTP server powers the development environment

## Installation

```bash
# Install globally
bun install -g bunpress

# Or as a project dependency
bun add bunpress
```

## Quick Start

```bash
# Create a new site
mkdir my-site && cd my-site

# Initialize a BunPress site
bunpress init

# Start the development server
bunpress dev

# Build your site
bunpress build
```

### Creating Content

Content in BunPress is created using Markdown or MDX files:

```md
---
title: Getting Started
description: Learn how to get started with BunPress
layout: doc
---

# Getting Started with BunPress

Welcome to BunPress! This guide will help you get started...
```

### Using Components in MDX

You can use React components in your MDX files:

```mdx
---
title: Interactive Example
---

import { Button } from '../components/Button';

# Interactive Components

Click the button below:

<Button onClick={() => alert('Hello!')}>Click Me</Button>
```

### Creating Custom Themes

You can create custom themes by modifying the components in the `themes` directory:

1. Copy the default theme as a starting point:
   ```bash
   cp -r themes/default themes/my-theme
   ```

2. Update your configuration to use the new theme:
   ```typescript
   // bunpress.config.ts
   export default defineConfig({
     // ...
     themeConfig: {
       name: 'my-theme',
       options: {
         // Your theme options
       }
     }
   });
   ```

3. Customize the components in your theme directory

## Advanced Usage

### Using Plugins

BunPress comes with several built-in plugins that you can configure in your `bunpress.config.ts`:

```typescript
import { defineConfig } from 'bunpress';
import { 
  seoPlugin, 
  imagePlugin, 
  rssPlugin,
  analyticsPlugin
} from 'bunpress/plugins';

export default defineConfig({
  // ...
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
    rssPlugin({
      title: 'My Blog',
      description: 'Latest posts from my blog',
      itemLimit: 20,
    }),
    analyticsPlugin({
      provider: 'google',
      trackingId: 'G-XXXXXXXXXX',
    }),
  ],
});
```

### Internationalization

BunPress has built-in support for multilingual content via the i18n plugin:

```typescript
import { i18nPlugin } from 'bunpress/plugins';

export default defineConfig({
  // ...
  plugins: [
    i18nPlugin({
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr'],
      fallback: true,
    }),
  ],
});
```

Then, add translations in the `i18n` directory:

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

Use translations in your content:

```md
# {{t:welcome}}

Click on the {{t:navigation.home}} link to return to the homepage.
```

## Project Structure

```
my-site/
├── bunpress.config.ts     # Configuration file
├── pages/                 # Content pages (Markdown/MDX)
│   ├── index.md           # Home page
│   └── about.md           # About page
├── public/                # Static assets
└── themes/                # Custom themes (optional)
```

## Configuration

BunPress is configured via a `bunpress.config.ts` file in your project root:

```typescript
import { defineConfig } from 'bunpress';
import { markdownItPlugin, prismPlugin } from 'bunpress/plugins';

export default defineConfig({
  title: 'My BunPress Site',
  description: 'Created with BunPress',
  siteUrl: 'https://example.com',
  pagesDir: 'pages',
  outputDir: 'dist',
  themeConfig: {
    name: 'default',
    options: {
      primaryColor: '#3b82f6',
      darkMode: true,
    },
  },
  plugins: [
    markdownItPlugin({
      html: true,
      linkify: true,
    }),
    prismPlugin({
      theme: 'dark',
      languages: ['javascript', 'typescript'],
    }),
  ],
});
```

## Plugin System

BunPress comes with a powerful plugin system that allows you to extend its functionality. You can use built-in plugins or create your own:

```typescript
import { definePlugin } from 'bunpress';

export default definePlugin({
  name: 'my-plugin',
  transform: (content) => {
    // Transform content before rendering
    return content.replace(/foo/g, 'bar');
  },
  buildStart: async () => {
    // Called at the start of the build process
    console.log('Build started');
  },
});
```

## API Usage

You can also use BunPress programmatically:

```typescript
import { buildSite, loadConfig } from 'bunpress/core';

async function main() {
  const { config, pluginManager } = await loadConfig();
  await buildSite(config, pluginManager);
}

main();
```

## Code Quality & Maintenance

BunPress maintains high code quality standards through automated tools and practices:

### Cleanup & Optimization

Run the cleanup script to ensure your codebase is optimized and follows best practices:

```bash
bun run cleanup
```

The cleanup script:
- Runs the formatter to ensure consistent code style
- Checks exports to ensure all components are properly exported
- Validates tests to ensure quality
- Provides a summary of the codebase status

### Dependency Management

We use [knip](https://github.com/webpro/knip) to detect unused files, exports, and dependencies:

```bash
bun run knip
```

### TypeScript Configuration

BunPress uses a strict TypeScript configuration to ensure type safety. See `tsconfig.json` for details.

### Testing

Run the test suite to ensure everything is working correctly:

```bash
bun test
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to BunPress.

## License

MIT © [BunPress Team](https://github.com/bunpress)