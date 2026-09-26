import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, realpathSync, readdirSync, statSync} from 'node:fs';
import {homedir} from 'node:os';
import {join, resolve, isAbsolute, relative, dirname, basename, extname, sep} from 'node:path';
import {parse} from 'csv-parse/sync';
import {stringify} from 'csv-stringify/sync';
import {Problem, hash, record, readJSON} from './common.mjs';

export const CORE = ['id', 'name', 'path', 'bpm', 'desc'];
export const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.dxv', '.mpeg', '.mpg']);
export const isFile = path => { try { return statSync(path).isFile(); } catch { return false; } };
export const isDirectory = path => { try { return statSync(path).isDirectory(); } catch { return false; } };
export const inside = (root, path) => { const r = relative(root, path); return !!r && !r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r); };
export function mediaPath(value) {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new Problem('Enter an absolute video path or a path starting with ~/.');
  let path = value.trim();
  if (path.startsWith('~/')) path = join(homedir(), path.slice(2));
  if (!isAbsolute(path)) throw new Problem('Use absolute paths or ~/. Relative paths are ambiguous.');
  // Resolve existing parents too, so offline files under a symlink keep their identity.
  path = resolve(path);
  if (existsSync(path)) return realpathSync(path);
  const parent = dirname(path);
  return parent === path ? path : join(mediaPath(parent), basename(path));
}
export const displayPath = path => inside(homedir(), path) ? `~/${relative(homedir(), path).split(sep).join('/')}` : path;
export function* videoFiles(root) {
  if (!isDirectory(root)) return;
  root = mediaPath(root);
  for (const entry of readdirSync(root, {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* videoFiles(path);
    } else if (VIDEO.has(extname(path).toLowerCase()) && isFile(path)) {
      const actual = realpathSync(path);
      if (inside(root, actual)) yield actual;
    }
  }
}
export class FootageStore {
  constructor(directory, roots = [], seed = []) {
    mkdirSync(directory, {recursive:true});
    this.file = join(directory, 'footage.csv');
    this.settings = join(directory, 'settings.json');
    if (!existsSync(this.settings)) this.atomic(this.settings, JSON.stringify({roots:roots.map(displayPath)}));
    if (!existsSync(this.file)) this.atomic(this.file, this.csvText(CORE, seed));
  }
  atomic(path, text) {
    const temp = `${path}.tmp`;
    try { writeFileSync(temp, text, 'utf8'); renameSync(temp, path); }
    finally { rmSync(temp, {force:true}); }
  }
  csvText(columns, rows) {
    return stringify(rows, {header:true, columns, record_delimiter:'\r\n'});
  }
  snapshot() {
    const text = readFileSync(this.file, 'utf8').replace(/^\uFEFF/, '');
    let columns;
    const rows = parse(text, {columns:header => { columns = header; return header; }, skip_empty_lines:true});
    const clean = this.validate(columns, rows);
    return {columns, rows:clean, roots:readJSON(this.settings).roots, revision:hash(text)};
  }
  validate(columns, rows) {
    if (!Array.isArray(columns) || columns.length < 5 || columns.length > 100 || columns.some(c => typeof c !== 'string' || !/^[\p{L}\p{N}_ .-]{1,80}$/u.test(c) || ['__proto__','constructor','prototype'].includes(c))) throw new Problem('Invalid column names. Use letters, numbers, spaces, dots, underscores or hyphens.');
    if (new Set(columns).size !== columns.length || CORE.some(c => !columns.includes(c))) throw new Problem('Keep the id, name, path, bpm and desc columns, without duplicates.');
    if (!Array.isArray(rows) || rows.length > 10000) throw new Problem('The library supports up to 10,000 rows.');
    const ids = new Set(), paths = new Set();
    return rows.map(row => {
      if (!record(row) || Object.keys(row).some(k => !columns.includes(k))) throw new Problem('Invalid CSV row or unexpected fields.');
      const r = Object.fromEntries(columns.map(key => [key, String(row[key] ?? '')]));
      if (Object.values(r).some(v => v.length > 10000 || v.includes('\0'))) throw new Problem('A cell is too long or contains invalid characters.');
      if (!r.id || !r.name.trim() || ids.has(r.id)) throw new Problem('Each row needs a unique ID and a name.');
      const path = mediaPath(r.path);
      if (!VIDEO.has(extname(path).toLowerCase()) || paths.has(path)) throw new Problem('Each row needs a unique video path.');
      ids.add(r.id); paths.add(path);
      r.bpm = r.bpm.trim() ? Number(r.bpm) : null;
      if (r.bpm !== null && (!Number.isFinite(r.bpm) || r.bpm <= 0)) throw new Problem(`Invalid BPM for ${r.name}. Leave blank or enter a positive number.`);
      return r;
    });
  }
  save(columns, rows, revision) {
    rows = this.validate(columns, rows);
    if (this.snapshot().revision !== revision) throw new Problem('The CSV changed in another window. Reload before saving.', 409);
    this.atomic(this.file, this.csvText(columns, rows));
    return this.snapshot();
  }
  setRoots(roots) {
    if (!Array.isArray(roots) || !roots.length || roots.length > 30) throw new Problem('Enter one to thirty media folders.');
    const paths = [...new Set(roots.map(mediaPath))];
    for (const path of paths) if (!isDirectory(path)) throw new Problem(`Media folder is unavailable: ${displayPath(path)}`);
    const result = {roots:paths.map(displayPath)};
    this.atomic(this.settings, JSON.stringify(result));
    return result;
  }
  importPaths(values) {
    if (!Array.isArray(values) || !values.length || values.length > 10000) throw new Problem('Provide a list of video paths or folders.');
    const snapshot = this.snapshot(), roots = snapshot.roots.map(mediaPath).sort((a,b) => b.length-a.length);
    const found = new Set(), errors = [];
    for (const value of values) {
      try {
        const path = mediaPath(value);
        for (const file of isDirectory(path) ? videoFiles(path) : [path]) {
          if (!isFile(file) || !VIDEO.has(extname(file).toLowerCase())) throw new Problem(`Video not found or unsupported: ${value}`);
          if (found.size >= 10000) throw new Problem('Import at most 10,000 videos at a time.');
          found.add(file);
        }
      } catch (error) { errors.push(error.message); }
    }
    const existing = new Map(snapshot.rows.map(r => [mediaPath(r.path), r.id]));
    return {rows:[...found].map(path => ({id:existing.get(path) ?? `local-${hash(path).slice(0,24)}`, name:relative(roots.find(r => inside(r,path)) ?? dirname(dirname(path)), path).split(sep).join('/'), path:displayPath(path), bpm:null, desc:''})), errors};
  }
  resolveDrops(files) {
    if (!Array.isArray(files) || !files.length || files.length > 10000) throw new Problem('Drop one to 10,000 videos.');
    for (const f of files) if (!record(f) || typeof f.name !== 'string' || !Number.isSafeInteger(f.size) || f.size < 0) throw new Problem('Invalid dropped file metadata.');
    const wanted = new Set(files.map(f=>f.name)), index = new Map();
    for (const root of this.snapshot().roots.map(mediaPath)) for (const path of videoFiles(root)) {
      if (!wanted.has(basename(path))) continue;
      try {
        const key = JSON.stringify([basename(path), statSync(path).size]);
        if (!index.has(key)) index.set(key, new Set());
        index.get(key).add(path);
      } catch { /* A drive may disappear during a scan. */ }
    }
    return {files:files.map(file => {
      let matches = [...(index.get(JSON.stringify([file.name, file.size])) ?? [])].sort();
      if (typeof file.relative_path === 'string' && file.relative_path.includes('/')) {
        const narrowed = matches.filter(p => p.split(sep).join('/').endsWith('/'+file.relative_path.replace(/^\/+/, '')));
        if (narrowed.length) matches = narrowed;
      }
      return {name:file.name, matches:matches.map(displayPath)};
    })};
  }
}
