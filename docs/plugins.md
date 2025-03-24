# BunPress Plugin System

BunPress offers a flexible plugin system that allows you to extend and customize the behavior of your site. This guide will help you understand how plugins work, how to use existing plugins, and how to create your own.

## Using Plugins

To use plugins, add them to your `bunpress.config.ts` file:

```typescript
// bunpress.config.ts
import type { BunPressConfig } from 'bunpress';

const config: BunPressConfig = {
  // ... other config options
  plugins: [
    {
      name: '@bunpress/markdown-it',
      options: {
        html: true,
        linkify: true,
      },
    },
    {
      name: '@bunpress/prism',
      options: {
        theme: 'dark',
        languages: ['javascript', 'typescript'],
      },
    },
    // External plugins from npm
    {
      name: 'bunpress-plugin-sitemap',
      options: {
        hostname: 'https://example.com',
      },
    },
  ],
};

export default config;
```

## Built-in Plugins

BunPress comes with several built-in plugins:

### @bunpress/markdown-it

The Markdown-it plugin provides enhanced Markdown processing using the [markdown-it](https://github.com/markdown-it/markdown-it) library.

**Options:**
- `html` (boolean): Allow HTML tags in source (default: `true`)
- `linkify` (boolean): Autoconvert URL-like text to links (default: `true`)
- `typographer` (boolean): Enable smartquotes and other typographic replacements (default: `true`)
- `breaks` (boolean): Convert `\n` in paragraphs into `<br>` (default: `false`)

### @bunpress/prism

The Prism plugin adds syntax highlighting to code blocks using [Prism.js](https://prismjs.com/).

**Options:**
- `theme` (string): Theme to use (`'default'`, `'dark'`, `'okaidia'`, `'solarizedlight'`, `'tomorrow'`)
- `languages` (string[]): Array of languages to support
- `lineNumbers` (boolean): Show line numbers (default: `false`)

## Creating Your Own Plugin

A BunPress plugin is a JavaScript function that returns an object with the plugin interface. Here's a basic structure:

```typescript
import type { Plugin } from 'bunpress';

interface MyPluginOptions {
  // Define your plugin options here
  optionA?: string;
  optionB?: boolean;
}

export default function myPlugin(options: MyPluginOptions = {}): Plugin {
  return {
    name: 'my-plugin',
    options,
    
    // Content transformation
    transform(content: string) {
      // Modify the content before it's converted to HTML
      return content.replace(/foo/g, options.optionA || 'bar');
    },
    
    // Build lifecycle hooks
    async buildStart() {
      // Called at the start of the build process
      console.log('Build started');
    },
    
    async buildEnd() {
      // Called at the end of the build process
      console.log('Build completed');
    },
    
    // Development server hook
    async configureServer(server: any) {
      // Configure the development server
      console.log('Server configured');
    },
  };
}
```

### Plugin Interface

The plugin interface consists of:

- `name` (required): Unique identifier for your plugin
- `options`: Plugin configuration options
- `transform`: Function to transform content before rendering
- `buildStart`: Hook called at the start of the build process
- `buildEnd`: Hook called at the end of the build process
- `configureServer`: Hook called when setting up the development server

### Publishing Your Plugin

To publish your plugin:

1. Create a package with a name prefixed with `bunpress-plugin-`
2. Export your plugin function as the default export
3. Publish to npm

## Plugin Execution Order

Plugins are executed in the order they are registered in the configuration file. This is important for the `transform` hook, as each plugin receives the content after it has been processed by previous plugins.

## Examples

You can find example plugins in the BunPress repository:

- [markdown-it plugin](https://github.com/bunpress/bunpress/tree/main/src/plugins/markdown-it)
- [prism plugin](https://github.com/bunpress/bunpress/tree/main/src/plugins/prism)

These examples demonstrate how to implement the plugin interface and can serve as a starting point for your own plugins. 