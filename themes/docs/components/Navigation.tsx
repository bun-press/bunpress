import React, { useState, useRef } from 'react';
import { cn } from '../../../src/lib/utils';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
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
  logoImage
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
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
            className={navigationMenuTriggerStyle()}
          >
            {item.text}
          </NavigationMenuLink>
        </NavigationMenuItem>
      );
    }
    
    // Item with dropdown
    if (hasDropdown(item)) {
      return (
        <NavigationMenuItem key={index}>
          <NavigationMenuTrigger className={item.active ? 'active' : ''}>
            {item.text}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {item.items!.map((subItem, subIndex) => (
                <li key={subIndex}>
                  <a
                    href={subItem.link}
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      subItem.active && "bg-accent/50"
                    )}
                  >
                    <div className="text-sm font-medium leading-none">{subItem.text}</div>
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
            item.active && "text-primary font-medium"
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
              "block py-2 text-base font-medium transition-colors hover:text-primary",
              item.active && "text-primary"
            )}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            {item.text}
          </a>
        ) : (
          <div className="py-2 text-base font-medium">{item.text}</div>
        )}
        
        {item.items && item.items.length > 0 && (
          <div className="ml-4 mt-2 border-l pl-4">
            {renderMobileItems(item.items)}
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <div className={cn("flex items-center justify-between w-full", className)} ref={navRef}>
      {/* Logo */}
      <a href={logoLink} className="flex items-center gap-2 mr-4">
        {logoImage ? (
          <img src={logoImage} alt={logoText} className="h-8 w-auto" />
        ) : (
          <span className="text-xl font-bold">{logoText}</span>
        )}
      </a>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex">
        <NavigationMenu>
          <NavigationMenuList>
            {processedItems.map((item, index) => renderNavigationItem(item, index))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col space-y-4 py-4">
              {renderMobileItems(processedItems)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 