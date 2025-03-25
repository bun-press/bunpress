import React from 'react';
import { Sidebar, SidebarItem } from '../components/Sidebar';
import { TOC } from '../components/TOC';
import { Navigation, NavItem } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SlotProvider, Slot } from '../../../src/core/slot-system';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { cn } from '../../../src/lib/utils';

interface TocItem {
  level: number;
  id: string;
  text: string;
}

interface SidebarConfig {
  items?: SidebarItem[];
  autoGenerate?: boolean;
  collapseDepth?: number;
  showActiveAncestors?: boolean;
  persistState?: boolean;
}

interface PrevNextLink {
  text: string;
  link: string;
}

interface DocLayoutProps {
  frontmatter: {
    title: string;
    description?: string;
    sidebar?: boolean | SidebarConfig;
    outline?: boolean;
    editLink?: string;
    lastUpdated?: string;
    tocLevels?: [number, number];
    prev?: PrevNextLink;
    next?: PrevNextLink;
    heroImage?: string;
    logoText?: string;
    logoLink?: string;
    navTitle?: string;
    theme?: {
      fullWidthLayout?: boolean;
      showAside?: boolean;
      showFooter?: boolean;
      hideNav?: boolean;
      accentColor?: string;
      footerLinks?: Array<{
        title: string;
        items: Array<{ text: string; link: string }>;
      }>;
    };
    backgroundColor?: string;
  };
  children: React.ReactNode;
  navItems: NavItem[];
  sidebarItems: SidebarItem[];
  tocItems: TocItem[];
  currentPath?: string;
}

export function DocLayout({
  frontmatter,
  children,
  navItems,
  sidebarItems,
  tocItems,
  currentPath = ''
}: DocLayoutProps) {
  // Get TOC level configuration
  const tocLevels = frontmatter.tocLevels || [2, 3];
  const [minLevel, maxLevel] = tocLevels;
  
  // Theme options
  const theme = frontmatter.theme || {};
  const isFullWidth = theme.fullWidthLayout || false;
  const showAside = theme.showAside !== false; // Default to true
  const showFooter = theme.showFooter !== false; // Default to true
  const hideNav = theme.hideNav || false;
  const footerLinks = theme.footerLinks || [];
  const backgroundColor = frontmatter.backgroundColor || '';
  const accentColor = theme.accentColor || '';
  
  // Navigation options
  const logoText = frontmatter.logoText || 'BunPress';
  const logoLink = frontmatter.logoLink || '/';
  const logoImage = frontmatter.heroImage;

  // Process sidebar configuration
  const showSidebar = frontmatter.sidebar !== false;
  
  // Setup default sidebar config with persistence enabled
  const defaultSidebarConfig: SidebarConfig = {
    persistState: true
  };
  
  // Merge user config with defaults
  const sidebarConfig = typeof frontmatter.sidebar === 'object' 
    ? { ...defaultSidebarConfig, ...frontmatter.sidebar }
    : defaultSidebarConfig;

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
          "doc-layout min-h-screen flex flex-col",
          "animate-in fade-in duration-500",
          backgroundColor && "bg-background"
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {/* Navigation slot */}
        <Slot name="navigation" fallback={
          !hideNav && (
            <header className="doc-header sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className={cn(
                "doc-header-container mx-auto flex h-16 items-center px-4 sm:container", 
                isFullWidth && "max-w-full"
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

        <div className={cn(
          "doc-container flex-1 items-start md:grid",
          showSidebar && sidebarItems.length > 0 && showAside && tocItems.length > 0 
            ? "md:grid-cols-[240px_1fr_260px] lg:grid-cols-[280px_1fr_300px]" 
            : showSidebar && sidebarItems.length > 0 
              ? "md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]"
              : showAside && tocItems.length > 0
                ? "md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px]"
                : "md:grid-cols-[1fr]",
          isFullWidth ? "max-w-full" : "container mx-auto"
        )}>
          {/* Sidebar slot */}
          <Slot name="sidebar" fallback={
            showSidebar && sidebarItems.length > 0 && (
              <aside className="doc-sidebar animate-in slide-in-from-left-5 duration-300 sticky top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 border-r md:block">
                <ScrollArea className="h-full py-6 pr-4 pl-6">
                  <div className="mb-4">
                    <strong className="text-sm font-medium tracking-tight text-foreground/80">Documentation</strong>
                  </div>
                  <Sidebar 
                    items={sidebarItems}
                    config={sidebarConfig}
                    currentPath={currentPath}
                  />
                </ScrollArea>
              </aside>
            )
          } />

          <main className="doc-main relative py-10 px-4 md:px-8 lg:px-12 max-w-full">
            {/* Before content slot */}
            <Slot name="before-content" />

            <article className="doc-content prose prose-slate dark:prose-invert max-w-3xl mx-auto animate-in fade-in-50 duration-300">
              {children}
            </article>

            {/* After content slot */}
            <Slot name="after-content" />

            {/* Footer slot */}
            {showFooter && (
              <>
                <Separator className="my-8" />
                <Slot name="footer" fallback={
                  <Footer
                    editLink={frontmatter.editLink}
                    lastUpdated={frontmatter.lastUpdated}
                    prev={frontmatter.prev}
                    next={frontmatter.next}
                    footerLinks={footerLinks}
                  />
                } />
              </>
            )}
          </main>

          {/* TOC slot */}
          <Slot name="toc" fallback={
            showAside && tocItems.length > 0 && (
              <aside className="doc-toc animate-in slide-in-from-right-5 duration-300 sticky top-16 z-20 hidden h-[calc(100vh-4rem)] w-full shrink-0 border-l lg:block">
                <ScrollArea className="h-full py-6 pl-6 pr-4">
                  <div className="mb-4">
                    <strong className="text-sm font-medium tracking-tight text-foreground/80">On This Page</strong>
                  </div>
                  <TOC 
                    items={tocItems}
                    minLevel={minLevel}
                    maxLevel={maxLevel}
                  />
                </ScrollArea>
              </aside>
            )
          } />
        </div>
      </div>
    </SlotProvider>
  );
}

export default DocLayout; 