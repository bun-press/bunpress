import type { Plugin } from '../../core/plugin';
import * as Prism from 'prismjs';
import * as fs from 'fs';
import * as path from 'path';

// Load languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

// Map of theme names to their file paths
const THEME_MAP = {
  'default': 'prism.css',
  'dark': 'prism-dark.css',
  'okaidia': 'prism-okaidia.css',
  'solarizedlight': 'prism-solarizedlight.css',
  'tomorrow': 'prism-tomorrow.css'
};

interface PrismOptions {
  theme?: keyof typeof THEME_MAP;
  languages?: string[];
  lineNumbers?: boolean;
  injectStyles?: boolean;
}

/**
 * Dynamically load additional Prism language
 */
function loadLanguage(lang: string): boolean {
  try {
    if (!Prism.languages[lang]) {
      require(`prismjs/components/prism-${lang}`);
      return true;
    }
    return true;
  } catch (error) {
    console.warn(`Prism.js plugin: Could not load language '${lang}'. ${error}`);
    return false;
  }
}

/**
 * Get theme CSS content
 */
function getThemeCSS(theme: keyof typeof THEME_MAP): string {
  try {
    const themePath = require.resolve(`prismjs/themes/${THEME_MAP[theme]}`);
    return fs.readFileSync(themePath, 'utf8');
  } catch (error) {
    console.warn(`Prism.js plugin: Could not load theme '${theme}'. Using default theme.`);
    try {
      const defaultThemePath = require.resolve('prismjs/themes/prism.css');
      return fs.readFileSync(defaultThemePath, 'utf8');
    } catch {
      return ''; // Return empty string if both fail
    }
  }
}

/**
 * Add line numbers CSS
 */
function getLineNumbersCSS(): string {
  try {
    const lineNumbersPath = require.resolve('prismjs/plugins/line-numbers/prism-line-numbers.css');
    return fs.readFileSync(lineNumbersPath, 'utf8');
  } catch {
    return '';
  }
}

export default function prismPlugin(options: PrismOptions = {}): Plugin {
  const {
    theme = 'default',
    languages = [],
    lineNumbers = false,
    injectStyles = true
  } = options;
  
  // Track loaded languages to avoid duplicate loading warnings
  const loadedLanguages = new Set<string>(['markup', 'css', 'javascript', 'typescript', 
    'jsx', 'tsx', 'bash', 'yaml', 'json', 'markdown']);
  
  // Load additional languages
  for (const lang of languages) {
    if (!loadedLanguages.has(lang)) {
      if (loadLanguage(lang)) {
        loadedLanguages.add(lang);
      }
    }
  }
  
  // Theme CSS content
  let themeCSS = '';
  let lineNumbersCSS = '';
  
  // Helper function to highlight code
  function highlightCode(code: string, language: string): string {
    // Try loading the language if it's not loaded yet
    if (language && !loadedLanguages.has(language)) {
      if (loadLanguage(language)) {
        loadedLanguages.add(language);
      }
    }
    
    // Check if language is supported
    if (language && Prism.languages[language]) {
      try {
        return Prism.highlight(code, Prism.languages[language], language);
      } catch (error) {
        console.warn(`Prism.js plugin: Error highlighting language '${language}'.`, error);
        return code; // Return original code on error
      }
    }
    
    // Return original code for unknown languages
    return code;
  }
  
  return {
    name: 'prism-syntax-highlighting',
    options,
    
    transform: async (content: string) => {
      // Find code blocks in markdown content
      const regex = /```(\w+)?\s*\n([\s\S]+?)```/g;
      
      // Replace each code block with highlighted code
      const transformed = content.replace(regex, (match, language, code) => {
        const lang = language?.trim() || 'text';
        
        // Skip if language is text or plaintext
        if (lang === 'text' || lang === 'plaintext') {
          return match;
        }
        
        // Trim trailing whitespace and newlines
        const trimmedCode = code.trim();
        
        // Highlight the code
        const highlightedCode = highlightCode(trimmedCode, lang);
        
        // Prepare CSS classes
        const cssClasses = ['language-' + lang];
        if (lineNumbers) {
          cssClasses.push('line-numbers');
        }
        
        // Return highlighted code wrapped in pre and code tags
        return `<pre class="${cssClasses.join(' ')}"><code class="language-${lang}">${highlightedCode}</code></pre>`;
      });
      
      return transformed;
    },
    
    buildStart: async () => {
      console.log('Prism.js plugin: build starting');
      
      // Load theme CSS
      themeCSS = getThemeCSS(theme);
      
      // Load line numbers CSS if enabled
      if (lineNumbers) {
        lineNumbersCSS = getLineNumbersCSS();
      }
    },
    
    buildEnd: async () => {
      console.log('Prism.js plugin: build complete');
      
      if (injectStyles) {
        try {
          // Create directory for CSS
          const outputDir = process.cwd() + '/dist/assets/css';
          fs.mkdirSync(outputDir, { recursive: true });
          
          // Write theme CSS
          if (themeCSS) {
            fs.writeFileSync(path.join(outputDir, `prism-${theme}.css`), themeCSS);
          }
          
          // Write line numbers CSS
          if (lineNumbers && lineNumbersCSS) {
            fs.writeFileSync(path.join(outputDir, 'prism-line-numbers.css'), lineNumbersCSS);
          }
        } catch (error) {
          console.error('Prism.js plugin: Error writing CSS files', error);
        }
      }
    },
    
    configureServer: async (server: any) => {
      console.log('Prism.js plugin: configuring server');
      
      // In a server context (development):
      // 1. Add middleware to serve Prism's themes from node_modules
      // 2. Inject the appropriate stylesheet link in HTML responses
      
      // This is a simplified example - actual implementation would depend on server type
      if (server && server.use && typeof server.use === 'function') {
        // Simple middleware to inject Prism styles
        server.use((_req: any, res: any, next: () => void) => {
          // Only process HTML responses
          const originalSend = res.send;
          
          res.send = function(body: any) {
            if (typeof body === 'string' && res.getHeader('content-type')?.includes('text/html')) {
              // Inject styles in head
              const styleLinks = [];
              
              // Theme stylesheet
              styleLinks.push(`<link rel="stylesheet" href="/node_modules/prismjs/themes/${THEME_MAP[theme]}">`);
              
              // Line numbers stylesheet
              if (lineNumbers) {
                styleLinks.push('<link rel="stylesheet" href="/node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css">');
              }
              
              // Inject styles before </head>
              body = body.replace('</head>', styleLinks.join('') + '</head>');
              
              // Inject Prism initialization script before </body>
              const script = `<script>
                document.addEventListener('DOMContentLoaded', (event) => {
                  if (typeof Prism !== 'undefined') {
                    Prism.highlightAll();
                  }
                });
              </script>`;
              
              body = body.replace('</body>', script + '</body>');
            }
            
            return originalSend.call(this, body);
          };
          
          next();
        });
      }
    },
  };
} 