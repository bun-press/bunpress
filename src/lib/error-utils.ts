/**
 * Error Handling Utilities
 * Provides a centralized system for error creation, formatting, and handling
 */

import { getNamespacedLogger } from './logger-utils';

// Create a namespaced logger for error utils
const logger = getNamespacedLogger('error');

/**
 * Error codes for different categories of errors
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_DELETE_ERROR = 'FILE_DELETE_ERROR',
  FILE_COPY_ERROR = 'FILE_COPY_ERROR',
  FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  DIRECTORY_DELETE_ERROR = 'DIRECTORY_DELETE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Plugin errors
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  
  // Server errors
  SERVER_START_ERROR = 'SERVER_START_ERROR',
  SERVER_STOP_ERROR = 'SERVER_STOP_ERROR',
  
  // Content errors
  CONTENT_PARSE_ERROR = 'CONTENT_PARSE_ERROR',
  CONTENT_RENDER_ERROR = 'CONTENT_RENDER_ERROR',
  
  // Content processing errors (200-299)
  INVALID_MARKDOWN = 200,
  INVALID_FRONTMATTER = 201,
  CONTENT_TRANSFORM_FAILED = 202,
  
  // Theme errors (500-599)
  THEME_LOAD_ERROR = 500,
  THEME_NOT_FOUND = 501,
  LAYOUT_NOT_FOUND = 502,
  COMPONENT_ERROR = 503,
  
  // Configuration errors (600-699)
  CONFIG_VALIDATION_ERROR = 600,
  CONFIG_PARSE_ERROR = 601,
  CONFIG_NOT_FOUND = 602,
  
  // CLI errors (700-799)
  COMMAND_ERROR = 700,
  INVALID_ARGUMENTS = 701,
}

/**
 * Helper function to check if a value is a string or number
 */
function isStringOrNumber(value: any): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Helper function to format a value for display in error messages
 */
function formatValue(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (isStringOrNumber(value)) {
    return String(value);
  }
  
  if (value instanceof Error) {
    return value.message;
  }
  
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[Object]';
  }
}

/**
 * Extended error context
 */
export interface ErrorContext {
  [key: string]: any;
}

/**
 * Structured error with code, context and stack trace
 */
export class BunPressError extends Error {
  readonly code: ErrorCode;
  readonly context?: ErrorContext;
  
  constructor(code: ErrorCode, message: string, context?: ErrorContext) {
    super(message);
    this.name = 'BunPressError';
    this.code = code;
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BunPressError.prototype);
  }
  
  /**
   * Format error for CLI output
   */
  formatForCli(): string {
    return `Error ${this.code}: ${this.message}${this.formatContext()}`;
  }
  
  /**
   * Format error for logging
   */
  formatForLog(): string {
    return `${this.code}: ${this.message}${this.formatContext()}`;
  }
  
  /**
   * Format context as a string
   */
  private formatContext(): string {
    if (!this.context || Object.keys(this.context).length === 0) {
      return '';
    }
    
    return '\nContext: ' + 
      Object.entries(this.context)
        .map(([key, value]) => `\n  ${key}: ${formatValue(value)}`)
        .join('');
  }
}

/**
 * Create a new BunPress error
 */
export function createError(
  code: ErrorCode,
  message: string,
  context?: ErrorContext
): BunPressError {
  return new BunPressError(code, message, context);
}

/**
 * Create and throw a BunPress error
 */
export function throwError(
  code: ErrorCode,
  message: string,
  context?: ErrorContext
): never {
  const error = createError(code, message, context);
  throw error;
}

/**
 * Create a file system specific error
 */
export function createFileSystemError(
  code: ErrorCode,
  message: string,
  path: string,
  originalError?: Error
): BunPressError {
  return createError(code, message, { path, originalError });
}

/**
 * Get a human-readable error message for an error code
 */
