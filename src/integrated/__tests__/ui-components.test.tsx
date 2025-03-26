import { describe, test, expect } from 'bun:test';

import { renderToString } from 'react-dom/server';
import {
  TOC,
  Sidebar,
  Navigation,
  Footer,
  ThemeSelector,
  LanguageSelector,
} from '..';

describe('Integrated UI Components', () => {
  test('TOC component renders correctly', () => {
    const tocItems = [
      { id: 'heading-1', text: 'Heading 1', level: 1 },
      { id: 'heading-2', text: 'Heading 2', level: 2 },
      { id: 'heading-3', text: 'Heading 3', level: 3 },
    ];

    const component = TOC.createComponent(tocItems);
    const html = renderToString(component);

    expect(html).toContain('toc');
    expect(html).toContain('heading-1');
    expect(html).toContain('Heading 1');
    expect(html).toContain('toc-level-1');
    expect(html).toContain('toc-level-2');
    expect(html).toContain('toc-level-3');
  });

  test('Sidebar component renders correctly', () => {
    const sidebarItems = [
      { title: 'Home', url: '/' },
      {
        title: 'Documentation',
        items: [
          { title: 'Getting Started', url: '/docs/getting-started' },
          { title: 'Installation', url: '/docs/installation' },
        ],
      },
    ];

    const component = Sidebar.createComponent(sidebarItems, { collapsible: true });
    const html = renderToString(component);

    expect(html).toContain('sidebar');
    expect(html).toContain('Home');
    expect(html).toContain('Documentation');
    expect(html).toContain('Getting Started');
    expect(html).toContain('href="/docs/getting-started"');
    expect(html).toContain('has-children');
    expect(html).toContain('collapsible');
  });

  test('Navigation component renders correctly', () => {
    const navItems = [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Contact', url: '/contact' },
    ];

    const component = Navigation.createComponent(navItems, {
      logo: '/logo.png',
      title: 'BunPress',
    });
    const html = renderToString(component);

    expect(html).toContain('navigation');
    expect(html).toContain('BunPress');
    expect(html).toContain('Home');
    expect(html).toContain('About');
    expect(html).toContain('Contact');
    expect(html).toContain('href="/"');
    expect(html).toContain('/logo.png');
  });

  test('Footer component renders correctly', () => {
    const footerLinks = [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
    ];

    const component = Footer.createComponent(footerLinks, {
      copyright: '© 2023 BunPress',
      prevNext: {
        prev: { label: 'Previous Page', url: '/prev' },
        next: { label: 'Next Page', url: '/next' },
      },
    });
    const html = renderToString(component);

    expect(html).toContain('footer');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Terms of Service');
    expect(html).toContain('© 2023 BunPress');
    expect(html).toContain('Previous Page');
    expect(html).toContain('Next Page');
    expect(html).toContain('href="/prev"');
    expect(html).toContain('href="/next"');
  });

  test('ThemeSelector component renders correctly', () => {
    const themes = [
      { id: 'light', name: 'Light Theme' },
      { id: 'dark', name: 'Dark Theme' },
      { id: 'system', name: 'System Default' },
    ];

    const component = ThemeSelector.createComponent(themes, 'dark');
    const html = renderToString(component);

    expect(html).toContain('theme-selector');
    expect(html).toContain('Light Theme');
    expect(html).toContain('Dark Theme');
    expect(html).toContain('System Default');
    expect(html).toContain('value="dark"');
  });

  test('LanguageSelector component renders correctly', () => {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
    ];

    const component = LanguageSelector.createComponent(languages, 'en');
    const html = renderToString(component);

    expect(html).toContain('language-selector');
    expect(html).toContain('English');
    expect(html).toContain('Español');
    expect(html).toContain('Français');
    expect(html).toContain('value="en"');
  });
});
