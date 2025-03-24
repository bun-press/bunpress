# BunPress Internationalization (i18n) Plugin

The Internationalization (i18n) plugin adds multilingual support to your BunPress site.

## Features

- Support for multiple languages/locales
- Translation loading from JSON files
- Simple syntax for inline translations using `{{t:key}}` 
- Locale-specific route generation (e.g., /en/about, /fr/about)
- Fallback to default language for missing translations
- Support for nested translation keys

## Installation

This plugin is included with BunPress, so you don't need to install it separately.

## Usage

Add the i18n plugin to your `bunpress.config.ts` file:

```typescript
import { defineConfig } from 'bunpress';
import { i18nPlugin } from 'bunpress/plugins';

export default defineConfig({
  // ... other config
  plugins: [
    i18nPlugin({
      defaultLocale: 'en', 
      locales: ['en', 'fr', 'es'],
      translationsDir: 'i18n'
    })
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | `string` | `'en'` | The default locale to use as fallback |
| `locales` | `string[]` | `['en']` | List of supported locales |
| `translationsDir` | `string` | `'i18n'` | Directory containing translation files |
| `allowMissingTranslations` | `boolean` | `true` | Whether to allow missing translations (falls back to default locale) |
| `generateLocaleRoutes` | `boolean` | `true` | Whether to generate locale-specific routes | 
| `prefixLocaleInUrl` | `boolean` | `true` | Whether locale should be prefixed in URLs (e.g., /en/about) |

## Translation Files

Create a directory for your translations (default: `i18n`) and add JSON files for each locale:

```
i18n/
  en.json
  fr.json
  es.json
```

Example translation file (`en.json`):

```json
{
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "home": {
    "title": "Welcome to my site",
    "description": "This is a BunPress site with i18n support"
  }
}
```

## Using Translations in Content

In your markdown files, use the `{{t:key}}` syntax to insert translations:

```markdown
---
title: {{t:home.title}}
description: {{t:home.description}}
---

# {{t:home.title}}

{{t:home.content|This is the default text if translation is missing}}

- [{{t:navigation.home}}](/)
- [{{t:navigation.about}}](/about)
- [{{t:navigation.contact}}](/contact)
```

## Language-Specific Content

You can create language-specific content by specifying the locale in frontmatter:

```markdown
---
title: French Only Page
description: This page only appears in French
locale: fr
---

# Page en français

Ce contenu n'apparaît qu'en français.
```

## Route Generation

The i18n plugin automatically generates locale-specific routes for your content. For example, if you have an `about.md` file and support English and French, the following routes will be generated:

- `/en/about` - English version
- `/fr/about` - French version

If you set `prefixLocaleInUrl` to `false`, the default locale routes will not be prefixed:

- `/about` - English version (default)
- `/fr/about` - French version

The plugin automatically handles this route generation during the build process.

## Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentDir` | `string` | `'pages'` | Directory containing content files |
| `outputDir` | `string` | `'dist'` | Output directory for generated files |

## How It Works

The i18n plugin performs the following operations:

1. Loads translation files from the specified directory
2. Transforms content by replacing translation keys with actual translations
3. Registers content files for locale-specific route generation
4. Generates locale-specific routes for all content during build
5. Allows fallback to default language for missing translations

## Best Practices

1. **Keep translations organized**: Use nested objects to organize translations by section or page
2. **Provide default values**: Use the fallback syntax `{{t:key|Default text}}` for important content
3. **Specify locale in frontmatter**: For content that should only appear in specific languages
4. **Use meaningful keys**: Choose descriptive keys that indicate the purpose of the text

## Example Configuration

```typescript
i18nPlugin({
  defaultLocale: 'en',
  locales: ['en', 'fr', 'de', 'es'],
  translationsDir: 'translations',
  allowMissingTranslations: true,
  generateLocaleRoutes: true, 
  prefixLocaleInUrl: true
})
```

## Example Translation Access

```typescript
// Load all translations
import { loadTranslations } from 'bunpress/plugins/i18n';

// Access translation programmatically
const frenchTranslations = loadTranslations('fr');
const welcomeText = frenchTranslations.home.title;
``` 