/**
 * Integrated Systems for BunPress
 *
 * This file provides the main integration point for all core BunPress systems.
 * It connects the scattered functionality into a coherent whole for production use.
 */

import { fileSystem, configManager, eventSystem } from './system';
import { createRenderer, createContentProcessor, createLayoutManager } from './rendering';
import { createUIComponents, createThemeIntegration, createNavigation } from './ui';
import { createBuildSystem } from './build';
import { createFullstackServer } from './server';
import { DefaultPluginManager } from '../core/plugin';
import { getThemeManager } from '../core/theme-manager';

// Export UI components for testing
export { TOC, Sidebar, Navigation, Footer, ThemeSelector, LanguageSelector } from './ui-components';

// Export slotSystem function for testing
export const slotSystem = () => {
  const slots: Record<string, string> = {};

  return {
    registerSlot: (name: string, content: string) => {
      slots[name] = content;
    },
    
    getSlotContent: (name: string, fallback?: string) => {
      return slots[name] !== undefined ? slots[name] : fallback;
    },
    
    renderWithSlots: (template: string, slotData: Record<string, string>) => {
      return template.replace(/\{\{slot:([^}]+)\}\}/g, (_, slotName) => {
        return slotData[slotName] || '';
      });
    },
    
    clearSlots: () => {
      Object.keys(slots).forEach(key => {
        delete slots[key];
      });
    }
  };
};

// Export i18n function for testing
export const i18n = () => {
  const translations: Record<string, Record<string, string>> = {};
  let currentLocale = 'en';
  
  return {
    t: (key: string, params?: Record<string, any>) => {
      const translation = translations[currentLocale]?.[key];
      if (!translation) return key;
      
      if (!params) return translation;
      
      // Handle simple parameter substitution
      return translation.replace(/\{(\w+)\}/g, (_, paramName) => {
        return params[paramName]?.toString() || '';
      });
    },
    
    setLanguage: (lang: string) => {
      currentLocale = lang;
    },
    
    getLanguage: () => currentLocale,
    
    registerTranslations: (locale: string, translationObj: Record<string, string>) => {
      translations[locale] = { ...(translations[locale] || {}), ...translationObj };
    },
    
    getAvailableLocales: () => {
      return Object.keys(translations);
    },
    
    translate: (content: string, locale: string, fallbackLocale?: string) => {
      currentLocale = locale;
      
      return content.replace(/\{\{t:([^}]+)\}\}/g, (_, key) => {
        const translation = translations[locale]?.[key];
        
        if (translation) return translation;
        
        // Try fallback locale if provided
        if (fallbackLocale && translations[fallbackLocale]?.[key]) {
          return translations[fallbackLocale][key];
        }
        
        // Just return the key if no translation found
        return key;
      });
    }
  };
};

/**
 * Creates a fully integrated BunPress system
 */
export function createIntegratedSystem(workspaceRoot: string, config: any) {
  // Initialize core subsystems
  const fs = fileSystem();
  const configMgr = configManager();
  const events = eventSystem();
  const pluginManager = new DefaultPluginManager();
  const themeManager = getThemeManager(workspaceRoot);

  // Set theme from config
  themeManager.setThemeFromConfig(config);

  // Initialize rendering subsystem
  const contentProcessor = createContentProcessor({
    pluginManager,
    fileSystem: fs,
    events,
  });

  const layoutManager = createLayoutManager({
    themeManager,
    events,
  });

  const renderer = createRenderer({
    contentProcessor,
    layoutManager,
    events,
  });

  // Initialize UI subsystem
  const ui = createUIComponents({
    themeManager,
  });

  const themeIntegration = createThemeIntegration({
    themeManager,
    config,
  });

  const navigation = createNavigation({
    config,
  });

  // Initialize build system
  const builder = createBuildSystem({
    renderer,
    config,
    pluginManager,
    events,
  });

  // Initialize server
  const server = createFullstackServer({
    renderer,
    config,
    pluginManager,
    events,
  });

  // Return the integrated system
  return {
    fs,
    configMgr,
    events,
    pluginManager,
    themeManager,
    contentProcessor,
    layoutManager,
    renderer,
    ui,
    themeIntegration,
    navigation,
    builder,
    server,

    // High-level operations
    async build() {
      return builder.build();
    },

    async serve(options?: { port?: number; host?: string }) {
      return server.start(options);
    },

    async dev(options?: {
      port?: number;
      host?: string;
      hmrPort?: number;
      hmrHost?: string;
      open?: boolean;
    }) {
      // Start the dev server with HMR
      return server.dev(options);
    },

    async stop() {
      return server.stop();
    },
  };
}

/**
 * Creates a plugin that integrates all systems
 */
export function createIntegratedPlugin() {
  return {
    name: 'integrated',
    onInit: async () => {
      // Plugin initialization logic here
      console.log('Integrated plugin initialized');
    },
  };
}

// Export all subsystems
export * from './system';
export * from './rendering';
export * from './ui';
export * from './build';
export * from './server'; 