/**
 * Logger Utilities for BunPress
 * 
 * This file provides a centralized logging system with configurable log levels,
 * output formatting, and extensibility. It helps reduce duplication of logging
 * code across the codebase and provides consistent logging patterns.
 */

/**
 * Available log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5
}

/**
 * Configuration for the logger
 */
export interface LoggerConfig {
  /**
   * Minimum level to log
   */
  minLevel: LogLevel;

  /**
   * Whether to include timestamps in logs
   */
  timestamps: boolean;

  /**
   * Whether to enable colors in terminal output
   */
  colors: boolean;

  /**
   * Optional namespace for the logger
   */
  namespace?: string;

  /**
   * Custom log handlers for different log levels
   */
  handlers?: Partial<Record<LogLevel, LogHandler>>;

  /**
   * Whether to log to files
   */
  logToFile?: boolean;

  /**
   * Output directory for log files
   */
  logDirectory?: string;
}

/**
 * Log handler function type
 */
export type LogHandler = (message: string, metadata?: Record<string, any>) => void;

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  success(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  createChildLogger(namespace: string): Logger;
}

/**
 * Terminal colors helper
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  timestamps: true,
  colors: true,
};

/**
 * Apply color to a string if colors are enabled
 */
function applyColor(text: string, color: keyof typeof colors, enabled: boolean): string {
  if (!enabled) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Format metadata as a string
 */
function formatMetadata(metadata?: Record<string, any>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  try {
    return ' ' + JSON.stringify(metadata, null, 0);
  } catch (error) {
    return ` {metadata serialization failed: ${error}}`;
  }
}

/**
 * Get timestamp string for logs
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Implementation of the Logger interface
 */
class LoggerImpl implements Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Log a debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a success message
   */
  public success(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.SUCCESS, message, metadata);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   */
  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Set the minimum log level
   */
  public setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Get the current minimum log level
   */
  public getLevel(): LogLevel {
    return this.config.minLevel;
  }

  /**
   * Create a child logger with a nested namespace
   */
  public createChildLogger(namespace: string): Logger {
    const parentNamespace = this.config.namespace ? `${this.config.namespace}:` : '';
    return createLogger({
      ...this.config,
      namespace: `${parentNamespace}${namespace}`,
    });
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (level < this.config.minLevel) {
      return;
    }

    // Format the message with namespace and timestamp
    let formattedMessage = message;
    
    // Add namespace if configured
    if (this.config.namespace) {
      formattedMessage = `[${this.config.namespace}] ${formattedMessage}`;
    }
    
    // Add timestamp if configured
    if (this.config.timestamps) {
      formattedMessage = `${getTimestamp()} ${formattedMessage}`;
    }

    // Add metadata if provided
    formattedMessage += formatMetadata(metadata);

    // Use the appropriate handler
    if (this.config.handlers && this.config.handlers[level]) {
      this.config.handlers[level]!(formattedMessage, metadata);
      return;
    }

    // Default handlers
    switch (level) {
      case LogLevel.DEBUG:
        console.log(applyColor('[DEBUG]', 'gray', this.config.colors), formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(applyColor('[INFO]', 'blue', this.config.colors), formattedMessage);
        break;
      case LogLevel.SUCCESS:
        console.log(applyColor('[SUCCESS]', 'green', this.config.colors), formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(applyColor('[WARN]', 'yellow', this.config.colors), formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(applyColor('[ERROR]', 'red', this.config.colors), formattedMessage);
        break;
    }

    // Implementation of file logging would go here when logToFile is enabled
  }
}

/**
 * Create a logger with custom configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new LoggerImpl(config);
}

/**
 * Default logger instance
 */
let defaultLogger: Logger = createLogger();

/**
 * Set the default logger configuration
 */
export function configureDefaultLogger(config: Partial<LoggerConfig>): void {
  defaultLogger = createLogger(config);
}

/**
 * Get the default logger
 */
export function getLogger(): Logger {
  return defaultLogger;
}

/**
 * Create a logger with a specific namespace
 */
export function getNamespacedLogger(namespace: string): Logger {
  return defaultLogger.createChildLogger(namespace);
} 