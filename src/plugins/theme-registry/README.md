# Theme Registry Plugin for BunPress

The Theme Registry Plugin seamlessly integrates themes with BunPress, providing automatic theme discovery, validation, and loading.

## Installation

The Theme Registry Plugin is included by default in BunPress, but you can also add it explicitly:

```js
import { defineConfig } from 'bunpress';
import { themeRegistryPlugin } from 'bunpress/plugins/theme-registry';

export default defineConfig({
  // Other configuration...
  plugins: [
    themeRegistryPlugin({
      themesDir: 'themes', // Default
      validateThemes: true, // Default
    }),
    // Other plugins...
  ]
});
```

## Features

- **Automatic Theme Discovery**: Finds and registers all themes in the `themes` directory
- **Theme Validation**: Ensures themes have the required components and files
- **Multiple Layout Support**: Handles different layout types (doc, page, home)
- **Component Integration**: Properly connects React components with BunPress

## Theme Structure

A valid BunPress theme should follow this structure:

```
themes/
└── my-theme/
    ├── index.tsx              # Theme entry point (required)
    ├── bunpress-connector.tsx # Theme connector (optional but recommended)
    ├── Layout.tsx             # Main layout component (alternative to index.tsx)
    ├── styles.css             # Main styles (required)
    └── layouts/               # Layout components
        ├── DocLayout.tsx      # Documentation layout
        ├── PageLayout.tsx     # Page layout
        └── HomeLayout.tsx     # Home page layout
```

## Creating a Theme

To create a compatible theme, follow these steps:

1. Create a new directory in the `themes` folder
2. Create an `index.tsx` file as the entry point
3. Create layout files in a `layouts` subdirectory
4. Create a `styles.css` file for styling
5. Create a `bunpress-connector.tsx` file to connect with BunPress

### Example Connector

```tsx
// themes/my-theme/bunpress-connector.tsx
import React from 'react';
import DocLayout from './layouts/DocLayout';
import HomeLayout from './layouts/HomeLayout';
import PageLayout from './layouts/PageLayout';

export function createTheme(options = {}) {
  const defaultLayout = options.defaultLayout || 'doc';
  
  return function MyTheme(props) {
    const {
      frontmatter = {},
      content,
      navItems = [],
      sidebarItems = [],
      tocItems = [],
      currentPath = ''
    } = props;
    
    const layoutType = frontmatter.layout || defaultLayout;
    
    switch (layoutType.toLowerCase()) {
      case 'home':
        return (
          <HomeLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </HomeLayout>
        );
        
      case 'page':
        return (
          <PageLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </PageLayout>
        );
        
      case 'doc':
      default:
        return (
          <DocLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            sidebarItems={sidebarItems}
            tocItems={tocItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </DocLayout>
        );
    }
  };
}

export default createTheme();
```

### Example Entry Point

```tsx
// themes/my-theme/index.tsx
import React from 'react';
import { createTheme } from './bunpress-connector';

export default createTheme();
```

## Using Themes

To use a theme in your BunPress project, specify it in your configuration:

```js
// bunpress.config.ts
import { defineConfig } from 'bunpress';

export default defineConfig({
  // Other configuration...
  themeConfig: {
    name: 'docs', // Name of the theme to use
    defaultLayout: 'doc', // Default layout type
    options: {
      darkMode: true,
      primaryColor: '#3b82f6',
      // Other theme options...
    }
  }
});
```

## Advanced Usage

### Custom Theme Directory

```js
// bunpress.config.ts
import { defineConfig } from 'bunpress';
import { themeRegistryPlugin } from 'bunpress/plugins/theme-registry';

export default defineConfig({
  plugins: [
    themeRegistryPlugin({
      themesDir: 'src/themes', // Custom theme directory
    }),
  ]
});
```

### Modifying Theme Options

```js
// bunpress.config.ts
export default defineConfig({
  themeConfig: {
    name: 'docs',
    options: {
      darkMode: true,
      primaryColor: '#3b82f6',
      accentColor: '#f97316',
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        code: 'Fira Code',
      },
    }
  }
}); 