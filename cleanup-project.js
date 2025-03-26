#!/usr/bin/env bun

/**
 * BunPress Project Deep Cleanup Script
 * 
 * This script removes unnecessary files, test directories, and 
 * examples to streamline the project for production use.
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
 * Remove a file or directory
 */
function removeItem(itemPath) {
  if (!fs.existsSync(itemPath)) {
    log.warning(`Path does not exist: ${itemPath}`);
    return;
  }

  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
      log.success(`Removed directory: ${itemPath}`);
    } else {
      fs.unlinkSync(itemPath);
      log.success(`Removed file: ${itemPath}`);
    }
  } catch (error) {
    log.error(`Failed to remove ${itemPath}: ${error.message}`);
  }
}

/**
 * Remove empty directories recursively
 */
function removeEmptyDirs(directory) {
  if (!fs.existsSync(directory)) {
    return false;
  }

  let files = fs.readdirSync(directory);
  if (files.length === 0) {
    fs.rmdirSync(directory);
    log.info(`Removed empty directory: ${directory}`);
    return true;
  }

  let removed = false;
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const subdirRemoved = removeEmptyDirs(fullPath);
      removed = removed || subdirRemoved;
    }
  }

  // Try again after subdirectories might have been removed
  files = fs.readdirSync(directory);
  if (files.length === 0) {
    fs.rmdirSync(directory);
    log.info(`Removed empty directory: ${directory}`);
    return true;
  }

  return removed;
}

// Start cleanup process
log.section('Beginning BunPress deep project cleanup...');

// 1. Remove unused files identified by knip
log.section('Removing unused files identified by static analysis...');
const unusedFiles = [
  'src/core/theme-builder.ts',
  'src/lib/index.ts',
  'src/plugins/image-optimizer/example/bunpress.config.ts'
];

for (const file of unusedFiles) {
  removeItem(path.join(rootDir, file));
}

// 2. Remove test directories
log.section('Removing test directories...');
const testDirs = [
  'test-input',
  'test-project'
];

for (const dir of testDirs) {
  removeItem(path.join(rootDir, dir));
}

// 3. Remove temporary fix directory
log.section('Removing temporary fix directory...');
removeItem(path.join(rootDir, 'fix'));

// 4. Remove examples directory (optional - uncomment if needed)
log.section('Removing examples directory...');
removeItem(path.join(rootDir, 'examples'));

// 5. Remove other unnecessary files
log.section('Removing other unnecessary files...');
const unnecessaryFiles = [
  'bunpress.config.example.ts'
];

for (const file of unnecessaryFiles) {
  removeItem(path.join(rootDir, file));
}

// 6. Remove empty directories
log.section('Removing empty directories...');
removeEmptyDirs(rootDir);

// Final summary
log.section('Deep cleanup complete!');
log.success('The project has been streamlined by removing unnecessary files and directories.');
log.info('Please review the changes and commit them if everything looks good.'); 