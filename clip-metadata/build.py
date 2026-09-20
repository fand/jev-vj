"""Package manually reviewed clip-note annotations. No model calls or video analysis."""
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'clip-notes.md'
PACK_DIRS = {'Ducky3D': 'ducky3d', 'Inferno': 'Inferno', 'loopable-smoke': 'loopable-smoke', 'mantissa': 'mantissa', 'Opti': 'Opti', 'SELDO': 'SELDO', 'tatsuyam': 'tatsuyam'}


def dump(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def source_rows():
    pack = None
    rows = []
    for line_no, line in enumerate(SOURCE.read_text().splitlines(), 1):
        if line.startswith('# '):
            pack = line[2:].strip()
        match = re.match(r'^- (.+?\.(?:mp4|mov)):\s*(.*)$', line)
        if match and match[2].strip():
            assert pack in PACK_DIRS, pack
            rows.append({'id': f'{PACK_DIRS[pack]}/{match[1]}', 'pack': pack,
                         'filename': match[1], 'source_line': line_no,
                         'source_note': match[2].strip()})
    assert len({r['id'] for r in rows}) == len(rows)
    return rows


def source_pack_notes():
    pack, notes = None, {}
    for line in SOURCE.read_text().splitlines():
        if line.startswith('# '):
            pack = line[2:].strip()
        elif pack in PACK_DIRS and line.strip() and not line.startswith('- '):
            notes.setdefault(PACK_DIRS[pack], []).append(line.strip())
    return notes


def main():
    rows = source_rows()
    pack_notes = source_pack_notes()
    axes = json.loads((ROOT / 'axes.json').read_text())
    annotations = json.loads((ROOT / 'annotations.json').read_text())
    assert set(annotations) == {r['id'] for r in rows}, 'Description/annotation mismatch: review new or removed notes.'
    paths = {}
    resolve_paths = '--resolve-paths' in sys.argv
    for pack, folder in (PACK_DIRS.items() if resolve_paths else []):
        base = Path('/Volumes/T7/vj') / folder
        wanted = {r['filename'] for r in rows if r['pack'] == pack}
        if base.exists():
            for path in base.rglob('*'):
                if path.name in wanted and path.is_file():
                    paths.setdefault((pack, path.name), []).append(path)
    coverage = Counter()
    clips = []
    candidates = []
    review = ['# 記入済みクリップの属性', '', '説明文のみを整理。動画の再解析・実測なし。不明は未記載。', '']
    extracted = []
    previous_pack = None
    for row in rows:
        ann = annotations[row['id']]
        assert ann['source_note_sha256'] == hashlib.sha256(row['source_note'].encode()).hexdigest(), f"Stale annotation: {row['id']}"
        unknown_keys = set(ann['attributes']) - set(axes)
        assert not unknown_keys, unknown_keys
        values = {key: None for key in axes}
        for key, value in ann['attributes'].items():
            spec = axes[key]
            if spec['type'] == 'tags':
                assert isinstance(value, list) and value and all(isinstance(v, str) and v for v in value), (row['id'], key)
                assert len(set(value)) == len(value)
            elif spec['type'] == 'boolean':
                assert type(value) is bool, (row['id'], key)
            elif spec['type'] == 'number':
                assert isinstance(value, (int, float)) and not isinstance(value, bool), (row['id'], key)
            else:
                assert isinstance(value, str) and value, (row['id'], key)
            if spec.get('values'):
                assert value in spec['values'], (row['id'], key, value)
            values[key] = value
            coverage[key] += 1
        matches = paths.get((row['pack'], row['filename']), [])
        assert len(matches) <= 1, f"Ambiguous path: {row['id']}"
        row.update(path=str(matches[0]) if matches else None,
                   source_root=f"/Volumes/T7/vj/{PACK_DIRS[row['pack']]}",
                   path_status='resolved' if matches else 'unavailable' if resolve_paths else 'not_checked',
                   description_en=ann['description_en'], attributes=values,
                   review_notes=ann.get('review_notes', []),
                   derived_attributes=ann.get('derived_attributes', {}),
                   provenance={'method': 'manual_semantic_structuring_of_user_note', 'video_reviewed': False,
                               'source_file': '../clip-notes.md', 'source_note_sha256': ann['source_note_sha256']})
        clips.append(row)
        candidates.append({'id': row['id'], 'description': ann['description_en'],
                           'attributes': ann['attributes'], 'caveats': ann.get('review_notes', []),
                           'derived_attributes': ann.get('derived_attributes', {})})
        if previous_pack != row['pack']:
            review += [f"## {row['pack']}", '']
            extracted += [f"# {row['pack']}", '']
            for note in pack_notes.get(PACK_DIRS[row['pack']], []):
                review += [f'パック全体の注記：{note}', '']
                extracted += [note, '']
            previous_pack = row['pack']
        extracted += [f"- {row['filename']}: {row['source_note']}"]
        review += [f"### {row['filename']}", '', f"> {row['source_note']}", '', ann['description_en'], '', '| 評価軸 | 値 |', '| --- | --- |']
        for key, value in ann['attributes'].items():
            display = ', '.join(value) if isinstance(value, list) else str(value).lower() if isinstance(value, bool) else str(value)
            review.append(f"| {axes[key]['label_ja']} (`{key}`) | {display.replace('|', '/')} |")
        review += ['']
        if ann.get('review_notes'):
            review += ['補足：' + ' / '.join(ann['review_notes']), '']
        if ann.get('derived_attributes'):
            review += ['派生属性：' + ', '.join(ann['derived_attributes']), '']
    policy = {'unknown': 'null or missing means unknown, never false or absent.',
              'basis': 'User descriptions only; normalized labels are interpretations, not measured features.',
              'camera_rotation': 'Direction preserves user wording; viewpoint/axis is not independently verified.',
              'tempo': 'Separate camera, subject and light speeds. No BPM or live audio synchronization inferred.',
              'selection': 'Unknown attributes do not count as matching a requested feature. Allow no_match or keep.',
              'operations': 'No Resolume layer/slot mapping, no runtime catalog changes.'}
    dump('metadata.json', {'schema_version': 1, 'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                           'policy': policy, 'pack_notes': pack_notes,
                           'counts': dict(Counter(r['pack'] for r in rows)), 'clips': clips})
    dump('jev-candidates.json', {'policy': policy, 'pack_notes': pack_notes, 'clips': candidates})
    dump('coverage.json', {'clips': len(rows), 'axes_total': len(axes), 'axes_populated': len(coverage),
                           'axes': {key: {'known': coverage[key], 'unknown': len(rows) - coverage[key]} for key in axes}})
    (ROOT / 'review.md').write_text('\n'.join(review) + '\n')
    (ROOT / 'described-clips.md').write_text('\n'.join(extracted) + '\n')
    guide = ['# 評価軸一覧', '', f'{len(axes)}軸。うち今回の説明で値が得られたものは{len(coverage)}軸。', '',
             'nullは「不明」。タグ配列も不明ならnull。falseは明確な否定がある場合のみ。', '',
             f'| 属性 | 意味 | 型・値 | 記入あり / {len(rows)} |', '| --- | --- | --- | --- |']
    for key, spec in axes.items():
        choices = ', '.join(spec.get('values', [])) or spec['type']
        guide.append(f"| `{key}` | {spec['label_ja']}：{spec['description_ja']} | {choices} | {coverage[key]} |")
    (ROOT / 'axes.md').write_text('\n'.join(guide) + '\n')
    print(json.dumps({'clips': len(rows), 'axes': len(axes), 'populated_axes': len(coverage), 'resolved_paths': sum(c['path'] is not None for c in clips), 'counts': dict(Counter(r['pack'] for r in rows))}, ensure_ascii=False))


if __name__ == '__main__':
    main()
