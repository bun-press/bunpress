import React from 'react';
import { Sidebar, SidebarItem } from '../components/Sidebar';
import { TOC } from '../components/TOC';
import { Navigation, NavItem } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SlotProvider, Slot } from '../../../src/core/slot-system';

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

  return (
    <SlotProvider>
      <div className="doc-layout" style={backgroundColor ? { backgroundColor } : undefined}>
        {/* Navigation slot */}
        <Slot name="navigation" fallback={
          !hideNav && (
            <header className="doc-header">
              <div className={`doc-header-container ${isFullWidth ? 'full-width' : ''}`}>
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

        <div className="doc-container">
          {/* Sidebar slot */}
          <Slot name="sidebar" fallback={
            showSidebar && sidebarItems.length > 0 && (
              <aside className="doc-sidebar">
                <Sidebar 
                  items={sidebarItems}
                  config={sidebarConfig}
                  currentPath={currentPath}
                />
              </aside>
            )
          } />

          <main className="doc-main">
            {/* Before content slot */}
            <Slot name="before-content" />

            <article className="doc-content">
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
                  prev={frontmatter.prev}
                  next={frontmatter.next}
                  footerLinks={footerLinks}
                />
              )
            } />
          </main>

          {/* TOC slot */}
          <Slot name="toc" fallback={
            showAside && tocItems.length > 0 && (
              <aside className="doc-toc">
                <TOC 
                  items={tocItems}
                  minLevel={minLevel}
                  maxLevel={maxLevel}
                />
              </aside>
            )
          } />
        </div>
      </div>
    </SlotProvider>
  );
}

export default DocLayout; 