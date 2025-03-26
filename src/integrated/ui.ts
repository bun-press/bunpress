/**
 * Integrated UI implementation for BunPress
 *
 * This file provides consolidated implementations for UI components
 * that were previously scattered or only existed in tests.
 */

import type { ThemeManager } from '../core/theme-manager';
import type { BunPressConfig } from '../../bunpress.config';

// Navigation item type
export interface NavigationItem {
  title: string;
  href: string;
  active?: boolean;
  external?: boolean;
  items?: NavigationItem[];
}

// Sidebar item type
export interface SidebarItem {
  title: string;
  href?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  active?: boolean;
  external?: boolean;
}

// TOC item type
export interface TOCItem {
  id: string;
  text: string;
  level: number;
  items?: TOCItem[];
}

// Interface for UI components
export interface UIComponents {
  createTOC(items: TOCItem[], options?: TOCOptions): string;
  createSidebar(items: SidebarItem[], options?: SidebarOptions): string;
  createNavigation(items: NavigationItem[], options?: NavigationOptions): string;
  createFooter(options?: FooterOptions): string;
  createThemeSelector(themes: string[], activeTheme: string): string;
  createLanguageSelector(languages: string[], activeLanguage: string): string;
}

// Component options
export interface TOCOptions {
  activeId?: string;
  maxDepth?: number;
  minLevel?: number;
  containerClass?: string;
  listClass?: string;
  itemClass?: string;
  linkClass?: string;
}

export interface SidebarOptions {
  expandAll?: boolean;
  containerClass?: string;
  itemClass?: string;
  linkClass?: string;
  activeClass?: string;
}

export interface NavigationOptions {
  containerClass?: string;
  itemClass?: string;
  linkClass?: string;
  activeClass?: string;
  mobileMenuClass?: string;
}

export interface FooterOptions {
  containerClass?: string;
  copyright?: string;
  links?: { text: string; href: string }[];
  showThemeSelector?: boolean;
  showLanguageSelector?: boolean;
}

// Interface for theme integration
export interface ThemeIntegration {
  getThemeAssets(): { css: string[]; js: string[] };
  getThemeConfig(): Record<string, any>;
  applyTheme(theme: string): Promise<boolean>;
}

// Interface for navigation service
export interface NavigationService {
  getNavigationItems(): NavigationItem[];
  getSidebarItems(): SidebarItem[];
  activateRoute(pathname: string): void;
}

/**
 * Creates UI components
 */
