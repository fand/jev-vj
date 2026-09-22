import unittest
from player_server import parse_source_bpms, Problem


class SourceBpmTests(unittest.TestCase):
    notes = {
        'one/a.mp4': {'pack': 'One', 'filename': 'a.mp4'},
        'one/tile_dark.mp4': {'pack': 'One', 'filename': 'tile_dark.mp4'},
        'two/a.mp4': {'pack': 'Two', 'filename': 'a.mp4'},
        'two/b.mp4': {'pack': 'Two', 'filename': 'b.mp4'},
    }

    def test_pack_scoping_decimals_escaped_names_and_blanks(self):
        text = r'''## One
- a.mp4: 120
- tile\_dark.mp4: 158.52
## Two
- a.mp4: 180
- b.mp4:
'''
        self.assertEqual(parse_source_bpms(text, self.notes), {
            'one/a.mp4': 120, 'one/tile_dark.mp4': 158.52, 'two/a.mp4': 180})
        self.assertEqual(parse_source_bpms('', self.notes), {})

    def test_invalid_annotations_fail_instead_of_syncing_the_wrong_footage(self):
        for text in ['## One\n- a.mp4: 0', '## One\n- a.mp4: -120',
                     '## One\n- a.mp4: nan', '## One\n- a.mp4: inf',
                     '## One\n- a.mp4: fast', '## One\n- missing.mp4: 120',
                     '## One\n- a.mp4: 120\n- a.mp4: 180']:
            with self.subTest(text=text), self.assertRaises(Problem):
                parse_source_bpms(text, self.notes)
