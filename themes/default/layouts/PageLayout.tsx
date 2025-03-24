import React from 'react';
import { Header, NavItem } from '../components/Header';
import { Footer } from '../components/Footer';
import { ThemeProvider } from 'next-themes';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  navItems?: NavItem[];
  editLink?: string;
  lastUpdated?: string | Date;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function PageLayout({
  children,
  title,
  navItems = [],
  editLink,
  lastUpdated,
  prevPage,
  nextPage,
  hideNav = false,
  hideFooter = false,
}: PageLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        {!hideNav && <Header title={title || ''} items={navItems} />}
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mx-auto prose prose-neutral dark:prose-invert max-w-4xl">
            {children}
          </div>
          
          {!hideFooter && (
            <div className="max-w-4xl mx-auto">
              <Footer
                editLink={editLink}
                lastUpdated={lastUpdated}
                prev={prevPage}
                next={nextPage}
              />
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
} 