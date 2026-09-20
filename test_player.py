import http.client
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

from player_server import Library, Player, Problem, byte_range, create_server, request_body, evaluate


def answer(choice):
    return {'answers': {'clip': {'type': 'choice', 'choice': choice, 'probabilities': {choice: 1}}}}


def effects_off(body):
    return {'answers':{key:{'type':'choice','choice':'off'} for key in body['questions']}}


class FakeLibrary:
    clips = [{'id': 'pack/a.mp4', 'attributes': {'color.palette': ['red']}},
             {'id': 'pack/b.mov', 'attributes': {'camera.translation_speed': 'slow'}}]
    axes = {'color.palette': {'label_ja': '色'}}

    def __init__(self):
        self.state = 'ready'
        self.path = None

    def available(self): return [self.clips[0]['id']]
    def prepare(self, cid): return 'asset-key'
    def job(self, key):
        if key != 'asset-key': raise Problem('Not found', 404)
        return {'state': self.state, 'path': self.path, 'error': None}
    def public(self, cid): return {'id': cid, 'name': cid.split('/')[1], 'pack': 'pack'}


class PlayerTests(unittest.TestCase):
    def setUp(self):
        self.library = FakeLibrary()
        self.player = Player(self.library, evaluator=lambda _: answer('pack/a.mp4'), effect_evaluator=effects_off)

    def test_context_keeps_all_metadata_but_only_playable_choices_and_last_12(self):
        history = [{'clip_id': str(n), 'played_at': n, 'prompt': 'カラフルに'} for n in range(20)]
        body = request_body('少しずつビルドアップ', self.library.clips, history, None, self.library.available(), 'select')
        self.assertEqual(body['state']['clips'], self.library.clips)
        self.assertEqual(body['state']['history'], [{'clip_id':str(n), 'played_at':n} for n in range(8,20)])
        self.assertEqual(set(body['questions']['clip']['criteria']), {'pack/a.mp4', 'no_match'})
        self.assertNotIn('camera.translation_speed', body['state']['clips'][0]['attributes'])

    def test_transport_preserves_all_context_in_compact_json(self):
        body = request_body('クラゲ', self.library.clips, [], None, self.library.available(), 'select', {'pack':['情報量多め']})
        def send(request, **kwargs):
            payload = json.loads(request.data)
            self.assertIsInstance(payload['state'], str)
            self.assertEqual(json.loads(payload['state']), body['state'])
            self.assertEqual(payload['questions'], body['questions'])
            return io.BytesIO(json.dumps(answer('pack/a.mp4')).encode())
        with patch('player_server.read_key', return_value='test-key'), patch('player_server.urlopen', side_effect=send):
            self.assertEqual(evaluate(body)['answers']['clip']['choice'], 'pack/a.mp4')

    def test_current_clip_metadata_is_kept_even_when_excluded_from_candidates(self):
        clip = dict(self.library.clips[0], description='Blue moving lines', caveats=['Rotation speed unknown'])
        body = request_body('もっとミニマルに', [clip, self.library.clips[1]], [], clip['id'],
                            [c['id'] for c in self.library.clips], 'next')
        self.assertEqual(body['state']['current_clip'], clip)
        self.assertNotIn(clip['id'], body['questions']['clip']['criteria'])
        self.assertIsNone(request_body('もっとミニマルに', [clip], [], None, [clip['id']], 'select')['state']['current_clip'])

    def test_relative_baseline_advances_only_after_playback(self):
        self.library.available = lambda: [c['id'] for c in self.library.clips]
        seen = []
        def evaluate(body):
            seen.append(body['state']['current_clip'])
            return answer(body['state']['candidate_ids'][0])
        self.player.evaluator = evaluate
        first = self.player.select('minimal')
        replacement = self.player.select('もっとミニマルに')
        self.assertEqual(seen, [None, None])
        self.player.played(replacement['ticket'])
        next_clip = self.player.select('もっとミニマルに', 'next')
        self.assertEqual(seen[-1], self.library.clips[0])
        self.assertEqual(next_clip['comparison_clip_id'], first['clip_id'])
        self.player.played(next_clip['ticket'])
        after = self.player.select('もっとミニマルに', 'next')
        self.assertEqual(seen[-1], self.library.clips[1])
        self.assertEqual(after['comparison_clip_id'], next_clip['clip_id'])

    def test_only_confirmed_playback_becomes_context(self):
        selected = self.player.select('赤く')
        self.assertEqual(self.player.history, [])
        self.assertIsNone(self.player.current)
        self.library.state = 'preparing'
        with self.assertRaises(Problem): self.player.played(selected['ticket'])
        self.library.state = 'ready'
        self.player.played(selected['ticket'])
        self.assertEqual(self.player.current, 'pack/a.mp4')
        self.assertEqual(len(self.player.history), 1)
        with self.assertRaises(Problem): self.player.played(selected['ticket'])

    def test_next_excludes_current_but_retains_its_metadata_for_comparison(self):
        self.library.available = lambda: ['pack/a.mp4', 'pack/b.mov']
        selected = self.player.select('calm')
        self.player.played(selected['ticket'])
        def evaluate(body):
            self.assertEqual(body['state']['candidate_ids'], ['pack/b.mov'])
            self.assertEqual(body['state']['current_clip_id'], 'pack/a.mp4')
            self.assertEqual(body['state']['clips'], self.library.clips)
            self.assertNotIn('pack/a.mp4', body['questions']['clip']['criteria'])
            return answer('pack/b.mov')
        self.player.evaluator = evaluate
        result = self.player.select('calm', action='next')
        self.assertEqual((result['outcome'], result['clip_id']), ('selected', 'pack/b.mov'))
        self.player.evaluator = lambda _: answer('pack/a.mp4')
        with self.assertRaises(Problem): self.player.select('calm', action='next')

    def test_next_with_only_current_available_skips_api_and_does_not_repeat(self):
        selected = self.player.select('calm')
        self.player.played(selected['ticket'])
        self.player.evaluator = lambda _: self.fail('No alternative should not call API')
        result = self.player.select('calm', action='next')
        self.assertEqual(result['outcome'], 'no_match')
        self.assertEqual(len(self.player.history), 1)

    def test_recent_cooldown_prevents_abab_for_both_buttons(self):
        ids = [f'pack/{letter}.mp4' for letter in 'abcd']
        self.library.clips = [{'id': cid, 'attributes': {}} for cid in ids]
        self.library.available = lambda: ids
        self.player.evaluator = lambda body: answer(body['state']['candidate_ids'][0])
        sequence = []
        for action in ['select', 'next', 'select', 'next', 'next', 'next']:
            result = self.player.select('minimal', action)
            self.assertNotIn(result['clip_id'], sequence[-3:])
            self.assertFalse(result['repeat_fallback'])
            self.player.played(result['ticket'])
            sequence.append(result['clip_id'])
        self.assertEqual(sequence, ids + ids[:2])

    def test_no_match_relaxes_oldest_first_and_sums_api_usage(self):
        ids = [f'pack/{letter}.mp4' for letter in 'abcd']
        self.library.clips = [{'id': cid, 'attributes': {}} for cid in ids]
        self.library.available = lambda: ids
        for cid in ids[:3]:
            self.player.evaluator = lambda _, cid=cid: answer(cid)
            event = self.player.select('test')
            self.player.played(event['ticket'])
        seen = []
        def evaluate(body):
            seen.append(body['state']['candidate_ids'])
            chosen = ids[0] if ids[0] in seen[-1] else 'no_match'
            return dict(answer(chosen), usage={'input_tokens': 100, 'output_tokens': 10})
        self.player.evaluator = evaluate
        result = self.player.select('test', 'next')
        self.assertEqual(seen, [[ids[3]], [ids[0], ids[3]]])
        self.assertTrue(result['repeat_fallback'])
        self.assertEqual(result['api_calls'], 3)  # Two clip judgments plus effects.
        self.assertEqual(result['usage']['input_tokens'], 200)
        self.assertEqual(len(self.player.history), 3)  # Retry attempts aren't playback.

    def test_two_clip_library_relaxes_without_repeating_current(self):
        self.library.available = lambda: [c['id'] for c in self.library.clips]
        self.player.evaluator = lambda body: answer(body['state']['candidate_ids'][0])
        choices = []
        for _ in range(4):
            event = self.player.select('test', 'next')
            choices.append(event['clip_id'])
            self.player.played(event['ticket'])
        self.assertEqual(choices, ['pack/a.mp4', 'pack/b.mov'] * 2)
        self.assertTrue(event['repeat_fallback'])

    def test_cancel_during_no_match_does_not_launch_fallback(self):
        self.library.available = lambda: [c['id'] for c in self.library.clips]
        event = self.player.select('test')
        self.player.played(event['ticket'])
        calls = []
        def evaluate(body):
            calls.append(body)
            self.player.cancel()
            return answer('no_match')
        self.player.evaluator = evaluate
        with self.assertRaises(Problem): self.player.select('test')
        self.assertEqual(len(calls), 1)
        self.assertEqual(len(self.player.history), 1)

    def test_invalid_or_unavailable_answers_preserve_playback(self):
        for chosen in ['pack/b.mov', 'invented', 'keep']:
            self.player.evaluator = lambda _, chosen=chosen: answer(chosen)
            with self.assertRaises(Problem): self.player.select('test')
            self.assertFalse(self.player.busy)
            self.assertEqual(self.player.history, [])
            self.assertIsNone(self.player.pending)

    def test_api_failure_and_no_match_preserve_history(self):
        selected = self.player.select('red')
        self.player.played(selected['ticket'])
        def fail(_): raise Problem('failed', 502)
        self.player.evaluator = fail
        with self.assertRaises(Problem): self.player.select('test')
        for chosen, outcome in [('pack/a.mp4', 'keep'), ('no_match', 'no_match')]:
            self.player.evaluator = lambda _, chosen=chosen: answer(chosen)
            self.assertEqual(self.player.select('next')['outcome'], outcome)
            self.assertEqual(self.player.last_selection['outcome'], outcome)
        self.assertEqual(len(self.player.history), 1)
        self.assertEqual(self.player.current, 'pack/a.mp4')

    def test_cancel_discards_inflight_answer_and_old_ticket(self):
        old = self.player.select('red')
        self.player.cancel()
        with self.assertRaises(Problem): self.player.played(old['ticket'])
        entered, release = threading.Event(), threading.Event()
        errors = []
        def evaluate(_):
            entered.set()
            release.wait(3)
            return answer('pack/a.mp4')
        def select():
            try: self.player.select('test')
            except Problem as e: errors.append(e.status)
        self.player.evaluator = evaluate
        worker = threading.Thread(target=select)
        worker.start()
        self.assertTrue(entered.wait(2))
        with self.assertRaises(Problem): self.player.select('second')
        self.player.cancel(clear=True)
        release.set()
        worker.join(3)
        self.assertEqual(errors, [409])
        self.assertFalse(self.player.busy)
        self.assertEqual(self.player.history, [])
        self.assertIsNone(self.player.pending)

    def test_input_rejected_before_api(self):
        for value in [None, '', ' ', 123, 'a' * 1001]:
            with self.assertRaises(Problem): self.player.select(value)

    def test_byte_ranges(self):
        for header, expected in [(None, (0,9,200)), ('bytes=2-5',(2,5,206)), ('bytes=8-',(8,9,206)), ('bytes=-3',(7,9,206)), ('bytes=0-99',(0,9,206))]:
            self.assertEqual(byte_range(header,10), expected)
        for header in ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'wrong']:
            with self.assertRaises(Problem): byte_range(header,10)

    def test_library_resolves_nested_unique_files_and_rejects_ambiguous_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'ducky3d/nested').mkdir(parents=True)
            (root/'ducky3d/nested/animation 1.mp4').touch()
            library = Library(root=root, cache=root/'cache')
            self.assertEqual(library.available(), ['ducky3d/animation 1.mp4'])
            (root/'ducky3d/animation 1.mp4').touch()
            library.scan()
            self.assertEqual(library.available(), [])


