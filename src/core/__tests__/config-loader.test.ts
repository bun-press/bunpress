import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { loadConfig, ConfigLoaderOptions } from '../config-loader';
import fs from 'fs';
import path from 'path';

describe('Config Loader', () => {
  const testDir = path.join(process.cwd(), 'test-config');
  const testConfigPath = path.join(testDir, 'bunpress.config.ts');

  // Setup test directory and files
  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a test configuration file with a self-contained structure that doesn't depend on external imports
    const testConfig = `
// Define the BunPressConfig type locally
interface BunPressConfig {
  title: string;
  description: string;
  siteUrl: string;
  pagesDir: string;
  outputDir: string;
  themeConfig?: {
    name: string;
    defaultLayout?: 'doc' | 'page' | 'home';
    options?: Record<string, any>;
  };
  plugins: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
  navigation: Array<{
    title: string;
    href: string;
  }>;
  sidebar: Array<{
    title: string;
    items: Array<{
      title: string;
      href: string;
    }>;
  }>;
}

// Define the configuration directly
const config: BunPressConfig = {
  title: 'Test Config',
  description: 'A test configuration',
  siteUrl: 'https://example.com/test',
  pagesDir: './test-pages',
  outputDir: './test-output',
  themeConfig: {
    name: 'test-theme',
    defaultLayout: 'doc',
    options: {
      primaryColor: '#ff0000'
    }
  },
  plugins: [
    {
      name: 'markdown-it',
      options: {
        html: true,
        linkify: true
      }
    }
  ],
  navigation: [
    { title: 'Home', href: '/' },
    { title: 'About', href: '/about' }
  ],
  sidebar: [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs/introduction' }
      ]
    }
  ]
};

// Export the configuration
export default config;
`;
    fs.writeFileSync(testConfigPath, testConfig);
  });

  // Clean up test files after tests
  afterAll(() => {
    // Remove test directory and files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('loads configuration from specified path', async () => {
    const options: ConfigLoaderOptions = {
      configPath: testConfigPath,
      rootDir: testDir,
    };

    const result = await loadConfig(options);
    const { config, pluginManager } = result;

    // Verify basic config properties
    expect(config.title).toBe('Test Config');
    expect(config.description).toBe('A test configuration');
    expect(config.siteUrl).toBe('https://example.com/test');
    expect(config.pagesDir).toBe('./test-pages');
    expect(config.outputDir).toBe('./test-output');

    // Verify theme config
    expect(config.themeConfig?.name).toBe('test-theme');
    expect(config.themeConfig?.options?.primaryColor).toBe('#ff0000');

    // Verify plugins are loaded
    expect(config.plugins.length).toBe(1);
    expect(config.plugins[0].name).toBe('markdown-it');

    // Verify plugin manager has the plugin
    expect(pluginManager.plugins.length).toBe(1);
    expect(pluginManager.plugins[0].name).toBe('markdown-it');
  });

  test('handles missing configuration file', async () => {
    const options: ConfigLoaderOptions = {
      configPath: path.join(testDir, 'non-existent-config.ts'),
      rootDir: testDir,
    };

    await expect(loadConfig(options)).rejects.toThrow('Failed to load configuration');
  });

  test('uses default configuration path when none specified', async () => {
    // Create a config in the default location for this test
    const defaultConfigPath = path.join(process.cwd(), 'bunpress.config.ts');
    const originalConfig = fs.existsSync(defaultConfigPath)
      ? await Bun.file(defaultConfigPath).text()
      : null;

    // Create a temporary config in the default location
    const tempConfig = `
// Define the BunPressConfig type locally
interface BunPressConfig {
  title: string;
  description: string;
  siteUrl: string;
  pagesDir: string;
  outputDir: string;
  themeConfig?: {
    name: string;
    defaultLayout?: 'doc' | 'page' | 'home';
  };
  plugins: any[];
  navigation: any[];
  sidebar: any[];
}

// Define a simple configuration
const config: BunPressConfig = {
  title: 'Default Config',
  description: 'A default configuration',
  siteUrl: 'https://example.com/default',
  pagesDir: './pages',
  outputDir: './dist',
  themeConfig: {
    name: 'default-theme',
    defaultLayout: 'doc'
  },
  plugins: [],
  navigation: [],
  sidebar: []
};

// Export the configuration
export default config;
`;

    try {
      // Write a temporary config to the default location
      fs.writeFileSync(defaultConfigPath, tempConfig);

      // Load config without specifying path
      const { config } = await loadConfig({});

      // Verify default config was loaded
      expect(config.title).toBe('Default Config');
      expect(config.description).toBe('A default configuration');
    } finally {
      // Restore the original config
      if (originalConfig !== null) {
        fs.writeFileSync(defaultConfigPath, originalConfig);
      } else {
        // If there was no original config, remove the temporary one
        fs.unlinkSync(defaultConfigPath);
      }
    }
  });
});
