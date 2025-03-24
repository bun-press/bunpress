# BunPress

A modern static site generator built with Bun's native capabilities for blazing-fast performance.

[![npm version](https://img.shields.io/npm/v/bunpress.svg)](https://www.npmjs.com/package/bunpress)
[![License](https://img.shields.io/npm/l/bunpress.svg)](https://github.com/bunpress/bunpress/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/built%20with-bun-yellow)](https://bun.sh)

## Features

- 🚀 **Built for Bun**: Leverages Bun's native tools for maximum performance
- 🔌 **Plugin System**: Extend functionality with a powerful plugin architecture
- 📄 **Markdown Support**: First-class support for Markdown content
- 🎨 **Theme System**: Customize your site with flexible theming (coming soon)
- 🧩 **React Components**: Use React components in your content with MDX
- 💻 **Dev Server**: Fast development server with hot module replacement
- 📦 **Static Output**: Generate static sites for deployment anywhere

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

## Contributing

Contributions are welcome! Please check out our [contributing guide](CONTRIBUTING.md) for details.

## License

MIT © [BunPress Team](https://github.com/bunpress)