export function getErrorDescription(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.UNKNOWN_ERROR:
      return 'An unknown error occurred';
    case ErrorCode.VALIDATION_ERROR:
      return 'Validation failed';
    case ErrorCode.FILE_NOT_FOUND:
      return 'File not found';
    case ErrorCode.FILE_READ_ERROR:
      return 'Failed to read file';
    case ErrorCode.FILE_WRITE_ERROR:
      return 'Failed to write file';
    case ErrorCode.FILE_DELETE_ERROR:
      return 'Failed to delete file';
    case ErrorCode.FILE_COPY_ERROR:
      return 'Failed to copy file';
    case ErrorCode.FILE_ALREADY_EXISTS:
      return 'File already exists';
    case ErrorCode.DIRECTORY_NOT_FOUND:
      return 'Directory not found';
    case ErrorCode.DIRECTORY_DELETE_ERROR:
      return 'Failed to delete directory';
    case ErrorCode.PERMISSION_DENIED:
      return 'Permission denied';
    case ErrorCode.PLUGIN_NOT_FOUND:
      return 'Plugin not found';
    case ErrorCode.PLUGIN_LOAD_ERROR:
      return 'Failed to load plugin';
    case ErrorCode.SERVER_START_ERROR:
      return 'Failed to start server';
    case ErrorCode.SERVER_STOP_ERROR:
      return 'Failed to stop server';
    case ErrorCode.CONTENT_PARSE_ERROR:
      return 'Failed to parse content';
    case ErrorCode.CONTENT_RENDER_ERROR:
      return 'Failed to render content';
    case ErrorCode.INVALID_MARKDOWN:
      return 'Invalid markdown content';
    case ErrorCode.INVALID_FRONTMATTER:
      return 'Invalid frontmatter';
    case ErrorCode.CONTENT_TRANSFORM_FAILED:
      return 'Content transformation failed';
    case ErrorCode.THEME_LOAD_ERROR:
      return 'Failed to load theme';
    case ErrorCode.THEME_NOT_FOUND:
      return 'Theme not found';
    case ErrorCode.LAYOUT_NOT_FOUND:
      return 'Layout not found';
    case ErrorCode.COMPONENT_ERROR:
      return 'Component error';
    case ErrorCode.CONFIG_VALIDATION_ERROR:
      return 'Configuration validation failed';
    case ErrorCode.CONFIG_PARSE_ERROR:
      return 'Failed to parse configuration';
    case ErrorCode.CONFIG_NOT_FOUND:
      return 'Configuration not found';
    case ErrorCode.COMMAND_ERROR:
      return 'Command error';
    case ErrorCode.INVALID_ARGUMENTS:
      return 'Invalid arguments';
    default:
      return `Error code: ${code}`;
  }
}

/**
 * Error handler type
 */
export type ErrorHandler = (error: Error | BunPressError) => void;

/**
 * Global error handler configuration
 */
let globalErrorHandler: ErrorHandler = (error) => {
  if (error instanceof BunPressError) {
    logger.error(error.formatForLog());
  } else {
    logger.error(error.message, { stack: error.stack });
  }
};

/**
 * Set a global error handler
 */
export function setGlobalErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler;
}

/**
 * Get the current global error handler
 */
export function getGlobalErrorHandler(): ErrorHandler {
  return globalErrorHandler;
}

/**
 * Handle an error using the global error handler
 */
export function handleError(error: Error | BunPressError): void {
  globalErrorHandler(error);
}

/**
 * Safely execute a function and catch any errors
 */
export async function tryCatch<T>(
  fn: () => Promise<T> | T,
  onError?: (error: Error | BunPressError) => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error);
    
    if (onError) {
      return await onError(error as Error);
    }
    
    throw error; // Re-throw if no onError handler
  }
}

/**
 * Safely execute a function, convert error to BunPressError, and catch
 */
export async function tryCatchWithCode<T>(
  fn: () => Promise<T> | T,
  errorCode: ErrorCode,
  errorMessage: string,
  context?: ErrorContext,
  onError?: (error: BunPressError) => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    const bunPressError = new BunPressError(
      errorCode,
      `${errorMessage}: ${errorStr}`,
      {
        ...context,
        originalError: errorStr
      }
    );
    
    handleError(bunPressError);
    
    if (onError) {
      return await onError(bunPressError);
    }
    
    throw bunPressError;
  }
}

/**
 * Safely execute a function and catch any errors - synchronous version
 */
export function tryCatchSync<T>(
  fn: () => T,
  onError?: (error: Error | BunPressError) => T
): T {
  try {
    return fn();
  } catch (error) {
    handleError(error as Error);
    
    if (onError) {
      return onError(error as Error);
    }
    
    throw error; // Re-throw if no onError handler
  }
}

/**
 * Safely execute a function, convert error to BunPressError, and catch - synchronous version
 */
export function tryCatchWithCodeSync<T>(
  fn: () => T,
  errorCode: ErrorCode,
  errorMessage: string,
  context?: ErrorContext,
  onError?: (error: BunPressError) => T
): T {
  try {
    return fn();
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    const bunPressError = new BunPressError(
      errorCode,
      `${errorMessage}: ${errorStr}`,
      {
        ...context,
        originalError: errorStr
      }
    );
    
    handleError(bunPressError);
    
    if (onError) {
      return onError(bunPressError);
    }
    
    throw bunPressError;
  }
} 