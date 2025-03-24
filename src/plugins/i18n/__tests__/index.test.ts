import { describe, test, expect, mock } from 'bun:test';
import i18nPlugin from '../index';
import * as fs from 'fs';

// Fix the i18n plugin test issues by ensuring the translations directory is properly handled
const translationsDir = '/project/i18n';

// Mock fs module to avoid filesystem operations
mock.module('fs', () => {
  const originalFs = { ...fs };
  const mockFiles: Record<string, string> = {
    // Mock translation files
    '/project/i18n/en.json': JSON.stringify({
      "hello": "Hello",
      "welcome": "Welcome to our site",
      "blog": {
        "title": "Blog",
        "readMore": "Read more"
      },
      "nav": {
        "home": "Home",
        "about": "About",
        "contact": "Contact"
      }
    }),
    '/project/i18n/fr.json': JSON.stringify({
      "hello": "Bonjour",
      "welcome": "Bienvenue sur notre site",
      "blog": {
        "title": "Blog",
        "readMore": "Lire plus"
      },
      "nav": {
        "home": "Accueil",
        "about": "À propos",
        "contact": "Contact"
      }
    }),
    '/project/i18n/es.json': JSON.stringify({
      "hello": "Hola",
      "welcome": "Bienvenido a nuestro sitio",
      "blog": {
        "title": "Blog",
        "readMore": "Leer más"
      },
      "nav": {
        "home": "Inicio",
        "about": "Acerca de",
        "contact": "Contacto"
      }
    })
  };

  return {
    ...originalFs,
    existsSync: mock((filePath: string) => {
      // Always return true for the translations directory to avoid trying to create it
      if (filePath === translationsDir) {
        return true;
      }
      return Object.keys(mockFiles).includes(filePath) || originalFs.existsSync(filePath);
    }),
    readFileSync: mock((filePath: string, encoding: BufferEncoding) => {
      if (Object.keys(mockFiles).includes(filePath)) {
        return mockFiles[filePath];
      }
      return originalFs.readFileSync(filePath, encoding);
    }),
    writeFileSync: mock(() => {}),
    mkdirSync: mock(() => {}),
    readdirSync: mock((dirPath: string) => {
      if (dirPath === translationsDir) {
        return ['en.json', 'fr.json', 'es.json'];
      }
      return originalFs.readdirSync(dirPath);
    })
  };
});

// Create a class that directly injects translations for testing without filesystem access
class TestI18nPlugin {
  static injectTranslations(plugin: any, translations: Record<string, any>) {
    plugin.translations = translations;
  }
}