export function createUIComponents({
  themeManager,
  config,
}: {
  themeManager?: any;
  config?: any;
}): UIComponents {
  return {
    /**
     * Create table of contents component
     */
    createTOC(items: TOCItem[], options: TOCOptions = {}): string {
      const containerClass = options.containerClass || 'toc';
      const listClass = options.listClass || 'toc-list';
      const itemClass = options.itemClass || 'toc-item';
      const linkClass = options.linkClass || 'toc-link';
      const maxDepth = options.maxDepth || 3;
      const minLevel = options.minLevel || 2;
      const activeId = options.activeId || '';

      // Filter items by level and organize into hierarchy
      const filteredItems = items.filter(item => item.level >= minLevel);
      const rootItems: TOCItem[] = [];

      // Convert flat list to hierarchical structure
      const itemsByLevel: Record<number, TOCItem[]> = {};
      for (const item of filteredItems) {
        if (!itemsByLevel[item.level]) {
          itemsByLevel[item.level] = [];
        }
        itemsByLevel[item.level].push({ ...item, items: [] });
      }

      // Find the minimum level present
      const levels = Object.keys(itemsByLevel).map(Number).sort();
      const baseLevel = levels[0] || minLevel;

      // Start with root items
      if (itemsByLevel[baseLevel]) {
        rootItems.push(...itemsByLevel[baseLevel]);
      }

      // Build hierarchy from remaining items
      for (let i = 1; i < levels.length; i++) {
        const currentLevel = levels[i];
        const previousLevel = levels[i - 1];

        for (const item of itemsByLevel[currentLevel]) {
          // Find parent item (closest preceding item of lower level)
          let parentFound = false;

          for (let j = itemsByLevel[previousLevel].length - 1; j >= 0; j--) {
            const potentialParent = itemsByLevel[previousLevel][j];
            if (!parentFound) {
              potentialParent.items = potentialParent.items || [];
              potentialParent.items.push(item);
              parentFound = true;
            }
          }

          // If no parent found, add to root
          if (!parentFound) {
            rootItems.push(item);
          }
        }
      }

      // Recursive function to render TOC items
      const renderItems = (tocItems: TOCItem[], currentDepth = 1): string => {
        if (currentDepth > maxDepth || !tocItems.length) {
          return '';
        }

        const listItems = tocItems
          .map(item => {
            const isActive = item.id === activeId;
            const activeClass = isActive ? ' active' : '';

            const link = `<a href="#${item.id}" class="${linkClass}${activeClass}">${item.text}</a>`;

            let childList = '';
            if (item.items && item.items.length) {
              childList = renderItems(item.items, currentDepth + 1);
            }

            return `<li class="${itemClass}${activeClass}">${link}${childList}</li>`;
          })
          .join('\n');

        return `<ul class="${listClass}">${listItems}</ul>`;
      };

      return `<nav class="${containerClass}">${renderItems(rootItems)}</nav>`;
    },

    /**
     * Create sidebar component
     */
    createSidebar(items: SidebarItem[], options: SidebarOptions = {}): string {
      const containerClass = options.containerClass || 'sidebar';
      const itemClass = options.itemClass || 'sidebar-item';
      const linkClass = options.linkClass || 'sidebar-link';
      const activeClass = options.activeClass || 'active';
      const expandAll = options.expandAll || false;

      // Recursive function to render sidebar items
      const renderItems = (sidebarItems: SidebarItem[]): string => {
        if (!sidebarItems.length) {
          return '';
        }

        const listItems = sidebarItems
          .map(item => {
            const isActive = item.active === true;
            const isCollapsed = expandAll ? false : item.collapsed !== false;
            const hasItems = item.items && item.items.length > 0;

            let itemContent = '';

            if (item.href) {
              const external = item.external ? ' target="_blank" rel="noopener"' : '';
              itemContent = `<a href="${item.href}" class="${linkClass}${isActive ? ' ' + activeClass : ''}"${external}>${item.title}</a>`;
            } else {
              itemContent = `<span class="${linkClass}">${item.title}</span>`;
            }

            let childList = '';
            if (hasItems) {
              const collapsedAttr = isCollapsed ? ' collapsed' : '';
              childList = `
              <div class="sidebar-children${collapsedAttr}">
                ${renderItems(item.items!)}
              </div>
              <button class="sidebar-toggle" aria-label="Toggle section">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M5.5 5.5l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            `;
            }

            return `<li class="${itemClass}${isActive ? ' ' + activeClass : ''}${hasItems ? ' has-children' : ''}">${itemContent}${childList}</li>`;
          })
          .join('\n');

        return `<ul>${listItems}</ul>`;
      };

      return `<nav class="${containerClass}">${renderItems(items)}</nav>`;
    },

    /**
     * Create navigation component
     */
    createNavigation(items: NavigationItem[], options: NavigationOptions = {}): string {
      const containerClass = options.containerClass || 'nav';
      const itemClass = options.itemClass || 'nav-item';
      const linkClass = options.linkClass || 'nav-link';
      const activeClass = options.activeClass || 'active';
      const mobileMenuClass = options.mobileMenuClass || 'mobile-menu';

      // Recursive function to render navigation items
      const renderItems = (navItems: NavigationItem[]): string => {
        if (!navItems.length) {
          return '';
        }

        const listItems = navItems
          .map(item => {
            const isActive = item.active === true;
            const hasItems = item.items && item.items.length > 0;

            let link = '';
            if (item.href) {
              const external = item.external ? ' target="_blank" rel="noopener"' : '';
              link = `<a href="${item.href}" class="${linkClass}${isActive ? ' ' + activeClass : ''}"${external}>${item.title}</a>`;
            } else {
              link = `<span class="${linkClass}">${item.title}</span>`;
            }

            let dropdown = '';
            if (hasItems) {
              dropdown = `
              <div class="nav-dropdown">
                ${renderItems(item.items!)}
              </div>
            `;
            }

            return `<li class="${itemClass}${isActive ? ' ' + activeClass : ''}${hasItems ? ' has-dropdown' : ''}">${link}${dropdown}</li>`;
          })
          .join('\n');

        return `<ul>${listItems}</ul>`;
      };

      return `
        <nav class="${containerClass}">
          ${renderItems(items)}
          <button class="${mobileMenuClass}" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </nav>
      `;
    },

    /**
     * Create footer component
     */
    createFooter(options: FooterOptions = {}): string {
      const containerClass = options.containerClass || 'footer';
      const copyright = options.copyright || `© ${new Date().getFullYear()} ${config.title}`;
      const links = options.links || [];
      const showThemeSelector = options.showThemeSelector !== false;
      const showLanguageSelector = options.showLanguageSelector !== false;

      // Create links
      const linkElements = links
        .map(link => {
          return `<a href="${link.href}">${link.text}</a>`;
        })
        .join('\n');

      // Create theme selector if enabled
      let themeSelector = '';
      if (showThemeSelector) {
        const themes = themeManager.getAvailableThemes();
        const activeTheme = themeManager.getActiveTheme()?.name || themes[0] || 'default';
        themeSelector = this.createThemeSelector(themes, activeTheme);
      }

      // Create language selector if enabled
      let languageSelector = '';
      if (showLanguageSelector) {
        // TODO: Get languages from i18n system
        const languages = ['en', 'fr', 'de', 'es', 'ja'];
        const activeLanguage = 'en'; // TODO: Get from i18n
        languageSelector = this.createLanguageSelector(languages, activeLanguage);
      }

      return `
        <footer class="${containerClass}">
          <div class="footer-content">
            <div class="footer-copyright">${copyright}</div>
            <div class="footer-links">${linkElements}</div>
          </div>
          <div class="footer-actions">
            ${themeSelector}
            ${languageSelector}
          </div>
        </footer>
      `;
    },

    /**
     * Create theme selector component
     */
    createThemeSelector(themes: string[], activeTheme: string): string {
      const options = themes
        .map(theme => {
          const selected = theme === activeTheme ? ' selected' : '';
          return `<option value="${theme}"${selected}>${theme}</option>`;
        })
        .join('\n');

      return `
        <div class="theme-selector">
          <label for="theme-select">Theme:</label>
          <select id="theme-select">
            ${options}
          </select>
        </div>
      `;
    },

    /**
     * Create language selector component
     */
    createLanguageSelector(languages: string[], activeLanguage: string): string {
      const options = languages
        .map(lang => {
          const selected = lang === activeLanguage ? ' selected' : '';
          return `<option value="${lang}"${selected}>${lang.toUpperCase()}</option>`;
        })
        .join('\n');

      return `
        <div class="language-selector">
          <label for="language-select">Language:</label>
          <select id="language-select">
            ${options}
          </select>
        </div>
      `;
    },
  };
}

