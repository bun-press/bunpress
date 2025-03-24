// Import styles to be bundled by Bun
import '../styles/main.css';

// Theme toggling functionality
type Theme = 'light' | 'dark' | 'system';

class ThemeManager {
  private root: HTMLElement;
  
  constructor() {
    this.root = document.documentElement;
    this.setupThemeToggle();
  }
  
  private setupThemeToggle() {
    // Find any theme toggle buttons in the document
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') as Theme || 'system';
        let newTheme: Theme;
        
        // Cycle through themes
        if (currentTheme === 'light') newTheme = 'dark';
        else if (currentTheme === 'dark') newTheme = 'system';
        else newTheme = 'light';
        
        this.setTheme(newTheme);
      });
    });
    
    // Find specific theme buttons
    document.querySelectorAll('[data-theme-value]').forEach(button => {
      button.addEventListener('click', (e) => {
        const theme = (e.currentTarget as HTMLElement).dataset.themeValue as Theme;
        if (theme) this.setTheme(theme);
      });
    });
  }
  
  public setTheme(theme: Theme) {
    // Remove existing theme classes
    this.root.classList.remove('light', 'dark');
    
    // Set theme based on selection
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      this.root.classList.add(systemTheme);
    } else {
      this.root.classList.add(theme);
    }
    
    // Save preference
    localStorage.setItem('theme', theme);
    
    // Update any UI indicators
    document.querySelectorAll('[data-theme-value]').forEach(el => {
      const buttonTheme = (el as HTMLElement).dataset.themeValue;
      if (buttonTheme === theme) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Load content dynamically
async function loadContent() {
  try {
    // Fetch available routes
    const routesResponse = await fetch('/api/routes');
    const routes = await routesResponse.json();
    
    console.log('Available routes:', routes);
    
    // Get current path
    const path = window.location.pathname.substring(1) || 'index';
    
    // Find matching route or default to index
    const routePath = routes.find((r: string) => r === path || r === `${path}.md` || r === `${path}.mdx`) || 'index.md';
    
    // Fetch content for the route
    const response = await fetch(`/api/content/${routePath}`);
    const data = await response.json();
    
    // Update content area
    const contentElement = document.getElementById('content');
    if (contentElement && data.content) {
      contentElement.innerHTML = data.content;
    }
    
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

// Run initial content load
loadContent();

// Set up HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // HMR handling - we'll rely on page reloads automatically triggered by Bun
  console.log('HMR enabled - page will reload on changes');
}

// Export for debugging
export { themeManager, loadContent }; 