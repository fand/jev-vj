import math
import unittest

from effect_selection import controls, presets, validate_chain, select_effects
from player_server import Player, Problem

def adjust_intent(_):
    return {'answers':{'effect_mode':{'type':'choice','choice':'adjust'}}}



def clip_answer(choice):
    return {'answers': {'clip': {'type': 'choice', 'choice': choice, 'probabilities': {choice: 1}}}}


def effects_off(body):
    return {'answers': {key: {'type': 'choice', 'choice': 'off'} for key in body['questions']}}


def trails_medium(body):
    answer = effects_off(body)
    answer['answers']['trails'] = {'type': 'choice', 'choice': 'medium'}
    return answer


class FakeLibrary:
    clips = [{'id': 'pack/a.mp4', 'attributes': {}}]
    axes = {}

    def available(self):
        return ['pack/a.mp4']

    def prepare(self, _clip_id):
        return 'asset-key'

    def job(self, key):
        if key != 'asset-key':
            raise Problem('Not found', 404)
        return {'state': 'ready', 'path': None, 'error': None}

    def public(self, clip_id):
        return {'id': clip_id, 'name': 'a.mp4', 'pack': 'pack'}


class EffectStateTests(unittest.TestCase):
    def test_multicolor_palette_removes_current_single_tint(self):
        current = [{'id':'colorize','params':{'hue':0,'saturation':.8,'brightness':1},'mix':1}]
        def conflicting(body):
            result = effects_off(body)
            result['answers']['colorize']['choice'] = 'keep'
            result['answers']['colorama']['choice'] = 'rainbow'
            return result
        chain, _ = select_effects(conflicting, 'make it colurful', {}, current, [])
        self.assertEqual([item['id'] for item in chain], ['colorama'])
        self.assertEqual(chain[0]['params'], {'palette':0, 'frequency':1, 'speed':.4})
        self.assertEqual(chain[0]['mix'],.4)

    def test_colorful_can_use_source_palette_without_colorama(self):
        current=[{'id':'colorize','params':{'hue':0,'saturation':.8,'brightness':1},'mix':1}]
        chain,_=select_effects(effects_off,'Colorful',{'description':'Multicolored flowing neon'},current,[])
        self.assertEqual(chain,[])

    def test_rainbow_automatic_presets_are_light_and_animated(self):
        definition=next(d for d in controls() if d['id']=='colorama')
        for name,preset in presets(definition).items():
            setting=preset['setting']
            if setting['params']['palette']==0:
                self.assertEqual(setting['mix'],.4)
                self.assertGreaterEqual(setting['params']['speed'],.4)
            elif name.endswith('_cycle'):
                self.assertEqual(setting['params']['speed'],.08)
            else:
                self.assertEqual(setting['params']['speed'],0)

    def test_colorama_frequency_does_not_trigger_legacy_palette_mapping(self):
        for palette in range(5):
            params = {'palette':palette, 'frequency':8, 'speed':.2}
            chain = validate_chain([{'id':'colorama', 'params':params}])
            self.assertEqual(chain[0]['params'], params)

    def test_colorama_migrates_old_monochrome_palette(self):
        chain = validate_chain([{'id':'colorama','params':{'palette':3,'frequency':1,'offset':0,'repeat':2,'speed':.1}}])
        self.assertEqual(chain[0]['params'], {'palette':4,'frequency':1,'speed':.1})

    def test_shift_glitch_migrates_legacy_axis_to_partial_coverage(self):
        for vertical in [0,1]:
            p = validate_chain([{'id':'shift-glitch','params':{'amount':40,'bandSize':48,'vertical':vertical,'frequency':8}}])[0]['params']
            self.assertEqual(p['size'], 48)
            self.assertEqual(p['vertical'], .25 if vertical else 0)
            self.assertEqual(p['horizontal'], 0 if vertical else .25)
            self.assertNotIn('amount', p)
            self.assertNotIn('bandSize', p)


    def test_obsolete_blur_frequency_migrates_to_constant_motion_blur(self):
        params = validate_chain([{'id':'twitch','params':{'blurAmount':.7,'blurFreq':0},'mix':1}])[0]['params']
        self.assertEqual(params['blurAmount'], .7)
        self.assertNotIn('blurFreq', params)

    def test_legacy_twitch_settings_migrate_to_independent_controls(self):
        chain = validate_chain([{'id': 'twitch', 'params': {'amplitude': .22, 'frequency': 6,
            'duration': .09, 'axis': 1, 'zoom': .2, 'motionBlur': .8, 'seed': 1, 'mix': 1}, 'mix': 1}])
        params = chain[0]['params']
        self.assertEqual(params['posX'], .22)
        self.assertEqual(params['posY'], 0)
        self.assertEqual(params['scaleAmount'], .1)
        self.assertEqual(params['rgbAmount'], 0)
        self.assertEqual(params['lightAmount'], 0)
        self.assertNotIn('frequency', params)
        self.assertEqual(validate_chain(chain), chain)

    def test_validate_chain_rejects_unknown_ids_and_parameters(self):
        with self.assertRaises(ValueError):
            validate_chain([{'id': 'unknown', 'params': {}, 'mix': 1}])
        with self.assertRaises(ValueError):
            validate_chain([{'id': 'trails', 'params': {'unknown': 1}, 'mix': 1}])

    def test_validate_chain_rejects_nonfinite_and_out_of_range_values(self):
        for value in (math.nan, math.inf, -math.inf):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    validate_chain([{'id': 'trails', 'params': {}, 'mix': value}])
                with self.assertRaises(ValueError):
                    validate_chain([{'id': 'trails', 'params': {'halfLife': value}, 'mix': 1}])
        for item in (
            {'id': 'trails', 'params': {'halfLife': 0.01}, 'mix': 1},
            {'id': 'trails', 'params': {'halfLife': 11}, 'mix': 1},
            {'id': 'trails', 'params': {}, 'mix': -0.01},
            {'id': 'trails', 'params': {}, 'mix': 1.01},
        ):
            with self.subTest(item=item):
                with self.assertRaises(ValueError):
                    validate_chain([item])

    def test_presets_are_deterministic_valid_complete_configs(self):
        for definition in controls():
            with self.subTest(effect=definition['id']):
                first = presets(definition)
                self.assertEqual(first, presets(definition))
                self.assertTrue(first)
                keys = {control['key'] for control in definition['controls']}
                for preset in first.values():
                    setting = preset['setting']
                    self.assertEqual(setting['id'], definition['id'])
                    self.assertEqual(set(setting['params']), keys)
                    self.assertEqual(validate_chain([setting]), [setting])


