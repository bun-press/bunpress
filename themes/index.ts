/**
 * BunPress Integrated Themes
 * 
 * This file provides a streamlined API for all BunPress themes.
 */

// Import all themes
import * as docsTheme from './docs';

// Named exports
export { docsTheme };

// Themes collection
export const themes = {
  docs: docsTheme
};

export default themes;
