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
  
  // Render with theme
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title || config.title}</title>
  <meta name="description" content="${frontmatter.description || config.description}">
  <style>${themeStyles}</style>
</head>
<body class="min-h-screen bg-background">
  <header class="border-b">
    <div class="container mx-auto px-4 py-4">
      <nav class="flex items-center justify-between">
        <a href="/" class="text-xl font-bold">${config.title}</a>
        <div class="flex items-center space-x-4">
          <a href="/" class="hover:text-primary">Home</a>
          <a href="/docs" class="hover:text-primary">Docs</a>
        </div>
      </nav>
    </div>
  </header>

  <main class="container mx-auto px-4 py-8">
    <article class="prose prose-lg dark:prose-invert mx-auto">
      <h1>${frontmatter.title || ''}</h1>
      ${html}
    </article>
  </main>

  <footer class="border-t">
    <div class="container mx-auto px-4 py-6">
      <p class="text-center text-muted-foreground">
        &copy; ${new Date().getFullYear()} - Powered by BunPress
      </p>
    </div>
  </footer>
</body>
</html>`;
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