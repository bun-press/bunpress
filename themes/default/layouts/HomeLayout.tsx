import React from 'react';
import { Header, NavItem } from '../components/Header';
import { Footer } from '../components/Footer';
import { ThemeProvider } from 'next-themes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
  link?: string;
}

interface HeroSection {
  title: string;
  tagline?: string;
  description?: string;
  image?: string;
  actions?: {
    text: string;
    href: string;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  }[];
}

interface HomeLayoutProps {
  children?: React.ReactNode;
  title: string;
  navItems?: NavItem[];
  hero?: HeroSection;
  features?: Feature[];
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function HomeLayout({
  children,
  title,
  navItems = [],
  hero,
  features,
  hideNav = false,
  hideFooter = false,
}: HomeLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        {!hideNav && <Header title={title} items={navItems} />}
        
        <main className="flex-1">
          {/* Hero section */}
          {hero && (
            <section className="py-20 px-4 text-center bg-muted/50 border-b">
              <div className="container mx-auto max-w-5xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  {hero.title}
                </h1>
                {hero.tagline && (
                  <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                    {hero.tagline}
                  </p>
                )}
                {hero.description && (
                  <p className="mb-8 max-w-3xl mx-auto text-lg text-muted-foreground">
                    {hero.description}
                  </p>
                )}
                {hero.actions && hero.actions.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {hero.actions.map((action, i) => (
                      <Button
                        key={i}
                        variant={action.variant || 'default'}
                        size="lg"
                        asChild
                      >
                        <a href={action.href}>{action.text}</a>
                      </Button>
                    ))}
                  </div>
                )}
                {hero.image && (
                  <div className="mt-12">
                    <img
                      src={hero.image}
                      alt={hero.title}
                      className="mx-auto max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Features section */}
          {features && features.length > 0 && (
            <section className="py-20 px-4">
              <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, i) => (
                    <Card key={i}>
                      <CardHeader>
                        {feature.icon && (
                          <div className="mb-4 text-primary">{feature.icon}</div>
                        )}
                        <CardTitle>{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardContent>
                      {feature.link && (
                        <CardFooter>
                          <Button variant="ghost" asChild className="px-0">
                            <a href={feature.link}>
                              Learn more
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </a>
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Custom content */}
          {children && (
            <section className="py-10 px-4">
              <div className="container mx-auto prose prose-neutral dark:prose-invert max-w-3xl">
                {children}
              </div>
            </section>
          )}
        </main>

        {!hideFooter && (
          <div className="container mx-auto px-4 max-w-3xl">
            <Footer />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
} 