# Technical Context

## Technologies Used

### Core Technologies

1. **Bun**: Core runtime and package manager, providing a fast JavaScript runtime with built-in testing capabilities.
2. **TypeScript**: Used for type-safe development.
3. **Markdown-it**: For Markdown processing.
4. **Esbuild**: For JavaScript/TypeScript bundling.
5. **fs-extra**: For enhanced file system operations.
6. **path**: For path manipulation.
7. **globby**: For file matching using glob patterns.
8. **commander**: For CLI command parsing.
9. **chokidar**: For file watching in development mode.
10. **gray-matter**: For frontmatter parsing.
11. **cosmiconfig**: For configuration loading.
12. **chalk**: For terminal coloring.

### Testing Libraries

1. **Bun Test**: Used for unit and integration testing.
2. **Jest compatible mocking**: For mocking dependencies in tests.

### Plugin-Specific Technologies

1. **Prism.js**: For syntax highlighting in code blocks.
2. **Sharp**: For image processing and optimization.
3. **HTML/XML Manipulation**: For SEO meta tag insertion and RSS feed generation.

## Development Setup

The project is designed to be developed with Bun, leveraging its fast runtime and testing capabilities. The development setup includes:

1. Bun as the package manager and runtime
2. TypeScript for type-safe development
3. ESLint for code linting
4. Git for version control

## Technical Constraints

1. **Bun Compatibility**: All code must be compatible with Bun's runtime.
2. **Node.js APIs**: The code uses Node.js APIs that are supported by Bun.
3. **Pure ESM**: The project uses pure ES modules (no CommonJS).
4. **TypeScript**: All code is written in TypeScript for type safety.
5. **Plugin Architecture**: Features should be implemented as plugins when possible.

## Dependencies

### Core Dependencies

- `bun`: Core runtime and test runner
- `typescript`: For type checking and compilation
- `markdown-it`: For Markdown processing
- `gray-matter`: For frontmatter parsing
- `fs-extra`: Enhanced file system operations
- `globby`: For file matching using glob patterns
- `commander`: For CLI command parsing
- `chokidar`: For file watching

### Plugin Dependencies

- `prismjs`: For syntax highlighting (Prism.js plugin)
- `sharp`: For image processing (Image Optimizer plugin)

## Technical Patterns

### File-Based Routing

BunPress uses a file-based routing system, where the structure of the content directory determines the routes of the site. This approach is similar to frameworks like Next.js and Nuxt.js.

### Plugin System

The plugin system is based on a set of lifecycle hooks that allow plugins to interact with the build process at various stages:

1. `configureServer`: For development server configuration
2. `buildStart`: For initialization at the beginning of a build
3. `transform`: For content transformation
4. `buildEnd`: For finalization at the end of a build

### Content Processing Pipeline

The content processing pipeline transforms raw Markdown files into processed content objects:

1. Read file content
2. Parse frontmatter
3. Render Markdown to HTML
4. Apply plugin transformations
5. Generate final content object

### Test Patterns

1. **Mock File System**: Using Jest-compatible mock implementations for file system operations
2. **Isolated Tests**: Ensuring tests are independent and don't affect each other
3. **Plugin Testing**: Using dedicated test helpers exposed through a `__test__` property
4. **Mock Content Processor**: Creating mock implementations of the content processor for testing

### RSS Feed Generation

The RSS feed plugin uses several technical patterns:

1. **XML Generation**: Creating valid XML for RSS feeds
2. **Content Collection**: Gathering content files during the build process
3. **XML Escaping**: Properly escaping special characters in XML
4. **Content Excerpts**: Generating excerpts from full content
5. **Test Helper Pattern**: Exposing internal methods for testing through `__test__` property

## Project Structure

```
bunpress/
  ├── src/               # Source code
  │   ├── cli/           # CLI commands
  │   ├── core/          # Core functionality
  │   │   ├── builder.ts # Build process
  │   │   ├── config.ts  # Configuration management
  │   │   ├── content-processor.ts # Content processing
  │   │   ├── plugins.ts # Plugin system
  │   │   └── router.ts  # Routing system
  │   ├── plugins/       # Built-in plugins
  │   │   ├── image-optimizer/ # Image optimization plugin
  │   │   ├── markdown-it/     # Markdown-it configuration
  │   │   ├── prism/           # Syntax highlighting
  │   │   ├── seo/             # SEO optimization
  │   │   ├── rss-feed/        # RSS feed generation
  │   │   └── index.ts         # Plugin exports
  │   └── utils/         # Utility functions
  ├── tests/             # Test files
  ├── types/             # TypeScript type definitions
  └── package.json       # Package configuration
```

## Build Process

The build process follows these steps:

1. Parse configuration
2. Initialize plugins (buildStart)
3. Scan content directory
4. Process content files
5. Apply plugin transformations
6. Generate routes
7. Build output files
8. Run plugin buildEnd hooks
9. Write files to disk 