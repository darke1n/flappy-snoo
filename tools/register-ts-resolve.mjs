import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

/**
 * Node's type stripping requires explicit file extensions, while the app
 * sources use extensionless imports for Vite/TypeScript. This hook lets the
 * built-in test runner resolve `./foo` to `./foo.ts` when needed.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL
    ) {
      const resolved = new URL(specifier, context.parentURL);
      if (!existsSync(fileURLToPath(resolved))) {
        const withExtension = new URL(`${specifier}.ts`, context.parentURL);
        if (existsSync(fileURLToPath(withExtension))) {
          return nextResolve(withExtension.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
