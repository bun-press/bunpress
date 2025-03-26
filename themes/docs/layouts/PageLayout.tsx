import React from 'react';
import { Navigation, NavItem } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SlotProvider, Slot } from '../../../src/core/slot-system';
import { cn } from '../../../src/lib/utils';
import { Language } from '../components/i18n/LanguageSelector';

interface PageLayoutProps {
  frontmatter: {
    title: string;
    description?: string;
    hideNav?: boolean;
    showFooter?: boolean;
    footerLinks?: Array<{
      title: string;
      items: Array<{ text: string; link: string }>;
    }>;
    heroImage?: string;
    logoText?: string;
    logoLink?: string;
    layout?: 'centered' | 'full';
    accentColor?: string;
    backgroundColor?: string;
    locale?: string;
    availableLocales?: Language[];
  };
  children: React.ReactNode;
  navItems: NavItem[];
  currentPath?: string;
  onLocaleChange?: (locale: string) => void;
}

export function PageLayout({
  frontmatter,
  children,
  navItems,
  currentPath = '',
  onLocaleChange
}: PageLayoutProps) {
  // Default options
  const showFooter = frontmatter.showFooter !== false;
  const hideNav = frontmatter.hideNav || false;
  const footerLinks = frontmatter.footerLinks || [];
  const layout = frontmatter.layout || 'centered';
  const isFullWidth = layout === 'full';
  const logoText = frontmatter.logoText || 'BunPress';
  const logoLink = frontmatter.logoLink || '/';
  const logoImage = frontmatter.heroImage;
  const accentColor = frontmatter.accentColor;
  const backgroundColor = frontmatter.backgroundColor;

  // Current locale and available locales for i18n
  const currentLocale = frontmatter.locale || 'en';
  const availableLocales = frontmatter.availableLocales;

  // Custom style element for accent color if specified
  const customStyles = accentColor ? (
    <style>{`
      :root {
        --primary: ${accentColor};
        --ring: ${accentColor};
      }
    `}</style>
  ) : null;

  return (
    <SlotProvider>
      {customStyles}
      <div 
        className={cn(
          "page-layout min-h-screen flex flex-col",
          "animate-in fade-in duration-500",
          backgroundColor && "bg-background"
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {/* Navigation slot */}
        <Slot name="navigation" fallback={
          !hideNav && (
            <header className="page-header sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className={cn(
                "page-header-container mx-auto flex h-16 items-center px-4 sm:container", 
                isFullWidth && "max-w-full"
              )}>
                <Navigation 
                  items={navItems}
                  currentPath={currentPath}
                  logoText={logoText}
                  logoLink={logoLink}
                  logoImage={logoImage}
                  currentLocale={currentLocale}
                  availableLocales={availableLocales}
                  onLocaleChange={onLocaleChange}
                />
              </div>
            </header>
          )
        } />

        <main className={cn(
          "page-main flex-1 py-10",
          isFullWidth ? "container-full px-4" : "container px-4 md:px-8"
        )}>
          {/* Before content slot */}
          <Slot name="before-content" />

          <article className="page-content prose prose-slate dark:prose-invert max-w-3xl mx-auto animate-in fade-in-50 duration-300">
            {children}
          </article>

          {/* After content slot */}
          <Slot name="after-content" />
        </main>

        {/* Footer slot */}
        {showFooter && (
          <Slot name="footer" fallback={
            <Footer
              footerLinks={footerLinks}
            />
          } />
        )}
      </div>
    </SlotProvider>
  );
}

export default PageLayout; 