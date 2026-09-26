import {createServer} from 'node:http';
import {readFileSync, existsSync, statSync, createReadStream} from 'node:fs';
import {join, extname} from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {ROOT, Problem, record} from './common.mjs';
import {Player} from './player.mjs';
import {CORE, mediaPath, displayPath, isFile, isDirectory} from './footage-store.mjs';

// Keep browser URLs stable while serving only these explicitly listed assets.
const staticFiles = new Map([
  ...['player.js','player.css','effect-output.html','effect-output.css','library.html','library.css','performance-controls.js','deck-output.js','output-popup.js','output-popup.css','output-popup.html'].map(file=>['/'+file,'src/client/'+file]),
  ...['player-renderer.js','effects-smoke.js','library.js','library.css'].map(file=>['/dist/'+file,'dist/'+file]),
  ...['effects-smoke.html','effects-smoke.css'].map(file=>['/'+file,'tests/gpu/'+file]),
  ['/','src/client/player.html'], ['/library','src/client/library.html'],
]);
const mime = {'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8'};
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self'; frame-ancestors 'self'"};
export function byteRange(header, size) {
  if (header === undefined) return [0,size-1,200];
  const m = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!m || (!m[1] && !m[2]) || size <= 0) throw new Problem('Invalid range',416);
  const first = m[1] ? Number(m[1]) : null, last = m[2] ? Number(m[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) throw new Problem('Invalid range',416);
  if (first === null && !last) throw new Problem('Invalid range',416);
  const start = first ?? Math.max(0,size-last), end = first === null ? size-1 : Math.min(last ?? size-1,size-1);
  if (start >= size || end < start) throw new Problem('Invalid range',416);
  return [start,end,206];
}
async function bodyJSON(req, limit) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new Problem('JSON required',415);
  const length = Number(req.headers['content-length']);
  if (!Number.isSafeInteger(length) || length <= 0 || length > limit) throw new Problem('Invalid size',413);
  const chunks = []; let total = 0;
  for await (const chunk of req) {
    total += chunk.length; if (total > limit) throw new Problem('Invalid size',413);
    chunks.push(chunk);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Problem('Invalid input format.'); }
  if (!record(data)) throw new Problem('JSON object required');
  return data;
}
export function createPlayerServer(player = new Player()) {
  const server = createServer(async (req,res) => {
    const reply = (data,status = 200,kind = 'application/json; charset=utf-8') => {
      if (res.destroyed || res.writableEnded) return;
      const body = Buffer.isBuffer(data) ? data : Buffer.from(kind.startsWith('application/json') ? JSON.stringify(data) : data);
      res.writeHead(status,{...headers,'Content-Type':kind,'Content-Length':body.length});
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    try {
      const port = server.address().port;
      if (![ `localhost:${port}`, `127.0.0.1:${port}`].includes(req.headers.host)) throw new Problem('Invalid host',403);
      const path = new URL(req.url,`http://127.0.0.1:${port}`).pathname, lib = player.library;
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (staticFiles.has(path)) {
          const file = staticFiles.get(path);
          return reply(readFileSync(join(ROOT,file)),200,mime[extname(file)]);
        }
        if (path === '/api/status') return reply(player.status());
        if (path === '/api/library') {
          if (!lib.store && !existsSync(join(lib.dataDir,'footage.csv')) && lib.root && !isDirectory(lib.root)) return reply({token:player.token,columns:CORE,rows:[],roots:[displayPath(lib.root)],revision:null,missing:[],setup_message:'Media folder unavailable. Reconnect and reload, or set an available media folder. Existing notes are unchanged.'});
          const snapshot = lib.ensureStore().snapshot();
          return reply({...snapshot,token:player.token,missing:snapshot.rows.filter(r=>!isFile(mediaPath(r.path))).map(r=>r.id)});
        }
        if (path === '/api/library/csv') {
          const store = lib.ensureStore(), {columns,rows} = store.snapshot();
          return reply(store.csvText(columns,rows),200,'text/csv; charset=utf-8');
        }
        if (path.startsWith('/api/asset/')) {
          const key = path.split('/').at(-1), job = lib.job(key);
          return reply({state:job.state,error:job.error,url:job.state === 'ready' ? '/media/'+key : null});
        }
        if (path.startsWith('/media/')) {
          const job = lib.job(path.split('/').at(-1));
          if (job.state !== 'ready' || !job.path || !isFile(job.path)) throw new Problem('Media unavailable',404);
          const size = statSync(job.path).size;
          let start,end,status;
          try { [start,end,status] = byteRange(req.headers.range,size); }
          catch { res.writeHead(416,{...headers,'Content-Type':'video/mp4','Content-Length':0,'Content-Range':`bytes */${size}`}); res.end(); return; }
          res.writeHead(status,{...headers,'Content-Type':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes',...(status === 206 ? {'Content-Range':`bytes ${start}-${end}/${size}`} : {})});
          if (req.method === 'HEAD' || size === 0) { res.end(); return; }
          const stream = createReadStream(job.path,{start,end});
          res.on('close',()=>stream.destroy()); stream.on('error',()=>res.destroy()); stream.pipe(res); return;
        }
        throw new Problem('Not found',404);
      }
      if (req.method !== 'POST') throw new Problem('Method not allowed',405);
      const origin = req.headers.origin, supplied = Buffer.from(req.headers['x-jev-token'] ?? ''), expected = Buffer.from(player.token);
      if ((origin && ![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(origin)) || supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) throw new Problem('Forbidden',403);
      const data = await bodyJSON(req,path.startsWith('/api/library/') ? 8*1024*1024 : 8192);
      let result;
      if (path === '/api/library/roots' && !lib.store && !existsSync(join(lib.dataDir,'footage.csv'))) {
        if (!Array.isArray(data.roots) || !data.roots.length || data.roots.length > 30) throw new Problem('Enter one to thirty media folders.');
        const roots = data.roots.map(mediaPath);
        if (roots.some(root=>!isDirectory(root))) throw new Problem('One of the media folders is unavailable.');
        if (player.busy) throw new Problem('Wait for the current selection to finish.',409);
        lib.root = roots[0]; lib.scan();
      }
      if (path.startsWith('/api/library/')) {
        const store = lib.ensureStore();
        switch (path) {
          case '/api/library/save':
            if (player.busy) throw new Problem('Wait for the current selection to finish before saving.',409);
            result = store.save(data.columns,data.rows,data.revision); lib.applyCatalog(result); player.cancel(); break;
          case '/api/library/import': result = store.importPaths(data.paths); break;
          case '/api/library/resolve': result = store.resolveDrops(data.files); break;
          case '/api/library/roots': result = {...store.setRoots(data.roots),catalog:store.snapshot()}; break;
          case '/api/library/preview': result = {asset:lib.preparePath(mediaPath(data.path))}; break;
          default: throw new Problem('Not found',404);
        }
      } else {
        switch (path) {
          case '/api/candidates': result = await player.select(data.prompt,'candidates'); break;
          case '/api/select': result = await player.select(data.prompt,data.action ?? 'select'); break;
          case '/api/choose': result = player.choose(data.id); break;
          case '/api/played': result = player.played(data.ticket,data.effects_failed === true); break;
          case '/api/effects': result = player.manualEffects(data.effects,data.clip_id,data.revision); break;
          case '/api/cancel': result = player.cancel(); break;
          case '/api/clear': result = player.cancel(true); break;
          case '/api/scan':
            if (player.busy) throw new Problem('Wait for the current selection to finish.',409);
            lib.scan(); player.cancel(); result = {ok:true}; break;
          default: throw new Problem('Not found',404);
        }
      }
      reply(result);
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      if (error instanceof Problem) reply({error:error.message},error.status);
      else if (error instanceof TypeError || error instanceof SyntaxError || error.code?.startsWith('CSV_')) reply({error:'Invalid input format.'},400);
      else reply({error:'The request failed. Please try again.'},500);
    }
  });
  return server;
}
