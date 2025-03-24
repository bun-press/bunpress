import React from 'react';
import { Header, NavItem } from '../components/Header';
import { Sidebar, SidebarItem } from '../components/Sidebar';
import { TOC } from '../components/TOC';
import { Footer } from '../components/Footer';
import { cn } from '../../../src/lib/utils';
import { ThemeProvider } from 'next-themes';

interface TOCItem {
  id: string;
  level: number;
  text: string;
}

interface DocLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  navItems?: NavItem[];
  sidebarItems?: SidebarItem[];
  tocItems?: TOCItem[];
  editLink?: string;
  lastUpdated?: string | Date;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
  hideTOC?: boolean;
  hideSidebar?: boolean;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function DocLayout({
  children,
  title = 'Documentation',
  navItems = [],
  sidebarItems = [],
  tocItems = [],
  editLink,
  lastUpdated,
  prevPage,
  nextPage,
  hideTOC = false,
  hideSidebar = false,
  hideNav = false,
  hideFooter = false,
}: DocLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        {!hideNav && <Header title={title} items={navItems} />}
        
        <div className="flex flex-1 items-stretch">
          {!hideSidebar && sidebarItems.length > 0 && (
            <div className="hidden md:block border-r">
              <Sidebar items={sidebarItems} className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto" />
            </div>
          )}
          
          <main className="flex-1 px-4 py-8 md:px-8 max-w-full">
            <div className={cn(
              "mx-auto",
              !hideTOC ? "max-w-3xl" : "max-w-4xl"
            )}>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <article className="prose prose-neutral dark:prose-invert max-w-none">
                    {children}
                  </article>
                  
                  {!hideFooter && (
                    <Footer
                      editLink={editLink}
                      lastUpdated={lastUpdated}
                      prev={prevPage}
                      next={nextPage}
                    />
                  )}
                </div>
                
                {/* TOC sidebar */}
                {!hideTOC && tocItems.length > 0 && (
                  <div className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-20">
                      <TOC items={tocItems} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 