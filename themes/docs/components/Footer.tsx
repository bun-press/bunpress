import { cn } from "@bunpress/lib/utils";
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Pencil, Clock } from 'lucide-react';
import { Separator } from './ui/separator';

interface FooterLink {
  text: string;
  link: string;
}

interface FooterProps {
  editLink?: string;
  lastUpdated?: string | Date;
  prev?: FooterLink;
  next?: FooterLink;
  className?: string;
  footerLinks?: Array<{
    title: string;
    items: Array<{ text: string; link: string }>;
  }>;
  isFullWidth?: boolean;
}

export function Footer({
  editLink,
  lastUpdated,
  prev,
  next,
  className,
  footerLinks = [],
  isFullWidth = false
}: FooterProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <footer className={cn(
      'space-y-8 animate-in fade-in-50 duration-300', 
      isFullWidth ? 'w-full' : '', 
      className
    )}>
      {/* Previous and Next navigation */}
      {(prev || next) && (
        <nav className="flex flex-col sm:flex-row justify-between gap-4">
          {prev ? (
            <Button 
              variant="outline" 
              className="group flex items-center gap-2 h-auto py-2 transition-all duration-200 hover:border-primary/50" 
              asChild
            >
              <a href={prev.link}>
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Previous</span>
                  <span className="text-sm font-medium">{prev.text}</span>
                </span>
              </a>
            </Button>
          ) : (
            // Empty div for flex layout when no prev link
            <div />
          )}
          
          {next && (
            <Button 
              variant="outline" 
              className="group flex items-center gap-2 h-auto py-2 ml-auto transition-all duration-200 hover:border-primary/50" 
              asChild
            >
              <a href={next.link}>
                <span className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Next</span>
                  <span className="text-sm font-medium">{next.text}</span>
                </span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </Button>
          )}
        </nav>
      )}

      {/* Edit link and last updated */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        {editLink && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-primary transition-colors duration-200"
            asChild
          >
            <a
              href={editLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit this page</span>
            </a>
          </Button>
        )}
        
        {formattedDate && (
          <time className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Last updated on {formattedDate}</span>
          </time>
        )}
      </div>

      {/* Footer links */}
      {footerLinks.length > 0 && (
        <div className="pt-4">
          <Separator className="mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {footerLinks.map((section, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a 
                        href={item.link} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="pt-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} - Powered by <a 
            href="https://bunpress.dev" 
            className="font-medium hover:text-primary transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            BunPress
          </a>
        </p>
      </div>
    </footer>
  );
} 