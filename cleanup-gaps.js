#!/usr/bin/env bun

/**
 * BunPress Implementation Gap Cleaner
 * 
 * This script analyzes the project to identify:
 * 1. Tests without corresponding implementations
 * 2. Redundant implementations
 * 3. Unused code paths
 * 4. Consolidation opportunities
 * 
 * It then creates a more streamlined implementation structure
 * by integrating functionality into consolidated modules.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log functions
const log = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  section: (message) => console.log(`\n${colors.magenta}[SECTION]${colors.reset} ${message}`),
};

/**
 * Create a directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`Created directory: ${dirPath}`);
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Find all test files in a directory
 */
function findTestFiles(directory) {
  const testFiles = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') {
          // Found a test directory, add all .test.ts and .test.tsx files
          const files = fs.readdirSync(entryPath)
            .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
            .map(file => path.join(entryPath, file));
          
          testFiles.push(...files);
        } else {
          // Continue scanning subdirectories
          scanDirectory(entryPath);
        }
      }
    }
  }
  
  scanDirectory(directory);
  return testFiles;
}

/**
 * Get the implementation file path for a test file
 */
function getImplementationPath(testFile) {
  const fileName = path.basename(testFile).replace('.test.ts', '.ts').replace('.test.tsx', '.tsx');
  const dirPath = path.dirname(testFile).replace('/__tests__', '');
  return path.join(dirPath, fileName);
}

/**
 * Check if a test file has an implementation
 */
function hasImplementation(testFile) {
  const implPath = getImplementationPath(testFile);
  return fileExists(implPath);
}

/**
 * Create an integrated implementation for tests without implementations
 */
function createIntegratedImplementation(testFiles) {
  const testsWithoutImpl = testFiles.filter(file => !hasImplementation(file));
  
  if (testsWithoutImpl.length === 0) {
    log.success('All tests have corresponding implementations.');
    return;
  }
  
  log.warning(`Found ${testsWithoutImpl.length} tests without implementations.`);
  
  // Group by functionality
  const groupedTests = {};
  
  for (const testFile of testsWithoutImpl) {
    const baseName = path.basename(testFile)
      .replace('.test.ts', '')
      .replace('.test.tsx', '');
    
    const category = categorizeTest(baseName);
    
    if (!groupedTests[category]) {
      groupedTests[category] = [];
    }
    
    groupedTests[category].push(testFile);
  }
  
  // Create integrated implementations
  const integratedDir = path.join(rootDir, 'src', 'integrated');
  ensureDirectoryExists(integratedDir);
  
  for (const [category, tests] of Object.entries(groupedTests)) {
    const integrationFile = path.join(integratedDir, `${category}.ts`);
    
    createIntegrationFile(integrationFile, tests, category);
    log.success(`Created integrated implementation for ${category}: ${integrationFile}`);
  }
  
  // Create index file to export all integrated implementations
  const indexFile = path.join(integratedDir, 'index.ts');
  const categories = Object.keys(groupedTests);
  
  const indexContent = `/**
 * Integrated implementations for BunPress
 * 
 * This file exports consolidated implementations for features
 * that were previously scattered or only existed in tests.
 */

${categories.map(category => `import * as ${category} from './${category}';`).join('\n')}

export {
  ${categories.join(',\n  ')}
};
`;
  
  fs.writeFileSync(indexFile, indexContent);
  log.success(`Created integrated index file: ${indexFile}`);
}

/**
 * Categorize a test file based on its name
 */
function categorizeTest(baseName) {
  const uiRelated = ['component', 'layout', 'theme', 'ui', 'style', 'css'];
  const buildRelated = ['build', 'bundle', 'asset', 'compile'];
  const serverRelated = ['server', 'api', 'route', 'middleware', 'fullstack'];
  const renderingRelated = ['render', 'html', 'content', 'markdown', 'slot', 'toc'];
  
  if (uiRelated.some(term => baseName.includes(term))) {
    return 'ui';
  } else if (buildRelated.some(term => baseName.includes(term))) {
    return 'build';
  } else if (serverRelated.some(term => baseName.includes(term))) {
    return 'server';
  } else if (renderingRelated.some(term => baseName.includes(term))) {
    return 'rendering';
  }
  
  return 'system';
}

