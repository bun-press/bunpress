import React from 'react';
import { Navigation, NavItem } from '../components/Navigation';

interface HeroAction {
  text: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
  link?: string;
}

interface HomeLayoutProps {
  frontmatter: {
    title: string;
    description?: string;
    hero?: {
      title: string;
      tagline?: string;
      description?: string;
      image?: string;
      actions?: HeroAction[];
    };
    features?: Feature[];
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

export function HomeLayout({
  frontmatter,
  children,
  navItems,
  currentPath = ''
}: HomeLayoutProps) {
  const hero = frontmatter.hero || { title: frontmatter.title || 'BunPress' };
  const features = frontmatter.features || [];
  
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
    <div className="home-layout" style={backgroundColor ? { backgroundColor } : undefined}>
      {!hideNav && (
        <header className="home-header">
          <div className={`home-header-container ${isFullWidth ? 'full-width' : ''}`}>
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
      
      {hero && (
        <section className="home-hero">
          <div className={`home-hero-container ${isFullWidth ? 'full-width' : ''}`}>
            <div className="home-hero-content">
              <h1 className="home-hero-title">{hero.title}</h1>
              {hero.tagline && <p className="home-hero-tagline">{hero.tagline}</p>}
              {hero.description && <p className="home-hero-description">{hero.description}</p>}
              
              {hero.actions && hero.actions.length > 0 && (
                <div className="home-hero-actions">
                  {hero.actions.map((action, index) => (
                    <a 
                      key={index} 
                      href={action.link} 
                      className={`home-hero-action ${action.variant || 'primary'}`}
                    >
                      {action.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            {hero.image && (
              <div className="home-hero-image">
                <img src={hero.image} alt={hero.title} />
              </div>
            )}
          </div>
        </section>
      )}
      
      {features.length > 0 && (
        <section className="home-features">
          <div className={`home-features-container ${isFullWidth ? 'full-width' : ''}`}>
            {features.map((feature, index) => (
              <div key={index} className="home-feature">
                {feature.icon && <div className="home-feature-icon">{feature.icon}</div>}
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
                {feature.link && (
                  <a href={feature.link} className="home-feature-link">Learn more</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {children && (
        <section className="home-content">
          <div className={`home-content-container ${isFullWidth ? 'full-width' : ''}`}>
            {children}
          </div>
        </section>
      )}
      
      {showFooter && (
        <footer className="home-footer-container">
          <div className={`home-footer-content ${isFullWidth ? 'full-width' : ''}`}>
            {footerLinks.length > 0 ? (
              <div className="home-footer-links">
                {footerLinks.map((section, index) => (
                  <div key={index} className="home-footer-section">
                    <h3 className="home-footer-title">{section.title}</h3>
                    <ul className="home-footer-items">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="home-footer-item">
                          <a href={item.link} className="home-footer-link">{item.text}</a>
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

export default HomeLayout; 