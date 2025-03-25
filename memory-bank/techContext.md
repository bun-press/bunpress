# Technical Context

## Technology Stack

### Core Technologies
- **Bun**: JavaScript/TypeScript runtime and package manager
- **TypeScript**: Typed superset of JavaScript for improved developer experience
- **React**: UI library for components and theme development
- **ESBuild** (via Bun): Fast JavaScript/TypeScript bundler

### Key Dependencies
- **markdown-it**: Markdown processing and rendering
- **happy-dom**: DOM implementation for testing
- **gray-matter**: YAML frontmatter parsing
- **chalk**: Terminal styling for CLI
- **sharp**: Image processing and optimization
- **ws**: WebSocket implementation for HMR

## Development Tools

### TypeScript Configuration
- **TypeScript 5.8+**: Using the latest TypeScript for improved type checking and performance
- **Custom TypeChecking**: Custom script that suppresses unused variable warnings with appropriate flags
- **Declaration Files**: TypeScript declaration files generation for better module consumption
- **tsconfig.json**: Project-specific TypeScript configuration with appropriate compiler options
- **JSX Support**: Support for React components in .tsx files

### Testing
- **Bun's Test Runner**: Used for unit and integration testing
- **Happy DOM**: For DOM manipulation in tests
- **Test Isolation**: Global variable management for proper test isolation

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript Checking**: Static type analysis for catching errors

## Project Structure

### Core Module System
```
src/
  core/           - Core functionality
    plugin.ts     - Plugin system interfaces and utilities
    router.ts     - Routing and URL handling
    bundler.ts    - Asset bundling logic
    renderer.ts   - Content rendering pipeline
    theme-manager.ts - Theme loading and management
    slot-system.ts   - Component slot architecture
    types.ts      - Core type definitions
  plugins/        - Built-in plugins
  cli/            - Command-line interface
  lib/            - Shared utilities
  index.ts        - Main exports
```

### Plugin Architecture
- **Plugin Interface**: Consistent API for all plugins
- **Lifecycle Hooks**: Registration, initialization, and content processing
- **Configuration Options**: Type-safe plugin configuration

### Theme System
- **Theme Registration**: Auto-discovery of themes in the project
- **Component Architecture**: Layout components with slots
- **Style Processing**: CSS/Sass handling
- **JSX Support**: React components for theming
- **Type Definitions**: TypeScript interfaces for themes

## Build Pipeline

### Development Flow
1. Source TypeScript files (.ts/.tsx)
2. TypeScript type checking (via custom script with appropriate flags)
3. Bun's bundler (based on esbuild)
4. Output JavaScript with source maps

### Production Build
1. Source TypeScript files
2. Type checking and declaration file generation
3. Bundling with minification
4. Asset optimization
5. Output distribution files

### Type Generation
- **Declaration Files**: Generated with `--emitDeclarationOnly` for type exports
- **Type Exports**: Package exports include type definitions
- **Skipped Checks**: Using `--skipLibCheck`, `--noUnusedLocals false`, and `--noUnusedParameters false` for improved build experience

## Key Architectural Concepts

### Content Pipeline
1. **Discovery**: Finding markdown and MDX files
2. **Parsing**: Extracting frontmatter and content
3. **Transformation**: Applying plugins and processors
4. **Rendering**: Converting to HTML
5. **Theming**: Applying layout components

### Rendering Strategy
- **Server-Side Rendering**: Pre-rendered HTML for fast loading
- **Hydration**: Client-side interactivity where needed
- **Asset Optimization**: Image processing and CSS minification

### Plugin System
- **Registration**: Plugins are registered with the core
- **Discovery**: Auto-discovery of plugins in the project
- **Configuration**: Type-safe config options
- **Execution**: Lifecycle-based execution

### Theme Architecture
- **Component-Based**: React components for layouts
- **Slot System**: Content injection points
- **Style Integration**: CSS modules or global styles
- **Layout Selection**: Based on content type or frontmatter

## Development Workflows

### Local Development
1. `bun run dev`: Start development server with HMR
2. `bun run build`: Build the project
3. `bun run lint`: Run TypeScript checks
4. `bun test`: Run test suite

### Testing Approach
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions
- **End-to-End Tests**: Full workflow testing
- **Test Isolation**: Using global variables and mocking

### Deployment
- **Static Outputs**: Generated HTML, JS, and CSS
- **Asset Optimization**: Minification and tree-shaking
- **Platform Support**: Node.js, Bun, and static hosting
- **CI/CD Integration**: Test and build on push

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