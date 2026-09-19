import { build } from 'esbuild';

await build({
  entryPoints: {
    upload: 'src/handlers/upload.handler.ts',
    search: 'src/handlers/search.handler.ts',
    document: 'src/handlers/document.handler.ts',
    extract: 'src/handlers/extract.handler.ts',
    chunk: 'src/handlers/chunk.handler.ts',
  },
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  sourcemap: true,
  minify: true,
  external: ['@aws-sdk/*', 'pg-native'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log('Build complete: dist/*.mjs');
