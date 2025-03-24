import { describe, test, expect } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Navigation } from '../../components/Navigation';

describe('Navigation Component', () => {
  test('renders basic navigation', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' },
        { text: 'About', link: '/about' }
      ],
      logoText: 'Test Logo',
      currentPath: '/'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('Test Logo');
    expect(html).toContain('Home');
    expect(html).toContain('About');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/about"');
  });

  test('renders dropdown navigation', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' },
        {
          text: 'Products',
          items: [
            { text: 'Item 1', link: '/products/item1' },
            { text: 'Item 2', link: '/products/item2' }
          ]
        }
      ],
      logoText: 'Test Logo',
      currentPath: '/'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('Products');
    expect(html).toContain('aria-expanded');
    expect(html).toContain('data-state=');
  });

  test('renders with logo image', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' },
        { text: 'About', link: '/about' }
      ],
      logoText: 'Test Logo',
      logoImage: '/logo.png',
      currentPath: '/'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('/logo.png');
  });

  test('renders with custom class name', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' }
      ],
      logoText: 'Test Logo',
      className: 'custom-nav',
      currentPath: '/'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('custom-nav');
  });

  test('renders with external links', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' },
        { text: 'GitHub', link: 'https://github.com', external: true }
      ],
      logoText: 'Test Logo',
      currentPath: '/'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="https://github.com"');
  });

  test('renders with active items', () => {
    const props = {
      items: [
        { text: 'Home', link: '/' },
        { text: 'About', link: '/about' }
      ],
      logoText: 'Test Logo',
      currentPath: '/about'
    };

    const html = renderToString(<Navigation {...props} />);
    expect(html).toContain('text-primary font-medium');
  });
}); 