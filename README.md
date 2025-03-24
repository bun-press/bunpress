### Introducing BunPress: A VitePress Replacement

BunPress is a fast, lightweight, and extensible static site generator (SSG) designed to replace VitePress, leveraging Bun's native tools for superior performance and simplicity. Below, I’ll outline the architecture, features, development experience, unique selling points (USPs), and how it meets your requirements, including the use of Shadcn for theme templates and a plugin-based approach.

---

### Architecture Summary

#### Core Engine
BunPress utilizes Bun’s native capabilities to form its core engine:
- **Server**: Bun’s built-in server powers the development experience with hot module replacement (HMR).
- **Bundler**: Bun’s bundler generates optimized static files for production.
- **File Watcher**: Bun’s file-watching capabilities detect changes, triggering rebuilds or HMR during development.

This Bun-first approach ensures maximum performance and minimal reliance on external dependencies.

---

### Static Site Generator (SSG) Features

BunPress provides a robust set of features to create static sites efficiently:

1. **File-Based Routing**
   - Routes are determined by the file structure in the `pages/` directory.
   - Examples:
     - `pages/index.md` → `/`
     - `pages/about.md` → `/about`
     - `pages/blog/post1.md` → `/blog/post1`
   - Future support for dynamic routes (e.g., `[param].md`) can be added via plugins.

2. **Markdown Parsing with Frontmatter**
   - Supports Markdown files with YAML frontmatter for metadata (e.g., `title`, `description`).
   - Uses libraries like `gray-matter` for frontmatter parsing and `marked` or `remark` for Markdown rendering.
   - Extends to MDX for JSX support (see below).

3. **Customizable Themes/Templates**
   - Themes define the site’s look and feel using a layout component and styles.
   - Default theme leverages **Shadcn**, a React-based component library, for pre-built, customizable UI components.
   - Example theme structure:
     ```
     themes/default/
     ├── Layout.tsx  # Main layout component
     └── styles.css  # Theme styles
     ```

4. **Plugin System**
   - A modular plugin system allows users to extend functionality.
   - Plugins can hook into the build process, development server, and content transformation.
   - Example plugin interface:
     ```javascript
     export default function myPlugin(options) {
       return {
         name: 'my-plugin',
         transform(code, id) { /* Transform content */ },
         buildEnd() { /* Post-build actions */ },
         configureServer(server) { /* Add middleware */ }
       };
     }
     ```

---

### Development Experience

BunPress offers a seamless development workflow:
- **`bun dev`**: Starts a development server with instant HMR.
  - Serves the site based on the file structure.
  - Updates the browser in real-time as files change using Bun’s HMR capabilities.
- **`bun build`**: Generates an optimized static site for production.
  - Compiles Markdown/MDX to HTML.
  - Bundles assets (JS, CSS, images).
  - Outputs static files to a `dist/` directory.

---

### Unique Selling Points (USPs)

BunPress stands out with the following advantages:
- **Bun-First and Bun-Native Speed**: Built entirely on Bun’s ecosystem for lightning-fast builds and development.
- **Framework-Agnostic**: Core operates without a specific framework, with optional framework support (e.g., React) via plugins or themes.
- **Lightweight MDX Support**: Allows JSX in Markdown files using `mdx-js`, enabling dynamic content without heavy dependencies.

---

### Pluggable Features

To keep the core lightweight, advanced features are implemented as plugins:

1. **Internationalization (i18n)**
   - Plugin: `@bunpress/i18n`
   - Adds multi-language support with locale detection and content translation.

2. **Image Optimization**
   - Plugin: `@bunpress/image-optimization`
   - Automatically optimizes images during the build process (e.g., resizing, format conversion).

3. **Search Functionality**
   - Plugin: `@bunpress/search`
   - Generates a search index and provides a client-side search component.

4. **Global State Management**
   - Plugin: `@bunpress/state`
   - Integrates state management libraries (e.g., Redux, MobX) for interactive sites.

5. **Analytics Integration**
   - Plugin: `@bunpress/analytics`
   - Simplifies adding analytics scripts (e.g., Google Analytics) to pages.

All features are optional, ensuring users only include what they need.

---

### SEO Enhancements

BunPress automates SEO configuration to save users from manual setup:
- **Meta Tags and OpenGraph Tags**
  - Extracts metadata (e.g., `title`, `description`) from frontmatter.
  - Generates `<meta>` and OpenGraph tags in the HTML `<head>` for each page.
  - Example frontmatter:
    ```yaml
    ---
    title: "Home Page"
    description: "Welcome to my BunPress site"
    ---
    ```
  - Resulting HTML:
    ```html
    <head>
      <title>Home Page</title>
      <meta name="description" content="Welcome to my BunPress site">
      <meta property="og:title" content="Home Page">
      <meta property="og:description" content="Welcome to my BunPress site">
    </head>
    ```

- **Sitemap Generation**
  - During `bun build`, collects all routes and generates a `sitemap.xml` file.
  - Example:
    ```xml
    <urlset>
      <url><loc>https://example.com/</loc></url>
      <url><loc>https://example.com/about</loc></url>
      <url><loc>https://example.com/blog/post1</loc></url>
    </urlset>
    ```

These features are built into the core but can be customized or extended via plugins.

---

### Example Project Structure

Here’s how a BunPress project might look:
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

#### Configuration Example
```javascript
// bunpress.config.js
export default {
  title: 'My BunPress Site',
  description: 'A fast static site',
  theme: 'default', // Uses Shadcn-based theme
  plugins: [
    ['@bunpress/i18n', { locales: ['en', 'fr'] }],
    '@bunpress/image-optimization',
    '@bunpress/search'
  ]
};
```

---

### How It Works

#### Development Server (`bun dev`)
1. Starts a Bun server.
2. Maps URLs to files in `pages/`.
3. Parses Markdown/MDX, renders with the theme’s `Layout.tsx`, and serves HTML.
4. Watches for changes and triggers HMR.

#### Build Process (`bun build`)
1. Scans `pages/` to build a route map.
2. Parses each file’s frontmatter and content.
3. Compiles MDX to React components (if applicable).
4. Renders pages to static HTML using the theme.
5. Bundles JS, CSS, and optimizes assets.
6. Generates SEO files (meta tags, sitemap).

#### Shadcn Integration
- The default theme uses Shadcn’s React components for layouts and UI elements.
- Users can import Shadcn components in MDX files or customize the theme.

---

### Why BunPress?
- **Speed**: Bun’s native tools ensure fast builds and instant HMR.
- **Simplicity**: File-based routing and a minimal core reduce complexity.
- **Extensibility**: Plugins and themes make it adaptable to any use case.
- **SEO Made Easy**: Automatic meta tags and sitemap generation save time.

BunPress delivers a modern SSG experience tailored to Bun’s strengths, with Shadcn enhancing the theming system and a plugin architecture keeping it lightweight and flexible.