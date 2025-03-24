import React from 'react';
import { Navigation, NavItem } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SlotProvider, Slot } from '../../../src/core/slot-system';
import { cn } from '../../../src/lib/utils';

interface PageLayoutProps {
  frontmatter: {
    title: string;
    description?: string;
    editLink?: string;
    lastUpdated?: string;
    heroImage?: string;
    logoText?: string;
    logoLink?: string;
    navTitle?: string;
    theme?: {
      fullWidthLayout?: boolean;
      hideNav?: boolean;
      showFooter?: boolean;
      footerLinks?: Array<{
        title: string;
        items: Array<{ text: string; link: string }>;
      }>;
    };
    backgroundColor?: string;
  };
  children: React.ReactNode;
  navItems: NavItem[];
  currentPath?: string;
}

export function PageLayout({
  frontmatter,
  children,
  navItems,
  currentPath = ''
}: PageLayoutProps) {
  // Theme options
  const theme = frontmatter.theme || {};
  const isFullWidth = theme.fullWidthLayout || false;
  const hideNav = theme.hideNav || false;
  const showFooter = theme.showFooter !== false; // Default to true
  const footerLinks = theme.footerLinks || [];
  const backgroundColor = frontmatter.backgroundColor || '';
  
  // Navigation options
  const logoText = frontmatter.logoText || 'BunPress';
  const logoLink = frontmatter.logoLink || '/';
  const logoImage = frontmatter.heroImage;

  return (
    <SlotProvider>
      <div className="page-layout" style={backgroundColor ? { backgroundColor } : undefined}>
        {/* Navigation slot */}
        <Slot name="navigation" fallback={
          !hideNav && (
            <header className="page-header">
              <div className={cn(
                'page-header-container',
                isFullWidth && 'full-width'
              )}>
                <Navigation 
                  items={navItems}
                  currentPath={currentPath}
                  logoText={logoText}
                  logoLink={logoLink}
                  logoImage={logoImage}
                />
              </div>
            </header>
          )
        } />

        <main className="page-main">
          {/* Before content slot */}
          <Slot name="before-content" />

          <article className={cn(
            'page-content',
            isFullWidth ? 'full-width' : 'container'
          )}>
            {children}
          </article>

          {/* After content slot */}
          <Slot name="after-content" />

          {/* Footer slot */}
          <Slot name="footer" fallback={
            showFooter && (
              <Footer
                editLink={frontmatter.editLink}
                lastUpdated={frontmatter.lastUpdated}
                footerLinks={footerLinks}
              />
            )
          } />
        </main>
      </div>
    </SlotProvider>
  );
}

export default PageLayout; 