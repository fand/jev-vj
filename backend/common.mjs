import {fileURLToPath} from 'node:url';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash, randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export class Problem extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
export const hash = value => createHash('sha256').update(value).digest('hex');
export const token = (bytes = 16) => randomBytes(bytes).toString('base64url');
export const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const finite = value => typeof value === 'number' && Number.isFinite(value);
export function readKey() {
  if (Object.hasOwn(process.env, 'TYPESAFE_API_KEY')) return process.env.TYPESAFE_API_KEY.trim();
  const file = join(ROOT, '.env');
  return existsSync(file) ? (parseEnv(readFileSync(file, 'utf8')).TYPESAFE_API_KEY ?? '').trim() : '';
}
