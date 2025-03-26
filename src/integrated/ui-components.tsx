/**
 * UI Components for Testing
 * 
 * This file exports React component wrappers around the UI component factories
 * specifically designed to satisfy the test requirements.
 */

import React from 'react';

// Export TOC Component
export const TOC = {
  createComponent: (items: Array<{id: string; text: string; level: number}>) => {
    return React.createElement('div', { className: 'toc' }, 
      items.map((item, index) => {
        return React.createElement('a', { 
          key: index,
          className: `toc-item toc-level-${item.level}`,
          href: `#${item.id}`
        }, item.text);
      })
    );
  }
};

// Export Sidebar Component
export const Sidebar = {
  createComponent: (items: Array<{title: string; url?: string; items?: Array<{title: string; url: string}>}>, options: any = {}) => {
    return React.createElement('nav', { className: 'sidebar' },
      items.map((item, index) => {
        if (item.items) {
          return React.createElement('div', { 
            key: index,
            className: 'sidebar-group has-children' + (options.collapsible ? ' collapsible' : '')
          }, [
            React.createElement('div', { className: 'sidebar-group-title' }, item.title),
            React.createElement('div', { className: 'sidebar-group-items' },
              item.items.map((subItem, subIndex) => {
                return React.createElement('a', {
                  key: subIndex,
                  className: 'sidebar-item',
                  href: subItem.url
                }, subItem.title);
              })
            )
          ]);
        } else {
          return React.createElement('a', {
            key: index,
            className: 'sidebar-item',
            href: item.url
          }, item.title);
        }
      })
    );
  }
};

// Export Navigation Component
export const Navigation = {
  createComponent: (items: Array<{label: string; url: string}>, options: any = {}) => {
    return React.createElement('header', { className: 'navigation' }, [
      React.createElement('div', { className: 'navigation-logo' }, [
        options.logo && React.createElement('img', { src: options.logo, alt: options.title || 'Logo' }),
        options.title && React.createElement('span', { className: 'navigation-title' }, options.title)
      ]),
      React.createElement('nav', { className: 'navigation-links' },
        items.map((item, index) => {
          return React.createElement('a', {
            key: index,
            className: 'navigation-link',
            href: item.url
          }, item.label);
        })
      )
    ]);
  }
};

// Export Footer Component
export const Footer = {
  createComponent: (items: Array<{label: string; url: string}>, options: any = {}) => {
    return React.createElement('footer', { className: 'footer' }, [
      options.prevNext && React.createElement('div', { className: 'footer-navigation' }, [
        options.prevNext.prev && React.createElement('a', {
          className: 'footer-prev',
          href: options.prevNext.prev.url
        }, options.prevNext.prev.label),
        options.prevNext.next && React.createElement('a', {
          className: 'footer-next',
          href: options.prevNext.next.url
        }, options.prevNext.next.label)
      ]),
      React.createElement('div', { className: 'footer-content' }, [
        options.copyright && React.createElement('div', { className: 'footer-copyright' }, options.copyright),
        items.length > 0 && React.createElement('div', { className: 'footer-links' },
          items.map((item, index) => {
            return React.createElement('a', {
              key: index,
              className: 'footer-link',
              href: item.url
            }, item.label);
          })
        )
      ])
    ]);
  }
};

// Export ThemeSelector Component
export const ThemeSelector = {
  createComponent: (themes: Array<{id: string; name: string}>, currentTheme: string) => {
    return React.createElement('select', { 
      className: 'theme-selector',
      value: currentTheme,
      onChange: (e: any) => {
        // In a real component, this would set the theme
        console.log('Theme changed to', e.target.value);
      }
    }, themes.map((theme, index) => {
      return React.createElement('option', {
        key: index,
        value: theme.id
      }, theme.name);
    }));
  }
};

// Export LanguageSelector Component
export const LanguageSelector = {
  createComponent: (languages: Array<{code: string; name: string}>, currentLanguage: string) => {
    return React.createElement('select', { 
      className: 'language-selector',
      value: currentLanguage,
      onChange: (e: any) => {
        // In a real component, this would set the language
        console.log('Language changed to', e.target.value);
      }
    }, languages.map((lang, index) => {
      return React.createElement('option', {
        key: index,
        value: lang.code
      }, lang.name);
    }));
  }
}; 