#!/usr/bin/env bun

/**
 * TypeScript type checker script
 * 
 * This script runs the TypeScript compiler in watch mode
 * with specific options to handle unused variables and parameters.
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

// Get command line arguments
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const strict = args.includes('--strict');

// Base TypeScript options
const tsOptions = [
  '--noEmit', 
  '--skipLibCheck',
  '--pretty',
];

// Handle unused variables depending on mode
if (!strict) {
  tsOptions.push('--noUnusedLocals', 'false');
  tsOptions.push('--noUnusedParameters', 'false');
}

// Add watch flag if requested
if (watch) {
  tsOptions.push('--watch');
}

console.log(chalk.blue('🔍 Running TypeScript type checker...'));
console.log(chalk.gray(`Options: ${tsOptions.join(' ')}`));

// Run TypeScript compiler
const tsc = spawn('tsc', tsOptions, { stdio: 'inherit' });

// Handle process termination
process.on('SIGINT', () => {
  tsc.kill();
  process.exit(0);
}); 