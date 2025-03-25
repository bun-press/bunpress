import * as fs from 'fs';
import * as path from 'path';
import type { Plugin } from '../../core/plugin';

export interface SeoOptions {
  /**
   * Site title
   * @default undefined
   */
  siteTitle?: string;

  /**
   * Site description
   * @default undefined
   */
  siteDescription?: string;

  /**
   * Site URL
   * @default undefined
   */
  siteUrl?: string;

  /**
   * Default image for social sharing
   * @default undefined
   */
  defaultImage?: string;

  /**
   * Twitter handle
   * @default undefined
   */
  twitterHandle?: string;

  /**
   * Whether to generate a robots.txt file
   * @default true
   */
  generateRobotsTxt?: boolean;

  /**
   * Whether to generate a sitemap.xml file
   * @default true
   */
  generateSitemap?: boolean;

  /**
   * Whether to add canonical URLs
   * @default true
   */
  addCanonicalUrls?: boolean;

  /**
   * Whether to add schema.org JSON-LD
   * @default false
   */
  addJsonLd?: boolean;
}

export default function seoPlugin(options: SeoOptions = {}): Plugin {
  const {
    siteTitle,
    siteDescription,
    siteUrl,
    defaultImage,
    twitterHandle,
    generateRobotsTxt = true,
    generateSitemap = true,
    addCanonicalUrls = true,
    addJsonLd = false,
  } = options;

  // Track processed pages
  const pages: string[] = [];

  return {
    name: 'seo',
    options,

    async buildStart() {
      console.log('SEO plugin: Starting SEO optimization...');
    },

    transform(content: string) {
      // Basic implementation that looks for HTML content with a <head> tag
      if (!content.includes('<head>')) {
        return content;
      }

      // Extract title from content if available
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const pageTitle = titleMatch ? titleMatch[1] : siteTitle || '';

      // Extract description from content if available
      const descriptionMatch = content.match(/<meta name="description" content="(.*?)"\s*\/?>/);
      const pageDescription = descriptionMatch ? descriptionMatch[1] : siteDescription || '';

      // URL path extraction from content (could be more robust in a real implementation)
      const urlPathMatch = content.match(/data-page-path="(.*?)"/);
      const urlPath = urlPathMatch ? urlPathMatch[1] : '/';

      // Track this page for sitemap generation
      pages.push(urlPath);

      // Build meta tags to inject
      let metaTags = '';

      // Basic meta tags
      if (pageDescription && !descriptionMatch) {
        metaTags += `\n  <meta name="description" content="${pageDescription}" />`;
      }

      // OpenGraph tags
      metaTags += `\n  <meta property="og:title" content="${pageTitle}" />`;
      metaTags += `\n  <meta property="og:type" content="website" />`;

      if (pageDescription) {
        metaTags += `\n  <meta property="og:description" content="${pageDescription}" />`;
      }

      if (siteUrl) {
        const fullUrl = new URL(urlPath, siteUrl).toString();
        metaTags += `\n  <meta property="og:url" content="${fullUrl}" />`;

        // Add canonical URL if enabled
        if (addCanonicalUrls) {
          metaTags += `\n  <link rel="canonical" href="${fullUrl}" />`;
        }
      }

      if (defaultImage) {
        const imageUrl = defaultImage.startsWith('http')
          ? defaultImage
          : siteUrl
            ? new URL(defaultImage, siteUrl).toString()
            : defaultImage;
        metaTags += `\n  <meta property="og:image" content="${imageUrl}" />`;
      }

      // Twitter Card tags
      metaTags += `\n  <meta name="twitter:card" content="summary_large_image" />`;
      if (twitterHandle) {
        metaTags += `\n  <meta name="twitter:site" content="@${twitterHandle.replace('@', '')}" />`;
      }
      metaTags += `\n  <meta name="twitter:title" content="${pageTitle}" />`;
      if (pageDescription) {
        metaTags += `\n  <meta name="twitter:description" content="${pageDescription}" />`;
      }
      if (defaultImage) {
        const imageUrl = defaultImage.startsWith('http')
          ? defaultImage
          : siteUrl
            ? new URL(defaultImage, siteUrl).toString()
            : defaultImage;
        metaTags += `\n  <meta name="twitter:image" content="${imageUrl}" />`;
      }

      // Add schema.org JSON-LD if enabled
      if (addJsonLd) {
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: pageTitle,
          description: pageDescription,
          url: siteUrl ? new URL(urlPath, siteUrl).toString() : undefined,
          image: defaultImage
            ? defaultImage.startsWith('http')
              ? defaultImage
              : siteUrl
                ? new URL(defaultImage, siteUrl).toString()
                : defaultImage
            : undefined,
        };

        metaTags += `\n  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>`;
      }

      // Inject meta tags into the <head> section
      return content.replace(/<head>/, `<head>${metaTags}`);
    },

    async buildEnd() {
      if (!siteUrl) {
        console.log(
          'SEO plugin: Site URL not provided, skipping robots.txt and sitemap.xml generation.'
        );
        return;
      }

      const outputDir = 'dist'; // This should be configurable or determined from context

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate robots.txt if enabled
      if (generateRobotsTxt) {
        const robotsContent = `User-agent: *
Allow: /

${generateSitemap ? `Sitemap: ${new URL('sitemap.xml', siteUrl).toString()}` : ''}
`;

        fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
        console.log('SEO plugin: Generated robots.txt');
      }

      // Generate sitemap.xml if enabled
      if (generateSitemap) {
        let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        for (const page of pages) {
          const pageUrl = new URL(page, siteUrl).toString();
          sitemapContent += `
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
        }

        sitemapContent += `
</urlset>`;

        fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapContent);
        console.log(`SEO plugin: Generated sitemap.xml with ${pages.length} URLs`);
      }

      console.log('SEO plugin: SEO optimization complete.');
    },
  };
}
