import path from 'path';
import { BunPlugin } from 'bun';

/**
 * Creates a Bun plugin to support path aliases
 * This plugin allows using @bunpress/* imports to reference files within the src directory
 *
 * @returns A Bun plugin for path alias resolution
 */
export function createPathAliasPlugin(): BunPlugin {
  return {
    name: 'bunpress-path-aliases',
    setup(build) {
      // Handle @bunpress/* imports
      build.onResolve({ filter: /^@bunpress\// }, args => {
        const pathInSrc = args.path.replace('@bunpress/', '');
        const resolvedPath = path.join(process.cwd(), 'src', pathInSrc);

        return {
          path: resolvedPath,
          namespace: 'file',
        };
      });
    },
  };
}
