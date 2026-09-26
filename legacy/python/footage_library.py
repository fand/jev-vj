"""Local, editable CSV catalog. Media stays at its original path."""
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import threading
from server import Problem

CORE = ['id', 'name', 'path', 'bpm', 'desc']
VIDEO = {'.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.dxv', '.mpeg', '.mpg'}


def media_path(value):
    if not isinstance(value, str) or not value.strip() or '\x00' in value:
        raise Problem('Enter an absolute video path or a path starting with ~/.')
    path = Path(value.strip()).expanduser()
    if not path.is_absolute():
        raise Problem('Use absolute paths or ~/. Relative paths are ambiguous.')
    return path.resolve()


def display_path(path):
    try:
        return '~/' + str(path.relative_to(Path.home()))
    except ValueError:
        return str(path)


def video_files(root):
    for here, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if not d.startswith('.'))
        for name in sorted(files):
            path = Path(here) / name
            # Do not discover files outside a registered root through symlinks.
            if not name.startswith('.') and path.suffix.lower() in VIDEO and root in path.resolve().parents:
                yield path.resolve()


class FootageStore:
    def __init__(self, directory, root, seed=()):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.file = self.directory / 'footage.csv'
        self.settings = self.directory / 'settings.json'
        self.lock = threading.RLock()
        if not self.settings.exists():
            self._atomic(self.settings, json.dumps({'roots': [display_path(Path(root))]}, ensure_ascii=False))
        if not self.file.exists():
            self._atomic(self.file, self.csv_text(CORE, list(seed)))

    @staticmethod
    def _atomic(path, text):
        temp = path.with_suffix(path.suffix + '.tmp')
        try:
            temp.write_text(text, encoding='utf-8')
            temp.replace(path)
        finally:
            temp.unlink(missing_ok=True)

    @staticmethod
    def csv_text(columns, rows):
        out = io.StringIO(newline='')
        writer = csv.DictWriter(out, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)
        return out.getvalue()

    def snapshot(self):
        with self.lock:
            text = self.file.read_text(encoding='utf-8-sig')
            reader = csv.DictReader(io.StringIO(text, newline=''))
            columns, rows = self.validate(reader.fieldnames, list(reader))
            roots = json.loads(self.settings.read_text())['roots']
            return {'columns': columns, 'rows': rows, 'roots': roots,
                    'revision': hashlib.sha256(text.encode()).hexdigest()}

    @staticmethod
    def validate(columns, rows):
        if not isinstance(columns, list) or not 5 <= len(columns) <= 100 or any(not isinstance(c, str) or not re.fullmatch(r'[\w .-]{1,80}', c) or c in ('__proto__', 'constructor', 'prototype') for c in columns):
            raise Problem('Invalid column names. Use letters, numbers, spaces, dots, underscores or hyphens.')
        if len(set(columns)) != len(columns) or not set(CORE) <= set(columns):
            raise Problem('Keep the id, name, path, bpm and desc columns, without duplicates.')
        if not isinstance(rows, list) or len(rows) > 10000:
            raise Problem('The library supports up to 10,000 rows.')
        clean, ids, paths = [], set(), set()
        for row in rows:
            if not isinstance(row, dict) or any(k not in columns for k in row):
                raise Problem('Invalid CSV row or unexpected fields.')
            record = {key: '' if row.get(key) is None else str(row[key]) for key in columns}
            if any(len(value) > 10000 or '\x00' in value for value in record.values()):
                raise Problem('A cell is too long or contains invalid characters.')
            if not record['id'] or not record['name'].strip() or record['id'] in ids:
                raise Problem('Each row needs a unique ID and a name.')
            path = media_path(record['path'])
            if path.suffix.lower() not in VIDEO or path in paths:
                raise Problem('Each row needs a unique video path.')
            ids.add(record['id']); paths.add(path)
            try:
                bpm = float(record['bpm']) if record['bpm'].strip() else None
                if bpm is not None and (not math.isfinite(bpm) or bpm <= 0):
                    raise ValueError()
            except ValueError:
                raise Problem(f"Invalid BPM for {record['name']}. Leave blank or enter a positive number.") from None
            record['bpm'] = bpm
            clean.append(record)
        return columns, clean

    def save(self, columns, rows, revision):
        columns, rows = self.validate(columns, rows)
        with self.lock:
            if self.snapshot()['revision'] != revision:
                raise Problem('The CSV changed in another window. Reload before saving.', 409)
            self._atomic(self.file, self.csv_text(columns, rows))
            return self.snapshot()

    def set_roots(self, roots):
        if not isinstance(roots, list) or not roots or len(roots) > 30:
            raise Problem('Enter one to thirty media folders.')
        paths = list(dict.fromkeys(media_path(value) for value in roots))
        for path in paths:
            if not path.is_dir():
                raise Problem(f'Media folder is unavailable: {display_path(path)}')
        with self.lock:
            self._atomic(self.settings, json.dumps({'roots': [display_path(p) for p in paths]}, ensure_ascii=False))
        return {'roots': [display_path(p) for p in paths]}

    def import_paths(self, values):
        if not isinstance(values, list) or not values or len(values) > 10000:
            raise Problem('Provide a list of video paths or folders.')
        roots = [media_path(p) for p in self.snapshot()['roots']]
        found, errors = {}, []
        for value in values:
            try:
                path = media_path(value)
                files = video_files(path) if path.is_dir() else [path]
                for file in files:
                    if not file.is_file() or file.suffix.lower() not in VIDEO:
                        raise Problem(f'Video not found or unsupported: {value}')
                    if len(found) >= 10000:
                        raise Problem('Import at most 10,000 videos at a time.')
                    found[file] = True
            except (Problem, OSError) as error:
                errors.append(str(error))
        existing = {media_path(r['path']): r['id'] for r in self.snapshot()['rows']}
        rows = []
        for path in found:
            base = next((r for r in sorted(roots, key=lambda p: len(str(p)), reverse=True) if r in path.parents), path.parent.parent)
            rows.append({'id': existing.get(path, 'local-' + hashlib.sha256(str(path).encode()).hexdigest()[:24]),
                         'name': str(path.relative_to(base)), 'path': display_path(path), 'bpm': None, 'desc': ''})
        return {'rows': rows, 'errors': errors}

    def resolve_drops(self, files):
        if not isinstance(files, list) or not files or len(files) > 10000:
            raise Problem('Drop one to 10,000 videos.')
        for file in files:
            if not isinstance(file, dict) or not isinstance(file.get('name'), str) or type(file.get('size')) is not int or file['size'] < 0:
                raise Problem('Invalid dropped file metadata.')
        wanted = {f['name'] for f in files}
        index = {}
        for value in self.snapshot()['roots']:
            root = media_path(value)
            for path in video_files(root):
                if path.name not in wanted:
                    continue
                try:
                    index.setdefault((path.name, path.stat().st_size), set()).add(path)
                except OSError:
                    pass
        result = []
        for file in files:
            matches = sorted(index.get((file['name'], file['size']), []))
            relative = file.get('relative_path', '')
            if isinstance(relative, str) and '/' in relative:
                narrowed = [p for p in matches if str(p).endswith('/' + relative.lstrip('/'))]
                if narrowed:
                    matches = narrowed
            result.append({'name': file['name'], 'matches': [display_path(p) for p in matches]})
        return {'files': result}
