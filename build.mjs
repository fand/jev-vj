import { build } from 'esbuild';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
export async function buildAssets() {
  await mkdir('dist',{recursive:true});
  await build({entryPoints:['library.js'],bundle:true,format:'esm',outfile:'dist/library.js'});
  await build({entryPoints:['player-renderer.ts'],bundle:true,format:'esm',outfile:'dist/player-renderer.js',sourcemap:true});
  await build({entryPoints:['effects-smoke.ts'],bundle:true,format:'esm',outfile:'dist/effects-smoke.js'});
  await build({entryPoints:['effects/registry.ts'],bundle:true,platform:'node',format:'esm',outfile:'dist/registry.mjs'});
  const {definitions}=await import('./dist/registry.mjs?build='+Date.now());
  await writeFile('effects/controls.json',JSON.stringify(definitions.map(({create,...data})=>data),null,2)+'\n');
  await rm('dist/registry.mjs');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildAssets();
