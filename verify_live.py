"""Explicit live smoke test: calls Jev and changes the running Example composition."""
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from pathlib import Path

BASE = 'http://127.0.0.1:4318'
status = json.load(urlopen(BASE + '/api/status'))
token = status['token']


def post(text, origin=BASE, auth=token):
    request = Request(BASE + '/api/command', json.dumps({'text': text}).encode(),
                      {'Content-Type': 'application/json', 'X-Jev-Token': auth, 'Origin': origin})
    try:
        with urlopen(request, timeout=30) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)


report = []
for text, expected in [
    ('幾何学的な線に、強い万華鏡を', {'clip': 'lines', 'effect': 'kaleido', 'strength': 1.0}),
    ('映像はそのままで、効果を弱く', {'clip': 'lines', 'effect': 'kaleido', 'strength': 0.75}),
    ('静かなオーロラに。効果は消して', {'clip': 'aurora', 'effect': 'clean'}),
    ('有機的な液体に、弱い残像をかけて', {'clip': 'metaballs', 'effect': 'trails', 'strength': 0.25}),
]:
    code, result = post(text)
    assert code == 200, result
    assert all(result['last_sent'][key] == value for key, value in expected.items()), result
    if text.startswith('映像はそのまま'):
        assert not any('/connect' in path for path, _ in result['packets'])
    report.append(result)
    print(text, '->', result['selection'], str(result['ms']) + ' ms', flush=True)

before = json.load(urlopen(BASE + '/api/status'))['history']
assert post('次のドロップで万華鏡に切り替えて')[0] == 400
assert post('test', auth='wrong')[0] == 403
assert post('test', origin='https://other.example')[0] == 403
assert post('')[0] == 400
after = json.load(urlopen(BASE + '/api/status'))['history']
assert before == after, 'Rejected requests must not affect history or output'
Path(__file__).with_name('live-validation.json').write_text(json.dumps({
    'cases': report, 'deferred_rejected': True, 'auth_origin_validation': True,
}, ensure_ascii=False, indent=2))
print('Live API, OSC packet plans, rejection and HTTP authorization checks passed.')
