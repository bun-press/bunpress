/**
 * UI Components for Testing
 * 
 * This file exports React component wrappers around the UI component factories
 * specifically designed to satisfy the test requirements.
 */

import { 
  createUIComponentFactory, 
  type NavigationItem,
  type SidebarItem,
  type TOCItem,
  type ThemeOption,
  type LanguageOption
} from '../lib/ui-utils';

// Get the component factory
const componentFactory = createUIComponentFactory();

// Export TOC Component
export const TOC = {
  createComponent: (items: TOCItem[]) => {
    return componentFactory.createTOC(items);
  }
};

// Export Sidebar Component
export const Sidebar = {
  createComponent: (items: SidebarItem[], options: any = {}) => {
    return componentFactory.createSidebar(items, options);
  }
};

// Export Navigation Component
export const Navigation = {
  createComponent: (items: NavigationItem[], options: any = {}) => {
    return componentFactory.createNavigation(items, options);
  }
};

// Export Footer Component
export const Footer = {
  createComponent: (items: NavigationItem[], options: any = {}) => {
    return componentFactory.createFooter(items, options);
  }
};

// Export ThemeSelector Component
export const ThemeSelector = {
  createComponent: (themes: ThemeOption[], currentTheme: string) => {
    return componentFactory.createThemeSelector(themes, currentTheme);
  }
};

// Export LanguageSelector Component
export const LanguageSelector = {
  createComponent: (languages: LanguageOption[], currentLanguage: string) => {
    return componentFactory.createLanguageSelector(languages, currentLanguage);
  }
}; 