import { describe, expect, test } from 'bun:test';
import { DefaultPluginManager } from '../plugin';

describe('Plugin System', () => {
  test('adds and removes plugins', () => {
    const manager = new DefaultPluginManager();
    
    const plugin = {
      name: 'test-plugin',
      transform: (content: string) => content,
    };
    
    manager.addPlugin(plugin);
    expect(manager.plugins).toHaveLength(1);
    expect(manager.getPlugin('test-plugin')).toBeDefined();
    
    manager.removePlugin('test-plugin');
    expect(manager.plugins).toHaveLength(0);
    expect(manager.getPlugin('test-plugin')).toBeUndefined();
  });
  
  test('executes transform hooks in order', async () => {
    const manager = new DefaultPluginManager();
    
    const plugin1 = {
      name: 'plugin1',
      transform: (content: string) => content + '1',
    };
    
    const plugin2 = {
      name: 'plugin2',
      transform: (content: string) => content + '2',
    };
    
    manager.addPlugin(plugin1);
    manager.addPlugin(plugin2);
    
    const result = await manager.executeTransform('test');
    expect(result).toBe('test12');
  });
  
  test('executes build lifecycle hooks', async () => {
    const manager = new DefaultPluginManager();
    const buildStartCalls: string[] = [];
    const buildEndCalls: string[] = [];
    
    const plugin = {
      name: 'test-plugin',
      buildStart: async () => {
        buildStartCalls.push('start');
      },
      buildEnd: async () => {
        buildEndCalls.push('end');
      },
    };
    
    manager.addPlugin(plugin);
    
    await manager.executeBuildStart();
    await manager.executeBuildEnd();
    
    expect(buildStartCalls).toEqual(['start']);
    expect(buildEndCalls).toEqual(['end']);
  });
  
  test('executes server configuration hook', async () => {
    const manager = new DefaultPluginManager();
    const serverConfigCalls: string[] = [];
    
    const plugin = {
      name: 'test-plugin',
      configureServer: async (server: any) => {
        serverConfigCalls.push('configured');
      },
    };
    
    manager.addPlugin(plugin);
    
    await manager.executeConfigureServer({});
    
    expect(serverConfigCalls).toEqual(['configured']);
  });
  
  test('handles async transform hooks', async () => {
    const manager = new DefaultPluginManager();
    
    const plugin = {
      name: 'test-plugin',
      transform: async (content: string) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return content + 'async';
      },
    };
    
    manager.addPlugin(plugin);
    
    const result = await manager.executeTransform('test');
    expect(result).toBe('testasync');
  });
}); 