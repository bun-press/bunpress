import type { BunPressConfig } from '../../bunpress.config';

export function renderHtml(content: any, config: BunPressConfig): string {
  const { html, frontmatter } = content;
  
  // A simple HTML template for now - in a real implementation, this would use a theme system
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
    
    .language-javascript {
      color: #000080;
    }
    
    [data-prism="true"] {
      display: block;
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