/**
 * Creates theme integration
 */
export function createThemeIntegration({
  themeManager,
  config,
}: {
  themeManager: ThemeManager;
  config: BunPressConfig;
}): ThemeIntegration {
  return {
    /**
     * Get theme assets (CSS and JS files)
     */
    getThemeAssets(): { css: string[]; js: string[] } {
      const theme = themeManager.getActiveTheme();

      if (!theme) {
        return { css: [], js: [] };
      }

      // For now, we only support a single CSS file
      const css = ['/styles.css'];

      // And client-side JS
      const js = ['/app.js'];

      return { css, js };
    },

    /**
     * Get theme configuration
     */
    getThemeConfig(): Record<string, any> {
      const theme = themeManager.getActiveTheme();

      if (!theme) {
        return {};
      }

      return theme.options || {};
    },

    /**
     * Apply a different theme
     */
    async applyTheme(themeName: string): Promise<boolean> {
      const themes = themeManager.getThemes();

      if (!themes.has(themeName)) {
        console.error(`Theme "${themeName}" not found`);
        return false;
      }

      // Update theme in config
      config.themeConfig.name = themeName;

      // Set theme from updated config
      themeManager.setThemeFromConfig(config);

      return true;
    },
  };
}

/**
 * Creates navigation service
 */
export function createNavigation({
  config,
}: {
  config: BunPressConfig;
}): NavigationService {
  // Current active route
  let activePath = '/';

  return {
    /**
     * Get navigation items from config
     */
    getNavigationItems(): NavigationItem[] {
      return (config.navigation || []).map(item => {
        return {
          ...item,
          active: activePath === item.href || activePath.startsWith(item.href + '/'),
          items: item.items?.map(subItem => ({
            ...subItem,
            active: activePath === subItem.href || activePath.startsWith(subItem.href + '/'),
          })),
        };
      });
    },

    /**
     * Get sidebar items from config
     */
    getSidebarItems(): SidebarItem[] {
      return (config.sidebar || []).map(item => {
        return mapSidebarItem(item, activePath);
      });
    },

    /**
     * Set active route path
     */
    activateRoute(pathname: string): void {
      activePath = pathname;
    },
  };
}

/**
 * Map sidebar item for active path
 */
function mapSidebarItem(item: SidebarItem, activePath: string): SidebarItem {
  const result: SidebarItem = {
    ...item,
    active: item.href ? activePath === item.href || activePath.startsWith(item.href + '/') : false,
  };

  if (item.items && item.items.length) {
    result.items = item.items.map(subItem => mapSidebarItem(subItem, activePath));

    // If any child is active, make this item active too
    if (result.items.some(subItem => subItem.active)) {
      result.active = true;
      result.collapsed = false;
    }
  }

  return result;
}

// Export the component creation function for backward compatibility
export const createComponent = {
  toc: (items: TOCItem[], options?: TOCOptions) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createTOC(items, options);
  },

  sidebar: (items: SidebarItem[], options?: SidebarOptions) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createSidebar(items, options);
  },

  navigation: (items: NavigationItem[], options?: NavigationOptions) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createNavigation(items, options);
  },

  footer: (options?: FooterOptions) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createFooter(options);
  },

  themeSelector: (themes: string[], activeTheme: string) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createThemeSelector(themes, activeTheme);
  },

  languageSelector: (languages: string[], activeLanguage: string) => {
    const uiComponents = createUIComponents({
      themeManager: {
        getThemes: () => new Map(),
        getActiveTheme: () => null,
        setThemeFromConfig: () => {},
        getThemeStyleContent: () => '',
        getAvailableThemes: () => [],
        getThemeComponent: () => '',
      },
      config: {
        title: 'BunPress',
        description: '',
        siteUrl: '',
        pagesDir: '',
        outputDir: '',
        themeConfig: { name: 'default' },
        plugins: [],
      },
    });

    return uiComponents.createLanguageSelector(languages, activeLanguage);
  },
};
