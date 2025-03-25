# BunPress Project Structure

This document outlines the organization of the BunPress codebase to help you navigate and understand the project.

## Directory Structure

```
bunpress/
├── src/               # Source code
│   ├── core/          # Core functionality
│   │   ├── plugin.ts                # Plugin system interface
│   │   ├── content-processor.ts     # Content processing pipeline
│   │   ├── dev-server.ts            # Development server
│   │   ├── router.ts                # Routing system
│   │   ├── renderer.ts              # HTML rendering
│   │   ├── builder.ts               # Static site builder
│   │   ├── config-loader.ts         # Configuration loader
│   │   ├── bundler.ts               # Asset bundling
│   │   ├── fullstack-server.ts      # Fullstack server capabilities
│   │   ├── css-processor.ts         # CSS processing
│   │   ├── hmr.ts                   # Hot module replacement
│   │   ├── theme-manager.ts         # Theme management
│   │   └── slot-system.tsx          # Slot system for content injection
│   ├── plugins/       # Built-in plugins
│   │   ├── markdown-it/       # Markdown processing
│   │   ├── prism/            # Syntax highlighting
│   │   ├── image-optimizer/  # Image optimization
│   │   ├── seo/              # SEO optimization
│   │   ├── i18n/             # Internationalization
│   │   ├── rss-feed/         # RSS feed generation
│   │   ├── search-index/     # Search functionality
│   │   └── analytics/        # Analytics integration
│   ├── lib/           # Utility functions
│   └── cli/           # CLI commands
├── bin/               # Binary executables
├── dist/              # Compiled code (generated)
├── types/             # TypeScript declarations
├── themes/            # Theme components
│   └── docs/          # Documentation theme
│       ├── components/ # UI components
│       ├── layouts/    # Page layouts
│       └── styles/     # Theme styles
├── examples/          # Example projects
│   └── fullstack/     # Fullstack example with API routes
├── pages/             # Content pages
├── public/            # Static assets
├── test-content/      # Test content files
└── docs/              # Project documentation
```

## Core Modules

The `src/core/` directory contains the essential functionality of BunPress:

- **plugin.ts**: Defines the plugin interface and plugin manager
- **content-processor.ts**: Processes Markdown/MDX content
- **dev-server.ts**: Development server with hot reloading
- **router.ts**: File-based routing system
- **renderer.ts**: HTML rendering engine
- **builder.ts**: Static site generation
- **config-loader.ts**: Configuration loading and validation
- **bundler.ts**: Asset bundling with Bun's capabilities
- **fullstack-server.ts**: Server for fullstack applications
- **css-processor.ts**: CSS processing and optimization
- **hmr.ts**: Hot module replacement implementation
- **theme-manager.ts**: Theme loading and management
- **slot-system.tsx**: Slot-based content injection system

## Plugins

The `src/plugins/` directory contains built-in plugins to extend BunPress functionality:

- **markdown-it/**: Markdown processing engine
- **prism/**: Syntax highlighting for code blocks
- **image-optimizer/**: Image optimization and processing
- **seo/**: SEO enhancements like meta tags and sitemaps
- **i18n/**: Internationalization support
- **rss-feed/**: RSS feed generation
- **search-index/**: Search functionality
- **analytics/**: Analytics integration

## Themes

The `themes/` directory contains theming components:

- **docs/**: Documentation theme
  - **components/**: UI components (navigation, sidebar, etc.)
  - **layouts/**: Page layouts (doc, home, page)
  - **styles/**: Theme stylesheets

## Build Process

The build process follows these steps:

1. Load configuration (config-loader.ts)
2. Initialize plugins (plugin.ts)
3. Execute plugin buildStart hooks
4. Scan content directory (builder.ts)
5. Process content files (content-processor.ts)
6. Generate routes (router.ts)
7. Apply plugin transformations
8. Render HTML (renderer.ts)
9. Execute plugin buildEnd hooks
10. Write output files

## Testing

Tests are located alongside the code they test in `__tests__` directories:

- **src/core/__tests__/**: Tests for core functionality
- **src/plugins/*/\_\_tests\_\_/**: Tests for individual plugins
- **themes/docs/\_\_tests\_\_/**: Tests for theme components

## Development Guidelines

1. **Follow Project Structure**: Maintain the organized structure
2. **Keep Tests with Code**: Place tests in `__tests__` directories next to the code they test
3. **Use TypeScript**: All code should be written in TypeScript
4. **Consistent Naming**: Use kebab-case for files, PascalCase for components
5. **Plugin Architecture**: Implement new features as plugins where possible
6. **Documentation**: Keep memory-bank files updated with architectural decisions

## Plugin Development

To create a new plugin:

1. Create a new directory in `src/plugins/`
2. Implement the plugin interface defined in `src/core/plugin.ts`
3. Add tests in a `__tests__` directory
4. Export the plugin through `src/plugins/index.ts`
5. Document the plugin usage and options

## Theme Development

To create or modify themes:

1. Work in the `themes/` directory
2. Use React components for UI elements
3. Leverage the slot system for content injection
4. Follow the existing component patterns
5. Add tests for components
6. Ensure mobile responsiveness 