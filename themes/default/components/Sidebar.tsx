import React, { useState } from 'react';
import { cn } from '../../../src/lib/utils';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

export interface SidebarItem {
  title: string;
  href?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  active?: boolean;
  external?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

export function Sidebar({ items, className }: SidebarProps) {
  return (
    <aside className={cn("w-full md:w-64 flex-shrink-0", className)}>
      <ScrollArea className="h-full py-6">
        <div className="px-3">
          <nav className="flex flex-col space-y-1">
            {items.map((item, i) => (
              <SidebarGroup key={i} item={item} level={0} />
            ))}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}

interface SidebarGroupProps {
  item: SidebarItem;
  level: number;
}

function SidebarGroup({ item, level }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(!item.collapsed);
  const hasItems = Array.isArray(item.items) && item.items.length > 0;

  const toggleOpen = (e: React.MouseEvent) => {
    if (hasItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const getIndentClass = (level: number) => {
    if (level === 0) return "pl-3";
    if (level === 1) return "pl-6";
    if (level === 2) return "pl-9";
    return `pl-${Math.min(12, level * 3 + 3)}`;
  };

  return (
    <div className="pb-1">
      <div 
        className={cn(
          "flex items-center rounded-md text-sm transition-colors",
          item.active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted",
          hasItems ? "cursor-pointer" : "",
          level === 0 ? "font-medium py-2" : "py-1"
        )}
        onClick={toggleOpen}
      >
        {hasItems ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-1 justify-start w-full",
              getIndentClass(level),
              item.active && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-90" : "")}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.title}
          </Button>
        ) : (
          <a 
            href={item.href} 
            className={cn(
              "flex items-center w-full py-1 px-3 hover:underline",
              getIndentClass(level)
            )}
            {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.title}
          </a>
        )}
      </div>
      
      {hasItems && isOpen && (
        <div className={cn("mt-1", level > 0 && "border-l ml-3")}>
          {item.items!.map((child, j) => (
            <SidebarGroup key={j} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
} 