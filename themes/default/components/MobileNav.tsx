import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../../../src/lib/utils';
import { NavItem } from './Header';
import { ThemeToggle } from './ThemeToggle';

interface MobileNavProps {
  items: NavItem[];
  title?: string;
  logo?: string;
}

export function MobileNav({ items, title, logo }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="md:hidden"
          aria-label="Toggle Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide h-5 w-5"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0">
        <div className="px-2">
          <div className="flex items-center space-x-2 mb-4">
            {logo && <img src={logo} alt={title} className="h-6 w-auto" />}
            <span className="font-bold">{title}</span>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-3">
              {items.map((item) => (
                <div key={item.title} className="flex flex-col space-y-3">
                  {item.items && item.items.length > 0 ? (
                    <>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="pl-4 flex flex-col space-y-2">
                        {item.items.map((subItem) => (
                          <a
                            key={subItem.title}
                            href={subItem.href}
                            className={cn(
                              "text-sm hover:text-accent-foreground transition-colors",
                              subItem.active && "text-foreground font-medium"
                            )}
                            {...(subItem.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            onClick={() => setOpen(false)}
                          >
                            {subItem.title}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className={cn(
                        "text-sm hover:text-accent-foreground transition-colors",
                        item.active && "text-foreground font-medium"
                      )}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      onClick={() => setOpen(false)}
                    >
                      {item.title}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-6 px-6 py-2 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Theme</div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 