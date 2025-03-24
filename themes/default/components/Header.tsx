import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../components/ui/navigation-menu";
import { cn } from '../../../src/lib/utils';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
  active?: boolean;
}

interface HeaderProps {
  title: string;
  logo?: string;
  items?: NavItem[];
  className?: string;
}

export function Header({ title, logo, items = [], className }: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", 
      className
    )}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            {logo && <img src={logo} alt={title} className="h-6 w-auto" />}
            <span className="font-bold inline-block">{title}</span>
          </a>
        </div>
        
        {items.length > 0 && (
          <>
            <div className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {items.map((item) => (
                    item.items?.length ? (
                      <NavigationMenuItem key={item.title}>
                        <NavigationMenuTrigger className={cn(
                          item.active && "text-foreground font-medium"
                        )}>{item.title}</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items.map((child) => (
                              <li key={child.title}>
                                <NavigationMenuLink asChild>
                                  <a
                                    href={child.href}
                                    className={cn(
                                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                      child.active && "bg-accent text-accent-foreground font-medium"
                                    )}
                                    {...(child.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                  >
                                    <div className="text-sm font-medium leading-none">{child.title}</div>
                                  </a>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    ) : (
                      <NavigationMenuItem key={item.title}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              navigationMenuTriggerStyle(),
                              item.active && "text-foreground font-medium"
                            )}
                            {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          >
                            {item.title}
                          </a>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            <div className="flex flex-1 items-center justify-end space-x-4">
              <div className="flex-1 md:grow-0"></div>
              <ThemeToggle />
              <MobileNav items={items} title={title} logo={logo} />
            </div>
          </>
        )}
      </div>
    </header>
  );
} 