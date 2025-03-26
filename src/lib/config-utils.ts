/**
 * Configuration utilities for centralized configuration management
 * Provides a unified way to handle configuration from various sources
 */

import { join, resolve } from 'path';
import { readFileAsString, writeFileString } from './fs-utils';
import { ErrorCode, createFileSystemError, tryCatch, tryCatchWithCode } from './error-utils';

/**
 * Configuration source types
 */
export enum ConfigSource {
  FILE = 'file',
  ENV = 'env',
  DEFAULT = 'default',
  MEMORY = 'memory'
}

/**
 * Configuration value with metadata
 */
export interface ConfigValue<T = any> {
  /**
   * The actual configuration value
   */
  value: T;
  
  /**
   * Source of the configuration value
   */
  source: ConfigSource;
  
  /**
   * When the value was last updated
   */
  updatedAt: Date;
}

/**
 * Configuration schema field options
 */
export interface SchemaFieldOptions<T = any> {
  /**
   * Field type
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Default value if none is provided
   */
  default?: T;
  
  /**
   * Function to validate the value
   */
  validate?: (value: T) => boolean;
  
  /**
   * Environment variable name to load from
   */
  env?: string;
  
  /**
   * Description of the field
   */
  description?: string;
}

/**
 * Configuration schema definition
 */
export type ConfigSchema = Record<string, SchemaFieldOptions>;

/**
 * Configuration options
 */
export interface ConfigOptions {
  /**
   * Configuration schema
   */
  schema?: ConfigSchema;
  
  /**
   * Path to configuration file
   */
  configPath?: string;
  
  /**
   * Whether to load environment variables
   */
  loadEnv?: boolean;
  
  /**
   * Environment prefix for environment variables (e.g., 'BUNPRESS_')
   */
  envPrefix?: string;
  
  /**
   * Whether to automatically load the configuration file
   */
  autoload?: boolean;
}

/**
 * Configuration manager for centralized configuration handling
 */
export class ConfigManager<T extends Record<string, any> = Record<string, any>> {
  /**
   * The configuration values with metadata
   */
  private values: Map<string, ConfigValue> = new Map();
  
  /**
   * The configuration schema
   */
  private schema?: ConfigSchema;
  
  /**
   * Path to the configuration file
   */
  private configPath: string;
  
  /**
   * Whether to load environment variables
   */
  private loadEnv: boolean;
  
  /**
   * Environment prefix for environment variables
   */
  private envPrefix: string;
  
  /**
   * Create a new configuration manager
   */
  constructor(options: ConfigOptions = {}) {
    this.schema = options.schema;
    this.configPath = options.configPath || join(process.cwd(), 'bunpress.config.json');
    this.loadEnv = options.loadEnv !== undefined ? options.loadEnv : true;
    this.envPrefix = options.envPrefix || 'BUNPRESS_';
    
    // Load defaults from schema
    if (this.schema) {
      this.loadDefaults();
    }
    
    // Autoload config if requested
    if (options.autoload !== false) {
      this.load();
    }
  }
  
  /**
   * Load defaults from schema
   */
  private loadDefaults(): void {
    if (!this.schema) return;
    
    for (const [key, field] of Object.entries(this.schema)) {
      if (field.default !== undefined) {
        this.setInMemory(key, field.default, ConfigSource.DEFAULT);
      }
    }
  }
  
  /**
   * Set a value in memory
   */
  private setInMemory(key: string, value: any, source: ConfigSource): void {
    this.values.set(key, {
      value,
      source,
      updatedAt: new Date()
    });
  }
  
  /**
   * Load configuration from all sources
   */
  public load(): Promise<void> {
    return tryCatch(
      async () => {
        // Load from file first (lowest priority)
        await this.loadFromFile();
        
        // Then load from environment variables (higher priority)
        if (this.loadEnv) {
          this.loadFromEnv();
        }
        
        // Validate if we have a schema
        if (this.schema) {
          this.validate();
        }
      },
      (error) => {
        throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    );
  }
  
  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<void> {
    return await tryCatch(
      async () => {
        try {
          const content = await readFileAsString(this.configPath);
          const fileConfig = JSON.parse(content);
          
          // Add each value to the configuration
          for (const [key, value] of Object.entries(fileConfig)) {
            this.setInMemory(key, value, ConfigSource.FILE);
          }
        } catch (error) {
          // File doesn't exist or is invalid JSON - that's okay
          console.warn(`Config file ${this.configPath} not found or invalid. Using defaults.`);
        }
      },
      (error) => {
        throw new Error(`Failed to load configuration from file: ${error instanceof Error ? error.message : String(error)}`);
      }
    );
  }
  
  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): void {
    if (!this.schema) return;
    
    for (const [key, field] of Object.entries(this.schema)) {
      if (field.env) {
        const envKey = field.env;
        const envValue = process.env[envKey];
        
        if (envValue !== undefined) {
          let parsedValue: any = envValue;
          
          // Parse the value based on the type
          switch (field.type) {
            case 'number':
              parsedValue = Number(envValue);
              break;
            case 'boolean':
              parsedValue = envValue.toLowerCase() === 'true';
              break;
            case 'object':
            case 'array':
              try {
                parsedValue = JSON.parse(envValue);
              } catch (error) {
                console.warn(`Invalid JSON in environment variable ${envKey}: ${envValue}`);
              }
              break;
          }
          
          this.setInMemory(key, parsedValue, ConfigSource.ENV);
        }
      } else if (this.envPrefix) {
        // Check for prefixed environment variable
        const envKey = `${this.envPrefix}${key.toUpperCase()}`;
        const envValue = process.env[envKey];
        
        if (envValue !== undefined) {
          let parsedValue: any = envValue;
          
          // Parse the value based on the type
          switch (field.type) {
            case 'number':
              parsedValue = Number(envValue);
              break;
            case 'boolean':
              parsedValue = envValue.toLowerCase() === 'true';
              break;
            case 'object':
            case 'array':
              try {
                parsedValue = JSON.parse(envValue);
              } catch (error) {
                console.warn(`Invalid JSON in environment variable ${envKey}: ${envValue}`);
              }
              break;
          }
          
          this.setInMemory(key, parsedValue, ConfigSource.ENV);
        }
      }
    }
  }
  
