import React from 'react';
import { Navigation, NavItem } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SlotProvider, Slot } from '../../../src/core/slot-system';
import { cn } from '../../../src/lib/utils';

interface HeroAction {
  text: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface Hero {
  title: string;
  tagline?: string;
  description?: string;
  image?: string;
  actions?: HeroAction[];
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
    hero?: Hero;
    features?: Feature[];
    heroImage?: string;
    logoText?: string;
    logoLink?: string;
    navTitle?: string;
    theme?: {
      fullWidthLayout?: boolean;
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
    <SlotProvider>
      <div className="home-layout" style={backgroundColor ? { backgroundColor } : undefined}>
        {/* Navigation slot */}
        <Slot name="navigation" fallback={
          !hideNav && (
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
          )
        } />

        <main className="home-main">
          {/* Hero slot */}
          <Slot name="hero" fallback={
            hero && (
              <section className={cn(
                'home-hero',
                isFullWidth ? 'full-width' : 'container'
              )}>
                <div className="home-hero-content">
                  <h1 className="home-hero-title">{hero.title}</h1>
                  {hero.tagline && (
                    <p className="home-hero-tagline">{hero.tagline}</p>
                  )}
                  {hero.description && (
                    <p className="home-hero-description">{hero.description}</p>
                  )}
                  {hero.actions && hero.actions.length > 0 && (
                    <div className="home-hero-actions">
                      {hero.actions.map((action, index) => (
                        <a
                          key={index}
                          href={action.link}
                          className={cn(
                            'home-hero-action',
                            action.variant && `variant-${action.variant}`
                          )}
                        >
                          {action.text}
                        </a>
                      ))}
                    </div>
                  )}
                  {hero.image && (
                    <div className="home-hero-image">
                      <img src={hero.image} alt={hero.title} />
                    </div>
                  )}
                </div>
              </section>
            )
          } />

          {/* Features slot */}
          <Slot name="features" fallback={
            features.length > 0 && (
              <section className={cn(
                'home-features',
                isFullWidth ? 'full-width' : 'container'
              )}>
                <div className="home-features-grid">
                  {features.map((feature, index) => (
                    <div key={index} className="home-feature">
                      {feature.icon && (
                        <div className="home-feature-icon">
                          {feature.icon}
                        </div>
                      )}
                      <h3 className="home-feature-title">{feature.title}</h3>
                      <p className="home-feature-description">{feature.description}</p>
                      {feature.link && (
                        <a href={feature.link} className="home-feature-link">
                          Learn more
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          } />

          {/* Content slot */}
          <Slot name="content" fallback={
            children && (
              <section className={cn(
                'home-content',
                isFullWidth ? 'full-width' : 'container'
              )}>
                {children}
              </section>
            )
          } />

          {/* Footer slot */}
          <Slot name="footer" fallback={
            showFooter && (
              <Footer
                footerLinks={footerLinks}
              />
            )
          } />
        </main>
      </div>
    </SlotProvider>
  );
}

export default HomeLayout; 