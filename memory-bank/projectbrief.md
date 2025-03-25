# Project Brief: BunPress

## Overview
BunPress is a modern static site generator and fullstack framework built specifically for the Bun JavaScript runtime. It combines the benefits of static site generation with fullstack capabilities, offering a unified approach to building content-rich websites and web applications.

## Key Goals
1. **Performance**: Leverage Bun's speed for faster development and production experiences
2. **Developer Experience**: Provide intuitive APIs and rapid feedback loops
3. **Flexibility**: Support both static sites and dynamic applications
4. **Modern Architecture**: Utilize latest web technologies and practices

## Core Features

### Content Management
- Markdown-based content creation with frontmatter
- File-based routing with automatic path generation
- Content transformation pipeline with plugin support

### Theme System
- Component-based themes with React
- Layout components (docs, home, page)
- Slot-based content injection
- Dark/light mode support

### Fullstack Capabilities
- Static site generation with pre-rendering
- API routes with file-based routing
- HTML imports for component reuse
- Server middleware support

### Plugin Architecture
- Lifecycle-based hooks for extensions
- Content transformation plugins
- Build process plugins
- Server enhancement plugins

## Technologies
- **Runtime**: Bun (v1.0+)
- **Language**: TypeScript
- **UI Framework**: React 
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (based on Radix UI)
- **Content**: Markdown-it with plugin extensions

## Project Status
BunPress is currently in active development with core functionality implemented. It has a working plugin system, content processing pipeline, and theme system. The development server and build system are operational, but some features are partially implemented or need refinement.

### Current Phase
Development is focused on stabilizing core features, improving error handling, and enhancing cross-platform compatibility. The primary goal is to create a solid foundation before expanding the feature set.

### Next Steps
1. Complete placeholder implementations in plugins
2. Improve error handling and messaging
3. Fix cross-platform compatibility issues
4. Enhance documentation

## Project Structure
The codebase follows a modular structure with clear separation of concerns:

```
src/
├── core/ - Core system components
├── plugins/ - Plugin implementations
├── cli/ - Command line interface
├── templates/ - Default templates
└── utils/ - Shared utilities
```

## Working Model
BunPress operates through several key processes:

1. **Development Mode**:
   - File watching with HMR
   - On-demand content processing
   - Development server with Bun.serve

2. **Build Process**:
   - Content processing and transformation
   - Asset optimization and bundling
   - Static HTML generation

3. **Plugin System**:
   - Plugin registration and initialization
   - Lifecycle hooks for extensions
   - Content transformation pipeline

## Success Criteria
1. **Core Functionality**: Stable implementation of content processing, theming, and server capabilities
2. **Performance**: Fast development server startup and hot reloading
3. **Documentation**: Comprehensive guides and examples
4. **Cross-Platform**: Reliable operation across macOS, Linux, and Windows

## Compatibility Requirements
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Bun v1.0.0 or higher
- Node.js v16.0.0 or higher (for compatibility)

## Limitations
- Designed specifically for Bun runtime
- ESM modules only (no CommonJS support)
- Some plugin implementations are currently incomplete

## Additional Resources
- [GitHub Repository](https://github.com/your-org/bunpress)
- [Documentation Site](https://bunpress.dev)
- [Example Projects](https://bunpress.dev/examples) 