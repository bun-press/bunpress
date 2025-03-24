# BunPress Analytics Plugin

The Analytics plugin easily adds various analytics services to your BunPress site.

## Features

- Support for multiple analytics providers:
  - Google Analytics
  - Google Tag Manager 
  - Fathom Analytics
  - Plausible Analytics
  - Umami Analytics
  - Custom analytics code
- Automatic injection of tracking code into HTML output
- Option to disable analytics in development mode
- Highly configurable options

## Installation

This plugin is included with BunPress, so you don't need to install it separately.

## Usage

Add the Analytics plugin to your `bunpress.config.ts` file:

```typescript
import { defineConfig } from 'bunpress';
import { analyticsPlugin } from 'bunpress/plugins';

export default defineConfig({
  // ... other config
  plugins: [
    analyticsPlugin({
      type: 'google-analytics',
      googleAnalyticsId: 'G-XXXXXXXXXX'
    })
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `string` | `'google-analytics'` | Type of analytics to include (`'google-analytics'`, `'google-tag-manager'`, `'fathom'`, `'plausible'`, `'umami'`, or `'custom'`) |
| `googleAnalyticsId` | `string` | `''` | Google Analytics Measurement ID (G-XXXXXXXXXX) |
| `googleTagManagerId` | `string` | `''` | Google Tag Manager ID (GTM-XXXXXXX) |
| `fathomSiteId` | `string` | `''` | Fathom site ID |
| `plausibleDomain` | `string` | `''` | Plausible domain |
| `umamiWebsiteId` | `string` | `''` | Umami website ID |
| `umamiSrcUrl` | `string` | `'https://analytics.umami.is/script.js'` | Umami src URL |
| `customCode` | `string` | `''` | Custom analytics code to include |
| `includeDevelopment` | `boolean` | `false` | Whether to include analytics in development mode |

## Examples

### Google Analytics

```typescript
analyticsPlugin({
  type: 'google-analytics',
  googleAnalyticsId: 'G-XXXXXXXXXX'
})
```

### Google Tag Manager

```typescript
analyticsPlugin({
  type: 'google-tag-manager',
  googleTagManagerId: 'GTM-XXXXXXX'
})
```

### Fathom Analytics

```typescript
analyticsPlugin({
  type: 'fathom',
  fathomSiteId: 'ABCDEFG'
})
```

### Plausible Analytics

```typescript
analyticsPlugin({
  type: 'plausible',
  plausibleDomain: 'yourdomain.com'
})
```

### Umami Analytics

```typescript
analyticsPlugin({
  type: 'umami',
  umamiWebsiteId: '12345-67890',
  umamiSrcUrl: 'https://your-umami-instance.com/script.js' // Optional
})
```

### Custom Analytics Code

```typescript
analyticsPlugin({
  type: 'custom',
  customCode: `
    <script>
      // Your custom analytics code here
      console.log('Custom analytics loaded');
    </script>
  `
})
```

### Include Analytics in Development

By default, analytics code is not included in development mode. To include it:

```typescript
analyticsPlugin({
  type: 'google-analytics',
  googleAnalyticsId: 'G-XXXXXXXXXX',
  includeDevelopment: true
})
```

## How It Works

The Analytics plugin injects the appropriate tracking code into the HTML `<head>` section of each page during the build process. It uses the plugin system's `transform` hook to modify the HTML content.

For security and privacy reasons, analytics code is not included in development mode by default. You can override this behavior with the `includeDevelopment` option. 