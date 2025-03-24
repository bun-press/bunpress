import React, { useState, useEffect } from 'react';

export interface SidebarItem {
  text: string;
  link?: string;
  children?: SidebarItem[];
  collapsed?: boolean;
  active?: boolean;
}

interface SidebarConfig {
  items?: SidebarItem[];
  autoGenerate?: boolean;
  collapseDepth?: number;
  showActiveAncestors?: boolean;
  persistState?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  currentPath: string;
  className?: string;
  sidebarConfig?: SidebarConfig;
}

// Generate a unique id for an item to use in sessionStorage
const getItemId = (item: SidebarItem, parentPath: string = ''): string => {
  const path = item.link || item.text;
  return `${parentPath}/${path}`.replace(/\/+/g, '/');
};

export function Sidebar({
  items,
  currentPath,
  className = '',
  sidebarConfig
}: SidebarProps) {
  // Use config or defaults
  const config = {
    autoGenerate: sidebarConfig?.autoGenerate ?? true,
    collapseDepth: sidebarConfig?.collapseDepth ?? 2,
    showActiveAncestors: sidebarConfig?.showActiveAncestors ?? true,
    persistState: sidebarConfig?.persistState ?? true
  };
  
  // Use provided items or config items if available
  const sidebarItems = sidebarConfig?.items || items;
  
  // Process items to set active state and expand active sections
  const processedItems = React.useMemo(() => {
    return processItems(sidebarItems, currentPath, 1, config, '');
  }, [sidebarItems, currentPath, config]);
  
  return (
    <aside className={`doc-sidebar ${className}`}>
      <div className="doc-sidebar-container">
        <SidebarTree items={processedItems} level={1} persistState={config.persistState} />
      </div>
    </aside>
  );
}

// Get from sessionStorage with a safe fallback
const getFromStorage = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const value = sessionStorage.getItem(`sidebar-${key}`);
    return value === null ? defaultValue : value === 'true';
  } catch (e) {
    console.warn('Error accessing sessionStorage:', e);
    return defaultValue;
  }
};

// Set to sessionStorage with error handling
const setToStorage = (key: string, value: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(`sidebar-${key}`, String(value));
  } catch (e) {
    console.warn('Error writing to sessionStorage:', e);
  }
};

// Helper function to process sidebar items recursively
function processItems(
  items: SidebarItem[], 
  currentPath: string, 
  level: number,
  config: {
    collapseDepth: number;
    showActiveAncestors: boolean;
    persistState: boolean;
  },
  parentPath: string
): SidebarItem[] {
  return items.map(item => {
    // Generate a unique ID for this item
    const itemId = getItemId(item, parentPath);
    
    // Check if this item or any child is active
    const isExactActive = item.link === currentPath;
    const isActive = isExactActive || item.active || false;
    
    // Check if any children are active
    let hasActiveChild = false;
    let processedChildren: SidebarItem[] | undefined = undefined;
    
    if (item.children) {
      processedChildren = processItems(item.children, currentPath, level + 1, config, itemId);
      hasActiveChild = processedChildren.some(child => child.active || child.link === currentPath);
    }
    
    // If state persistence is enabled, check sessionStorage for this item's state
    let persistedState: boolean | null = null;
    if (config.persistState) {
      persistedState = getFromStorage(itemId, true); // Default to collapsed=true if not found
    }
    
    // Determine if this item should be collapsed
    // Priority:
    // 1. Explicitly set in item props
    // 2. Persisted state from sessionStorage (if persistState is enabled)
    // 3. Default logic (active items, active ancestors, depth)
    const defaultCollapsedState = 
      !isActive && 
      !(hasActiveChild && config.showActiveAncestors) &&
      level >= config.collapseDepth;
    
    const shouldBeCollapsed = 
      item.collapsed !== undefined ? item.collapsed :
      persistedState !== null ? persistedState :
      defaultCollapsedState;
    
    return {
      ...item,
      active: isActive || hasActiveChild,
      collapsed: shouldBeCollapsed,
      children: processedChildren,
      // Add an internal property for the item ID
      __id: itemId
    };
  });
}

interface SidebarTreeProps {
  items: (SidebarItem & { __id?: string })[];
  level: number;
  persistState: boolean;
}

function SidebarTree({ items, level, persistState }: SidebarTreeProps) {
  return (
    <ul className={`doc-sidebar-items level-${level}`}>
      {items.map((item, index) => (
        <SidebarItem 
          key={index} 
          item={item} 
          level={level}
          persistState={persistState}
        />
      ))}
    </ul>
  );
}

interface SidebarItemProps {
  item: SidebarItem & { __id?: string };
  level: number;
  persistState: boolean;
}

function SidebarItem({ item, level, persistState }: SidebarItemProps) {
  const [collapsed, setCollapsed] = useState(item.collapsed || false);
  const hasChildren = item.children && item.children.length > 0;
  const itemId = item.__id || getItemId(item);
  
  // When item.collapsed prop changes (usually from parent Sidebar re-rendering),
  // update the local state to match
  useEffect(() => {
    if (item.collapsed !== undefined && item.collapsed !== collapsed) {
      setCollapsed(item.collapsed);
    }
  }, [item.collapsed]);
  
  const toggleCollapse = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      const newState = !collapsed;
      setCollapsed(newState);
      
      // Save to sessionStorage if persistence is enabled
      if (persistState) {
        setToStorage(itemId, newState);
      }
    }
  };
  
  return (
    <li className={`doc-sidebar-item ${item.active ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}>
      <div className="doc-sidebar-item-container">
        {item.link ? (
          <a 
            href={item.link} 
            className={`doc-sidebar-link level-${level}`}
          >
            <span className="doc-sidebar-link-text">{item.text}</span>
            {hasChildren && (
              <button 
                className={`doc-sidebar-toggle ${collapsed ? 'collapsed' : ''}`}
                onClick={toggleCollapse}
                aria-label={collapsed ? 'Expand section' : 'Collapse section'}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="doc-sidebar-toggle-icon"
                >
                  <polyline points={collapsed ? "9 18 15 12 9 6" : "18 15 12 9 6 15"}></polyline>
                </svg>
              </button>
            )}
          </a>
        ) : (
          <div 
            className={`doc-sidebar-heading level-${level} ${item.active ? 'active' : ''}`}
            onClick={hasChildren ? toggleCollapse : undefined}
          >
            <span className="doc-sidebar-heading-text">{item.text}</span>
            {hasChildren && (
              <button 
                className={`doc-sidebar-toggle ${collapsed ? 'collapsed' : ''}`}
                onClick={toggleCollapse}
                aria-label={collapsed ? 'Expand section' : 'Collapse section'}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="doc-sidebar-toggle-icon"
                >
                  <polyline points={collapsed ? "9 18 15 12 9 6" : "18 15 12 9 6 15"}></polyline>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      {hasChildren && !collapsed && (
        <SidebarTree 
          items={item.children as (SidebarItem & { __id?: string })[]} 
          level={level + 1}
          persistState={persistState}
        />
      )}
    </li>
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
            children: [],
            collapsed: true,
          };
          
          currentItems.push(section);
          sections[currentPath] = section;
        }
        
        // Move to the children of this section for the next iteration
        currentItems = section.children!;
      }
    }
  }
  
  return items;
}

export default Sidebar; 