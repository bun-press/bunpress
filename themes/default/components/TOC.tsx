import React, { useState, useEffect } from 'react';
import { cn } from '../../../src/lib/utils';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';

interface TOCItem {
  id: string;
  level: number;
  text: string;
}

interface TOCProps {
  items: TOCItem[];
  minLevel?: number;
  maxLevel?: number;
  className?: string;
  scrollOffset?: number;
}

export function TOC({ 
  items, 
  minLevel = 2, 
  maxLevel = 3, 
  className, 
  scrollOffset = 100 
}: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');
  
  // Filter headings by level
  const filteredItems = items.filter(
    (item) => item.level >= minLevel && item.level <= maxLevel
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${scrollOffset}px 0px -70% 0px`,
        threshold: 0.1,
      }
    );

    // Observe all headings
    filteredItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      // Clean up observer
      filteredItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [filteredItems, scrollOffset]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      
      // Update URL hash without scrolling
      history.pushState(null, '', `#${id}`);
    }
  };

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <Card className={cn("rounded-lg border shadow-sm", className)}>
      <div className="p-4">
        <div className="mb-4 text-sm font-medium">On this page</div>
        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block py-1 text-sm transition-colors",
                  activeId === item.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                  item.level === 2 
                    ? "pl-0" 
                    : item.level === 3 
                      ? "pl-4" 
                      : "pl-6"
                )}
                onClick={(e) => handleClick(e, item.id)}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </Card>
  );
} 