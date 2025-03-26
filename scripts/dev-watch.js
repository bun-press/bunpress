#!/usr/bin/env bun

/**
 * Development Watch Script
 * 
 * This script watches for changes in the source files and:
 * 1. Runs type checking on every save
 * 2. Runs affected tests
 * 3. Provides a summary of errors
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const srcDir = path.join(process.cwd(), 'src');
const testsDir = path.join(process.cwd(), 'src');

// State tracking
let typeCheckProcess = null;
let testProcess = null;
let isRunningTypeCheck = false;
let isRunningTests = false;
let pendingTypeCheck = false;
let pendingTests = false;
let changedFiles = new Set();

// Watch config
const watchOptions = { persistent: true, recursive: true };

// Terminal clearing
function clearTerminal() {
  process.stdout.write('\x1Bc');
}

// File watching
function watchFiles() {
  console.log(chalk.blue('🔍 Watching for file changes...'));
  
  fs.watch(srcDir, watchOptions, (eventType, filename) => {
    if (!filename) return;
    
    // Only watch TypeScript files
    if (!filename.endsWith('.ts') && !filename.endsWith('.tsx')) return;
    
    const fullPath = path.join(srcDir, filename);
    
    // Skip if file doesn't exist (might have been deleted)
    if (!fs.existsSync(fullPath)) return;
    
    console.log(chalk.yellow(`File changed: ${filename}`));
    changedFiles.add(filename);
    
    // Queue type checking
    if (!isRunningTypeCheck) {
      runTypeCheck();
    } else {
      pendingTypeCheck = true;
    }
    
    // Queue tests if it's a test file or if there's a corresponding test file
    if (filename.includes('.test.') || hasCorrespondingTestFile(filename)) {
      if (!isRunningTests) {
        runTests(getTestFilesForChanges());
      } else {
        pendingTests = true;
      }
    }
  });
}

// Check if there's a test file for this source file
function hasCorrespondingTestFile(filename) {
  const baseName = path.basename(filename, path.extname(filename));
  const dirName = path.dirname(path.join(srcDir, filename));
  
  // Check for test file in __tests__ directory
  const testPath1 = path.join(dirName, '__tests__', `${baseName}.test.ts`);
  const testPath2 = path.join(dirName, '__tests__', `${baseName}.test.tsx`);
  
  // Check for test file alongside source file
  const testPath3 = path.join(dirName, `${baseName}.test.ts`);
  const testPath4 = path.join(dirName, `${baseName}.test.tsx`);
  
  return (
    fs.existsSync(testPath1) || 
    fs.existsSync(testPath2) || 
    fs.existsSync(testPath3) || 
    fs.existsSync(testPath4)
  );
}

// Get relevant test files for changed source files
function getTestFilesForChanges() {
  const testFiles = [];
  
  changedFiles.forEach(filename => {
    const baseName = path.basename(filename, path.extname(filename));
    const dirName = path.dirname(path.join(srcDir, filename));
    
    // If it's a test file, add it directly
    if (filename.includes('.test.')) {
      testFiles.push(path.join(dirName, filename));
      return;
    }
    
    // Check for test files in __tests__ directory
    const testPath1 = path.join(dirName, '__tests__', `${baseName}.test.ts`);
    const testPath2 = path.join(dirName, '__tests__', `${baseName}.test.tsx`);
    
    // Check for test files alongside source file
    const testPath3 = path.join(dirName, `${baseName}.test.ts`);
    const testPath4 = path.join(dirName, `${baseName}.test.tsx`);
    
    // Add existing test files
    if (fs.existsSync(testPath1)) testFiles.push(testPath1);
    if (fs.existsSync(testPath2)) testFiles.push(testPath2);
    if (fs.existsSync(testPath3)) testFiles.push(testPath3);
    if (fs.existsSync(testPath4)) testFiles.push(testPath4);
  });
  
  // If no specific test files found, return empty array (will run all tests)
  return testFiles;
}

// Run type checking
function runTypeCheck() {
  console.log(chalk.blue('Running type check...'));
  isRunningTypeCheck = true;
  
  typeCheckProcess = spawn('bun', ['lint'], { stdio: 'pipe' });
  
  let output = '';
  typeCheckProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  typeCheckProcess.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  typeCheckProcess.on('close', (code) => {
    isRunningTypeCheck = false;
    
    if (code === 0) {
      console.log(chalk.green('✅ Type check passed'));
    } else {
      console.log(chalk.red('❌ Type check failed'));
      console.log(output);
    }
    
    // Run pending type check if needed
    if (pendingTypeCheck) {
      pendingTypeCheck = false;
      setTimeout(runTypeCheck, 100);
    }
  });
}

// Run tests
function runTests(testFiles = []) {
  const testCommand = testFiles.length > 0 
    ? ['test', ...testFiles]
    : ['test'];
  
  console.log(chalk.blue(`Running tests: ${testFiles.length > 0 ? testFiles.join(', ') : 'all'}`));
  isRunningTests = true;
  
  testProcess = spawn('bun', testCommand, { stdio: 'pipe' });
  
  let output = '';
  testProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  testProcess.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  testProcess.on('close', (code) => {
    isRunningTests = false;
    
    if (code === 0) {
      console.log(chalk.green('✅ Tests passed'));
    } else {
      console.log(chalk.red('❌ Tests failed'));
      console.log(output);
    }
    
    // Clear changed files after running tests
    changedFiles.clear();
    
    // Run pending tests if needed
    if (pendingTests) {
      pendingTests = false;
      setTimeout(() => runTests(getTestFilesForChanges()), 100);
    }
  });
}

// Initial run
clearTerminal();
console.log(chalk.blue('🚀 Starting development mode with watch...'));
runTypeCheck();
runTests();
watchFiles();

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nStopping watch...'));
  
  if (typeCheckProcess) typeCheckProcess.kill();
  if (testProcess) testProcess.kill();
  
  process.exit(0);
}); 