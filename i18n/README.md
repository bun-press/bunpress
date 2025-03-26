# BunPress Internationalization (i18n)

This directory contains translations for your BunPress site. The i18n system allows you to create multilingual content with minimal effort.

## Directory Structure

The i18n directory follows this structure:

```
i18n/
├── en/              # English (default language)
│   ├── common.json  # Common translations
│   ├── blog.json    # Blog-specific translations
│   └── ...          # Other translation files
├── fr/              # French
│   ├── common.json
│   └── ...
├── es/              # Spanish
│   ├── common.json
│   └── ...
└── ...              # Other languages
```

## Using Translations in Content

You can use translations in your Markdown content with the `{{t:key}}` syntax:

```markdown
---
title: "{{t:site.title}}"
description: "{{t:site.description}}"
---

# Welcome to {{t:site.title}}

{{t:common.greeting}}
```

You can also specify a default value if a translation is missing:

```markdown
{{t:blog.readMore|Read More}}
```

## Translation File Format

Translation files are JSON files with nested keys:

```json
{
  "site": {
    "title": "BunPress",
    "description": "A modern static site generator"
  },
  "common": {
    "greeting": "Welcome to our site",
    "readMore": "Read more"
  }
}
```

## Adding a New Language

To add a new language:

1. Create a new directory with the language code (e.g. `de` for German)
2. Add translation files (at minimum, copy and translate `common.json`)
3. Update the `bunpress.config.ts` file to include the new language:

```typescript
{
  name: 'i18n',
  options: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es', 'de'], // Add your language code here
    translationsDir: './i18n',
    fallbackLocale: 'en'
  }
}
```

## Route Structure

By default, BunPress generates localized routes with the language code prefix:

- `/` - Default language (typically English)
- `/fr/` - French version
- `/es/` - Spanish version

## Locale Detection

BunPress automatically:

1. Checks URL for locale prefix
2. Uses browser preferred language
3. Falls back to default locale

## Language Selector

The built-in `LanguageSelector` component in the navigation automatically detects:

- Current locale from URL
- Available locales from configuration
- User's preferred locales

## Configuration Options

The i18n plugin accepts these options:

- `defaultLocale`: The fallback locale (default: 'en')
- `locales`: Array of supported locale codes
- `translationsDir`: Path to translations directory
- `allowMissingTranslations`: If true, uses default locale for missing translations
- `generateLocaleRoutes`: If true, creates routes for each locale
- `prefixLocaleInUrl`: If true, adds locale prefix to URLs

## Language-Specific Content

For content that's completely different between languages, create language-specific directories:

```
pages/
├── en/
│   └── about.md
├── fr/
│   └── about.md
└── index.md  # Shared home page with t: tags
``` 