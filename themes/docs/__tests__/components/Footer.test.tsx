import { describe, test, expect } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { Footer } from '../../components/Footer';

describe('Footer Component', () => {
  test('renders with basic props', () => {
    const props = {
      editLink: 'https://github.com/example/bunpress/edit/main/docs/index.md',
      lastUpdated: '2024-03-24',
      prev: {
        text: 'Getting Started',
        link: '/guide/getting-started'
      },
      next: {
        text: 'Configuration',
        link: '/guide/configuration'
      }
    };

    const html = renderToString(<Footer {...props} />);
    expect(html).toContain('Getting Started');
    expect(html).toContain('Configuration');
    expect(html).toContain('https://github.com/example/bunpress/edit/main/docs/index.md');
    expect(html).toContain('Last updated on');
    expect(html).toContain('March'); // Check for month
  });

  test('renders without navigation links', () => {
    const props = {
      editLink: 'https://github.com/example/bunpress/edit/main/docs/index.md',
      lastUpdated: '2024-03-24'
    };

    const html = renderToString(<Footer {...props} />);
    expect(html).toContain('https://github.com/example/bunpress/edit/main/docs/index.md');
    expect(html).toContain('Last updated on');
    expect(html).toContain('March'); // Check for month
  });

  test('renders without edit link', () => {
    const props = {
      lastUpdated: '2024-03-24',
      prev: {
        text: 'Getting Started',
        link: '/guide/getting-started'
      }
    };

    const html = renderToString(<Footer {...props} />);
    expect(html).toContain('Getting Started');
    expect(html).toContain('Last updated on');
    expect(html).toContain('March'); // Check for month
  });
}); 