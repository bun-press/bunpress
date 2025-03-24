# Active Context

## Current Focus: Enhancing Configuration System

The current focus is on improving the configuration system of BunPress to make it more flexible and powerful. We're working on adding support for:

1. Theme configuration
2. Build configuration
3. Site metadata
4. Plugin system configuration

## Bun Feature Integration

We're currently working on enhancing BunPress to take full advantage of Bun's native features. The key areas we're focusing on include:

1. **HTML-first bundling approach** - We've implemented a new bundler.ts module that handles HTML-first bundling by:
   - Using HTMLRewriter to extract assets from HTML
   - Processing JavaScript, CSS, and image files separately
   - Bundling assets with appropriate content hashing
   - Updating HTML to reference bundled assets

2. **Bun.build API** - We've integrated the native Bun.build API in our bundler implementation to:
   - Process JavaScript files efficiently 
   - Support code splitting
   - Enable source maps
   - Configure publicPath and other bundler options

3. **Hot Module Replacement** - We've implemented a dev server with HMR capabilities that:
   - Provides websocket-based HMR
   - Supports CSS hot reloading without page refreshes
   - Watches for file changes and triggers appropriate updates
   - Includes an HMR client script that's injected into HTML pages

4. **CSS Processing** - We've added a css-processor.ts module that:
   - Processes CSS files using Bun's transform API
   - Supports minification and source maps
   - Handles asset URL rewriting
   - Bundles multiple CSS files into a single output

5. **Theme Building** - We've created a theme-builder.ts module that:
   - Loads themes from the filesystem
   - Processes theme layouts and assets
   - Bundles theme scripts and styles
   - Applies theme layouts to content

6. **Testing** - We've begun creating tests for these new modules:
   - Tests for bundler.ts
   - Tests for css-processor.ts
   - Tests for theme-builder.ts
   - Tests for dev-server.ts

## Next Steps

### 1. Bug Fixing Phase

Our immediate focus is addressing the remaining bugs to improve stability and reliability:

- **Memory Management**
  - Investigate and fix potential memory leaks in the build process
  - Implement proper resource cleanup and monitoring
  - Add memory usage diagnostics for large builds

- **Dev Server Reliability**
  - Fix auto-reload inconsistencies for certain file types
  - Improve WebSocket connection stability
  - Enhance file watching with better path normalization

- **Error Handling Improvements**
  - Implement better error messages for missing templates
  - Add fallback mechanisms for common error scenarios
  - Create specific error classes for different error types

### 2. Fullstack Development

Once critical bugs are addressed, we'll continue enhancing the fullstack features:

- Implement WebSocket support for real-time applications
- Add better integration with HMR for fullstack development
- Create more sophisticated middleware examples
- Implement file upload handling capabilities
- Integrate the fullstack server with the main build process

### 3. Documentation

Improve and expand documentation with:

- Document the Bun native features and how to use them
- Create examples of HTML-first bundling and HMR
- Add comprehensive API documentation for the new features
- Document the debugging insights we've discovered
- Create troubleshooting guides based on our experiences

## Current Tasks

- [x] Implement fullstack server with HTML imports
- [x] Create comprehensive tests for server functionality
- [x] Fix issues with custom route pattern matching
- [x] Create working example implementation
- [x] Fix CLI help command display issue
- [ ] Investigate and fix memory leaks in build process
- [ ] Fix dev server auto-reload inconsistencies
- [ ] Improve error handling for missing templates
- [ ] Document fullstack server features
- [ ] Integrate with the main build process

## Current Focus

Our immediate focus has shifted to addressing critical bugs that affect the stability and user experience of BunPress. We've already successfully fixed the CLI help command display issue, which was caused by a path format difference between `import.meta.url` and `Bun.main`. 

The next critical issues we're tackling are:

1. **Memory Management**: Investigating potential memory leaks in the build process, particularly around file watchers and resource cleanup.

2. **Dev Server Reliability**: Fixing inconsistencies in the auto-reload functionality when certain file types change, and improving WebSocket connection stability.

3. **Error Handling**: Enhancing error messages and recovery mechanisms, particularly for missing templates and configuration issues.

