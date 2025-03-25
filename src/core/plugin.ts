export interface Plugin {
  name: string;
  options?: Record<string, any>;

  // Content transformation
  transform?: (content: string) => string | Promise<string>;

  // Build lifecycle hooks
  buildStart?: () => void | Promise<void>;
  buildEnd?: () => void | Promise<void>;

  // Development server hooks
  configureServer?: (server: any) => void | Promise<void>;
}

export interface PluginManager {
  plugins: Plugin[];

  addPlugin(plugin: Plugin): void;
  removePlugin(name: string): void;
  getPlugin(name: string): Plugin | undefined;

  // Execute hooks
  executeTransform(content: string): Promise<string>;
  executeBuildStart(): Promise<void>;
  executeBuildEnd(): Promise<void>;
  executeConfigureServer(server: any): Promise<void>;
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
}
