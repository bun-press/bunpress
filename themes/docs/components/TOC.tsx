import React, { useState, useEffect, useRef } from 'react';
import { cn } from "../../../src/lib/utils";

interface TocItem {
  level: number;
  id: string;
  text: string;
}

interface TOCProps {
  items: TocItem[];
  minLevel?: number;
  maxLevel?: number;
  className?: string;
  scrollOffset?: number;
  title?: string;
}

export function TOC({
  items,
  minLevel = 2,
  maxLevel = 3,
  className = '',
  scrollOffset = 100,
  title = 'On This Page'
}: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');
  const observer = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<{[key: string]: IntersectionObserverEntry}>({});
  
  // Filter items by level
  const filteredItems = items.filter(
    item => item.level >= minLevel && item.level <= maxLevel
  );
  
  useEffect(() => {
    // Function to handle section highlighting based on scroll position
    const callback = (entries: IntersectionObserverEntry[]) => {
      // Store all entries in the ref to reference later
      entries.forEach(entry => {
        headingElementsRef.current[entry.target.id] = entry;
      });
      
      // Find the first heading that is currently visible
      const visibleHeadings: IntersectionObserverEntry[] = [];
      Object.keys(headingElementsRef.current).forEach(key => {
        const entry = headingElementsRef.current[key];
        if (entry.isIntersecting) {
          visibleHeadings.push(entry);
        }
      });
      
      // Select the first visible heading or the one with highest intersection ratio
      if (visibleHeadings.length > 0) {
        // Sort by intersection ratio and position
        visibleHeadings.sort((a, b) => {
          // If they're both highly visible, prefer the one that's higher on the page
          if (a.intersectionRatio > 0.8 && b.intersectionRatio > 0.8) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          }
          // Otherwise, prefer the one that's more visible
          return b.intersectionRatio - a.intersectionRatio;
        });
        
        setActiveId(visibleHeadings[0].target.id);
      }
    };
    
    // Setup the observer
    observer.current = new IntersectionObserver(callback, {
      rootMargin: `-${scrollOffset}px 0px -${window.innerHeight - scrollOffset - 100}px 0px`,
      threshold: [0, 0.5, 0.75, 0.9, 1]
    });
    
    // Observe all headings
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter(heading => heading.id);
    
    headingElements.forEach(element => {
      observer.current?.observe(element);
    });
    
    // Cleanup on unmount
    return () => {
      observer.current?.disconnect();
    };
  }, [items, scrollOffset]);
  
  // Handle smooth scrolling when clicking on a TOC item
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    
    const element = document.getElementById(id);
    if (element) {
      // Calculate target position with offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - scrollOffset;
      
      // Smooth scroll to the target
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Set active ID manually since scrolling might not trigger the observer immediately
      setActiveId(id);
      
      // Update URL hash
      window.history.pushState(null, '', `#${id}`);
    }
  };
  
  // Check if there are items to display
  if (filteredItems.length === 0) {
    return null;
  }
  
  return (
    <aside className={cn("animate-in fade-in-50 duration-300", className)}>
      <div className="rounded-lg bg-accent/30 p-5">
        {title && (
          <h2 className="text-sm font-medium text-foreground/80 mb-4 tracking-tight">
            {title}
          </h2>
        )}
        <nav className="relative">
          <ul className="space-y-2.5 text-sm">
            {filteredItems.map((item) => {
              const isActive = activeId === item.id;
              
              // Calculate indentation based on heading level
              const indentLevel = item.level - minLevel;
              
              return (
                <li 
                  key={item.id} 
                  className={cn(
                    "relative transition-colors duration-200",
                    indentLevel > 0 && "text-muted-foreground text-xs"
                  )}
                  style={{ 
                    paddingLeft: `${indentLevel * 12}px`,
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full animate-in slide-in-from-left-1 duration-200"
                    />
                  )}
                  <a 
                    href={`#${item.id}`}
                    className={cn(
                      "inline-block py-1 pl-3 transition-colors hover:text-primary",
                      isActive ? "text-primary font-medium" : "hover:text-primary"
                    )}
                    onClick={(e) => handleClick(e, item.id)}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

// Helper function to extract TOC items from HTML content
export function extractTOC(html: string, minLevel = 1, maxLevel = 6): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  return headings
    .filter(heading => {
      const level = parseInt(heading.tagName.substring(1), 10);
      return level >= minLevel && level <= maxLevel;
    })
    .map(heading => {
      const level = parseInt(heading.tagName.substring(1), 10);
      const id = heading.id || '';
      const text = heading.textContent || '';
      
      return { level, id, text };
    });
}

export default TOC; 