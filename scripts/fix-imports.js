#!/usr/bin/env bun

/**
 * Script to fix import paths in theme components
 */

const fs = require('fs');
const path = require('path');

// Directory containing theme components
const COMPONENTS_DIR = 'themes/docs/components';

// Pattern to match imports from src/lib/utils or our attempted relative path
const UTILS_IMPORT_PATTERN = /import\s*\{\s*cn\s*\}\s*from\s*["'](?:..\/..\/..\/src\/lib(?:\/utils)?|src\/lib\/utils)["'];?/;

// Correct import statement that works across the project
const CORRECT_IMPORT = 'import { cn } from "@bunpress/lib/utils";';

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file needs updating
    if (UTILS_IMPORT_PATTERN.test(content)) {
      // Replace the import statement
      const updatedContent = content.replace(UTILS_IMPORT_PATTERN, CORRECT_IMPORT);
      
      // Write the file back
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed imports in ${path.basename(filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

// Process directories recursively
function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Main function
function main() {
  console.log('Starting import fix process...');
  
  // Process the components directory
  if (fs.existsSync(COMPONENTS_DIR)) {
    processDirectory(COMPONENTS_DIR);
  } else {
    console.error(`Components directory not found: ${COMPONENTS_DIR}`);
  }
  
  console.log('Import fixing process completed.');
}

// Run the main function
main(); 