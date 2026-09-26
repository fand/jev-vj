import json
import struct
import threading
import unittest
from unittest.mock import patch
from server import Bridge, Problem, ROOT, osc, plan


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / 'legacy/python/catalog.json').read_text())
        self.selection = dict(scope='now', clip='lines', effect='kaleido', strength='soft')

    def test_osc_wire_encoding(self):
        packet = osc('/test', 1)
        self.assertEqual(packet, b'/test\0\0\0,i\0\0' + struct.pack('>i', 1))
        self.assertEqual(osc('/x', .5)[-4:], struct.pack('>f', .5))

    def test_effect_only_preserves_clip(self):
        packets, state = plan(dict(self.selection, clip='keep'), {'clip': 'aurora'}, self.catalog)
        self.assertFalse(any('/connect' in address for address, _ in packets))
        self.assertEqual(state['clip'], 'aurora')
        self.assertEqual(dict(packets)['/composition/dashboard/link5'], .85 * .25)
        self.assertEqual(sum(v != 0 for _, v in packets), 1)

    def test_source_only_keeps_manual_effects(self):
        packets, _ = plan(dict(self.selection, effect='keep', strength='keep'), {}, self.catalog)
        self.assertEqual(packets, [('/composition/layers/1/clips/3/connect', 1)])

    def test_relative_strength_is_bounded(self):
        packets, state = plan(dict(self.selection, clip='keep', effect='keep', strength='up'),
                              {'effect': 'trails', 'strength': .95}, self.catalog)
        self.assertEqual(state['strength'], 1)
        self.assertAlmostEqual(dict(packets)['/composition/dashboard/link8'], .7)

    def test_unknown_effect_cannot_be_adjusted(self):
        with self.assertRaises(Problem):
            plan(dict(self.selection, effect='keep', strength='down'), {}, self.catalog)

    def test_invalid_and_deferred_commands_send_nothing(self):
        for selection in (dict(self.selection, clip='invented'), dict(self.selection, scope='unsupported')):
            emitted = []
            b = Bridge(sender=emitted.extend, evaluator=lambda *args: (selection, {}))
            with self.assertRaises(Problem):
                b.run('test')
            self.assertEqual(emitted, [])
            self.assertFalse(b.busy)

    def test_cancel_discards_late_result(self):
        started, release = threading.Event(), threading.Event()
        emitted, errors = [], []
        def evaluate(*args):
            started.set()
            release.wait(3)
            return self.selection, {}
        b = Bridge(sender=emitted.extend, evaluator=evaluate)
        def run():
            try:
                b.run('test')
            except Problem as e:
                errors.append(e.status)
        thread = threading.Thread(target=run)
        thread.start()
        self.assertTrue(started.wait(2))
        with self.assertRaises(Problem):
            b.run('second command')
        b.cancel()
        release.set()
        thread.join(3)
        self.assertEqual(emitted, [])
        self.assertEqual(errors, [409])

    def test_api_failure_does_not_change_history_or_emit(self):
        emitted = []
        def fail(*args):
            raise Problem('API failed', 502)
        b = Bridge(sender=emitted.extend, evaluator=fail)
        b.last_sent = {'clip': 'lips'}
        with self.assertRaises(Problem):
            b.run('test')
        self.assertEqual(b.last_sent, {'clip': 'lips'})
        self.assertEqual(emitted, [])

    def test_partial_udp_failure_invalidates_cached_state(self):
        def fail(packets):
            raise OSError('send failed')
        b = Bridge(sender=fail, evaluator=lambda *args: (self.selection, {}))
        b.last_sent = {'clip': 'lips'}
        with self.assertRaises(Problem):
            b.run('test')
        self.assertEqual(b.last_sent, {})


if __name__ == '__main__':
    unittest.main()
