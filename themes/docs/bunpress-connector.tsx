
// Re-export the Layout component as default
import DocLayout from './layouts/DocLayout';
import HomeLayout from './layouts/HomeLayout';
import PageLayout from './layouts/PageLayout';

interface BunPressConnectorOptions {
  defaultLayout?: 'doc' | 'page' | 'home';
}

/**
 * BunPress connector for the docs theme
 * 
 * This function creates a BunPress-compatible theme interface
 * to connect the docs theme with the BunPress core
 */
export function createDocsTheme(options: BunPressConnectorOptions = {}) {
  const defaultLayout = options.defaultLayout || 'doc';
  
  /**
   * Default exported function that will be called by BunPress
   */
  return function DocsTheme(props: any) {
    const {
      frontmatter = {},
      content,
      navItems = [],
      sidebarItems = [],
      tocItems = [],
      currentPath = ''
    } = props;
    
    // Determine which layout to use
    const layoutType = frontmatter.layout || defaultLayout;
    
    // Choose the appropriate layout component
    switch (layoutType.toLowerCase()) {
      case 'home':
        return (
          <HomeLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </HomeLayout>
        );
        
      case 'page':
        return (
          <PageLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </PageLayout>
        );
        
      case 'doc':
      default:
        return (
          <DocLayout 
            frontmatter={frontmatter}
            navItems={navItems}
            sidebarItems={sidebarItems}
            tocItems={tocItems}
            currentPath={currentPath}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </DocLayout>
        );
    }
  };
}

// Also export the layout components individually
export {
  DocLayout,
  HomeLayout,
  PageLayout
};

// Default export for the theme
export default createDocsTheme(); 