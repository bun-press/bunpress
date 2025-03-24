import React from 'react';
import { DocLayout } from './layouts/DocLayout';
import { HomeLayout } from './layouts/HomeLayout';
import { PageLayout } from './layouts/PageLayout';
import { NavItem } from './components/Navigation';

interface LayoutProps {
  frontmatter: {
    title: string;
    description?: string;
    layout?: 'doc' | 'home' | 'page';
    heroImage?: string;
    logoText?: string;
    logoLink?: string;
    sidebar?: boolean;
    outline?: boolean;
    tocLevels?: [number, number];
    editLink?: string;
    lastUpdated?: string;
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
    [key: string]: any;
  };
  children: React.ReactNode;
  navItems: NavItem[];
  sidebarItems: any[];
  tocItems: any[];
  currentPath?: string;
}

export function Layout(props: LayoutProps) {
  const { 
    frontmatter, 
    children, 
    navItems, 
    sidebarItems, 
    tocItems,
    currentPath = ''
  } = props;
  
  const layoutType = frontmatter.layout || 'doc'; // Default to doc layout

  // Select layout based on frontmatter
  switch (layoutType) {
    case 'home':
      return (
        <HomeLayout
          frontmatter={frontmatter}
          navItems={navItems}
          currentPath={currentPath}
        >
          {children}
        </HomeLayout>
      );
    case 'page':
      return (
        <PageLayout
          frontmatter={frontmatter}
          navItems={navItems}
          currentPath={currentPath}
        >
          {children}
        </PageLayout>
      );
    case 'doc':
    default:
      return (
        <DocLayout
          frontmatter={frontmatter}
          navItems={navItems}
          sidebarItems={sidebarItems}
          tocItems={tocItems}
          currentPath={currentPath}
        >
          {children}
        </DocLayout>
      );
  }
}

export default Layout; 