# Project Brief: BunPress

## Project Overview
BunPress is a fast, lightweight, and extensible static site generator (SSG) designed as a VitePress replacement, leveraging Bun's native tools for superior performance and simplicity.

## Core Objective
Create a modern static site generator that takes full advantage of Bun's capabilities to deliver exceptional speed and developer experience while maintaining simplicity and extensibility.

## Key Requirements
1. **Performance-Focused**: Utilize Bun's native capabilities for maximum speed in both development and build processes.
2. **Markdown and MDX Support**: Process Markdown files with frontmatter and extend to MDX for JSX support.
3. **File-Based Routing**: Generate routes based on the file structure in the `pages/` directory.
4. **Customizable Themes**: Support theme customization with Shadcn components as the default UI library.
5. **Plugin Architecture**: Implement a flexible plugin system that allows extending functionality.
6. **SEO Optimization**: Include automatic meta tags, OpenGraph tags, and sitemap generation.
7. **Development Experience**: Provide seamless development workflow with hot module replacement.

## Success Criteria
1. Development server (`bun dev`) with hot module replacement that updates instantly.
2. Build command (`bun build`) that generates optimized static files for production.
3. Proper rendering of Markdown/MDX content with frontmatter support.
4. Easy theme customization with Shadcn integration.
5. Working plugin system for extending core functionality.
6. Automated SEO features working correctly.
7. Equal or better performance compared to VitePress.

## Constraints
- Must be built primarily with Bun's native tools.
- Core should remain lightweight, with advanced features implemented via plugins.
- Development and build processes should be optimized for speed. 