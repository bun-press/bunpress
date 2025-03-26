export interface Plugin {
  name: string;
  options?: Record<string, any>;

  // Content transformation
  transform?: (content: string) => string | Promise<string>;

  // Content processing
  processContentFile?: (file: any) => void | Promise<void>;

  // Build lifecycle hooks
  buildStart?: () => void | Promise<void>;
  buildEnd?: () => void | Promise<void>;

  // Development server hooks
  configureServer?: (server: any) => void | Promise<void>;

  // Theme system hooks
  registerThemes?: () => void | Promise<void>;

  // i18n hooks
  loadTranslations?: () => void | Promise<void>;

  // Other lifecycle hooks
  onInit?: (config?: any) => void | Promise<void>;
  onBuild?: () => void | Promise<void>;
}

export interface PluginManager {
  plugins: Plugin[];

  addPlugin(plugin: Plugin): void;
  removePlugin(name: string): void;
  getPlugin(name: string): Plugin | undefined;

  // Execute hooks
  executeTransform(content: string): Promise<string>;
  executeProcessContentFile(file: any): Promise<void>;
  executeBuildStart(): Promise<void>;
  executeBuildEnd(): Promise<void>;
  executeConfigureServer(server: any): Promise<void>;
  executeRegisterThemes(): Promise<void>;
  executeLoadTranslations(): Promise<void>;
  executeOnInit(): Promise<void>;
  executeOnBuild(): Promise<void>;
}

export class DefaultPluginManager implements PluginManager {
  plugins: Plugin[] = [];

  addPlugin(plugin: Plugin) {
    this.plugins.push(plugin);
  }

  removePlugin(name: string) {
    this.plugins = this.plugins.filter(p => p.name !== name);
  }

  getPlugin(name: string) {
    return this.plugins.find(p => p.name === name);
  }

  async executeTransform(content: string): Promise<string> {
    let result = content;

    for (const plugin of this.plugins) {
      if (plugin.transform) {
        result = await plugin.transform(result);
      }
    }

    return result;
  }

  async executeProcessContentFile(file: any): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.processContentFile) {
        await plugin.processContentFile(file);
      }
    }
  }

  async executeBuildStart() {
    for (const plugin of this.plugins) {
      if (plugin.buildStart) {
        await plugin.buildStart();
      }
    }
  }

  async executeBuildEnd() {
    for (const plugin of this.plugins) {
      if (plugin.buildEnd) {
        await plugin.buildEnd();
      }
    }
  }

  async executeConfigureServer(server: any) {
    for (const plugin of this.plugins) {
      if (plugin.configureServer) {
        await plugin.configureServer(server);
      }
    }
  }

  async executeRegisterThemes() {
    for (const plugin of this.plugins) {
      if (plugin.registerThemes) {
        await plugin.registerThemes();
      }
    }
  }

  async executeLoadTranslations() {
    for (const plugin of this.plugins) {
      if (plugin.loadTranslations) {
        await plugin.loadTranslations();
      }
    }
  }

  async executeOnInit() {
    for (const plugin of this.plugins) {
      if (plugin.onInit) {
        await plugin.onInit();
      }
    }
  }

  async executeOnBuild() {
    for (const plugin of this.plugins) {
      if (plugin.onBuild) {
        await plugin.onBuild();
      }
    }
  }
}