class PlayerEffectStateTests(unittest.TestCase):
    def test_renderer_failure_records_raw_output_not_requested_effects(self):
        player = Player(FakeLibrary(), intent_evaluator=adjust_intent, evaluator=lambda _: clip_answer('pack/a.mp4'), effect_evaluator=trails_medium)
        selected = player.select('trails')
        self.assertTrue(selected['effects'])
        player.played(selected['ticket'], effects_failed=True)
        self.assertEqual(player.effects, [])
        self.assertEqual(player.history[-1]['effects'], [])
        self.assertTrue(player.history[-1]['effects_failed'])

    def make_playing_player(self, effect_evaluator=effects_off):
        player = Player(
            FakeLibrary(), intent_evaluator=adjust_intent,
            evaluator=lambda _: clip_answer('pack/a.mp4'),
            effect_evaluator=effect_evaluator,
        )
        selected = player.select('initial')
        player.played(selected['ticket'])
        return player

    def test_effect_update_commits_only_after_played_without_clip_history(self):
        player = self.make_playing_player()
        player.effect_evaluator = trails_medium
        history_len = len(player.history)

        event = player.select('long trails', action='effects')
        self.assertEqual(event['outcome'], 'effects_updated')
        self.assertEqual(player.effects, [])
        self.assertEqual(len(player.history), history_len)
        self.assertIsNotNone(player.pending)

        player.played(event['ticket'])
        self.assertEqual(player.effects[0]['id'], 'trails')
        self.assertEqual(len(player.history), history_len)

    def test_manual_effects_checks_current_revision_and_pending_state(self):
        player = Player(FakeLibrary(), intent_evaluator=adjust_intent, evaluator=lambda _: clip_answer('pack/a.mp4'), effect_evaluator=trails_medium)
        chain = validate_chain([{'id': 'invert', 'params': {}, 'mix': 1}])
        with self.assertRaises(Problem):
            player.manual_effects(chain, 'pack/a.mp4', 0)

        selected = player.select('initial')
        player.played(selected['ticket'])
        revision = player.effect_revision
        for clip_id, stale in [('wrong.mp4', revision), ('pack/a.mp4', revision - 1), ('pack/a.mp4', True)]:
            with self.subTest(clip_id=clip_id, revision=stale):
                with self.assertRaises(Problem):
                    player.manual_effects(chain, clip_id, stale)
        player.manual_effects(chain, 'pack/a.mp4', revision)
        self.assertEqual(player.effects, chain)
        self.assertEqual(player.effect_revision, revision + 1)

        event = player.select('trails', action='effects')
        with self.assertRaises(Problem):
            player.manual_effects(chain, 'pack/a.mp4', player.effect_revision)
        player.played(event['ticket'])

    def test_failed_or_invalid_effect_selection_preserves_current_state(self):
        for evaluator in (
            lambda _body: {'answers': {}},
            lambda _body: (_ for _ in ()).throw(Problem('effect API failed', 502)),
        ):
            with self.subTest(evaluator=evaluator):
                player = self.make_playing_player(trails_medium)
                before = (list(player.history), list(player.effects), player.effect_revision)
                player.effect_evaluator = evaluator
                with self.assertRaises(Problem):
                    player.select('change effects', action='effects')
                self.assertEqual((player.history, player.effects, player.effect_revision), before)
                self.assertIsNone(player.pending)

    def test_cancel_during_effect_evaluation_prevents_application(self):
        player = self.make_playing_player(trails_medium)
        before = (list(player.history), list(player.effects), player.effect_revision)

        def cancel_then_answer(body):
            player.cancel()
            return trails_medium(body)

        player.effect_evaluator = cancel_then_answer
        with self.assertRaises(Problem):
            player.select('more trails', action='effects')
        self.assertEqual((player.history, player.effects, player.effect_revision), before)
        self.assertIsNone(player.pending)


if __name__ == '__main__':
    unittest.main()
