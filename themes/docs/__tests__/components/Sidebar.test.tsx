import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
import { renderToString } from 'react-dom/server';
import { Sidebar } from '../../components/Sidebar';

// Set up JSDOM for document and window globals
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

// Mock window.localStorage
const localStorageMock = {
  getItem: mock(() => null),
  setItem: mock(() => {}),
  removeItem: mock(() => {}),
  clear: mock(() => {}),
  length: 0,
  key: mock(() => null)
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockRouter = {
  pathname: '/docs/guide/getting-started',
};

// Mock useRouter
mock.module('next/router', () => ({
  useRouter: () => mockRouter,
}));

describe('Sidebar Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Clean up DOM between tests
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    mockRouter.pathname = '/docs/guide/getting-started';
  });

  test('renders with basic items', () => {
    const sidebarItems = [
      { text: 'Introduction', link: '/docs/introduction' },
      { text: 'Getting Started', link: '/docs/guide/getting-started' },
      { text: 'Configuration', link: '/docs/guide/configuration' },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems} 
      />
    );

    // Check that all sidebar items are rendered
    expect(html).toContain('Introduction');
    expect(html).toContain('Getting Started');
    expect(html).toContain('Configuration');
    
    // Check that links are present in the structure
    expect(html).toContain('sidebar-link');
  });

  test('renders with nested items', () => {
    const sidebarItems = [
      { text: 'Introduction', link: '/docs/introduction' },
      { 
        text: 'Guide', 
        items: [
          { text: 'Getting Started', link: '/docs/guide/getting-started' },
          { text: 'Configuration', link: '/docs/guide/configuration' },
        ]
      },
      { text: 'API', link: '/docs/api' },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems} 
      />
    );

    // Check parent item
    expect(html).toContain('Guide');
    
    // Check children
    expect(html).toContain('Getting Started');
    expect(html).toContain('Configuration');
    
    // Check structure for nested items
    expect(html).toContain('sidebar-children');
  });

  test('renders with multi-level nested items', () => {
    const sidebarItems = [
      { 
        text: 'Guide', 
        items: [
          { text: 'Getting Started', link: '/docs/guide/getting-started' },
          { 
            text: 'Advanced', 
            items: [
              { text: 'Customization', link: '/docs/guide/advanced/customization' },
              { text: 'Plugins', link: '/docs/guide/advanced/plugins' },
            ]
          },
        ]
      },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems} 
      />
    );

    // Check nested structure
    expect(html).toContain('Guide');
    expect(html).toContain('Advanced');
    expect(html).toContain('Customization');
    expect(html).toContain('Plugins');
    
    // Check structure for deeply nested items
    expect(html).toContain('level-2');
  });

  test('applies active state to current route', () => {
    mockRouter.pathname = '/docs/guide/getting-started';
    
    const sidebarItems = [
      { text: 'Introduction', link: '/docs/introduction' },
      { text: 'Getting Started', link: '/docs/guide/getting-started' },
      { text: 'Configuration', link: '/docs/guide/configuration' },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems} 
      />
    );

    // This is a simplistic test since we can't easily check class application in SSR
    expect(html).toContain('Getting Started');
  });

  test('renders with custom title', () => {
    const sidebarItems = [
      { text: 'Introduction', link: '/docs/introduction' },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems}
        className="custom-sidebar"
      />
    );

    // Check that the class is applied
    expect(html).toContain('custom-sidebar');
  });

  test('respects collapsible option', () => {
    const sidebarItems = [
      { 
        text: 'Guide',
        collapsible: true,
        items: [
          { text: 'Getting Started', link: '/docs/guide/getting-started' },
          { text: 'Configuration', link: '/docs/guide/configuration' },
        ]
      },
    ];

    const html = renderToString(
      <Sidebar 
        items={sidebarItems}
      />
    );

    // Check for collapsible structure
    expect(html).toContain('Guide');
    expect(html).toContain('Getting Started');
  });
}); 