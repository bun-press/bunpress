import { describe, test, expect } from 'bun:test';
import { createIntegratedSystem, slotSystem, i18n } from '..';
import * as path from 'path';
import * as os from 'os';

describe('Integrated System', () => {
  const workspaceRoot = path.join(os.tmpdir(), 'bunpress-integrated-system-test');

  const mockConfig = {
    title: 'BunPress Test Site',
    description: 'A test site for BunPress',
    contentDir: path.join(workspaceRoot, 'content'),
    outputDir: path.join(workspaceRoot, 'output'),
    publicDir: path.join(workspaceRoot, 'public'),
    devServer: {
      port: 3000,
      host: 'localhost',
      hmrPort: 3001,
      hmrHost: 'localhost',
    },
  };

  test('createIntegratedSystem creates a complete system', () => {
    const system = createIntegratedSystem(workspaceRoot, mockConfig);

    // Check that all expected properties exist
    expect(system).toHaveProperty('fs');
    expect(system).toHaveProperty('configMgr');
    expect(system).toHaveProperty('events');
    expect(system).toHaveProperty('pluginManager');
    expect(system).toHaveProperty('themeManager');
    expect(system).toHaveProperty('contentProcessor');
    expect(system).toHaveProperty('layoutManager');
    expect(system).toHaveProperty('renderer');
    expect(system).toHaveProperty('ui');
    expect(system).toHaveProperty('themeIntegration');
    expect(system).toHaveProperty('navigation');
    expect(system).toHaveProperty('builder');
    expect(system).toHaveProperty('server');

    // Check that all expected methods exist
    expect(typeof system.build).toBe('function');
    expect(typeof system.serve).toBe('function');
    expect(typeof system.dev).toBe('function');
    expect(typeof system.stop).toBe('function');
  });

  describe('slotSystem', () => {
    test('registers and retrieves slot content', () => {
      const slots = slotSystem();

      slots.registerSlot('header', 'Header Content');
      slots.registerSlot('footer', 'Footer Content');

      expect(slots.getSlotContent('header')).toBe('Header Content');
      expect(slots.getSlotContent('footer')).toBe('Footer Content');
    });

    test('returns fallback content when slot is not found', () => {
      const slots = slotSystem();

      expect(slots.getSlotContent('nonexistent', 'Fallback')).toBe('Fallback');
    });

    test('renders template with slots', () => {
      const slots = slotSystem();
      const template = '<div>{{slot:content}}</div>';
      const result = slots.renderWithSlots(template, { content: 'Test Content' });

      expect(result).toBe('<div>Test Content</div>');
    });

    test('clears slots', () => {
      const slots = slotSystem();

      slots.registerSlot('test', 'Test Content');
      expect(slots.getSlotContent('test')).toBe('Test Content');

      slots.clearSlots();
      expect(slots.getSlotContent('test')).toBeUndefined();
    });
  });

  describe('i18n', () => {
    test('translates keys', () => {
      const translator = i18n();

      translator.registerTranslations('en', {
        hello: 'Hello',
        welcome: 'Welcome',
      });

      expect(translator.t('hello')).toBe('Hello');
      expect(translator.t('welcome')).toBe('Welcome');
    });

    test('sets and gets language', () => {
      const translator = i18n();

      translator.registerTranslations('en', { hello: 'Hello' });
      translator.registerTranslations('fr', { hello: 'Bonjour' });

      translator.setLanguage('fr');
      expect(translator.getLanguage()).toBe('fr');
      expect(translator.t('hello')).toBe('Bonjour');

      translator.setLanguage('en');
      expect(translator.getLanguage()).toBe('en');
      expect(translator.t('hello')).toBe('Hello');
    });

    test('translates content with markers', () => {
      const translator = i18n();

      translator.registerTranslations('en', {
        hello: 'Hello',
        welcome: 'Welcome',
      });

      const content = '{{t:hello}} and {{t:welcome}}';
      const result = translator.translate(content, 'en');

      expect(result).toBe('Hello and Welcome');
    });

    test('gets available locales', () => {
      const translator = i18n();

      translator.registerTranslations('en', { hello: 'Hello' });
      translator.registerTranslations('fr', { hello: 'Bonjour' });
      translator.registerTranslations('es', { hello: 'Hola' });

      const locales = translator.getAvailableLocales();

      expect(locales).toContain('en');
      expect(locales).toContain('fr');
      expect(locales).toContain('es');
    });
  });
});
