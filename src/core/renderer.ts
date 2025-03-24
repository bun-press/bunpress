import type { BunPressConfig } from '../../bunpress.config';
import { ThemeManager } from './theme-manager';

// Cache the theme manager instance
let themeManager: ThemeManager | null = null;

export function renderHtml(content: any, config: BunPressConfig, workspaceRoot: string): string {
  const { html, frontmatter } = content;
  
  // Initialize theme manager if not already created
  if (!themeManager) {
    themeManager = new ThemeManager(workspaceRoot);
    themeManager.setThemeFromConfig(config);
  }
  
  // Get theme styles
  const themeStyles = themeManager.getThemeStyleContent();
  const activeTheme = themeManager.getActiveTheme();
  
  // If no theme is active, fall back to a simple template
  if (!activeTheme) {
    return renderFallbackTemplate(html, frontmatter, config);
  }

  // Extract TOC items from the HTML content
  const tocItems = extractTocItems(html);
  
  // Get navigation and sidebar data from the config
  const navItems = config.navigation || [];
  const sidebarItems = config.sidebar || [];
  
  // Prepare rendering parameters for React components
  const layoutParams = JSON.stringify({
    frontmatter,
    content: html,
    navItems,
    sidebarItems,
    tocItems,
    config
  });

  // Apply theme class
  const themeClass = 'bunpress-theme';

  // Return the rendered HTML with theme styles and layout
  return `
    <!DOCTYPE html>
    <html lang="en" class="${themeClass}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${frontmatter.title || config.title}</title>
        <style>${themeStyles}</style>
      </head>
      <body>
        <div id="app" data-layout-params='${layoutParams}'></div>
        <script type="module" src="${activeTheme.layoutComponent}"></script>
      </body>
    </html>
  `;
}

// Extract TOC items from HTML content
function extractTocItems(html: string) {
  const tocItems = [];
  const headingRegex = /<h([2-6])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/g;
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // Simple HTML tag stripping for the text
    const text = match[3].replace(/<[^>]*>/g, '');
    
    tocItems.push({ level, id, text });
  }
  
  return tocItems;
}

// Fallback to a simple template if theme is not available
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