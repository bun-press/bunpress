import { describe, test, expect } from 'bun:test';
import i18nPlugin from '../index';

describe('i18n Plugin', () => {
  test('creates a plugin with default options', () => {
    const plugin = i18nPlugin();
    expect(plugin.name).toBe('i18n');
    expect(plugin.options).toEqual({});
  });

  test('accepts custom options', () => {
    const options = {
      defaultLocale: 'fr',
      locales: ['fr', 'en', 'es'],
      translationsDir: 'translations'
    };
    
    const plugin = i18nPlugin(options);
    expect(plugin.options).toEqual(options);
  });

  // More detailed tests will be added as the implementation progresses
}); 