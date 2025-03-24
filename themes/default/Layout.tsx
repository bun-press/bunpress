import React from 'react';
import { ThemeProvider } from 'next-themes';
import { cn } from '../../src/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Layout({ children, title, description }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <a href="/" className="text-xl font-bold">
                BunPress
              </a>
              <div className="flex items-center space-x-4">
                <a href="/" className="hover:text-primary">
                  Home
                </a>
                <a href="/docs" className="hover:text-primary">
                  Docs
                </a>
              </div>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <article className="prose prose-lg dark:prose-invert mx-auto">
            {children}
          </article>
        </main>

        <footer className="border-t">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-muted-foreground">
              &copy; {new Date().getFullYear()} - Powered by BunPress
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
} 