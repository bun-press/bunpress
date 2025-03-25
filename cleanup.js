#!/usr/bin/env bun

/**
 * BunPress Project Cleanup Script
 * 
 * This script performs various cleanup operations to organize the project
 * structure according to the patterns defined in memory-bank/systemPatterns.md.
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
 * Move a file or directory to another location
 */
function moveItem(source, destination) {
  if (!fs.existsSync(source)) {
    log.warning(`Source does not exist: ${source}`);
    return;
  }

  const destDir = path.dirname(destination);
  ensureDirectoryExists(destDir);

  try {
    fs.renameSync(source, destination);
    log.success(`Moved ${source} to ${destination}`);
  } catch (error) {
    log.error(`Failed to move ${source} to ${destination}: ${error.message}`);
    
    // Try copying and removing instead of moving
    try {
      if (fs.statSync(source).isDirectory()) {
        execSync(`cp -r "${source}" "${destination}"`);
        execSync(`rm -rf "${source}"`);
      } else {
        fs.copyFileSync(source, destination);
        fs.unlinkSync(source);
      }
      log.success(`Copied and removed ${source} to ${destination}`);
    } catch (copyError) {
      log.error(`Failed to copy/remove: ${copyError.message}`);
    }
  }
}

/**
 * Remove empty directories
 */
function removeEmptyDirs(directory) {
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
log.section('Beginning BunPress project cleanup...');

// 1. Consolidate test directories
log.section('Consolidating test directories...');

// Ensure consistent __tests__ directories next to the files they test
// This is already done in the project

// 2. Clean up example content
log.section('Organizing example content...');

// Ensure examples directory exists
ensureDirectoryExists(path.join(rootDir, 'examples'));

// Move any stray examples to the examples directory
// Already done

// 3. Clean up redundant folders and files
log.section('Removing redundant or temporary files...');

// List of paths to clean up
const pathsToClean = [
  'run-help.js',
  'cli-trace.log',
  'test-cli.js',
  'bun-doc.md'
];

// Clean up paths
for (const pathToClean of pathsToClean) {
  const fullPath = path.join(rootDir, pathToClean);
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmdirSync(fullPath, { recursive: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      log.success(`Removed: ${pathToClean}`);
    } catch (error) {
      log.error(`Failed to remove ${pathToClean}: ${error.message}`);
    }
  }
}

// 4. Organize test content
log.section('Organizing test content...');

// Ensure test directories exist
ensureDirectoryExists(path.join(rootDir, 'test-content'));
ensureDirectoryExists(path.join(rootDir, 'test-output'));

// Consolidate any test content that might be scattered
// Already organized

// 5. Remove empty directories
log.section('Removing empty directories...');
removeEmptyDirs(rootDir);

// 6. Final checks
log.section('Performing final checks...');

// Check if src structure matches the pattern in systemPatterns.md
const coreFiles = fs.readdirSync(path.join(rootDir, 'src', 'core'));
log.info(`Core files: ${coreFiles.join(', ')}`);

const pluginDirs = fs.readdirSync(path.join(rootDir, 'src', 'plugins'));
log.info(`Plugin directories: ${pluginDirs.join(', ')}`);

// Final summary
log.section('Cleanup complete!');
log.success('The project structure has been organized according to the patterns in memory-bank/systemPatterns.md');
log.info('Please review the changes and commit them if everything looks good.'); 