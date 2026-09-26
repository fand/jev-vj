import {loadEnvFile} from 'node:process';
import {existsSync, watch} from 'node:fs';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import {ROOT} from '../src/server/common.mjs';
if (existsSync(join(ROOT,'.env'))) loadEnvFile(join(ROOT,'.env'));
const {values} = parseArgs({options:{port:{type:'string'},'media-root':{type:'string'}}});
const port = Number(values.port ?? process.env.PORT ?? 4319);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const {buildAssets} = await import('./build.mjs');
await buildAssets();
const {Library} = await import('../src/server/library.mjs');
const {Player} = await import('../src/server/player.mjs');
const {createPlayerServer} = await import('../src/server/http.mjs');
const library = new Library({root:values['media-root'] || process.env.MEDIA_ROOT || null,dataDir:process.env.JEV_LIBRARY_DIR || join(ROOT,'.library'),cache:process.env.JEV_CACHE_DIR || join(ROOT,'.player-cache')});
const server = createPlayerServer(new Player(library));
server.on('error',error=>{
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the other server, or use npm run dev -- --port 4320.` : error.message);
  process.exit(1);
});
server.listen(port,'127.0.0.1',()=>console.log(`Jev VJ: http://127.0.0.1:${port}/\nLibrary: http://127.0.0.1:${port}/library`));
// Keep the in-memory session alive while rebuilding browser assets.
let timer, rebuilding = false, queued = false;
async function rebuild() {
  if (rebuilding) { queued = true; return; }
  rebuilding = true;
  try { await buildAssets(); console.log('Browser assets rebuilt. Reload the page.'); }
  catch (error) { console.error('Build failed:',error.message); }
  finally { rebuilding = false; if (queued) { queued = false; void rebuild(); } }
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(rebuild,100); };
const watchers = ['src/client/library.js','src/client/player-renderer.ts','tests/gpu/effects-smoke.ts'].map(file=>watch(join(ROOT,file),schedule));
watchers.push(watch(join(ROOT,'src/effects'),{recursive:true},(_,file)=>{ if (file?.endsWith('.ts')) schedule(); }));
function close() { clearTimeout(timer); watchers.forEach(w=>w.close()); server.close(()=>process.exit(0)); server.closeAllConnections(); }
process.on('SIGINT',close); process.on('SIGTERM',close);
