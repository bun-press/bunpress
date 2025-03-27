/**
 * UI Utilities for BunPress
 *
 * This file centralizes UI component factories and theme-related utility functions
 * to reduce duplication across the codebase. It provides a common interface for
 * creating UI components that can be used in both the integrated and core modules.
 */

import React from 'react';

// Shared interfaces for UI components
export interface NavigationItem {
  label: string;
  url: string;
}

export interface SidebarItem {
  title: string;
  url?: string;
  items?: SidebarSubItem[];
}

export interface SidebarSubItem {
  title: string;
  url: string;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export interface ThemeOption {
  id: string;
  name: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface FooterNavigation {
  prev?: NavigationItem;
  next?: NavigationItem;
}

// UI Component Factory interface
export interface UIComponentFactory {
  createTOC: (items: TOCItem[]) => React.ReactElement;
  createSidebar: (items: SidebarItem[], options?: any) => React.ReactElement;
  createNavigation: (items: NavigationItem[], options?: any) => React.ReactElement;
  createFooter: (items: NavigationItem[], options?: any) => React.ReactElement;
  createThemeSelector: (themes: ThemeOption[], currentTheme: string) => React.ReactElement;
  createLanguageSelector: (
    languages: LanguageOption[],
    currentLanguage: string
  ) => React.ReactElement;
}

/**
 * Creates a standardized UI component factory
 */
export function createUIComponentFactory(): UIComponentFactory {
  return {
    /**
     * Create a Table of Contents component
     */
    createTOC(items: TOCItem[]): React.ReactElement {
      return React.createElement(
        'div',
        { className: 'toc' },
        items.map((item, index) => {
          return React.createElement(
            'a',
            {
              key: index,
              className: `toc-item toc-level-${item.level}`,
              href: `#${item.id}`,
            },
            item.text
          );
        })
      );
    },

    /**
     * Create a Sidebar component
     */
    createSidebar(items: SidebarItem[], options: any = {}): React.ReactElement {
      return React.createElement(
        'nav',
        { className: 'sidebar' },
        items.map((item, index) => {
          if (item.items) {
            return React.createElement(
              'div',
              {
                key: index,
                className:
                  'sidebar-group has-children' + (options.collapsible ? ' collapsible' : ''),
              },
              [
                React.createElement('div', { className: 'sidebar-group-title' }, item.title),
                React.createElement(
                  'div',
                  { className: 'sidebar-group-items' },
                  item.items.map((subItem, subIndex) => {
                    return React.createElement(
                      'a',
                      {
                        key: subIndex,
                        className: 'sidebar-item',
                        href: subItem.url,
                      },
                      subItem.title
                    );
                  })
                ),
              ]
            );
          } else {
            return React.createElement(
              'a',
              {
                key: index,
                className: 'sidebar-item',
                href: item.url,
              },
              item.title
            );
          }
        })
      );
    },

    /**
     * Create a Navigation component
     */
    createNavigation(items: NavigationItem[], options: any = {}): React.ReactElement {
      return React.createElement('header', { className: 'navigation' }, [
        React.createElement('div', { className: 'navigation-logo' }, [
          options.logo &&
            React.createElement('img', { src: options.logo, alt: options.title || 'Logo' }),
          options.title &&
            React.createElement('span', { className: 'navigation-title' }, options.title),
        ]),
        React.createElement(
          'nav',
          { className: 'navigation-links' },
          items.map((item, index) => {
            return React.createElement(
              'a',
              {
                key: index,
                className: 'navigation-link',
                href: item.url,
              },
              item.label
            );
          })
        ),
      ]);
    },

    /**
     * Create a Footer component
     */
    createFooter(items: NavigationItem[], options: any = {}): React.ReactElement {
      return React.createElement('footer', { className: 'footer' }, [
        options.prevNext &&
          React.createElement('div', { className: 'footer-navigation' }, [
            options.prevNext.prev &&
              React.createElement(
                'a',
                {
                  className: 'footer-prev',
                  href: options.prevNext.prev.url,
                },
                options.prevNext.prev.label
              ),
            options.prevNext.next &&
              React.createElement(
                'a',
                {
                  className: 'footer-next',
                  href: options.prevNext.next.url,
                },
                options.prevNext.next.label
              ),
          ]),
        React.createElement('div', { className: 'footer-content' }, [
          options.copyright &&
            React.createElement('div', { className: 'footer-copyright' }, options.copyright),
          items.length > 0 &&
            React.createElement(
              'div',
              { className: 'footer-links' },
              items.map((item, index) => {
                return React.createElement(
                  'a',
                  {
                    key: index,
                    className: 'footer-link',
                    href: item.url,
                  },
                  item.label
                );
              })
            ),
        ]),
      ]);
    },

    /**
     * Create a Theme Selector component
     */
    createThemeSelector(themes: ThemeOption[], currentTheme: string): React.ReactElement {
      return React.createElement(
        'select',
        {
          className: 'theme-selector',
          value: currentTheme,
          onChange: (e: any) => {
            // In a real component, this would set the theme
            console.log('Theme changed to', e.target.value);
          },
        },
        themes.map((theme, index) => {
          return React.createElement(
            'option',
            {
              key: index,
              value: theme.id,
            },
            theme.name
          );
        })
      );
    },

    /**
     * Create a Language Selector component
     */
    createLanguageSelector(
      languages: LanguageOption[],
      currentLanguage: string
    ): React.ReactElement {
      return React.createElement(
        'select',
        {
          className: 'language-selector',
          value: currentLanguage,
          onChange: (e: any) => {
            // In a real component, this would set the language
            console.log('Language changed to', e.target.value);
          },
        },
        languages.map((lang, index) => {
          return React.createElement(
            'option',
            {
              key: index,
              value: lang.code,
            },
            lang.name
          );
        })
      );
    },
  };
}

/**
 * Create a utility for theme-related operations
 */
export function createThemeUtils() {
  return {
    /**
     * Get CSS variables for a theme
     */
    getThemeVariables(theme: any): Record<string, string> {
      const defaultVariables = {
        '--primary-color': '#3182ce',
        '--secondary-color': '#805ad5',
        '--text-color': '#2d3748',
        '--background-color': '#ffffff',
        '--link-color': '#3182ce',
        '--code-background': '#f7fafc',
        '--border-color': '#e2e8f0',
        '--header-height': '60px',
        '--sidebar-width': '250px',
      };

      // Merge with theme variables if they exist
      return {
        ...defaultVariables,
        ...(theme?.variables || {}),
      };
    },

    /**
     * Apply theme CSS variables to the document
     */
    applyThemeVariables(variables: Record<string, string>): void {
      const root = document.documentElement;
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    },

    /**
     * Create a stylesheet link for a theme
     */
    createThemeStylesheet(themeName: string, basePath: string = '/themes'): HTMLLinkElement {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${basePath}/${themeName}/style.css`;
      link.id = 'theme-stylesheet';
      return link;
    },
  };
}
