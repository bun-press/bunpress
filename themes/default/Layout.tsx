import React from 'react';
import { DocLayout } from './layouts/DocLayout';
import { PageLayout } from './layouts/PageLayout';
import { HomeLayout } from './layouts/HomeLayout';

interface LayoutProps {
  children: React.ReactNode;
  frontmatter: {
    title?: string;
    description?: string;
    layout?: 'doc' | 'page' | 'home';
    sidebar?: boolean;
    toc?: boolean | [number, number];
    editLink?: string;
    lastUpdated?: string | Date;
    prev?: { title: string; href: string };
    next?: { title: string; href: string };
    hero?: {
      title: string;
      tagline?: string;
      description?: string;
      image?: string;
      actions?: {
        text: string;
        href: string;
        variant?: 'default' | 'secondary' | 'outline' | 'ghost';
      }[];
    };
    features?: {
      title: string;
      description: string;
      icon?: string;
      link?: string;
    }[];
    hideNav?: boolean;
    hideFooter?: boolean;
  };
  navItems?: any[];
  sidebarItems?: any[];
  tocItems?: any[];
}

export function Layout({ 
  children, 
  frontmatter, 
  navItems = [],
  sidebarItems = [],
  tocItems = []
}: LayoutProps) {
  // Default to 'doc' layout if not specified
  const layout = frontmatter.layout || 'doc';

  // Process TOC configuration
  let hideTOC = false;
  let tocConfig = frontmatter.toc;
  if (tocConfig === false) {
    hideTOC = true;
  }

  // Create icon components if needed
  const features = frontmatter.features?.map(feature => ({
    ...feature,
    icon: feature.icon ? renderIcon(feature.icon) : undefined
  }));

  switch (layout) {
    case 'home':
      return (
        <HomeLayout
          title={frontmatter.title || 'Home'}
          description={frontmatter.description}
          navItems={navItems}
          hero={frontmatter.hero}
          features={features}
          hideNav={frontmatter.hideNav}
          hideFooter={frontmatter.hideFooter}
        >
          {children}
        </HomeLayout>
      );
    case 'page':
      return (
        <PageLayout
          title={frontmatter.title}
          description={frontmatter.description}
          navItems={navItems}
          editLink={frontmatter.editLink}
          lastUpdated={frontmatter.lastUpdated}
          prevPage={frontmatter.prev}
          nextPage={frontmatter.next}
          hideNav={frontmatter.hideNav}
          hideFooter={frontmatter.hideFooter}
        >
          {children}
        </PageLayout>
      );
    case 'doc':
    default:
      return (
        <DocLayout
          title={frontmatter.title}
          description={frontmatter.description}
          navItems={navItems}
          sidebarItems={sidebarItems}
          tocItems={tocItems}
          editLink={frontmatter.editLink}
          lastUpdated={frontmatter.lastUpdated}
          prevPage={frontmatter.prev}
          nextPage={frontmatter.next}
          hideTOC={hideTOC}
          hideSidebar={frontmatter.sidebar === false}
          hideNav={frontmatter.hideNav}
          hideFooter={frontmatter.hideFooter}
        >
          {children}
        </DocLayout>
      );
  }
}

// Helper function to render icons
function renderIcon(iconName: string): React.ReactNode {
  // Simple implementation - in a real app you would use a proper icon library
  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
      {iconName[0].toUpperCase()}
    </div>
  );
} 