import React from 'react';
import { cn } from '../../../src/lib/utils';

export interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

export interface SidebarConfig {
  items?: SidebarItem[];
  autoGenerate?: boolean;
  collapseDepth?: number;
  showActiveAncestors?: boolean;
  persistState?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  currentPath?: string;
  config?: SidebarConfig;
  className?: string;
}

export function Sidebar({ items, currentPath = '', config, className }: SidebarProps) {
  // Get configuration options with defaults
  const {
    collapseDepth = 2,
    showActiveAncestors = true,
    persistState = true
  } = config || {};

  // State for tracking expanded items
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Load expanded state from sessionStorage if persistence is enabled
  React.useEffect(() => {
    if (persistState) {
      const stored = sessionStorage.getItem('sidebar-expanded');
      if (stored) {
        setExpandedItems(new Set(JSON.parse(stored)));
      }
    }
  }, [persistState]);

  // Save expanded state to sessionStorage when it changes
  React.useEffect(() => {
    if (persistState) {
      sessionStorage.setItem('sidebar-expanded', JSON.stringify(Array.from(expandedItems)));
    }
  }, [expandedItems, persistState]);

  // Generate a unique ID for an item based on its text and position
  const getItemId = (item: SidebarItem, path: string[] = []): string => {
    return [...path, item.text].join('/');
  };

  // Check if an item or any of its children is active
  const isItemActive = (item: SidebarItem, path: string[] = []): boolean => {
    if (item.link === currentPath) return true;
    if (item.items) {
      return item.items.some(child => isItemActive(child, [...path, item.text]));
    }
    return false;
  };

  // Toggle expanded state for an item
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Recursively render sidebar items
  const renderItems = (items: SidebarItem[], level: number = 0, path: string[] = []): React.ReactNode => {
    return items.map((item, index) => {
      const itemId = getItemId(item, path);
      const isActive = isItemActive(item, path);
      const hasChildren = item.items && item.items.length > 0;
      const isExpanded = expandedItems.has(itemId);
      const shouldAutoExpand = level < collapseDepth || (showActiveAncestors && isActive);
      const isExpandedOrAuto = isExpanded || shouldAutoExpand;

      return (
        <li key={index} className={cn(
          'sidebar-item',
          `level-${level}`,
          isActive && 'active',
          hasChildren && 'has-children'
        )}>
          <div className="sidebar-item-header">
            {item.link ? (
              <a 
                href={item.link}
                className={cn(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                {item.text}
              </a>
            ) : (
              <span className="sidebar-text">{item.text}</span>
            )}
            {hasChildren && (
              <button
                className={cn(
                  'sidebar-toggle',
                  isExpandedOrAuto && 'expanded'
                )}
                onClick={() => toggleExpanded(itemId)}
                aria-expanded={isExpandedOrAuto}
              >
                <svg
                  className="sidebar-toggle-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6l4 4 4-4"
                  />
                </svg>
              </button>
            )}
          </div>
          {hasChildren && isExpandedOrAuto && (
            <ul className="sidebar-children">
              {renderItems(item.items || [], level + 1, [...path, item.text])}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <nav className={cn('sidebar', className)}>
      <ul className="sidebar-items">
        {renderItems(items)}
      </ul>
    </nav>
  );
}

// Helper function to automatically generate sidebar items from file structure
export function generateSidebarFromFiles(
  files: string[], 
  basePath: string = '/'
): SidebarItem[] {
  const items: SidebarItem[] = [];
  const sections: Record<string, SidebarItem> = {};
  
  // Sort files to ensure proper ordering
  const sortedFiles = [...files].sort();
  
  for (const file of sortedFiles) {
    // Skip special files like _index.md
    if (file.startsWith('_')) continue;
    
    // Remove file extension and split by path segments
    const cleanPath = file.replace(/\.(md|mdx)$/, '');
    const segments = cleanPath.split('/');
    
    // Skip index files - they'll be represented by their parent sections
    if (segments[segments.length - 1] === 'index') continue;
    
    let currentItems = items;
    let currentPath = basePath;
    
    // Process each segment of the path
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLastSegment = i === segments.length - 1;
      
      // Build the path for this segment
      currentPath += segment + (isLastSegment ? '' : '/');
      
      // Format the display text - replace hyphens with spaces and capitalize words
      const displayText = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      
      if (isLastSegment) {
        // Add the file as an item
        currentItems.push({
          text: displayText,
          link: currentPath,
        });
      } else {
        // Check if we already have a section for this path segment
        let section = sections[currentPath];
        
        if (!section) {
          // Create a new section
          section = {
            text: displayText,
            link: currentPath + 'index', // Link to index.md if it exists
            items: [],
            collapsed: true,
          };
          
          currentItems.push(section);
          sections[currentPath] = section;
        }
        
        // Move to the children of this section for the next iteration
        currentItems = section.items!;
      }
    }
  }
  
  return items;
}

export default Sidebar; 