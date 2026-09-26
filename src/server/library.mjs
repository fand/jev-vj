import {existsSync, mkdirSync, readFileSync, statSync, renameSync, rmSync, chmodSync} from 'node:fs';
import {join, relative, extname, sep} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';
import {ROOT, Problem, readJSON, hash} from './common.mjs';
import {FootageStore, CORE, VIDEO, mediaPath, displayPath, videoFiles, isFile, isDirectory} from './footage-store.mjs';
const run = promisify(execFile);
// Some platform packages ship without an executable bit when install scripts are disabled.
// Repair only npm-owned binaries; explicit overrides remain untouched.
for (const [name, tool] of [['FFMPEG_PATH', ffmpeg], ['FFPROBE_PATH', ffprobe]]) {
  if (process.platform !== 'win32' && !process.env[name]) {
    const mode = statSync(tool.path).mode;
    if (!(mode & 0o100)) chmodSync(tool.path, mode | 0o100);
  }
}
export const videoTools = {ffmpeg:process.env.FFMPEG_PATH || ffmpeg.path, ffprobe:process.env.FFPROBE_PATH || ffprobe.path};
export function parseSourceBpms(text, notes) {
  const names = new Map(Object.entries(notes).map(([id,n])=>[JSON.stringify([n.pack.toLowerCase(),n.filename]),id]));
  const result = {}; let pack = '';
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('## ')) pack = line.slice(3).trim().toLowerCase();
    else if (line.startsWith('- ')) {
      const pos = line.lastIndexOf(':');
      if (pos < 0 || !line.slice(pos+1).trim()) continue;
      const name = line.slice(2,pos).trim().replaceAll('\\_','_'), id = names.get(JSON.stringify([pack,name])), bpm = Number(line.slice(pos+1).trim());
      if (!id || Object.hasOwn(result,id) || !Number.isFinite(bpm) || bpm <= 0) throw new Problem(`Invalid BPM entry in data/clip-bpm.md: ${name}`);
      result[id] = bpm;
    }
  }
  return result;
}
export class Library {
  constructor({root = null, cache = join(ROOT,'.player-cache'), dataDir = join(ROOT,'.library')} = {}) {
    const catalog = readJSON(join(ROOT,'data/clip-metadata/jev-candidates.json'));
    this.clips = catalog.clips; this.pack_notes = catalog.pack_notes ?? {};
    this.notes = Object.fromEntries(readJSON(join(ROOT,'data/clip-metadata/metadata.json')).clips.map(c=>[c.id,c]));
    this.axes = readJSON(join(ROOT,'data/clip-metadata/axes.json'));
    this.legacyClips = new Map(this.clips.map(c=>[c.id,c])); this.legacyNotes = {...this.notes};
    this.root = root ? mediaPath(root) : null; this.cache = cache; this.dataDir = dataDir;
    this.paths = new Map(); this.jobs = new Map(); this.store = null; this.sourceBpms = {};
    mkdirSync(cache,{recursive:true}); this.scan();
    if (existsSync(join(dataDir,'footage.csv'))) this.ensureStore();
  }
  scan() {
    if (this.store) { this.applyCatalog(this.store.snapshot()); return; }
    const bpmFile = join(ROOT,'data/clip-bpm.md');
    this.sourceBpms = parseSourceBpms(existsSync(bpmFile) ? readFileSync(bpmFile,'utf8') : '', this.notes);
    const index = new Map();
    if (this.root) for (const pack of new Set(this.clips.map(c=>c.id.split('/')[0]))) for (const path of videoFiles(join(this.root,pack))) {
      const id = `${pack}/${path.split(sep).at(-1)}`;
      index.set(id, [...(index.get(id) ?? []), path]);
    }
    this.paths = new Map(this.clips.filter(c=>index.get(c.id)?.length === 1).map(c=>[c.id,index.get(c.id)[0]]));
  }
  ensureStore() {
    if (!this.store) {
      if (!existsSync(join(this.dataDir,'footage.csv')) && this.root && !isDirectory(this.root)) throw new Problem('Media folder unavailable. Reconnect the drive, or set an available media folder in Library.',503);
      const seed = [...this.paths].map(([id,path])=>({id, name:relative(this.root,path).split(sep).join('/'), path:displayPath(path), bpm:this.sourceBpms[id] ?? null, desc:this.notes[id].source_note}));
      this.store = new FootageStore(this.dataDir, this.root ? [this.root] : [], seed);
      this.applyCatalog(this.store.snapshot());
    }
    return this.store;
  }
  applyCatalog(snapshot) {
    const clips = [], paths = new Map(), bpms = {};
    for (const row of snapshot.rows) {
      const id = row.id, desc = row.desc.trim(), previous = this.legacyNotes[id] ?? {};
      const legacy = desc === (previous.source_note ?? '').trim() ? this.legacyClips.get(id) ?? {} : {};
      const attributes = {...legacy.attributes, ...Object.fromEntries(Object.entries(row).filter(([k,v])=>!CORE.includes(k) && v.trim()))};
      if (desc) clips.push({...legacy,id,description:legacy.description ?? desc,attributes});
      const pos = row.name.lastIndexOf('/');
      this.notes[id] = {id,filename:row.name.slice(pos+1),pack:pos < 0 ? '' : row.name.slice(0,pos),source_note:desc,attributes};
      paths.set(id,mediaPath(row.path));
      if (row.bpm !== null) bpms[id] = row.bpm;
    }
    this.clips = clips; this.paths = paths; this.sourceBpms = bpms;
  }
  public(id) {
    const note = this.notes[id];
    return {id, name:note.filename,pack:note.pack,note:note.source_note,source_bpm:this.sourceBpms[id] ?? null,attributes:Object.fromEntries(Object.entries(note.attributes).filter(([,v])=>v !== null))};
  }
  available() { return this.clips.filter(c=>this.paths.has(c.id) && isFile(this.paths.get(c.id))).map(c=>c.id); }
  prepare(id) {
    const path = this.paths.get(id);
    if (!path || !isFile(path)) throw new Problem('Footage not found. Connect your media drive and rescan.',404);
    return this.preparePath(path);
  }
  preparePath(path) {
    if (!VIDEO.has(extname(path).toLowerCase()) || !isFile(path)) throw new Problem('Video not found or unsupported.',404);
    const stat = statSync(path,{bigint:true});
    const key = hash(`${path}:${stat.size}:${stat.mtimeNs}:h264-1280-v1`).slice(0,24), output = join(this.cache,`${key}.mp4`);
    if (this.jobs.has(key) && this.jobs.get(key).state !== 'error') return key;
    this.jobs.set(key, existsSync(output) ? {state:'ready',path:output,error:null} : {state:'preparing',path:null,error:null});
    if (!existsSync(output)) void this.convert(key,path,output);
    return key;
  }
  async convert(key, source, output) {
    const temp = output.replace(/\.mp4$/,'.partial.mp4');
    try {
      const probe = await run(videoTools.ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt','-of','json',source],{timeout:20000});
      const stream = JSON.parse(probe.stdout).streams[0];
      let result = source;
      if (!(extname(source).toLowerCase() === '.mp4' && stream?.codec_name === 'h264' && stream?.pix_fmt === 'yuv420p')) {
        await run(videoTools.ffmpeg,['-nostdin','-v','error','-y','-i',source,'-map','0:v:0','-an','-vf','scale=w=trunc(min(1280\\,iw)/2)*2:h=-2','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',temp],{timeout:300000,maxBuffer:1024*1024});
        renameSync(temp,output); result = output;
      }
      this.jobs.set(key,{state:'ready',path:result,error:null});
    } catch {
      this.jobs.set(key,{state:'error',path:null,error:'Could not prepare the video. Check the source file and video tools.'});
    } finally { rmSync(temp,{force:true}); }
  }
  job(key) {
    if (!this.jobs.has(key)) throw new Problem('Video not found.',404);
    return {...this.jobs.get(key)};
  }
}
