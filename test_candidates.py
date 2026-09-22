"""Deck candidates are previews until explicitly chosen and played."""
import copy
import threading
import unittest

from player_server import Player, Problem
from test_player import FakeLibrary, effects_off

def adjust_intent(_):
    return {'answers':{'effect_mode':{'type':'choice','choice':'adjust'}}}



class DeckTests(unittest.TestCase):
    def setUp(self):
        self.library = FakeLibrary()
        self.ids = [f'pack/{letter}.mp4' for letter in 'abcdef']
        self.library.clips = [{'id': cid, 'attributes': {}} for cid in self.ids]
        self.library.available = lambda: self.ids
        self.player = Player(self.library, self.ranking, self.effects, intent_evaluator=adjust_intent)

    def ranking(self, body):
        ids = body['state']['candidate_ids']
        probabilities = {cid: (i+1)/30 for i, cid in enumerate(ids)}
        # Unknown or excluded IDs must never become playable, even with a high weight.
        probabilities['unknown.mp4'] = .99
        return {'answers': {'clip': {'type': 'choice', 'choice': ids[-1], 'probabilities': probabilities}},
                'usage': {'input_tokens': 100}}

    def effects(self, body):
        result = effects_off(body)
        if body['state']['selected_clip']['id'] == self.ids[-1]:
            result['answers']['trails']['choice'] = 'medium'
        result['usage'] = {'input_tokens': 10}
        return result

    def test_intent_is_shared_and_new_theme_has_no_effect_context(self):
        current = [{'id':'trails','params':{'feedback':.4},'mix':1}]
        self.player.current = self.ids[0]
        self.player.effects = copy.deepcopy(current)
        self.player.effect_history = [{'clip_id':self.ids[0],'effects':current}]
        for mode in ['new_theme', 'adjust']:
            intent_calls, seen = [], []
            def intent(body):
                intent_calls.append(body)
                return {'answers':{'effect_mode':{'type':'choice','choice':mode}}, 'usage':{'input_tokens':7}}
            def effects(body):
                seen.append(body)
                result = effects_off(body)
                if 'keep' in body['questions']['trails']['criteria']:
                    result['answers']['trails']['choice']='keep'
                result['usage']={'input_tokens':10}
                return result
            self.player.intent_evaluator=intent
            self.player.effect_evaluator=effects
            result=self.player.select('a visual direction','candidates')
            self.assertEqual(len(intent_calls),1)
            self.assertEqual(intent_calls[0]['state']['current_effects'],current)
            self.assertEqual(len(seen),4)
            self.assertEqual(result['effect_mode'],mode)
            self.assertEqual(result['usage']['input_tokens'],147)
            for body in seen:
                self.assertEqual(body['state']['effect_mode'],mode)
                self.assertEqual(body['state']['current_effects'],current if mode=='adjust' else [])
                self.assertEqual(bool(body['state']['recent_presentations']),mode=='adjust')
                self.assertEqual('keep' in body['questions']['trails']['criteria'],mode=='adjust')
            for card in result['candidates']:
                self.assertEqual(card['effects'],current if mode=='adjust' else [])
            self.assertEqual(self.player.effects,current) # Suggestions never mutate playback.

    def test_invalid_intent_stops_before_ranking_and_preserves_playback(self):
        self.player.current=self.ids[0]
        self.player.effects=[{'id':'trails','params':{'feedback':.4},'mix':1}]
        before=copy.deepcopy(self.player.effects)
        self.player.intent_evaluator=lambda _: {'answers':{}}
        self.player.evaluator=lambda _: self.fail('Ranking must not run after an invalid intent')
        with self.assertRaises(Problem) as error:
            self.player.select('new theme','candidates')
        self.assertEqual(error.exception.status,502)
        self.assertEqual(self.player.effects,before)
        self.assertEqual(self.player.current,self.ids[0])
        self.assertFalse(self.player.busy)

    def test_four_ranked_combinations_only_commit_on_playback(self):
        result = self.player.select('trails', 'candidates')
        candidates = result['candidates']
        self.assertEqual([c['clip_id'] for c in candidates], list(reversed(self.ids))[:4])
        self.assertEqual(candidates[0]['effects'][0]['id'], 'trails')
        self.assertEqual(candidates[1]['effects'], [])
        self.assertEqual(result['usage']['input_tokens'], 140)
        self.assertEqual(result['api_calls'], 6)
        self.assertIsNone(self.player.current)
        self.assertIsNone(self.player.pending)
        self.assertEqual(self.player.history, [])
        event = self.player.choose(candidates[0]['id'])
        self.assertIsNone(self.player.current)
        self.library.state = 'preparing'
        with self.assertRaises(Problem):
            self.player.played(event['ticket'])
        self.library.state = 'ready'
        self.player.played(event['ticket'])
        self.assertEqual(self.player.current, candidates[0]['clip_id'])
        self.assertEqual(self.player.effects, candidates[0]['effects'])
        self.assertEqual(self.player.prompt, 'trails')
        self.assertEqual(len(self.player.history), 1)
        # A different card in the same list stays selectable without a new inference.
        event = self.player.choose(candidates[1]['id'])
        self.player.played(event['ticket'])
        self.assertEqual(self.player.effects, [])
        self.assertEqual(len(self.player.history), 2)

    def test_new_prompt_expires_cards_but_preserves_current_clip_and_fx(self):
        card = self.player.select('old', 'candidates')['candidates'][0]
        self.player.played(self.player.choose(card['id'])['ticket'])
        before = copy.deepcopy((self.player.current, self.player.effects, self.player.history, self.player.prompt))
        seen = []
        def rank(body):
            seen.append(body['state'])
            return self.ranking(body)
        self.player.evaluator = rank
        self.player.select('more minimal', 'candidates')
        self.assertEqual(before, (self.player.current, self.player.effects, self.player.history, self.player.prompt))
        self.assertEqual(seen[0]['current_clip']['id'], card['clip_id'])
        self.assertEqual(seen[0]['current_effects'], card['effects'])
        with self.assertRaises(Problem):
            self.player.choose(card['id'])
        with self.assertRaises(Problem):
            self.player.choose({'id': card['id']})

    def test_cancel_during_effect_generation_drops_late_results(self):
        entered, release = threading.Event(), threading.Event()
        errors = []
        def effects(body):
            entered.set()
            self.assertTrue(release.wait(3))
            return effects_off(body)
        self.player.effect_evaluator = effects
        def recommend():
            try:
                self.player.select('test', 'candidates')
            except Problem as error:
                errors.append(error.status)
        worker = threading.Thread(target=recommend)
        worker.start()
        self.assertTrue(entered.wait(3))
        with self.assertRaises(Problem):
            self.player.select('new request', 'candidates')
        self.player.cancel()
        release.set()
        worker.join(3)
        self.assertFalse(worker.is_alive())
        self.assertEqual(errors, [409])
        self.assertEqual(self.player.candidates, {})
        self.assertFalse(self.player.busy)
        self.assertEqual(self.player.history, [])

    def test_top_four_includes_zero_weight_options_without_inventing_scores(self):
        self.player.evaluator = lambda body: {'answers': {'clip': {'type': 'choice',
            'choice': self.ids[0], 'probabilities': {cid: int(i == 0) for i, cid in enumerate(self.ids)}}}}
        cards = self.player.select('specific', 'candidates')['candidates']
        self.assertEqual(len(cards), 4)
        self.assertEqual([c['weight'] for c in cards], [1, 0, 0, 0])

    def test_no_match_small_library_and_failed_fx(self):
        self.library.available = lambda: self.ids[:2]
        self.assertEqual(len(self.player.select('minimal', 'candidates')['candidates']), 2)
        self.player.evaluator = lambda _: {'answers': {'clip': {'type':'choice','choice':'no_match','probabilities':{}}}}
        self.assertEqual(self.player.select('nonvisual', 'candidates')['candidates'], [])
        self.player.evaluator = self.ranking
        self.player.effect_evaluator = lambda _: {'answers': {}}
        with self.assertRaises(Problem):
            self.player.select('bad effects', 'candidates')
        self.assertFalse(self.player.busy)
        self.assertEqual(self.player.candidates, {})
        self.assertIsNone(self.player.pending)


if __name__ == '__main__':
    unittest.main()
