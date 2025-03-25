#!/usr/bin/env node

/**
 * Script to run TypeScript type checking with appropriate flags
 * 
 * This script runs TypeScript type checking with flags that suppress
 * unused variable warnings, which are common in JSX files
 */

const { execSync } = require('child_process');

try {
  // Run TypeScript with flags to suppress unused warnings
  const result = execSync(
    'bun tsc --noEmit --skipLibCheck --noUnusedLocals false --noUnusedParameters false',
    { encoding: 'utf8' }
  );
  
  console.log('TypeScript type checking completed successfully');
  process.exit(0);
} catch (error) {
  console.error('TypeScript errors found:');
  console.error(error.stdout);
  process.exit(1);
} 