import React from 'react';
import { Sidebar, SidebarItem } from '../components/Sidebar';
import { TOC } from '../components/TOC';
import { Navigation, NavItem } from '../components/Navigation';

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
    <div className="doc-layout" style={backgroundColor ? { backgroundColor } : undefined}>
      {!hideNav && (
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
      )}
      
      <div className={`doc-container ${isFullWidth ? 'full-width' : ''}`}>
        {(showSidebar && sidebarItems.length > 0) && (
          <Sidebar 
            items={sidebarItems} 
            currentPath={currentPath}
            sidebarConfig={sidebarConfig}
          />
        )}
        
        <main className="doc-content">
          <article className="doc-article">
            <h1 className="doc-title">{frontmatter.title}</h1>
            <div className="doc-content-body">
              {children}
            </div>
            
            {/* Previous and Next navigation */}
            {(frontmatter.prev || frontmatter.next) && (
              <div className="doc-prev-next">
                {frontmatter.prev && (
                  <a href={frontmatter.prev.link} className="doc-prev">
                    <div className="doc-prev-next-label">Previous</div>
                    <div className="doc-prev-next-title">{frontmatter.prev.text}</div>
                  </a>
                )}
                
                {frontmatter.next && (
                  <a href={frontmatter.next.link} className="doc-next">
                    <div className="doc-prev-next-label">Next</div>
                    <div className="doc-prev-next-title">{frontmatter.next.text}</div>
                  </a>
                )}
              </div>
            )}
            
            {frontmatter.editLink && (
              <div className="doc-page-footer">
                <a href={frontmatter.editLink} className="doc-edit-link" target="_blank" rel="noopener noreferrer">
                  Edit this page on GitHub
                </a>
                {frontmatter.lastUpdated && (
                  <div className="doc-last-updated">
                    Last updated: {frontmatter.lastUpdated}
                  </div>
                )}
              </div>
            )}
          </article>
        </main>
        
        {(frontmatter.outline !== false && tocItems.length > 0 && showAside) && (
          <TOC
            items={tocItems}
            minLevel={minLevel}
            maxLevel={maxLevel}
          />
        )}
      </div>
      
      {showFooter && (
        <footer className="doc-footer-container">
          <div className={`doc-footer-content ${isFullWidth ? 'full-width' : ''}`}>
            {footerLinks.length > 0 ? (
              <div className="doc-footer-links">
                {footerLinks.map((section, index) => (
                  <div key={index} className="doc-footer-section">
                    <h3 className="doc-footer-title">{section.title}</h3>
                    <ul className="doc-footer-items">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="doc-footer-item">
                          <a href={item.link} className="doc-footer-link">{item.text}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p>Powered by BunPress</p>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

export default DocLayout; 