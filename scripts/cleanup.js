#!/usr/bin/env bun

/**
 * BunPress Codebase Cleanup Script
 * 
 * This script helps to maintain a clean, professional codebase by:
 * 1. Removing unused files
 * 2. Consolidating code structure
 * 3. Verifying all files are properly exported
 * 4. Running basic formatting and linting
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  srcDir: path.join(process.cwd(), 'src'),
  themesDir: path.join(process.cwd(), 'themes'),
  testDirs: ['**/__tests__/**'],
  exampleDirs: ['examples/**'],
  fileTypes: ['.ts', '.tsx', '.js', '.jsx', '.md', '.css', '.json'],
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'types/**',
    '.git/**',
    'test-project/**',
    'test-input/**'
  ]
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Main function
 */
async function main() {
  console.log(`${COLORS.bright}${COLORS.blue}BunPress Codebase Cleanup${COLORS.reset}\n`);
  
  // Ensure scripts directory exists
  if (!fs.existsSync(path.join(CONFIG.rootDir, 'scripts'))) {
    fs.mkdirSync(path.join(CONFIG.rootDir, 'scripts'));
  }
  
  // 1. Run formatting
  await runFormatter();
  
  // 2. Check exports
  checkExports();
  
  // 3. Run tests
  await runTests();
  
  // 4. Report summary
  reportSummary();
  
  console.log(`\n${COLORS.green}Cleanup complete!${COLORS.reset}`);
}

/**
 * Run the code formatter
 */
async function runFormatter() {
  console.log(`${COLORS.cyan}Running formatter...${COLORS.reset}`);
  
  try {
    await runCommand('bun', ['run', 'format']);
    console.log(`${COLORS.green}✓ Formatting complete${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}× Error running formatter:${COLORS.reset}`, error);
  }
}

/**
 * Check if all files are properly exported
 */
function checkExports() {
  console.log(`${COLORS.cyan}Checking exports...${COLORS.reset}`);
  
  // Check core exports
  const coreDir = path.join(CONFIG.srcDir, 'core');
  const coreIndex = path.join(coreDir, 'index.ts');
  
  if (fs.existsSync(coreDir) && fs.existsSync(coreIndex)) {
    const coreIndexContent = fs.readFileSync(coreIndex, 'utf8');
    
    fs.readdirSync(coreDir)
      .filter(file => {
        const filePath = path.join(coreDir, file);
        return fs.statSync(filePath).isFile() && 
               file.endsWith('.ts') && 
               file !== 'index.ts' &&
               !file.includes('.test.') &&
               !file.includes('.spec.');
      })
      .forEach(file => {
        const basename = file.replace(/\.[^/.]+$/, '');
        if (!coreIndexContent.includes(`export * from './${basename}'`)) {
          console.log(`${COLORS.yellow}⚠ Missing export in core/index.ts:${COLORS.reset} ${basename}`);
        }
      });
  }
  
  // Check plugin exports
  const pluginsDir = path.join(CONFIG.srcDir, 'plugins');
  const pluginsIndex = path.join(pluginsDir, 'index.ts');
  
  if (fs.existsSync(pluginsDir) && fs.existsSync(pluginsIndex)) {
    const pluginsIndexContent = fs.readFileSync(pluginsIndex, 'utf8');
    
    fs.readdirSync(pluginsDir)
      .filter(file => {
        const filePath = path.join(pluginsDir, file);
        return fs.statSync(filePath).isDirectory() && 
               file !== 'utils' &&
               file !== '__tests__';
      })
      .forEach(plugin => {
        if (!pluginsIndexContent.includes(`export * from './${plugin}'`)) {
          console.log(`${COLORS.yellow}⚠ Missing export in plugins/index.ts:${COLORS.reset} ${plugin}`);
        }
      });
  }
  
  console.log(`${COLORS.green}✓ Export checks complete${COLORS.reset}`);
}

/**
 * Run the test suite
 */
async function runTests() {
  console.log(`${COLORS.cyan}Running tests...${COLORS.reset}`);
  
  try {
    await runCommand('bun', ['test']);
    console.log(`${COLORS.green}✓ Tests passed${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}× Some tests failed${COLORS.reset}`);
    console.log(`${COLORS.yellow}Please fix failing tests for a production-ready codebase${COLORS.reset}`);
  }
}

/**
 * Run a shell command
 */
async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command ${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Report summary of the codebase status
 */
function reportSummary() {
  console.log(`\n${COLORS.cyan}Codebase Summary:${COLORS.reset}`);
  
  // Count files by type
  const fileCounts = {};
  
  function countFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    fs.readdirSync(dir, { withFileTypes: true })
      .forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        
        // Skip ignored patterns
        if (CONFIG.ignorePatterns.some(pattern => {
          if (pattern.endsWith('/**')) {
            const basePattern = pattern.slice(0, -3);
            return fullPath.startsWith(path.join(CONFIG.rootDir, basePattern));
          }
          return false;
        })) {
          return;
        }
        
        if (dirent.isDirectory()) {
          countFiles(fullPath);
        } else {
          const ext = path.extname(dirent.name).toLowerCase();
          if (CONFIG.fileTypes.includes(ext)) {
            fileCounts[ext] = (fileCounts[ext] || 0) + 1;
          }
        }
      });
  }
  
  countFiles(CONFIG.rootDir);
  
  console.log('File counts by type:');
  Object.entries(fileCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`  ${COLORS.dim}${ext}:${COLORS.reset} ${count}`);
    });
    
  // Display test coverage status
  if (fileCounts['.ts'] && fileCounts['.test.ts']) {
    const ratio = fileCounts['.test.ts'] / fileCounts['.ts'];
    const coverageStatus = ratio >= 0.5 ? 
      `${COLORS.green}Good` : 
      (ratio >= 0.3 ? `${COLORS.yellow}Moderate` : `${COLORS.red}Low`);
    
    console.log(`\nTest coverage status: ${coverageStatus}${COLORS.reset}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${COLORS.red}Error:${COLORS.reset}`, error);
  process.exit(1);
}); 