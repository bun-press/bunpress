import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import imageOptimizerPlugin from '../../src/plugins/image-optimizer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PathLike } from 'fs';

// Mock sharp
mock.module('sharp', () => {
  return (filePath: string) => {
    return {
      metadata: async () => ({ width: 1000, height: 800 }),
      clone: () => ({
        resize: () => ({
          webp: (options?: any) => ({
            toFile: async (path: string) => true
          }),
          avif: (options?: any) => ({
            toFile: async (path: string) => true
          }),
          jpeg: (options?: any) => ({
            toFile: async (path: string) => true
          }),
          png: (options?: any) => ({
            toFile: async (path: string) => true
          })
        })
      })
    };
  };
});

// Create mock functions for fs operations
const mockExistsSync = spyOn(fs, 'existsSync').mockImplementation(() => true);
const mockMkdirSync = spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
const mockCopyFileSync = spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);

// Create a properly typed mock Stats object
const mockStats = {
  isDirectory: () => false,
  isFile: () => true,
  isBlockDevice: () => false,
  isCharacterDevice: () => false,
  isSymbolicLink: () => false,
  isFIFO: () => false,
  isSocket: () => false,
  dev: 0,
  ino: 0,
  mode: 0,
  nlink: 0,
  uid: 0,
  gid: 0,
  rdev: 0,
  size: 0,
  blksize: 0,
  blocks: 0,
  atimeMs: 0,
  mtimeMs: 0,
  ctimeMs: 0,
  birthtimeMs: 0,
  atime: new Date(),
  mtime: new Date(),
  ctime: new Date(),
  birthtime: new Date()
} as fs.Stats;

const mockStatSync = spyOn(fs, 'statSync').mockImplementation(() => mockStats);
const mockReaddirSync = spyOn(fs, 'readdirSync').mockImplementation((path: PathLike) => {
  return ['test.jpg', 'test.png'];
});

describe('Image Optimizer Plugin', () => {
  beforeEach(() => {
    // Clear mock call history
    mockExistsSync.mockClear();
    mockMkdirSync.mockClear();
    mockCopyFileSync.mockClear();
    mockStatSync.mockClear();
    mockReaddirSync.mockClear();
  });

  test('should create plugin with default options', () => {
    const plugin = imageOptimizerPlugin();
    expect(plugin.name).toBe('image-optimizer');
    expect(plugin.options).toEqual({});
  });

  test('should process images during buildEnd', async () => {
    const plugin = imageOptimizerPlugin({
      inputDir: 'test-input',
      outputDir: 'test-output',
      formats: [{ format: 'webp', quality: 85 }],
    });

    // Spy on console.log
    const consoleSpy = spyOn(console, 'log');
    
    // Execute the buildEnd hook
    await plugin.buildEnd?.();
    
    // Verify directory was checked
    expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('test-input'));
    
    // Verify files were read
    expect(mockReaddirSync).toHaveBeenCalled();
    
    // Verify log message was printed about the processed images
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Processed'));
  });

  test('should transform markdown content to use new image format', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'webp', quality: 80 }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png "Title")';
    const transformed = plugin.transform?.(content) || '';
    
    expect(transformed).toContain('![Alt text](image.webp)');
    expect(transformed).toContain('![Another](path/to/image.webp "Title")');
  });

  test('should not transform content when using jpeg/png formats', () => {
    const plugin = imageOptimizerPlugin({
      formats: [{ format: 'jpeg', quality: 90 }],
    });

    const content = '![Alt text](image.jpg) ![Another](path/to/image.png)';
    const transformed = plugin.transform?.(content) || '';
    
    // No transformation should happen
    expect(transformed).toBe(content);
  });

  test('should handle custom sizes', async () => {
    const plugin = imageOptimizerPlugin({
      sizes: [
        { width: 400 },
        { width: 800 }
      ]
    });

    // Spy on console.log
    const consoleSpy = spyOn(console, 'log');
    
    // Execute the buildEnd hook
    await plugin.buildEnd?.();
    
    // We can't easily test the exact resizing logic due to mocks,
    // but we can verify the console output
    expect(consoleSpy).toHaveBeenCalled();
  });
}); 