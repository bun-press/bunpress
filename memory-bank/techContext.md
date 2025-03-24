# Technical Context

## Core Technologies

### Bun
- **Version**: Latest stable release
- **Purpose**: Runtime, bundler, test runner, package manager
- **Key Features Used**:
  - Bun's built-in server for development
  - Bun's bundler for asset optimization
  - Bun's file watcher for HMR
  - Bun's HTTP handling

### Markdown/MDX Processing
- **Libraries**:
  - `gray-matter` for frontmatter parsing
  - `marked` or `remark` for Markdown rendering
  - `mdx-js` for JSX in Markdown
- **Purpose**: Content processing pipeline

### React (Optional)
- **Version**: Latest stable release
- **Purpose**: Used for themes and dynamic components
- **Note**: Core is framework-agnostic; React used in default themes

### Shadcn UI
- **Purpose**: Default theme component library
- **Integration**: Used in the default theme for layout and UI elements

## Development Setup

### Project Structure
```
bunpress-project/
├── bunpress.config.js  # Configuration file
├── pages/              # Content files
│   ├── index.md        # Home page
│   ├── about.md        # About page
│   └── blog/
│       └── post1.md    # Blog post
├── components/         # Reusable components for MDX
│   └── MyComponent.tsx
├── public/             # Static assets
│   └── logo.png
└── themes/
    └── default/        # Default theme with Shadcn components
        ├── Layout.tsx
        └── styles.css
```

### Core Commands
- `bun dev`: Start development server with HMR
- `bun build`: Generate optimized static site
- `bun test`: Run test suite

## Technical Constraints

### Performance Targets
- Development server start: < 500ms
- Page HMR: < 100ms
- Build time: Proportional to site size, but faster than VitePress

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No explicit support for legacy browsers

### Dependencies
- Minimal external dependencies to maintain performance
- Core dependencies limited to essentials for Markdown/MDX processing
- Optional dependencies for framework integration (e.g., React)

## Technical Roadmap

### Phase 1: Core Functionality
- File-based routing
- Markdown/MDX processing
- Basic theme system
- Development server with HMR
- Production build

### Phase 2: Plugin System
- Plugin architecture
- Core plugins (i18n, image optimization, search)
- Plugin API documentation

### Phase 3: Advanced Features
- Advanced theme customization
- Performance optimizations
- Additional plugin ecosystem 