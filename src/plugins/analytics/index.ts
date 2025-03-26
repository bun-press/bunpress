import type { Plugin } from '../../core/plugin';

export interface AnalyticsOptions {
  /**
   * The type of analytics to include
   * @default 'google-analytics'
   */
  type?: 'google-analytics' | 'google-tag-manager' | 'fathom' | 'plausible' | 'umami' | 'custom';

  /**
   * Google Analytics Measurement ID (G-XXXXXXXXXX)
   * @default ''
   */
  googleAnalyticsId?: string;

  /**
   * Google Tag Manager ID (GTM-XXXXXXX)
   * @default ''
   */
  googleTagManagerId?: string;

  /**
   * Fathom site ID
   * @default ''
   */
  fathomSiteId?: string;

  /**
   * Plausible domain
   * @default ''
   */
  plausibleDomain?: string;

  /**
   * Umami website ID
   * @default ''
   */
  umamiWebsiteId?: string;

  /**
   * Umami src URL
   * @default 'https://analytics.umami.is/script.js'
   */
  umamiSrcUrl?: string;

  /**
   * Custom analytics code to include
   * @default ''
   */
  customCode?: string;

  /**
   * Whether to include the analytics code in development mode
   * @default false
   */
  includeDevelopment?: boolean;
}

export default function analyticsPlugin(options: AnalyticsOptions = {}): Plugin {
  const {
    type = 'google-analytics',
    googleAnalyticsId = '',
    googleTagManagerId = '',
    fathomSiteId = '',
    plausibleDomain = '',
    umamiWebsiteId = '',
    umamiSrcUrl = 'https://analytics.umami.is/script.js',
    customCode = '',
    includeDevelopment = false,
  } = options;

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Validate analytics IDs to prevent accidental use of example values
  if (
    googleAnalyticsId &&
    (googleAnalyticsId === 'G-XXXXXXXXXX' || !googleAnalyticsId.startsWith('G-'))
  ) {
    console.warn(
      'Warning: Invalid Google Analytics Measurement ID provided. Please use a valid ID starting with "G-".'
    );
  }

  if (
    googleTagManagerId &&
    (googleTagManagerId === 'GTM-XXXXXXX' || !googleTagManagerId.startsWith('GTM-'))
  ) {
    console.warn(
      'Warning: Invalid Google Tag Manager ID provided. Please use a valid ID starting with "GTM-".'
    );
  }

  return {
    name: 'analytics',
    options,

    transform(content: string, id?: string): string {
      // Don't include analytics in development mode unless explicitly enabled
      if (isDevelopment && !includeDevelopment) {
        return content;
      }

      // Only transform HTML content
      if (!id || !id.endsWith('.html')) {
        return content;
      }

      // Get analytics code based on selected type
      const analyticsCode = getAnalyticsCode(type, {
        googleAnalyticsId,
        googleTagManagerId,
        fathomSiteId,
        plausibleDomain,
        umamiWebsiteId,
        umamiSrcUrl,
        customCode,
      });

      if (!analyticsCode) {
        return content;
      }

      // Insert analytics code before closing head tag
      return content.replace('</head>', `${analyticsCode}\n</head>`);
    },
  };
}

function getAnalyticsCode(
  type: AnalyticsOptions['type'],
  options: Pick<
    AnalyticsOptions,
    | 'googleAnalyticsId'
    | 'googleTagManagerId'
    | 'fathomSiteId'
    | 'plausibleDomain'
    | 'umamiWebsiteId'
    | 'umamiSrcUrl'
    | 'customCode'
  >
): string {
  switch (type) {
    case 'google-analytics':
      if (!options.googleAnalyticsId) return '';
      return `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${options.googleAnalyticsId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${options.googleAnalyticsId}');
</script>`;

    case 'google-tag-manager':
      if (!options.googleTagManagerId) return '';
      return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${options.googleTagManagerId}');</script>
<!-- End Google Tag Manager -->`;

    case 'fathom':
      if (!options.fathomSiteId) return '';
      return `<!-- Fathom Analytics -->
<script src="https://cdn.usefathom.com/script.js" data-site="${options.fathomSiteId}" defer></script>`;

    case 'plausible':
      if (!options.plausibleDomain) return '';
      return `<!-- Plausible Analytics -->
<script defer data-domain="${options.plausibleDomain}" src="https://plausible.io/js/script.js"></script>`;

    case 'umami':
      if (!options.umamiWebsiteId) return '';
      return `<!-- Umami Analytics -->
<script async defer
  data-website-id="${options.umamiWebsiteId}"
  src="${options.umamiSrcUrl}"
></script>`;

    case 'custom':
      return options.customCode || '';

    default:
      return '';
  }
}
