import {build} from 'esbuild';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join, resolve} from 'node:path';
import {ROOT} from '../src/server/common.mjs';

export async function buildAssets() {
  const dist = join(ROOT,'dist');
  await mkdir(dist,{recursive:true});
  for (const [entry,output] of [
    ['src/client/library.js','library.js'],
    ['src/client/player-renderer.ts','player-renderer.js'],
    ['tests/gpu/effects-smoke.ts','effects-smoke.js'],
  ]) {
    await build({absWorkingDir:ROOT,entryPoints:[entry],bundle:true,format:'esm',outfile:join(dist,output),sourcemap:output === 'player-renderer.js'});
  }
  const registry = join(dist,'registry.mjs');
  await build({absWorkingDir:ROOT,entryPoints:['src/effects/registry.ts'],bundle:true,platform:'node',format:'esm',outfile:registry});
  const {definitions} = await import(pathToFileURL(registry).href+'?build='+Date.now());
  await writeFile(join(ROOT,'src/effects/controls.json'),JSON.stringify(definitions.map(({create,...data})=>data),null,2)+'\n');
  await rm(registry);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildAssets();