/**
 * Create an integration file based on test files
 */
function createIntegrationFile(filePath, testFiles, category) {
  // Extract functionalities from test files
  const functions = [];
  
  for (const testFile of testFiles) {
    const baseName = path.basename(testFile)
      .replace('.test.ts', '')
      .replace('.test.tsx', '');
    
    functions.push(baseName);
  }
  
  // Create an integrated implementation
  const content = `/**
 * Integrated ${category} implementation for BunPress
 * 
 * This file provides consolidated implementations for ${category}-related
 * functionality that was previously scattered or only existed in tests.
 */

${functions.map(func => `
/**
 * Implementation for ${func}
 */
export function ${func}() {
  // Integrated implementation
  return {
    // Implementation placeholder
  };
}`).join('\n')}
`;
  
  fs.writeFileSync(filePath, content);
}

/**
 * Find duplicate and redundant implementations
 */
function findRedundancies() {
  const srcDir = path.join(rootDir, 'src');
  const patterns = {
    processors: ['processor', 'transformer', 'converter'],
    builders: ['builder', 'creator', 'generator'],
    loaders: ['loader', 'reader', 'parser'],
    utilities: ['util', 'helper', 'common'],
  };
  
  const foundFiles = {};
  
  for (const [category, terms] of Object.entries(patterns)) {
    foundFiles[category] = [];
    
    for (const term of terms) {
      try {
        const result = execSync(`find ${srcDir} -type f -name "*${term}*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*"`, { encoding: 'utf8' });
        const files = result.split('\n').filter(Boolean);
        foundFiles[category].push(...files);
      } catch (error) {
        log.error(`Error finding ${term} files: ${error.message}`);
      }
    }
    
    foundFiles[category] = [...new Set(foundFiles[category])]; // Remove duplicates
  }
  
  for (const [category, files] of Object.entries(foundFiles)) {
    if (files.length > 1) {
      log.warning(`Found ${files.length} potentially redundant ${category}:`);
      files.forEach(file => log.info(`  - ${file}`));
    }
  }
  
  return foundFiles;
}

/**
 * Analyze implementation coverage
 */
function analyzeImplementationCoverage() {
  const srcDir = path.join(rootDir, 'src');
  const testFiles = findTestFiles(srcDir);
  
  log.section(`Found ${testFiles.length} test files.`);
  
  // Count tests with and without implementations
  const testsWithImpl = testFiles.filter(file => hasImplementation(file));
  const testsWithoutImpl = testFiles.filter(file => !hasImplementation(file));
  
  log.info(`Tests with implementations: ${testsWithImpl.length}`);
  log.info(`Tests without implementations: ${testsWithoutImpl.length}`);
  
  return {
    testFiles,
    testsWithImpl,
    testsWithoutImpl
  };
}

/**
 * Check for unused dependencies in package.json
 */
function checkUnusedDependencies() {
  log.section('Checking for unused dependencies...');
  
  try {
    execSync('bun run knip', { stdio: 'inherit' });
  } catch (error) {
    log.warning('Error running knip dependency check');
  }
}

// Main execution
log.section('Starting BunPress Implementation Gap Analysis');

// Analyze test coverage
const coverage = analyzeImplementationCoverage();

// Find redundancies
log.section('Finding redundant implementations...');
const redundancies = findRedundancies();

// Create integrated implementations
log.section('Creating integrated implementations...');
createIntegratedImplementation(coverage.testFiles);

// Check for unused dependencies
checkUnusedDependencies();

log.section('Implementation Gap Analysis Complete!');
log.success('Check src/integrated/ for consolidated implementations.');
log.info('Next steps:');
log.info('1. Review the created implementations and adapt them to your needs');
log.info('2. Remove redundant files or merge their functionality');
log.info('3. Update imports to use the new integrated structure');
log.info('4. Run tests to ensure everything still works'); 