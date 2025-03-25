import React, { useState, useRef } from 'react';
import { cn } from "@bunpress/lib/utils";
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, Search, Moon, Sun, ExternalLink } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu';

export interface NavItem {
  text: string;
  link?: string;
  items?: NavItem[];
  active?: boolean;
  activeMatch?: string;
  external?: boolean;
}

interface NavigationProps {
  items: NavItem[];
  currentPath: string;
  className?: string;
  logoText?: string;
  logoLink?: string;
  logoImage?: string;
  children?: React.ReactNode;
}

// Type for processed items with consistent active state
interface ProcessedNavItem extends NavItem {
  active: boolean;
  items?: ProcessedNavItem[];
}

export function Navigation({
  items,
  currentPath,
  className = '',
  logoText = 'BunPress',
  logoLink = '/',
  logoImage,
  children
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
  // Check for dark mode
  React.useEffect(() => {
    const isDark = 
      document.documentElement.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };
  
  // Process items to mark active ones based on current path
  const processedItems: ProcessedNavItem[] = React.useMemo(() => {
    return items.map(item => {
      const isActive = 
        item.link === currentPath || 
        (item.activeMatch && new RegExp(item.activeMatch).test(currentPath)) ||
        (item.link && currentPath.startsWith(item.link)) ||
        !!item.active;
      
      // Process nested items
      let hasActiveChild = false;
      const processedSubItems = item.items ? item.items.map(subItem => {
        const isSubActive = 
          subItem.link === currentPath || 
          (subItem.activeMatch && new RegExp(subItem.activeMatch).test(currentPath)) ||
          (subItem.link && currentPath.startsWith(subItem.link)) ||
          !!subItem.active;
        
        if (isSubActive) hasActiveChild = true;
        
        return {
          ...subItem,
          active: isSubActive,
          // Explicitly set items to undefined if not present to match ProcessedNavItem
          items: subItem.items ? processItemsRecursively(subItem.items, currentPath) : undefined
        } as ProcessedNavItem;
      }) : undefined;
      
      return {
        ...item,
        active: isActive || hasActiveChild,
        items: processedSubItems,
      };
    });
  }, [items, currentPath]);
  
  // Helper function for recursive processing of nav items
  function processItemsRecursively(items: NavItem[], path: string): ProcessedNavItem[] {
    return items.map(item => {
      const isActive = 
        item.link === path || 
        (item.activeMatch && new RegExp(item.activeMatch).test(path)) ||
        (item.link && path.startsWith(item.link)) ||
        !!item.active;
        
      return {
        ...item,
        active: isActive,
        items: item.items ? processItemsRecursively(item.items, path) : undefined
      };
    });
  }
  
  // Helper function to check if an item has dropdown items
  const hasDropdown = (item: ProcessedNavItem): boolean => {
    return Boolean(item.items && item.items.length > 0);
  };
  
  // Render navigation item
  const renderNavigationItem = (item: ProcessedNavItem, index: number) => {
    // External link
    if (item.external && item.link) {
      return (
        <NavigationMenuItem key={index}>
          <NavigationMenuLink
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              navigationMenuTriggerStyle(),
              "group flex items-center gap-1 transition-colors"
            )}
          >
            {item.text}
            <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </NavigationMenuLink>
        </NavigationMenuItem>
      );
    }
    
    // Item with dropdown
    if (hasDropdown(item)) {
      return (
        <NavigationMenuItem key={index}>
          <NavigationMenuTrigger 
            className={cn(
              "transition-colors",
              item.active && "text-primary font-medium"
            )}
          >
            {item.text}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] animate-in fade-in-50 duration-200">
              {item.items!.map((subItem, subIndex) => (
                <li key={subIndex}>
                  <a
                    href={subItem.link}
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      subItem.active && "bg-accent/50 text-primary font-medium"
                    )}
                  >
                    <div className="text-sm font-medium leading-none">{subItem.text}</div>
                    {subItem.link && subItem.link.endsWith('/') && (
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        Documentation section
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }
    
    // Simple link
    return (
      <NavigationMenuItem key={index}>
        <a
          href={item.link}
          className={cn(
            navigationMenuTriggerStyle(),
            "transition-colors hover:text-primary",
            item.active && "text-primary font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:content-['']"
          )}
        >
          {item.text}
        </a>
      </NavigationMenuItem>
    );
  };
  
  // Render mobile navigation items
  const renderMobileItems = (items: ProcessedNavItem[]) => {
    return items.map((item, index) => (
      <div key={index} className="mb-4">
        {item.link ? (
          <a
            href={item.link}
            className={cn(
              "flex items-center gap-1.5 py-2 text-base font-medium transition-colors hover:text-primary",
              item.active && "text-primary"
            )}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            {item.text}
            {item.external && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
          </a>
        ) : (
          <div className="py-2 text-base font-medium">{item.text}</div>
        )}
        
        {item.items && item.items.length > 0 && (
          <div className="ml-4 mt-2 border-l pl-4 border-border dark:border-border-dark">
            {renderMobileItems(item.items)}
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <div className={cn("flex items-center justify-between w-full", className)} ref={navRef}>
      {/* Logo */}
      <a href={logoLink} className="flex items-center gap-2 mr-4 transition-opacity hover:opacity-80">
        {logoImage ? (
          <img src={logoImage} alt={logoText} className="h-8 w-auto animate-in fade-in-50 duration-300" />
        ) : (
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent animate-in fade-in-50 duration-300">{logoText}</span>
        )}
      </a>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex animate-in fade-in-75 duration-300">
        <NavigationMenu>
          <NavigationMenuList>
            {processedItems.map((item, index) => renderNavigationItem(item, index))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Custom Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Search Button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
        
        {/* Dark Mode Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full" 
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        {/* Custom Children */}
        {children}
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ml-2">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px] animate-in slide-in-from-right duration-300">
            <div className="flex flex-col space-y-4 py-6">
              {renderMobileItems(processedItems)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 