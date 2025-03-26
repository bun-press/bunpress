import React from 'react';

interface DocLayoutProps {
  children: React.ReactNode;
  frontmatter: any;
  navItems: any;
  sidebarItems: any;
  tocItems: any;
  currentPath: string;
}

export default function DocLayout(props: DocLayoutProps) { 
  return (
    <div className="doc-layout">
      {props.children}
    </div>
  ); 
}
