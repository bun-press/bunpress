import { describe, test, expect } from 'bun:test';
import { renderContent, slotSystem, i18n } from '..';

describe('Integrated Rendering', () => {
  describe('renderContent', () => {
    test('renders markdown headings to HTML', async () => {
      const renderer = await renderContent();

      const markdown = `# Heading 1
## Heading 2
### Heading 3`;

      const result = renderer.render(markdown);

      expect(result).toContain('<h1 id="Heading 1">Heading 1</h1>');
      expect(result).toContain('<h2 id="Heading 2">Heading 2</h2>');
      expect(result).toContain('<h3 id="Heading 3">Heading 3</h3>');
    });

    test('renders paragraphs to HTML', async () => {
      const renderer = await renderContent();

      const markdown = `This is a paragraph.
      
This is another paragraph.`;

      const result = renderer.render(markdown);

      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<p>This is another paragraph.</p>');
    });

    test('renders code blocks with syntax highlighting when enabled', async () => {
      const renderer = await renderContent();

      const markdown = '```javascript\nconst x = 1;\n```';

      const resultWithHighlighting = renderer.render(markdown, { highlightCode: true });
      const resultWithoutHighlighting = renderer.render(markdown);

      expect(resultWithHighlighting).toContain('class="language-javascript"');
      expect(resultWithoutHighlighting).not.toContain('class="language-javascript"');
    });

    test('extracts frontmatter from markdown', async () => {
      const renderer = await renderContent();

      const markdown = `---
title: Test Document
description: This is a test
published: true
order: 5
---

# Document content`;

      const result = renderer.extractFrontmatter(markdown);

      expect(result.frontmatter).toEqual({
        title: 'Test Document',
        description: 'This is a test',
        published: true,
        order: 5,
      });

      expect(result.content).toBe('# Document content');
    });

    test('extracts TOC from HTML content', async () => {
      const renderer = await renderContent();

      const html = `
<h1 id="first-heading">First Heading</h1>
<p>Some content</p>
<h2 id="second-heading">Second Heading</h2>
<h3 id="third-heading">Third Heading</h3>
`;

      const toc = renderer.extractTOC(html);

      expect(toc).toEqual([
        { id: 'first-heading', text: 'First Heading', level: 1 },
        { id: 'second-heading', text: 'Second Heading', level: 2 },
        { id: 'third-heading', text: 'Third Heading', level: 3 },
      ]);
    });
  });

  describe('slotSystem', () => {
    const slots = slotSystem();

    test('registers and retrieves slot content', () => {
      slots.registerSlot('header', 'Header Content');
      slots.registerSlot('footer', 'Footer Content');

      expect(slots.getSlotContent('header')).toBe('Header Content');
      expect(slots.getSlotContent('footer')).toBe('Footer Content');
    });

    test('returns fallback content when slot is not found', () => {
      expect(slots.getSlotContent('nonexistent', 'Fallback')).toBe('Fallback');
    });

    test('renders template with slots', () => {
      const template = `
<!DOCTYPE html>
<html>
<head>
  <title>{{slot:title}}</title>
</head>
<body>
  <header>{{slot:header}}</header>
  <main>{{slot:content}}</main>
  <footer>{{slot:footer}}</footer>
</body>
</html>`;

      const slotData = {
        title: 'Page Title',
        header: 'Header Content',
        content: 'Main Content',
        footer: 'Footer Content',
      };

      const result = slots.renderWithSlots(template, slotData);

      expect(result).toContain('<title>Page Title</title>');
      expect(result).toContain('<header>Header Content</header>');
      expect(result).toContain('<main>Main Content</main>');
      expect(result).toContain('<footer>Footer Content</footer>');
    });

    test('clears all slots', () => {
      slots.registerSlot('test1', 'Test 1');
      slots.registerSlot('test2', 'Test 2');

      slots.clearSlots();

      expect(slots.getSlotContent('test1')).toBeUndefined();
      expect(slots.getSlotContent('test2')).toBeUndefined();
    });
  });

  describe('i18n', () => {
    const translator = i18n();

    test('registers and retrieves translations', () => {
      translator.registerTranslations('en', {
        hello: 'Hello',
        welcome: 'Welcome to BunPress',
      });

      translator.registerTranslations('es', {
        hello: 'Hola',
        welcome: 'Bienvenido a BunPress',
      });

      const availableLocales = translator.getAvailableLocales();
      expect(availableLocales).toContain('en');
      expect(availableLocales).toContain('es');
    });

    test('translates content with i18n markers', () => {
      const content = 'Say {{t:hello}} to get a {{t:welcome}}';

      const enResult = translator.translate(content, 'en');
      expect(enResult).toBe('Say Hello to get a Welcome to BunPress');

      const esResult = translator.translate(content, 'es');
      expect(esResult).toBe('Say Hola to get a Bienvenido a BunPress');
    });

    test('falls back to fallback locale when translation is missing', () => {
      translator.registerTranslations('fr', {
        hello: 'Bonjour',
        // welcome is missing
      });

      const content = '{{t:hello}} and {{t:welcome}}';
      const result = translator.translate(content, 'fr', 'en');

      expect(result).toBe('Bonjour and Welcome to BunPress');
    });

    test('returns key when translation is missing and no fallback', () => {
      const content = '{{t:hello}} and {{t:goodbye}}';
      const result = translator.translate(content, 'en');

      expect(result).toBe('Hello and goodbye');
    });
  });
});
