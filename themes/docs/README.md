# BunPress Documentation Theme

A beautiful, responsive documentation theme for BunPress with built-in dark mode, search, and customization options.

## Features

- **Responsive Design**: Works on all screen sizes
- **Dark Mode**: Automatically switches based on system preference, with manual toggle
- **Customizable Layout**: Multiple layout options (doc, page, home)
- **Sidebar Navigation**: Collapsible sidebar with nested items
- **Table of Contents**: Automatically generated from content headings
- **Search**: Built-in search functionality
- **Syntax Highlighting**: Code block highlighting
- **shadcn UI Components**: Built with shadcn UI for a modern look and feel

## Structure

The theme is organized as follows:

```
themes/docs/
├── components/         # Reusable components
│   ├── custom/         # Custom components specific to docs theme
│   ├── ui/             # shadcn UI components
│   ├── Footer.tsx      # Page footer component
│   ├── Navigation.tsx  # Top navigation bar
│   ├── Sidebar.tsx     # Documentation sidebar
│   └── TOC.tsx         # Table of contents
├── layouts/            # Page layouts
│   ├── DocLayout.tsx   # Documentation page layout
│   ├── HomeLayout.tsx  # Home page layout
│   └── PageLayout.tsx  # Standard page layout
├── __tests__/          # Theme tests
├── bunpress-connector.tsx # Connect theme with BunPress core
├── index.tsx           # Theme entry point
├── Layout.tsx          # Re-export of DocLayout (for compatibility)
├── COMPONENTS.md       # Documentation of included shadcn components
├── README.md           # This documentation
└── styles.css          # Consolidated theme styles
```

## Usage

### In a BunPress Project

```js
// bunpress.config.ts
import { defineConfig } from 'bunpress';

export default defineConfig({
  themeConfig: {
    name: 'docs',
    options: {
      // Theme options
      darkMode: true,
      primaryColor: '#3b82f6',
      navLogo: '/logo.svg',
      footer: {
        message: 'Released under the MIT License.',
        copyright: '© 2023 BunPress Team'
      }
    }
  }
});
```

## Theme Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `darkMode` | `boolean` | `true` | Enable dark mode toggle |
| `primaryColor` | `string` | `'#3b82f6'` | Primary color for buttons, links, etc. |
| `accentColor` | `string` | `'#f97316'` | Accent color for highlights |
| `navLogo` | `string` | `''` | Path to logo image in navbar |
| `footer.message` | `string` | `''` | Footer message |
| `footer.copyright` | `string` | `''` | Copyright text |
| `fonts.heading` | `string` | `'Inter'` | Heading font family |
| `fonts.body` | `string` | `'Inter'` | Body font family |
| `fonts.code` | `string` | `'Fira Code'` | Monospace font family |

## Layout Types

The theme provides three main layout types:

1. **DocLayout** - For documentation pages with sidebar and table of contents
2. **PageLayout** - For standard pages without sidebar
3. **HomeLayout** - For your landing page with special features

## Frontmatter Options

Documentation pages support the following frontmatter options:

```yaml
---
title: Getting Started
description: Learn how to use BunPress
layout: doc  # 'doc', 'page', or 'home'
sidebar: true  # Show sidebar on this page
toc: true  # Show table of contents
tocLevels: [2, 3]  # Min and max heading levels to show in TOC
editLink: https://github.com/your-repo/edit/path/to/file.md
lastUpdated: 2023-01-01
prev:
  text: Previous Page
  link: /path/to/prev
next:
  text: Next Page
  link: /path/to/next
heroImage: /path/to/image.png
theme:
  fullWidthLayout: false  # Use full width layout
  showAside: true  # Show table of contents
  showFooter: true  # Show footer
  hideNav: false  # Hide navigation
  footerLinks:
    - title: Resources
      items:
        - text: Documentation
          link: /docs
---
```

## Customization

### CSS Variables

You can customize the theme by overriding CSS variables in your own CSS file:

```css
:root {
  /* Colors */
  --doc-primary: #3b82f6;
  --doc-primary-hover: #2563eb;
  --doc-accent: #f97316;
  --doc-text: #1f2937;
  --doc-text-secondary: #4b5563;
  --doc-bg: #ffffff;
  --doc-bg-secondary: #f9fafb;
  --doc-border: #e5e7eb;

  /* Layout */
  --doc-content-width: 760px;
  --doc-sidebar-width: 260px;
  --doc-toc-width: 240px;
  
  /* Typography */
  --doc-font-family-heading: 'Inter', sans-serif;
  --doc-font-family-body: 'Inter', sans-serif;
  --doc-font-family-code: 'Fira Code', monospace;
}

html.dark {
  --doc-text: #f9fafb;
  --doc-text-secondary: #d1d5db;
  --doc-bg: #111827;
  --doc-bg-secondary: #1f2937;
  --doc-border: #374151;
}
```

### Components

You can extend or override theme components using the BunPress slot system:

```jsx
import { Slot } from 'bunpress';

export default function MyCustomNavigation() {
  return (
    <Slot name="navigation">
      {/* Your custom navigation */}
    </Slot>
  );
}
```

## Examples

### Basic Documentation Page

```markdown
---
title: Getting Started
description: Learn how to use BunPress
layout: doc
---

# Getting Started

Welcome to BunPress! This guide will help you get started with BunPress.

## Installation

```bash
npm install bunpress
```

## Configuration

Create a `bunpress.config.ts` file in your project root:

```js
import { defineConfig } from 'bunpress';

export default defineConfig({
  // Your configuration here
});
```
```

### Home Page

```markdown
---
title: BunPress
description: The blazingly fast documentation generator
layout: home
hero:
  title: BunPress
  tagline: The blazingly fast documentation generator
  actions:
    - text: Get Started
      link: /guide/getting-started
      type: primary
    - text: View on GitHub
      link: https://github.com/your-username/bunpress
      type: secondary
features:
  - title: Fast
    description: Built with Bun from the ground up for superior performance
    icon: 🚀
  - title: Flexible
    description: Customizable themes and plugins for any documentation need
    icon: 🛠️
  - title: Modern
    description: Utilizes the latest web technologies for the best experience
    icon: 💎
---
```

## shadcn UI Components

The theme includes many shadcn UI components in the `components/ui` directory, ready to use in your documentation. See [COMPONENTS.md](./COMPONENTS.md) for a full list of available components and usage examples.

## Credits

The Docs theme is inspired by modern documentation sites and built with:

- React for component rendering
- shadcn/ui for UI components
- Tailwind CSS for styling
- Lucide for icons 