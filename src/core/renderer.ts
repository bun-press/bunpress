import type { BunPressConfig } from '../../bunpress.config';
import { getThemeManager, initThemeManager } from './theme-manager';
import path from 'path';
import { extractTocItems, TocItem } from '../lib/content-utils';

export interface RenderOptions {
  /**
   * The layout type to use (doc, page, home, etc)
   */
  layout?: string;

  /**
   * Path to CSS files to include
   */
  styles?: string[];

  /**
   * Path to JS files to include
   */
  scripts?: string[];

  /**
   * Additional head tags
   */
  head?: string[];
}

export interface ContentData {
  html: string;
  frontmatter: Record<string, any>;
  toc?: TocItem[];
}

/**
 * Render HTML content with the appropriate theme
 */
export async function renderHtml(
  content: ContentData,
  config: BunPressConfig,
  workspaceRoot: string,
  options: RenderOptions = {}
): Promise<string> {
  const { html, frontmatter } = content;

  // Initialize or get theme manager
  const themeManager = getThemeManager(workspaceRoot) || initThemeManager(workspaceRoot);

  // Set the theme based on config if not already set
  const activeTheme = themeManager.getActiveTheme();
  if (!activeTheme) {
    themeManager.setThemeFromConfig(config);
  }

  // Get theme styles and choose layout type - need to await the promise
  const themeStyles = await themeManager.getThemeStyleContent();
  const layoutType =
    options.layout || frontmatter.layout || config.themeConfig?.defaultLayout || 'doc';

  // If no theme is active after trying to set it, fall back to a simple template
  if (!themeManager.getActiveTheme()) {
    return renderFallbackTemplate(html, frontmatter, config);
  }

  // Extract TOC items from the HTML content if not already provided
  const tocItems = content.toc || extractTocItems(html);

  // Get navigation and sidebar data from the config
  const navItems = config.navigation || [];
  const sidebarItems = config.sidebar || [];

  // Get the layout component path
  const layoutComponent = themeManager.getThemeComponent(layoutType);
  if (!layoutComponent) {
    console.warn(`Layout component for '${layoutType}' not found in theme`);
    return renderFallbackTemplate(html, frontmatter, config);
  }

  // Convert layout path to web path
  const layoutUrl = getWebPath(layoutComponent, workspaceRoot);

  // Prepare rendering parameters for React components
  const layoutParams = {
    frontmatter,
    content: html,
    navItems,
    sidebarItems,
    tocItems,
    currentPath: frontmatter.path || '/',
    config,
  };
  
  // Safely serialize the layout params with proper escaping
  const layoutParamsSerialized = JSON.stringify(layoutParams)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');

  // Apply theme class
  const themeClass = getThemeClasses(config);

  // Build additional CSS and script tags
  const additionalStyles = options.styles
    ? options.styles.map(style => `<link rel="stylesheet" href="${style}">`).join('\n    ')
    : '';

  const additionalScripts = options.scripts
    ? options.scripts
        .map(script => `<script type="module" src="${script}"></script>`)
        .join('\n    ')
    : '';

  // Build additional head tags
  const additionalHeadTags = options.head ? options.head.join('\n    ') : '';

  // Return the rendered HTML with theme styles and layout
  return `
<!DOCTYPE html>
<html lang="en" class="${themeClass}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${frontmatter.title || config.title}</title>
    <meta name="description" content="${frontmatter.description || config.description}">
    <style id="theme-styles">${themeStyles}</style>
    ${additionalStyles}
    ${additionalHeadTags}
  </head>
  <body>
    <div id="app" data-layout-params='${layoutParamsSerialized}'></div>
    ${
      isReactLayout(layoutUrl)
        ? `
    <script type="module">
      import { hydrate } from 'react-dom/client';
      import Layout from '${layoutUrl}';
      
      // Get the layout parameters
      const appElement = document.getElementById('app');
      const params = JSON.parse(appElement.getAttribute('data-layout-params'));
      
      // Hydrate the React component
      const root = hydrate(
        <Layout {...params} />,
        appElement
      );
    </script>
    `
        : '<!-- No hydration script needed for this layout -->'
    }
    ${additionalScripts}
  </body>
</html>
`;
}

/**
 * Check if the layout is a React component that needs hydration
 */
function isReactLayout(layoutPath: string): boolean {
  // Check file extension for React components
  return (
    layoutPath.endsWith('.jsx') ||
    layoutPath.endsWith('.tsx') ||
    layoutPath.includes('/react/') ||
    layoutPath.includes('/components/')
  );
}

/**
 * Get theme classes for the HTML element
 */
function getThemeClasses(config: BunPressConfig): string {
  const classes = ['bunpress-theme'];

  // Add theme name class
  if (config.themeConfig?.name) {
    classes.push(`theme-${config.themeConfig.name}`);
  }

  // Add dark mode class if needed
  if (config.themeConfig?.options?.darkMode) {
    classes.push('dark');
  }

  return classes.join(' ');
}

/**
 * Convert file system path to web path
 */
function getWebPath(filePath: string, workspaceRoot: string): string {
  // Convert absolute file path to relative web path
  const relativePath = path.relative(workspaceRoot, filePath);

  // Normalize path separators for web
  return relativePath.replace(/\\/g, '/');
}

/**
 * Fallback to a simple template if theme is not available
 */
function renderFallbackTemplate(html: string, frontmatter: any, config: BunPressConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title || config.title}</title>
  <meta name="description" content="${frontmatter.description || config.description}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 4px;
      overflow: auto;
    }
    
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <h1>${frontmatter.title || config.title}</h1>
  </header>
  <main>
    ${html}
  </main>
  <footer>
    <p>Built with BunPress</p>
  </footer>
</body>
</html>`;
}