class PlayerHTTPTests(unittest.TestCase):
    def test_media_ranges_and_request_boundaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            library = FakeLibrary()
            library.path = Path(tmp)/'clip.mp4'
            library.path.write_bytes(b'0123456789')
            player = Player(library, evaluator=lambda _: answer('pack/a.mp4'), effect_evaluator=effects_off)
            server = create_server(0, player)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            conn = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=3)
            def request(method, path, body=None, headers=None):
                conn.request(method, path, body, headers or {})
                res = conn.getresponse()
                return res.status, dict(res.getheaders()), res.read()
            try:
                status, headers, data = request('GET', '/media/asset-key', headers={'Range':'bytes=2-5'})
                self.assertEqual((status,data), (206,b'2345'))
                self.assertEqual(headers['Content-Range'], 'bytes 2-5/10')
                self.assertEqual(request('HEAD','/media/asset-key')[2], b'')
                self.assertEqual(request('GET','/media/asset-key',headers={'Range':'bytes=99-'})[0],416)
                self.assertEqual(request('GET','/media/../../etc/passwd')[0],404)
                self.assertEqual(request('GET','/api/status',headers={'Host':'evil.example'})[0],403)
                self.assertEqual(request('POST','/api/select','{}',{'Content-Type':'application/json'})[0],403)
                headers = {'Content-Type':'application/json', 'X-Jev-Token':player.token, 'Origin':'https://evil.example'}
                self.assertEqual(request('POST','/api/select','{}',headers)[0],403)
                headers.pop('Origin')
                status, _, data = request('POST','/api/select',json.dumps({'prompt':'red'}),headers)
                self.assertEqual(status,200)
                ticket = json.loads(data)['ticket']
                self.assertEqual(request('POST','/api/played',json.dumps({'ticket':ticket}),headers)[0],200)
                with patch('player_server.read_key', return_value='test-key'):
                    status, _, data = request('GET','/api/status')
                self.assertNotIn(b'test-key',data)
                self.assertEqual(json.loads(data)['current_asset'],'asset-key')
            finally:
                conn.close()
                server.shutdown()
                server.server_close()
                thread.join(3)


if __name__ == '__main__': unittest.main()
