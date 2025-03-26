/**
 * File system utilities shared across the codebase
 */

import { dirname, join, resolve, extname, relative, sep } from 'path';
import { mkdir, readdir, readFile, writeFile, copyFile as fsCopyFile, existsSync, rmdir, unlink, statSync } from 'fs';
import { stat } from 'fs/promises';
import { minimatch } from './server-utils';
import { 
  ErrorCode, 
  BunPressError, 
  createFileSystemError, 
  tryCatch,
  tryCatchWithCode
} from './error-utils';

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return false;
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  if (!existsSync(dirPath)) return false;
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Creates a directory and its parent directories if they don't exist
 */
export async function createDirectory(dirPath: string): Promise<boolean> {
  return await tryCatch(
    async () => {
      if (!existsSync(dirPath)) {
        await new Promise<void>((resolve, reject) => {
          mkdir(dirPath, { recursive: true }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      return true;
    },
    (error) => {
      throw createFileSystemError(
        ErrorCode.PERMISSION_DENIED,
        `Failed to create directory ${dirPath}`,
        dirPath,
        error
      );
    }
  );
}

/**
 * Get all files in a directory recursively
 */
export async function getAllFiles(dir: string): Promise<string[]> {
  return await tryCatch(
    async () => {
      const dirents = await new Promise<string[]>((resolve, reject) => {
        readdir(dir, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
      
      const files = await Promise.all(
        dirents.map(async (dirent) => {
          const res = resolve(dir, dirent);
          const stats = await stat(res);
          return stats.isDirectory() ? await getAllFiles(res) : res;
        })
      );
      return files.flat();
    },
    (error) => {
      throw createFileSystemError(
        ErrorCode.DIRECTORY_NOT_FOUND,
        `Failed to get files from directory ${dir}`,
        dir,
        error
      );
    }
  );
}

/**
 * Read a file and return its contents as a string
 */
export async function readFileAsString(filePath: string): Promise<string> {
  return await tryCatchWithCode(
    async () => {
      return await Bun.file(filePath).text();
    },
    ErrorCode.FILE_READ_ERROR,
    `Failed to read file ${filePath}`,
    { path: filePath }
  );
}

/**
 * Write a string to a file, creating the directory if it doesn't exist
 */
export async function writeFileString(filePath: string, content: string): Promise<boolean> {
  return await tryCatchWithCode(
    async () => {
      const dir = dirname(filePath);
      await createDirectory(dir);
      
      await new Promise<void>((resolve, reject) => {
        writeFile(filePath, content, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return true;
    },
    ErrorCode.FILE_WRITE_ERROR,
    `Failed to write to file ${filePath}`,
    { path: filePath }
  );
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(source: string, destination: string): Promise<boolean> {
  return await tryCatchWithCode(
    async () => {
      const dir = dirname(destination);
      await createDirectory(dir);
      
      await new Promise<void>((resolve, reject) => {
        fsCopyFile(source, destination, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return true;
    },
    ErrorCode.FILE_COPY_ERROR,
    `Failed to copy file from ${source} to ${destination}`,
    { source, destination }
  );
}

/**
 * Copy a directory recursively
 */
export async function copyDirectory(source: string, destination: string): Promise<boolean> {
  return await tryCatch(
    async () => {
      await createDirectory(destination);
      
      const files = await getAllFiles(source);
      
      for (const file of files) {
        const relativePath = file.slice(source.length);
        const destPath = join(destination, relativePath);
        await copyFile(file, destPath);
      }
      
      return true;
    },
    (error) => {
      throw createFileSystemError(
        ErrorCode.PERMISSION_DENIED,
        `Failed to copy directory from ${source} to ${destination}`,
        source,
        error
      );
    }
  );
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  return await tryCatchWithCode(
    async () => {
      if (existsSync(filePath)) {
        await new Promise<void>((resolve, reject) => {
          unlink(filePath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      return true;
    },
    ErrorCode.FILE_DELETE_ERROR,
    `Failed to delete file ${filePath}`,
    { path: filePath }
  );
}

/**
 * Delete a directory recursively
 */
export async function deleteDirectory(dirPath: string): Promise<boolean> {
  return await tryCatchWithCode(
    async () => {
      if (existsSync(dirPath)) {
        await new Promise<void>((resolve, reject) => {
          rmdir(dirPath, { recursive: true }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      return true;
    },
    ErrorCode.DIRECTORY_DELETE_ERROR,
    `Failed to delete directory ${dirPath}`,
    { path: dirPath }
  );
}

/**
 * Get the extension of a file
 */
export function getExtension(filePath: string): string {
  return extname(filePath).toLowerCase();
}

/**
 * Get file modification time
 */
export function getFileModTime(filePath: string): Date | null {
  try {
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      return stats.isFile() ? stats.mtime : null;
    }
    return null;
  } catch (error) {
    console.error(`Error getting mod time for ${filePath}:`, error);
    return null;
  }
}

/**
 * Get normalized relative path
 */
export function getNormalizedRelativePath(filePath: string, basePath: string): string {
  const relativePath = relative(basePath, filePath);
  return relativePath.split(sep).join('/');
}

/**
 * Extract frontmatter from Markdown content
 */
export function extractFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
  // Default result
  const result = {
    frontmatter: {},
    content,
  };
  
  // Check for frontmatter
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return result;
  }
  
  try {
    // Extract frontmatter content
    const frontmatterContent = match[1];
    
    // Parse frontmatter (simple key-value pairs)
    const frontmatter: Record<string, any> = {};
    const lines = frontmatterContent.split('\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          frontmatter[key] = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          frontmatter[key] = value.slice(1, -1);
        } else if (value === 'true') {
          frontmatter[key] = true;
        } else if (value === 'false') {
          frontmatter[key] = false;
        } else if (!isNaN(Number(value))) {
          frontmatter[key] = Number(value);
        } else {
          frontmatter[key] = value;
        }
      }
    });
    
    // Remove frontmatter from content
    const cleanContent = content.replace(frontmatterRegex, '');
    
    return {
      frontmatter,
      content: cleanContent,
    };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return result;
  }
}

/**
 * Filter files by extension
 */
export function filterFilesByExtension(files: string[], extensions: string | string[]): string[] {
  const exts = Array.isArray(extensions) ? extensions : [extensions];
  return files.filter(file => exts.includes(getExtension(file)));
}

/**
 * Check if a file path matches any of the provided patterns
 */
export function isFileIgnored(filePath: string, ignoredPatterns: string[]): boolean {
  return ignoredPatterns.some(pattern => minimatch(filePath, pattern));
} 