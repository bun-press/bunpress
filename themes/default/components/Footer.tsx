import { cn } from '../../../src/lib/utils';
import { Separator } from '../components/ui/separator';

interface PageNavLink {
  title: string;
  href: string;
}

interface FooterProps {
  editLink?: string;
  lastUpdated?: string | Date;
  prev?: PageNavLink;
  next?: PageNavLink;
  className?: string;
}

export function Footer({
  editLink,
  lastUpdated,
  prev,
  next,
  className
}: FooterProps) {
  // Format last updated date if provided
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <footer className={cn("mt-16", className)}>
      <Separator />
      
      {/* Edit link and last updated */}
      <div className="flex flex-col sm:flex-row justify-between my-8 text-sm text-muted-foreground">
        {editLink && (
          <div className="mb-4 sm:mb-0">
            <a 
              href={editLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit this page on GitHub
            </a>
          </div>
        )}
        {formattedDate && (
          <div>
            <span className="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Last updated: {formattedDate}
            </span>
          </div>
        )}
      </div>

      {/* Previous/Next navigation */}
      {(prev || next) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 mb-8">
          {prev && (
            <a
              href={prev.href}
              className="group flex items-center p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Previous</div>
                <div className="font-medium group-hover:text-primary transition-colors">{prev.title}</div>
              </div>
            </a>
          )}
          {next && (
            <a
              href={next.href}
              className={cn(
                "group flex items-center p-4 rounded-lg border hover:border-primary transition-colors",
                !prev && "md:col-start-2"
              )}
            >
              <div className={cn("flex-grow", next && "text-right")}>
                <div className="text-xs text-muted-foreground mb-1">Next</div>
                <div className="font-medium group-hover:text-primary transition-colors">{next.title}</div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2 text-muted-foreground group-hover:text-primary transition-colors"
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
          )}
        </div>
      )}

      {/* Copyright */}
      <div className="py-6 flex items-center justify-center border-t">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} - Powered by BunPress
        </p>
      </div>
    </footer>
  );
} 