  /**
   * Validate the configuration against the schema
   */
  private validate(): void {
    if (!this.schema) return;
    
    const errors: string[] = [];
    
    for (const [key, field] of Object.entries(this.schema)) {
      const configValue = this.values.get(key);
      
      // Check required fields
      if (field.required && (!configValue || configValue.value === undefined)) {
        errors.push(`Missing required configuration value: ${key}`);
        continue;
      }
      
      // Skip validation if no value
      if (!configValue) continue;
      
      // Validate type
      const value = configValue.value;
      
      switch (field.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Invalid type for ${key}: expected string, got ${typeof value}`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Invalid type for ${key}: expected number, got ${typeof value}`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Invalid type for ${key}: expected boolean, got ${typeof value}`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(`Invalid type for ${key}: expected object, got ${typeof value}`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Invalid type for ${key}: expected array, got ${typeof value}`);
          }
          break;
      }
      
      // Run custom validation if provided
      if (field.validate && value !== undefined) {
        try {
          if (!field.validate(value)) {
            errors.push(`Validation failed for ${key}`);
          }
        } catch (error) {
          errors.push(`Validation error for ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Throw if there are errors
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }
  
  /**
   * Get a configuration value
   * 
   * @param key Configuration key
   * @param defaultValue Default value if not found
   * @returns The configuration value or default
   */
  public get<K extends keyof T>(key: K): T[K];
  public get<V>(key: string, defaultValue: V): V;
  public get<V>(key: string, defaultValue?: V): V | undefined {
    const configValue = this.values.get(String(key));
    return configValue !== undefined ? configValue.value : defaultValue;
  }
  
  /**
   * Set a configuration value
   * 
   * @param key Configuration key
   * @param value Value to set
   */
  public set<K extends keyof T>(key: K, value: T[K]): void {
    this.setInMemory(String(key), value, ConfigSource.MEMORY);
    
    // Validate if we have a schema
    if (this.schema && this.schema[String(key)]) {
      const field = this.schema[String(key)];
      
      // Check type
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (field.type !== valueType) {
        throw new Error(`Invalid type for ${key}: expected ${field.type}, got ${valueType}`);
      }
      
      // Run validation if provided
      if (field.validate && !field.validate(value)) {
        throw new Error(`Validation failed for ${key}`);
      }
    }
  }
  
  /**
   * Check if a configuration key exists
   * 
   * @param key Configuration key
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return this.values.has(key);
  }
  
  /**
   * Get all configuration values
   * 
   * @returns All configuration values
   */
  public getAll(): T {
    const config: Record<string, any> = {};
    
    for (const [key, configValue] of this.values.entries()) {
      config[key] = configValue.value;
    }
    
    return config as T;
  }
  
  /**
   * Get all configuration values with metadata
   * 
   * @returns All configuration values with metadata
   */
  public getAllWithMetadata(): Record<string, ConfigValue> {
    const config: Record<string, ConfigValue> = {};
    
    for (const [key, configValue] of this.values.entries()) {
      config[key] = configValue;
    }
    
    return config;
  }
  
  /**
   * Save configuration to file
   * 
   * @param path Optional path to save to (defaults to configPath)
   */
  public async save(path?: string): Promise<void> {
    const savePath = path || this.configPath;
    
    return await tryCatchWithCode(
      async () => {
        const config = this.getAll();
        const content = JSON.stringify(config, null, 2);
        await writeFileString(savePath, content);
      },
      ErrorCode.FILE_WRITE_ERROR,
      `Failed to save configuration to ${savePath}`,
      { path: savePath }
    );
  }
  
  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.values.clear();
    
    // Load defaults from schema
    if (this.schema) {
      this.loadDefaults();
    }
  }
}

/**
 * Create a typed configuration manager with a schema
 * 
 * @param schema The configuration schema
 * @param options Configuration options
 * @returns A typed configuration manager
 */
export function createConfig<T extends Record<string, any>>(
  schema: ConfigSchema,
  options: Omit<ConfigOptions, 'schema'> = {}
): ConfigManager<T> {
  return new ConfigManager<T>({
    ...options,
    schema
  });
}

/**
 * Load environment variables from .env file
 * 
 * @param path Path to .env file
 */
export async function loadEnvFile(path: string = '.env'): Promise<void> {
  return await tryCatch(
    async () => {
      try {
        const content = await readFileAsString(path);
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip comments and empty lines
          if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
          }
          
          const match = trimmedLine.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            
            // Set environment variable
            process.env[key] = value;
          }
        }
      } catch (error) {
        // File doesn't exist - that's okay
        console.warn(`.env file not found at ${path}. Skipping.`);
      }
    },
    (error) => {
      throw new Error(`Failed to load .env file: ${error instanceof Error ? error.message : String(error)}`);
    }
  );
} 