import { build } from 'esbuild';
import { readdirSync } from 'fs';

const handlers = readdirSync('src/handlers')
  .filter(f => f.endsWith('.ts'))
  .map(f => `src/handlers/${f}`);

await build({
  entryPoints: handlers,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist/handlers',
  sourcemap: true,
  minify: true,
  external: ['@aws-sdk/*', 'pg-native'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log('Build complete: dist/handlers/');
