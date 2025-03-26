/**
 * Navigation item for site navigation
 */
export interface NavigationItem {
  title: string;
  href: string;
  items?: NavigationItem[];
  active?: boolean;
  external?: boolean;
}

/**
 * Sidebar item for documentation sidebar
 */
export interface SidebarItem {
  title: string;
  href?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  active?: boolean;
  external?: boolean;
}