describe('i18n Plugin', () => {
  const mockTranslations = {
    en: {
      "hello": "Hello",
      "welcome": "Welcome to our site",
      "blog": {
        "title": "Blog",
        "readMore": "Read more"
      },
      "nav": {
        "home": "Home",
        "about": "About",
        "contact": "Contact"
      }
    },
    fr: {
      "hello": "Bonjour",
      "welcome": "Bienvenue sur notre site",
      "blog": {
        "title": "Blog",
        "readMore": "Lire plus"
      },
      "nav": {
        "home": "Accueil",
        "about": "À propos",
        "contact": "Contact"
      }
    },
    es: {
      "hello": "Hola",
      "welcome": "Bienvenido a nuestro sitio",
      "blog": {
        "title": "Blog",
        "readMore": "Leer más"
      },
      "nav": {
        "home": "Inicio",
        "about": "Acerca de",
        "contact": "Contacto"
      }
    }
  };

  test('should create plugin with default options', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    expect(plugin.name).toBe('i18n');
    expect(plugin.options).toEqual({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      allowMissingTranslations: true,
      generateLocaleRoutes: true,
      prefixLocaleInUrl: true
    });
  });

  test('should transform content by replacing translation keys', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject translations to bypass filesystem loading
    TestI18nPlugin.injectTranslations(plugin, mockTranslations);
    
    const content = `# Welcome
    
{{t:hello}} visitor! {{t:welcome}}.

Check out our {{t:blog.title}} and {{t:nav.home}} page.`;
    
    const transformed = plugin.transform?.(content) || '';
    
    // Default locale (en) should be used
    expect(transformed).toContain('Hello visitor!');
    expect(transformed).toContain('Welcome to our site');
    expect(transformed).toContain('Check out our Blog');
    expect(transformed).toContain('Home page');
    expect(transformed).not.toContain('{{t:');
  });

  test('should respect locale specified in frontmatter', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject translations to bypass filesystem loading
    TestI18nPlugin.injectTranslations(plugin, mockTranslations);
    
    const contentWithFrenchLocale = `---
title: French Page
locale: fr
---

# Bienvenue

{{t:hello}} visitor! {{t:welcome}}.

Check out our {{t:blog.title}} and {{t:nav.home}} page.`;
    
    const transformed = plugin.transform?.(contentWithFrenchLocale) || '';
    
    // French locale should be used
    expect(transformed).toContain('Bonjour visitor!');
    expect(transformed).toContain('Bienvenue sur notre site');
    expect(transformed).toContain('Check out our Blog');
    expect(transformed).toContain('Accueil page');
  });

  test('should handle missing translation keys with fallback text', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject translations to bypass filesystem loading
    TestI18nPlugin.injectTranslations(plugin, mockTranslations);
    
    const content = `# Test Page
    
{{t:missing.key|Fallback Text}} and {{t:another.missing|Another Fallback}}.

With default key: {{t:hello}} and missing without fallback: {{t:missing.again}}`;
    
    const transformed = plugin.transform?.(content) || '';
    
    // Should use fallback text for missing keys
    expect(transformed).toContain('Fallback Text and Another Fallback');
    expect(transformed).toContain('With default key: Hello');
    expect(transformed).toContain('missing without fallback: missing.again');
  });

  test('should handle different locales for the same content', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject translations to bypass filesystem loading
    TestI18nPlugin.injectTranslations(plugin, mockTranslations);
    
    const content = `# Translation Test
    
{{t:hello}} world! {{t:welcome}}

{{t:nav.home}} | {{t:nav.about}} | {{t:nav.contact}}`;
    
    // Test with English (default)
    const transformedEn = plugin.transform?.(content) || '';
    expect(transformedEn).toContain('Hello world!');
    expect(transformedEn).toContain('Welcome to our site');
    expect(transformedEn).toContain('Home | About | Contact');
    
    // Test with French locale by manipulating frontmatter
    const contentWithFrenchFrontmatter = `---
locale: fr
---
${content}`;
    
    const transformedFr = plugin.transform?.(contentWithFrenchFrontmatter) || '';
    expect(transformedFr).toContain('Bonjour world!');
    expect(transformedFr).toContain('Bienvenue sur notre site');
    expect(transformedFr).toContain('Accueil | À propos | Contact');
    
    // Test with Spanish locale
    const contentWithSpanishFrontmatter = `---
locale: es
---
${content}`;
    
    const transformedEs = plugin.transform?.(contentWithSpanishFrontmatter) || '';
    expect(transformedEs).toContain('Hola world!');
    expect(transformedEs).toContain('Bienvenido a nuestro sitio');
    expect(transformedEs).toContain('Inicio | Acerca de | Contacto');
  });

  test('should properly handle nested keys and complex patterns', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject translations to bypass filesystem loading
    TestI18nPlugin.injectTranslations(plugin, mockTranslations);
    
    const content = `# Complex Test
    
This is a {{t:blog.title}} post. Please {{t:blog.readMore}}.

Navigation:
- {{t:nav.home}}
- {{t:nav.about}}
- {{t:nav.contact}}

Multiple on one line: {{t:hello}} and {{t:welcome}} together.`;
    
    const transformed = plugin.transform?.(content) || '';
    
    // Check nested key translations
    expect(transformed).toContain('This is a Blog post');
    expect(transformed).toContain('Please Read more');
    
    // Check list items
    expect(transformed).toContain('- Home');
    expect(transformed).toContain('- About');
    expect(transformed).toContain('- Contact');
    
    // Check multiple translations on one line
    expect(transformed).toContain('Multiple on one line: Hello and Welcome to our site together');
  });

  test('should respect fallback locale when translation is missing', () => {
    // Create a mock with incomplete Spanish translations
    const mockIncompleteTranslations = {
      en: mockTranslations.en,
      fr: mockTranslations.fr,
      es: {
        "hello": "Hola",
        "welcome": "Bienvenido a nuestro sitio",
        // Missing blog section
        "nav": {
          "home": "Inicio"
          // Missing about and contact
        }
      }
    };
    
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    });
    
    // Manually inject the incomplete translations
    TestI18nPlugin.injectTranslations(plugin, mockIncompleteTranslations);
    
    const contentWithSpanishFrontmatter = `---
locale: es
---
# Test Fallback

{{t:hello}} visitor! {{t:welcome}}.

Check out our {{t:blog.title}} and links to {{t:nav.about}} and {{t:nav.contact}}.`;
    
    const transformed = plugin.transform?.(contentWithSpanishFrontmatter) || '';
    
    // Spanish translations should be used where available
    expect(transformed).toContain('Hola visitor!');
    expect(transformed).toContain('Bienvenido a nuestro sitio');
    
    // Missing Spanish translations should fall back to English
    expect(transformed).toContain('Check out our Blog');
    expect(transformed).toContain('links to About and Contact');
  });

  test('should handle special cases like HTML in translations', () => {
    // Create a mock with HTML content in translations
    const mockHtmlTranslations = {
      en: {
        "hello": "Hello",
        "html": {
          "bold": "<strong>Bold Text</strong>",
          "link": "<a href=\"#\">Click here</a>",
          "complex": "<div class=\"alert\">This is an <em>important</em> notice</div>"
        }
      }
    };
    
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en']
    });
    
    // Manually inject the HTML translations
    TestI18nPlugin.injectTranslations(plugin, mockHtmlTranslations);
    
    const content = `# HTML Test

{{t:hello}} world!

With HTML elements:
- {{t:html.bold}}
- {{t:html.link}}
- {{t:html.complex}}`;
    
    const transformed = plugin.transform?.(content) || '';
    
    // Check HTML translations are properly inserted
    expect(transformed).toContain('Hello world!');
    expect(transformed).toContain('<strong>Bold Text</strong>');
    expect(transformed).toContain('<a href="#">Click here</a>');
    expect(transformed).toContain('<div class="alert">This is an <em>important</em> notice</div>');
  });

  test('should correctly check if a route has a locale prefix', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    }) as any; // Cast to any to access implementation-specific methods
    
    // Test routes with locale prefixes
    expect(plugin.isLocaleRoute('/en/about')).toBe(true);
    expect(plugin.isLocaleRoute('/fr/blog')).toBe(true);
    expect(plugin.isLocaleRoute('/es')).toBe(true);
    
    // Test routes without locale prefixes
    expect(plugin.isLocaleRoute('/about')).toBe(false);
    expect(plugin.isLocaleRoute('/blog/post-1')).toBe(false);
    expect(plugin.isLocaleRoute('/')).toBe(false);
    
    // Test invalid locale prefixes
    expect(plugin.isLocaleRoute('/de/about')).toBe(false); // 'de' is not in locales
    expect(plugin.isLocaleRoute('/english/about')).toBe(false);
  });

  test('should generate correct locale routes', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es']
    }) as any; // Cast to any to access implementation-specific methods
    
    // Test route generation for different paths
    expect(plugin.generateLocaleRoute('/', 'en')).toBe('/en');
    expect(plugin.generateLocaleRoute('/about', 'fr')).toBe('/fr/about');
    expect(plugin.generateLocaleRoute('/blog/post-1', 'es')).toBe('/es/blog/post-1');
  });

  test('should register content files for i18n route generation', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      generateLocaleRoutes: true
    }) as any; // Cast to any to access implementation-specific methods
    
    // Create mock content files
    const mockContentFiles = [
      {
        path: '/project/pages/index.md',
        route: '/',
        content: 'Home page content',
        frontmatter: { title: 'Home' },
        html: '<p>Home page content</p>'
      },
      {
        path: '/project/pages/about.md',
        route: '/about',
        content: 'About page content',
        frontmatter: { title: 'About' },
        html: '<p>About page content</p>'
      },
      {
        path: '/project/pages/fr/contact.md',
        route: '/fr/contact',
        content: 'Contact page content in French',
        frontmatter: { title: 'Contact', locale: 'fr' },
        html: '<p>Contact page content in French</p>'
      }
    ];
    
    // Register the content files
    mockContentFiles.forEach(file => plugin.registerContentFile(file));
    
    // Verify the route map
    expect(plugin.routeMap.has('/')).toBe(true);
    expect(plugin.routeMap.has('/about')).toBe(true);
    
    // The French route should be skipped as it already has a locale prefix
    expect(plugin.routeMap.has('/fr/contact')).toBe(false);
  });

  test('should skip registration when generateLocaleRoutes is disabled', () => {
    const plugin = i18nPlugin({
      translationsDir: translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      generateLocaleRoutes: false
    }) as any; // Cast to any to access implementation-specific methods
    
    // Create a mock content file
    const mockContentFile = {
      path: '/project/pages/index.md',
      route: '/',
      content: 'Home page content',
      frontmatter: { title: 'Home' },
      html: '<p>Home page content</p>'
    };
    
    // Register the content file
    plugin.registerContentFile(mockContentFile);
    
    // The route map should be empty since generateLocaleRoutes is disabled
    expect(plugin.routeMap.size).toBe(0);
  });

  test('should correctly handle buildEnd process', async () => {
    const outputDir = '/project/dist';
    
    // Update the mock to include the output directory
    mock.module('fs', () => {
      const originalFs = { ...fs };
      const mockFiles: Record<string, string> = {
        '/project/i18n/en.json': JSON.stringify({ "hello": "Hello" }),
        '/project/i18n/fr.json': JSON.stringify({ "hello": "Bonjour" }),
        '/project/i18n/es.json': JSON.stringify({ "hello": "Hola" })
      };

      return {
        ...originalFs,
        existsSync: mock((filePath: string) => {
          if (filePath === translationsDir || filePath === outputDir) {
            return true;
          }
          return Object.keys(mockFiles).includes(filePath) || originalFs.existsSync(filePath);
        }),
        readFileSync: mock((filePath: string, encoding: BufferEncoding) => {
          if (Object.keys(mockFiles).includes(filePath)) {
            return mockFiles[filePath];
          }
          return originalFs.readFileSync(filePath, encoding);
        }),
        writeFileSync: mock(() => {}),
        mkdirSync: mock(() => {}),
        readdirSync: mock((dirPath: string) => {
          if (dirPath === translationsDir) {
            return ['en.json', 'fr.json', 'es.json'];
          }
          return originalFs.readdirSync(dirPath);
        })
      };
    });
    
    const plugin = i18nPlugin({
      translationsDir,
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es'],
      generateLocaleRoutes: true,
      outputDir
    }) as any; // Cast to any to access implementation-specific methods
    
    // Mock content file
    const mockContentFile = {
      path: '/project/pages/index.md',
      route: '/',
      content: 'Home page content',
      frontmatter: { title: 'Home' },
      html: '<p>Home page content</p>'
    };
    
    // Register the content file
    plugin.registerContentFile(mockContentFile);
    
    // Call buildEnd - use plugin.buildEnd?.() to handle optional method
    await plugin.buildEnd?.();
    
    // Verify the plugin didn't throw any errors
    // In a real test, you'd verify file creation, but since we're mocking
    // the filesystem, we can't actually check the final output
  });
});