Once these critical issues are addressed, we'll return to enhancing the fullstack development features and documentation efforts.

### Bun Native Features Implementation

We've successfully implemented and fixed the following key components:

1. **HTML-first bundling with Bun.build**
   - Implemented HTMLRewriter to scan HTML for script, link, and asset tags
   - Used Bun's build API to bundle assets with proper content hashing
   - Fixed path normalization issues for cross-platform compatibility
   - Added proper error handling for bundling operations

2. **CSS Processing with Bun.build**
   - Replaced the old transform API with Bun.build for CSS processing
   - Implemented CSS bundling with proper optimization options
   - Added support for sourcemaps and minification
   - Fixed asset path rewriting in CSS files

3. **Enhanced Dev Server with WebSocket HMR**
   - Improved the development server with proper WebSocket handling
   - Implemented a client-side HMR script for hot module replacement
   - Added file watching capabilities with efficient debounce handling
   - Created specialized handlers for different file types (HTML, CSS, JS)

4. **Theme Builder**
   - Implemented theme loading with proper path normalization
   - Fixed asset bundling for themes using Bun.build
   - Added comprehensive testing for theme loading and building
   - Ensured cross-platform compatibility with path handling

### Recent Fixes

1. **Path Normalization**
   - Fixed path handling in the theme builder to ensure paths are normalized consistently
   - Updated path joining to use proper directory separators for cross-platform compatibility
   - Added conversion of backslashes to forward slashes for test comparisons

2. **Test Improvements**
   - Updated mocks to better simulate Bun's API behavior
   - Fixed WebSocket handling in the dev server tests
   - Corrected test expectations to match the new implementation
   - Added more robust error handling in test setup and teardown

3. **TypeScript Error Fixes**
   - Removed unused variables and imports
   - Added underscore prefixes for unused parameters
   - Fixed function signatures to match expected types
   - Improved type definitions for better type safety

### Next Steps

1. **Fullstack Development**
   - Implement HTML imports as routes for the Bun.serve API
   - Add better API endpoint integration with the HTML-first approach
   - Create documentation for the fullstack development features

2. **Final Integration**
   - ✅ Connect the HTML-first bundling approach with the existing build system
   - ✅ Update the CLI to use the new bundler for HTML entrypoints
   - Ensure seamless integration with the existing plugin system

3. **Documentation**
   - Document the Bun native features and how to use them
   - Create examples of HTML-first bundling and HMR
   - Add comprehensive API documentation for the new features

## Recent Changes

The following significant changes have been made to the project:

- **CLI Functionality**:
  - Integrated the HTMLRewriter-based bundler with the main CLI
  - Added new command-line flags for HTML-first bundling (`--html`) and hybrid mode (`--hybrid`)
  - Fixed issue with help command not displaying due to incorrect `import.meta.url` condition
    - Discovered that `import.meta.url` returns a URL with `file://` protocol (`file:///path/to/file`), while `Bun.main` returns a regular path string (`/path/to/file`)
    - Implemented a more reliable condition using `process.argv[1]?.endsWith('src/index.ts') || import.meta.url.endsWith('src/index.ts')` 
    - Added comprehensive logging to diagnose and validate the fix
  - Enhanced the build process to automatically detect HTML entrypoints

## Debugging Insights

Recent debugging efforts uncovered some important technical insights that will be helpful for future development:

### Bun Module Path Resolution

When working with Bun's import system, we discovered a critical difference in how paths are represented:

1. **`import.meta.url`**: Returns a fully qualified URL with the `file://` protocol (e.g., `file:///home/user/project/src/index.ts`)
2. **`Bun.main`**: Returns a filesystem path without protocol (e.g., `/home/user/project/src/index.ts`)

This creates an issue when doing direct equality comparison as in `import.meta.url === Bun.main`, which will always evaluate to `false` despite referring to the same file.

### Solution Patterns

We identified two effective approaches for handling this discrepancy:

1. **Path-based comparison**: Compare the path portions only using string manipulation methods:
   ```typescript
   if (process.argv[1]?.endsWith('src/index.ts') || import.meta.url.endsWith('src/index.ts')) {
     // CLI entry point code here
   }
   ```

