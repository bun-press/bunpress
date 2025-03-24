#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Get original content
const filePath = path.resolve('./src/index.ts');
const originalContent = fs.readFileSync(filePath, 'utf8');

// Create a modified version that just calls printHelp directly
const modifiedContent = `
import chalk from 'chalk';

function printHelp() {
  console.log(chalk.blue.bold(\`
\${chalk.blue('B')}\${chalk.cyan('u')}\${chalk.green('n')}\${chalk.yellow('P')}\${chalk.red('r')}\${chalk.magenta('e')}\${chalk.blue('s')}\${chalk.cyan('s')} - A modern static site generator built with Bun

\${chalk.white('Usage:')}
  \${chalk.green('bunpress')} \${chalk.yellow('<command>')} \${chalk.gray('[options]')}

\${chalk.white('Commands:')}
  \${chalk.green('init [dir]')}      Initialize a new BunPress project
  \${chalk.green('dev')}             Start the development server
  \${chalk.green('build')}           Build the site for production
  \${chalk.green('help')}            Display this help message
  \${chalk.green('version')}         Display version information

\${chalk.white('Build Options:')}
  \${chalk.yellow('--html')}           Use HTML-first bundling (experimental)
  \${chalk.yellow('--hybrid')}         Process both HTML and markdown (experimental)
  \${chalk.yellow('--minify')}         Minify the output (default in production)
  \${chalk.yellow('--no-minify')}      Disable minification

\${chalk.white('Examples:')}
  \${chalk.green('bunpress init my-site')}     Create a new project in the my-site directory
  \${chalk.green('bunpress dev')}              Start the development server
  \${chalk.green('bunpress build')}            Build the site for production
  \${chalk.green('bunpress build --html')}     Use HTML-first bundling for build
\`));
}

// Just call printHelp directly
console.log("Calling printHelp directly:");
printHelp();
`;

// Write the modified content to a temporary file
const tempFilePath = path.resolve('./temp-help.ts');
fs.writeFileSync(tempFilePath, modifiedContent);

console.log('Running help test script...');

// Execute with bun
exec('bun temp-help.ts', (error, stdout, stderr) => {
  console.log('\n--- OUTPUT ---\n');
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(stdout);
  
  // Clean up
  fs.unlinkSync(tempFilePath);
}); 