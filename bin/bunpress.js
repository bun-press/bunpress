#!/usr/bin/env bun

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the main BunPress script
const bunpressPath = join(__dirname, '../dist/index.js');

// Forward all arguments to the main script
const args = process.argv.slice(2);

// Use Bun to run the script
const result = spawnSync('bun', ['run', bunpressPath, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});

// Exit with the same code as the child process
process.exit(result.status); 