/**
 * Error Handling Utilities
 * Provides a centralized system for error creation, formatting, and handling
 */

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
 * Error context containing additional information
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
    return `[BunPressError-${this.code}] ${this.message}${this.formatContext()}`;
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
 * Format a value for display in error messages
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Factory functions for creating specific error types
 */

/**
 * Create a file system error
 */
export function createFileSystemError(
  code: ErrorCode.FILE_NOT_FOUND | ErrorCode.PERMISSION_DENIED | ErrorCode.FILE_ALREADY_EXISTS | ErrorCode.DIRECTORY_NOT_FOUND,
  message: string,
  filePath: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    filePath,
    originalError: originalError?.message
  });
}

/**
 * Create a content processing error
 */
export function createContentError(
  code: ErrorCode.INVALID_MARKDOWN | ErrorCode.INVALID_FRONTMATTER | ErrorCode.CONTENT_TRANSFORM_FAILED,
  message: string,
  filePath?: string,
  details?: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    filePath,
    details,
    originalError: originalError?.message
  });
}

/**
 * Create a server error
 */
export function createServerError(
  code: ErrorCode.SERVER_START_ERROR | ErrorCode.SERVER_STOP_ERROR,
  message: string,
  details?: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    details,
    originalError: originalError?.message
  });
}

/**
 * Create a plugin error
 */
export function createPluginError(
  code: ErrorCode.PLUGIN_LOAD_ERROR | ErrorCode.PLUGIN_NOT_FOUND,
  message: string,
  pluginName: string,
  details?: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    pluginName,
    details,
    originalError: originalError?.message
  });
}

/**
 * Create a theme error
 */
export function createThemeError(
  code: ErrorCode.THEME_LOAD_ERROR | ErrorCode.THEME_NOT_FOUND | ErrorCode.LAYOUT_NOT_FOUND | ErrorCode.COMPONENT_ERROR,
  message: string,
  themeName: string,
  details?: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    themeName,
    details,
    originalError: originalError?.message
  });
}

/**
 * Create a configuration error
 */
export function createConfigError(
  code: ErrorCode.CONFIG_VALIDATION_ERROR | ErrorCode.CONFIG_PARSE_ERROR | ErrorCode.CONFIG_NOT_FOUND,
  message: string,
  configPath?: string,
  details?: string,
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    configPath,
    details,
    originalError: originalError?.message
  });
}

/**
 * Create a CLI error
 */
export function createCliError(
  code: ErrorCode.COMMAND_ERROR | ErrorCode.INVALID_ARGUMENTS,
  message: string,
  command?: string,
  args?: string[],
  originalError?: Error
): BunPressError {
  return new BunPressError(code, message, {
    command,
    args,
    originalError: originalError?.message
  });
}

/**
 * Error handler type
 */
export type ErrorHandler = (error: Error | BunPressError) => void;

/**
 * Global error handler configuration
 */
let globalErrorHandler: ErrorHandler = (error) => {
  console.error(error instanceof BunPressError ? error.formatForLog() : error);
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
    const bunPressError = new BunPressError(
      errorCode,
      `${errorMessage}: ${(error as Error).message}`,
      {
        ...context,
        originalError: (error as Error).message
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
    const bunPressError = new BunPressError(
      errorCode,
      `${errorMessage}: ${(error as Error).message}`,
      {
        ...context,
        originalError: (error as Error).message
      }
    );
    
    handleError(bunPressError);
    
    if (onError) {
      return onError(bunPressError);
    }
    
    throw bunPressError;
  }
} 