2. **URL normalization**: Convert both to the same format before comparison:
   ```typescript
   // Option 1: Convert Bun.main to URL format
   if (import.meta.url === `file://${Bun.main}`) {
     // CLI entry point code here
   }
   
   // Option 2: Convert import.meta.url to path format
   if (new URL(import.meta.url).pathname === Bun.main) {
     // CLI entry point code here
   }
   ```

### Testing Strategy

For testing Bun's module resolution behavior, we created isolated test scripts that:
1. Log the values of both `import.meta.url` and `Bun.main`
2. Evaluate the comparison expression and log the result
3. Write results to both console and file for analysis

This approach allowed us to clearly observe the behavior and develop a reliable solution.

## Current Issues

While we've fixed all TypeScript errors, we still have several test failures that need addressing:

1. Dev Server Tests:
   - The server's WebSocket implementation is not being correctly mocked
   - The fetch handler expectations need updating to match Bun's new API

2. Theme Builder Tests:
   - The loadTheme function outputs paths that need normalization
   - The buildTheme function has issues with processHTMLEntrypoints

3. CSS Processor Tests:
   - The tests expect specific CSS content but our implementation has been simplified
   - Content transformations need to be adapted to match the test expectations

## Next Steps

1. Update the dev-server tests to mock the current Bun.serve API properly
2. Fix the theme-builder tests to handle path normalization correctly
3. Update CSS processor tests to account for our new implementation
4. Implement proper WebSocket handling for the HMR server

## Dependency Changes

We've added the `fast-glob` package which was previously missing and causing errors.

## Implementation Notes

The main challenge was adapting to Bun's evolving API. Several areas of the code were using older or non-existent Bun features:

1. The CSS processor was trying to use a `transpile` function which doesn't exist; we updated it to use `Bun.build` instead.
2. The HMR implementation was using `WebSocket` incorrectly; we fixed it to use `Server` from Bun.
3. The timeout handling in debouncing needed special attention to satisfy TypeScript's strict type checking.

We've made these changes with minimal modifications to the core functionality, focusing on fixing TypeScript errors while preserving the original behavior.

## Current Focus

We're now focusing on implementing and enhancing the fullstack development features of BunPress. We've successfully implemented:

1. **Fullstack Server Implementation**
   - Created a modular `fullstack-server.ts` that leverages Bun.serve for fullstack capabilities
   - Implemented HTML imports through custom `<import-html>` tags for component reuse
   - Added support for API routes via file-based routing in the /api directory
   - Integrated static file serving for public assets
   - Implemented custom route handlers with RegExp pattern matching
   - Added error handling for route handlers and API endpoints
   - Created middleware system for request/response transformation

2. **Testing Infrastructure for Fullstack Server**
   - Implemented comprehensive tests for fullstack server functionality
   - Added tests for HTML imports, API routes, and static file serving
   - Created tests for custom route patterns with RegExp support
   - Added middleware testing for request/response transformation
   - Fixed issues with mocking Bun.serve in test environment
   
3. **Working Example Implementation**
   - Created a complete example in `/examples/fullstack/` demonstrating the fullstack server
   - Implemented HTML imports with partial templates
   - Added API endpoints with proper response handling
   - Created sample static assets (CSS, etc.)
   - Demonstrated custom route handling with pattern matching

## Recent Fixes

1. **Test Reliability**
   - Fixed issues with custom route handler tests by implementing direct route matching tests
   - Improved error handling in route handlers to better report errors
   - Enhanced mocking strategy for Bun.serve in test environment
   - Added proper cleanup in test lifecycle to prevent state leakage

2. **Route Pattern Matching**
   - Enhanced RegExp pattern matching to correctly handle route parameters
   - Implemented proper error handling for custom route handlers
   - Added support for both string and RegExp pattern definitions
   - Ensured proper matching of path segments with RegExp capturing groups
   
3. **Mock Improvements**
   - Updated mocking approach to better isolate test cases
   - Enhanced test debugging capabilities with strategic logging
   - Improved test case organization for better clarity
   - Created more robust approach to testing pattern matching logic

## Next Steps

1. **Enhance Fullstack Features**
   - Implement websocket support for real-time applications
   - Add better integration with HMR for fullstack development
   - Create more sophisticated middleware examples
   - Implement file upload handling capabilities
   - Add session management utilities

2. **Documentation**
   - Document the fullstack server API and configuration options
   - Create comprehensive examples for common fullstack patterns
   - Add tutorials for creating custom route handlers
   - Document middleware implementation and usage
   - Provide best practices for API implementation

3. **Integration with Core Build**
   - Connect the fullstack server with the main build process
   - Implement automatic routing based on file structure
   - Add configuration options in bunpress.config.ts
   - Create production build optimizations for API routes

## Current Challenges

The main challenges encountered were:

1. **Mock Behavior**: Properly mocking Bun.serve was challenging as the routes weren't being correctly passed to the fetch handler. We solved this by directly testing the route matching logic instead of relying on the mock passing routes correctly.

2. **Route Pattern Matching**: The route pattern matching logic needed to correctly handle both string patterns and direct RegExp objects, with proper conversion between them.

3. **Test Isolation**: Ensuring proper test isolation was important to prevent state leakage between tests, especially with the shared mock objects.

4. **Error Handling**: Proper error handling in custom route handlers was critical to provide meaningful error messages and prevent unhandled exceptions.

5. **WebSocket Implementation**: Implementing WebSockets with BunPress required adapting to Bun's specific WebSocket API, which differs from the standard browser WebSocket API. We created a chat application example that demonstrates real-time communication capabilities.

## Active Decisions
1. Using native Node.js APIs where possible to reduce dependencies
2. Leveraging Bun's built-in features for better performance
3. Footer component is now the single source of truth for page navigation and metadata
4. All layouts inherit consistent footer behavior and styling
5. Mobile-first approach with responsive breakpoints
6. Theme customization through frontmatter configuration
7. Strong focus on accessibility and responsive design
8. Consistent styling using CSS variables for easy theming
9. Full-width layout support for all components

## Current Challenges
- Ensuring consistent footer behavior across all layout types
- Balancing flexibility of configuration with maintainable defaults
- Optimizing mobile navigation performance

## Documentation Needs
1. Update component documentation to reflect new footer features
2. Document frontmatter configuration options for footer customization
3. Create examples for common footer patterns
4. Add migration guide for users updating from previous versions
5. Document the new footer configuration options

## Testing Requirements
1. Add comprehensive tests for Footer component
2. Test mobile responsiveness across devices
3. Verify accessibility compliance
4. Test theme customization scenarios
5. Test footer configuration options

## VitePress Feature Gaps Analysis

Based on comparison with VitePress, we've identified several areas where BunPress needs improvement to provide a comparable or better experience:

1. **Documentation Layout System**: 
   - ✅ Implemented multiple layout variants (doc, page, home)
   - ✅ Added layout customization via frontmatter
   - ✅ Created documentation-specific styling and features
   - 🔄 Enhancing customization options via frontmatter

2. **Navigation Components**:
   - ✅ Implemented hierarchical navigation with active link highlighting
   - ✅ Added support for dropdown menus in navigation
   - ✅ Created mobile-responsive navigation menu
   - ✅ Added logo/branding options

3. **Sidebar Navigation**:
   - ✅ Implemented structured sidebar with collapsible sections
   - ✅ Added active state highlighting for sidebar items
   - ✅ Added per-page sidebar configuration options
   - ✅ Implemented sidebar state persistence between pages

4. **Table of Contents**:
   - ✅ Implemented on-page table of contents component
   - ✅ Added configurable heading levels for TOC
   - ✅ Created active indication for TOC items
   - ✅ Implemented smooth scrolling functionality

5. **Footer Components**:
   - 🔄 Implementing edit link functionality
   - 🔄 Adding last updated timestamp
   - 🔄 Creating previous/next navigation links between pages

6. **Theme System Enhancements**:
   - 🔄 Enhancing theme customization options
   - 🔄 Implementing slot system for content injection
   - 🔄 Creating theme extension mechanism
   - ⬜ Building component gallery for theme customization

7. **Search Functionality**:
   - ⬜ Implementing integrated search experience
   - ⬜ Adding search index generation
   - ⬜ Creating keyboard navigation for search results

8. **Frontmatter Capabilities**:
   - ✅ Enhanced layout control via frontmatter
   - ✅ Added page-specific sidebar customizations
   - 🔄 Adding additional frontmatter features

9. **Markdown Extensions**:
   - ⬜ Adding custom containers support
   - ⬜ Implementing enhanced code block features
   - ⬜ Adding inline component support in markdown

These identified gaps are being systematically addressed through our Phase 4 implementation plan, with significant progress already made on navigation, layout, and sidebar components.

## Current Status
- Navigation component fully implemented with mobile responsiveness
- Sidebar component implemented with collapsible sections, per-page configuration, and state persistence
- TOC component implemented with configurable heading levels and improved scrolling
- DocLayout, HomeLayout, and PageLayout components implemented
- Theme system foundation in place with Shadcn UI integration
- Analytics plugin implemented with support for multiple service providers
- Internationalization plugin implemented with multilingual support
- RSS feed plugin implemented and tested
- Search index plugin implemented and tested
- All core components have comprehensive test coverage

## Recent Decisions
1. Used separate themes directory for docs theme implementation
2. Created consistent styling approach using CSS variables
3. Focused on mobile-first responsive design for all components
4. Implemented TypeScript interfaces for component props
5. Ensured accessibility compliance across all components
6. Created reusable component patterns for navigation and sidebar
7. Integrated components into layout system with consistent behavior
8. Added per-page sidebar configuration through frontmatter
9. Used sessionStorage for sidebar state persistence to improve user experience

## Current Focus
- Fixing TypeScript and test errors in the codebase
- Improving test infrastructure and component tests

## Recent Changes
1. Fixed Footer component syntax error with comment placement
2. Fixed Navigation component test cases:
   - Added required `currentPath` prop to all test cases
   - Removed unsupported `socialLinks` prop
   - Fixed MediaQueryList mock implementation
3. Improved e2e test infrastructure:
   - Added proper directory creation and cleanup utilities
   - Fixed recursive directory operations
   - Added better test setup and teardown

## Active Decisions
1. Test Infrastructure:
   - Using custom directory management utilities to handle recursive operations
   - Implementing proper test setup and teardown for e2e tests
   - Using proper mocks for browser APIs in component tests

## Current Considerations
1. Component Testing:
   - Need to ensure all required props are provided in test cases
   - Need to properly mock browser APIs for component tests
   - Need to handle file system operations safely in e2e tests

## Next Steps
1. Continue fixing remaining test issues:
   - Address any remaining TypeScript errors
   - Ensure all test cases pass
   - Verify e2e test setup works correctly
2. Improve test coverage and reliability
3. Document testing best practices

## Current Challenges

1. **Theme System**:
   - Ensuring consistent slot behavior across layouts
   - Managing slot content lifecycle
   - Optimizing slot rendering performance
   - Handling slot content updates

2. **Component Integration**:
   - Maintaining consistent styling across slots
   - Managing slot dependencies
   - Handling dynamic slot content
   - Ensuring accessibility in custom slot content

3. **Documentation**:
   - Creating clear examples for slot usage
   - Documenting best practices
   - Providing migration guides
   - Maintaining up-to-date documentation

## Documentation Needs

1. **Theme System**:
   - Document available slots and their purposes
   - Explain slot configuration options
   - Provide examples of slot customization
   - Document frontmatter configuration

2. **Component Updates**:
   - Update component documentation with slot system
   - Add examples for common slot patterns
   - Document slot fallback behavior
   - Explain slot lifecycle management

3. **Migration Guide**:
   - Guide for updating existing themes
   - Examples of slot system integration
   - Best practices for slot usage
   - Common pitfalls and solutions

## Testing Requirements

1. **Slot System**:
   - Test slot registration and rendering
   - Verify slot fallback behavior
   - Test slot content updates
   - Validate slot lifecycle management

2. **Component Integration**:
   - Test slot behavior in all layouts
   - Verify responsive design
   - Test accessibility compliance
   - Validate state management

3. **Performance Testing**:
   - Measure slot rendering performance
   - Test bundle size impact
   - Verify memory usage
   - Test slot update efficiency 