# Technical Context

## Core Technologies

### Primary Technologies
- **Bun**: JavaScript runtime and toolkit (v1.0+)
  - Used for: Runtime execution, package management, bundling, HTTP server
  - Key features leveraged: Bun.serve, Bun.build, FileSystemRouter

- **TypeScript**: Programming language (v5.0+)
  - Used for: Type-safe code development
  - Key features: Strong typing, interfaces, type inference

- **React**: UI library (v18+)
  - Used for: Component rendering, client and server components
  - Key features: Server components, React hooks, context API

- **Markdown-it**: Markdown processor
  - Used for: Content transformation
  - Key features: Plugin system, HTML rendering, syntax extensions

### Supporting Libraries

- **Radix UI**: Component primitives
  - Used for: Accessible UI components 
  - Key components: Dialog, Navigation, Dropdown, Accordion

- **Tailwind CSS**: Utility-first CSS framework
  - Used for: Styling components
  - Integration: PostCSS plugin

- **Shadcn/ui**: Component library
  - Used for: Pre-styled UI components
  - Based on: Tailwind CSS and Radix UI

- **Prism.js**: Syntax highlighting (placeholder implementation)
  - Used for: Code block highlighting
  - Integration: Via plugin system

## Development Environment

### Required Tools
- **Bun**: v1.0.0 or higher
- **Node.js**: v16.0.0 or higher (for compatibility)
- **Git**: For version control

### Recommended VSCode Extensions
- TypeScript language features
- Tailwind CSS IntelliSense
- ESLint
- Prettier

## Project Structure

```
bunpress/
├── src/                    # Source code
│   ├── core/              # Core functionality
│   ├── plugins/           # Built-in plugins
│   ├── cli/               # CLI commands
│   ├── templates/         # Default templates
│   └── utils/             # Utility functions
├── dist/                  # Compiled code
├── types/                 # TypeScript declarations
├── themes/                # Theme components
│   └── default/           # Default theme
└── memory-bank/           # Project documentation
```

## Technical Constraints

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE not supported

### Node.js Requirements
- ESM modules only
- No CommonJS support

### Platform Compatibility
- Primary: Unix/Linux and macOS
- Secondary: Windows (with some path resolution issues)

## Technical Decisions

### Fullstack Architecture
BunPress leverages Bun's built-in server capabilities to provide a unified approach for static and dynamic content:

1. **Static Generation**:
   - Pre-rendered HTML for optimal performance
   - Asset optimization and bundling
   - Path-based routing

2. **Server Capabilities**:
   - API routes with file-based structure
   - HTML imports for component reuse
   - Middleware support for request transformation

### Plugin System
The plugin system is designed to be extensible and composable:

1. **Plugin Interface**:
   ```typescript
   interface BunPressPlugin {
     name: string;
     onInit?: (config: BunPressConfig) => void | Promise<void>;
     onContent?: (content: ContentObject) => ContentObject | Promise<ContentObject>;
     onBuild?: (buildContext: BuildContext) => void | Promise<void>;
     onServer?: (server: Server) => void | Promise<void>;
   }
   ```

2. **Plugin Registration**:
   ```typescript
   // In bunpress.config.ts
   export default {
     plugins: [
       imageOptimizerPlugin(),
       seoPlugin(),
       rssPlugin()
     ]
   };
   ```

### Content Processing
Content is processed through a transformation pipeline:

1. **Source**: Read Markdown files
2. **Parse**: Extract frontmatter and content
3. **Transform**: Apply Markdown and plugin transformations
4. **Render**: Generate HTML with React components
5. **Output**: Write to static files or serve dynamically

### Build System
The build process optimizes assets for production:

1. **Content Processing**: Transform all content
2. **Asset Bundling**: Bundle JS, CSS, and other assets
3. **HTML Generation**: Create static HTML files
4. **Output**: Generate a deployable site

## Development Workflow

### Local Development
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Create a new project
bun run bunpress init my-project
```

### Production Deployment
BunPress sites can be deployed to any static hosting service or Node.js/Bun capable environment:

1. **Static Hosting**: Deploy the `dist` directory to services like Vercel, Netlify, or GitHub Pages
2. **Dynamic Hosting**: Deploy with Bun runtime support for fullstack features

## Testing Approach

1. **Unit Tests**: Core functions and utilities
2. **Integration Tests**: Plugin system and content processing
3. **End-to-End Tests**: Build process and server functionality

Tests are implemented using Bun's built-in test runner:
```bash
bun test
```

## Performance Considerations

1. **Development Mode**:
   - Hot Module Replacement (HMR)
   - On-demand content processing
   - In-memory caching

2. **Production Mode**:
   - Static HTML generation
   - Asset optimization
   - Client-side hydration

## Security Considerations

1. **Input Validation**: Validate all user input in API routes
2. **HTML Sanitization**: Clean HTML output from Markdown
3. **Path Traversal Protection**: Prevent directory traversal
4. **Plugin Isolation**: Prevent plugins from affecting each other