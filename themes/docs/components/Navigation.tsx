import React, { useState, useEffect, useRef } from 'react';

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
  mobileTriggerText?: string;
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
  mobileTriggerText = 'Menu'
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle dropdown toggle
  const toggleDropdown = (text: string) => {
    setActiveDropdown(prev => prev === text ? null : text);
  };
  
  // Helper function to check if an item has dropdown items
  const hasDropdown = (item: ProcessedNavItem): boolean => {
    return Boolean(item.items && item.items.length > 0);
  };
  
  return (
    <nav className={`doc-navigation ${className}`} ref={navRef}>
      {/* Logo */}
      <div className="doc-nav-logo">
        <a href={logoLink}>
          {logoImage ? (
            <img src={logoImage} alt={logoText} />
          ) : (
            logoText
          )}
        </a>
      </div>
      
      {/* Desktop Navigation */}
      <ul className="doc-nav-items desktop">
        {processedItems.map((item, index) => (
          <li 
            key={index} 
            className={`doc-nav-item ${item.active ? 'active' : ''} ${hasDropdown(item) ? 'has-dropdown' : ''}`}
          >
            {item.link ? (
              <a 
                href={item.link} 
                className="doc-nav-link"
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={hasDropdown(item) ? (e) => {
                  e.preventDefault();
                  toggleDropdown(item.text);
                } : undefined}
              >
                {item.text}
                {hasDropdown(item) && (
                  <span className="dropdown-arrow">▼</span>
                )}
              </a>
            ) : (
              <span 
                className="doc-nav-link"
                onClick={() => hasDropdown(item) && toggleDropdown(item.text)}
              >
                {item.text}
                {hasDropdown(item) && (
                  <span className="dropdown-arrow">▼</span>
                )}
              </span>
            )}
            
            {/* Dropdown menu */}
            {hasDropdown(item) && item.items && (
              <ul className={`doc-nav-dropdown ${activeDropdown === item.text ? 'active' : ''}`}>
                {item.items.map((subItem, subIndex) => (
                  <li 
                    key={subIndex} 
                    className={`doc-nav-dropdown-item ${subItem.active ? 'active' : ''}`}
                  >
                    <a 
                      href={subItem.link} 
                      className="doc-nav-dropdown-link"
                      target={subItem.external ? '_blank' : undefined}
                      rel={subItem.external ? 'noopener noreferrer' : undefined}
                    >
                      {subItem.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      
      {/* Mobile Menu Toggle */}
      <button 
        className="doc-nav-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileTriggerText}
      </button>
      
      {/* Mobile Navigation */}
      <div className={`doc-nav-mobile ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="doc-nav-items mobile">
          {processedItems.map((item, index) => (
            <li 
              key={index} 
              className={`doc-nav-item ${item.active ? 'active' : ''}`}
            >
              {item.link ? (
                <a 
                  href={item.link} 
                  className="doc-nav-link"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {item.text}
                </a>
              ) : (
                <span className="doc-nav-link">{item.text}</span>
              )}
              
              {/* Dropdown items in mobile view */}
              {hasDropdown(item) && item.items && (
                <ul className="doc-nav-mobile-sub">
                  {item.items.map((subItem, subIndex) => (
                    <li 
                      key={subIndex} 
                      className={`doc-nav-mobile-sub-item ${subItem.active ? 'active' : ''}`}
                    >
                      <a 
                        href={subItem.link} 
                        className="doc-nav-mobile-sub-link"
                        target={subItem.external ? '_blank' : undefined}
                        rel={subItem.external ? 'noopener noreferrer' : undefined}
                      >
                        {subItem.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
} 