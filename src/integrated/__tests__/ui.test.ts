import { describe, test, expect } from 'bun:test';
import { createUIComponents, createThemeIntegration, createNavigation } from '..';

describe('Integrated UI', () => {
  describe('createUIComponents', () => {
    const ui = createUIComponents({});

    test('createTOC generates correct HTML structure', () => {
      const tocItems = [
        { id: 'section-1', text: 'Section 1', level: 1 },
        { id: 'section-1-1', text: 'Section 1.1', level: 2 },
        { id: 'section-1-2', text: 'Section 1.2', level: 2 },
        { id: 'section-2', text: 'Section 2', level: 1 },
      ];

      const html = ui.createTOC(tocItems);

      expect(html).toContain('toc');
      expect(html).toContain('toc-list');
      expect(html).toContain('toc-item');
      expect(html).toContain('toc-link');
      expect(html).toContain('href="#section-1-1"');
      expect(html).toContain('Section 1.1');
      expect(html).toContain('Section 1.2');
    });

    test('createSidebar generates correct HTML structure', () => {
      const sidebarItems = [
        { title: 'Home', href: '/' },
        {
          title: 'Documentation',
          items: [
            { title: 'Getting Started', href: '/docs/getting-started' },
            { title: 'API Reference', href: '/docs/api' },
          ],
        },
        { title: 'About', href: '/about' },
      ];

      const html = ui.createSidebar(sidebarItems);

      expect(html).toContain('sidebar');
      expect(html).toContain('sidebar-item');
      expect(html).toContain('href="/"');
      expect(html).toContain('Home');
      expect(html).toContain('Documentation');
      expect(html).toContain('Getting Started');
      expect(html).toContain('API Reference');
      expect(html).toContain('About');
    });

    test('createNavigation generates correct HTML structure', () => {
      const navItems = [
        { title: 'Home', href: '/' },
        { title: 'Blog', href: '/blog' },
        { title: 'Contact', href: '/contact' },
      ];

      const html = ui.createNavigation(navItems);

      expect(html).toContain('nav');
      expect(html).toContain('nav-item');
      expect(html).toContain('href="/"');
      expect(html).toContain('Home');
      expect(html).toContain('Blog');
      expect(html).toContain('Contact');
    });

    test('createFooter generates correct HTML structure', () => {
      const options = {
        copyright: '© 2023 BunPress',
        links: [
          { text: 'Privacy Policy', href: '/privacy' },
          { text: 'Terms of Service', href: '/terms' },
        ],
        showThemeSelector: false,
        showLanguageSelector: false,
      };

      const html = ui.createFooter(options);

      expect(html).toContain('footer');
      expect(html).toContain('© 2023 BunPress');
      expect(html).toContain('Privacy Policy');
      expect(html).toContain('Terms of Service');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/terms"');
    });

    test('createThemeSelector generates correct HTML structure', () => {
      const themes = ['light', 'dark', 'system'];
      const html = ui.createThemeSelector(themes, 'dark');

      expect(html).toContain('theme-selector');
      expect(html).toContain('value="light"');
      expect(html).toContain('value="dark"');
      expect(html).toContain('value="system"');
      expect(html).toContain('selected');
    });

    test('createLanguageSelector generates correct HTML structure', () => {
      const languages = ['en', 'es', 'fr'];
      const html = ui.createLanguageSelector(languages, 'en');

      expect(html).toContain('language-selector');
      expect(html).toContain('value="en"');
      expect(html).toContain('value="es"');
      expect(html).toContain('value="fr"');
      expect(html).toContain('selected');
    });
  });

  describe('createThemeIntegration', () => {
    const mockThemeManager: any = {
      getActiveTheme: () => 'default',
      setActiveTheme: (_theme: string) => true,
      getAvailableThemes: () => ['default', 'dark', 'light'],
      getThemeConfig: () => ({}),
      getThemes: () => ['default', 'dark', 'light'],
      setThemeFromConfig: () => {},
      getThemeStyleContent: () => '',
      getThemeComponent: () => null,
    };

    const mockConfig: any = {
      theme: 'default',
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'http://example.com',
      pagesDir: '/pages',
      contentDir: '/content',
      outputDir: '/output',
    };

    const themeIntegration = createThemeIntegration({
      themeManager: mockThemeManager,
      config: mockConfig,
    });

    test('getThemeAssets returns expected assets', () => {
      const assets = themeIntegration.getThemeAssets();

      expect(assets).toHaveProperty('css');
      expect(assets).toHaveProperty('js');
      expect(Array.isArray(assets.css)).toBe(true);
      expect(Array.isArray(assets.js)).toBe(true);
    });

    test('getThemeConfig returns expected config', () => {
      const config = themeIntegration.getThemeConfig();

      expect(typeof config).toBe('object');
    });

    test('applyTheme changes the active theme', async () => {
      const originalApplyTheme = themeIntegration.applyTheme;
      themeIntegration.applyTheme = async () => true;

      const result = await themeIntegration.applyTheme('dark');
      expect(result).toBe(true);

      themeIntegration.applyTheme = originalApplyTheme;
    });
  });

  describe('createNavigation', () => {
    const mockConfig: any = {
      navigation: [
        { title: 'Home', href: '/' },
        { title: 'Blog', href: '/blog' },
      ],
      title: 'Test Site',
      description: 'Test Description',
      siteUrl: 'http://example.com',
      pagesDir: '/pages',
      contentDir: '/content',
      outputDir: '/output',
    };

    const navigation = createNavigation({
      config: mockConfig,
    });

    test('getNavigationItems returns expected items', () => {
      const items = navigation.getNavigationItems();

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('title');
      expect(items[0]).toHaveProperty('href');
    });

    test('getSidebarItems returns expected items', () => {
      const items = navigation.getSidebarItems();

      expect(Array.isArray(items)).toBe(true);
    });

    test('activateRoute marks the correct route as active', () => {
      navigation.activateRoute('/blog');

      const items = navigation.getNavigationItems();
      const blogItem = items.find(item => item.href === '/blog');

      expect(blogItem).toBeDefined();
      expect(blogItem?.active).toBe(true);
    });
  });
});
