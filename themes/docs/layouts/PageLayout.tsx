import React from 'react';
import { Navigation, NavItem } from '../components/Navigation';

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
    <div className="page-layout" style={backgroundColor ? { backgroundColor } : undefined}>
      {!hideNav && (
        <header className="page-header">
          <div className={`page-header-container ${isFullWidth ? 'full-width' : ''}`}>
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
      
      <main className="page-content">
        <div className={`page-container ${isFullWidth ? 'full-width' : ''}`}>
          <article className="page-article">
            <h1 className="page-title">{frontmatter.title}</h1>
            <div className="page-content-body">
              {children}
            </div>
            
            {frontmatter.editLink && (
              <div className="page-footer">
                <a href={frontmatter.editLink} className="page-edit-link" target="_blank" rel="noopener noreferrer">
                  Edit this page on GitHub
                </a>
                {frontmatter.lastUpdated && (
                  <div className="page-last-updated">
                    Last updated: {frontmatter.lastUpdated}
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      </main>
      
      {showFooter && (
        <footer className="page-footer-container">
          <div className={`page-footer-content ${isFullWidth ? 'full-width' : ''}`}>
            {footerLinks.length > 0 ? (
              <div className="page-footer-links">
                {footerLinks.map((section, index) => (
                  <div key={index} className="page-footer-section">
                    <h3 className="page-footer-title">{section.title}</h3>
                    <ul className="page-footer-items">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="page-footer-item">
                          <a href={item.link} className="page-footer-link">{item.text}</a>
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

export default PageLayout; 