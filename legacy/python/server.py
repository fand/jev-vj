"""Local Jev -> Resolume OSC bridge. Python 3.9+, standard library only."""
import argparse
import json
import math
import os
from pathlib import Path
import secrets
import socket
import ssl
import struct
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

LEGACY_DIR = Path(__file__).resolve().parent
ROOT = LEGACY_DIR.parents[1]


class Problem(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def read_key():
    if os.environ.get('TYPESAFE_API_KEY'):
        return os.environ['TYPESAFE_API_KEY'].strip()
    # Reuse the existing project key without copying or exposing it to the browser.
    for path in (ROOT / '.env', ROOT.parent / 'jev-avatar-feed' / '.env'):
        if path.exists():
            for line in path.read_text().splitlines():
                name, sep, value = line.removeprefix('export ').partition('=')
                if sep and name.strip() == 'TYPESAFE_API_KEY' and value.strip():
                    return value.strip().strip('\"\'')
    return ''


def osc(address, value):
    def string(text):
        data = text.encode() + b'\0'
        return data + b'\0' * (-len(data) % 4)
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError('Invalid OSC number')
    kind = 'i' if type(value) is int else 'f'
    return string(address) + string(',' + kind) + struct.pack('>' + kind, value)


def questions(catalog):
    keep = {'keep': 'Leave unchanged. No relevant instruction, or no matching option.'}
    def choice(instructions, criteria):
        return {'type': 'choice', 'instructions': instructions, 'criteria': criteria}
    return {
        'scope': choice('Classify WHEN the operator wants this command executed. A requested future cue must select later even if the visual operation itself is available. Separately, unsupported operations select unsupported. This controller supports only source selection and one effect look, immediately.', {
            'now': 'Execute immediately, with no future cue or condition. Source, effect or strength adjustment.',
            'later': 'Wait for a future cue, beat, bar or condition: 次のドロップで、次の小節で、サビになったら、あとで、10秒後、on the next drop/bar/beat, when the chorus starts.',
            'unsupported': 'Explicit future timing, music synchronization, custom colors, file loading, multiple simultaneous effect looks, unrelated request or instructions to bypass this interface.'}),
        'clip': choice('Which SOURCE imagery is requested in user_text? Source and effect may both be requested: select the source even when the same command also changes/removes effects. Aurora / オーロラ means aurora; organic liquid means metaballs; geometric lines means lines. Only an effect-only command or 映像はそのまま means keep. Choose from these sources.', {
            **{k: v['name'] + ': ' + v['description'] for k, v in catalog['clips'].items()}, **keep}),
        'effect': choice('Select the composition effect look matching user_text. If effects are not mentioned or implied, keep. Clean/off means clean. Strength-only changes mean keep. A new effect replaces the previous Dashboard effect look.', {
            **{k: v['description'] for k, v in catalog['effects'].items()}, **keep}),
        'strength': choice('Select the strength requested for the EFFECT (not source size or brightness). For a newly requested effect without an explicit strength choose medium. For a source-only command choose keep. Read Japanese and English.', {
            'keep': 'No strength change; or no effect instruction.',
            'down': 'Weaker than before, reduce current strength.',
            'up': 'Stronger than before, increase current strength.',
            'soft': 'Subtle, weak, restrained effect.',
            'medium': 'Moderate, balanced effect.',
            'strong': 'Strong, pronounced effect.'})
    }


def infer(text, last_sent, catalog, key):
    if not key:
        raise Problem('TYPESAFE_API_KEY が未設定です。READMEの設定方法を確認してください。', 503)
    qs = questions(catalog)
    # Parse the requested change independently of old selections. Code resolves
    # keep/up/down using send history; old imagery otherwise biases new choices.
    body = {'model': 'jev-latest', 'state': {'user_text': text}, 'questions': qs}
    request = Request('https://api.typesafe.ai/v1/systemone', json.dumps(body).encode(),
                      {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem') if Path('/etc/ssl/cert.pem').exists() else ssl.create_default_context()
    try:
        with urlopen(request, timeout=20, context=ctx) as response:
            data = json.load(response)
    except HTTPError as error:
        raise Problem('Jev API エラー HTTP ' + str(error.code), 502) from None
    except (URLError, TimeoutError):
        raise Problem('Jevへの接続が失敗しました。再試行してください。', 502) from None
    answers = data.get('answers', {})
    for name, question in qs.items():
        answer = answers.get(name, {})
        if answer.get('type') != 'choice' or answer.get('choice') not in question['criteria']:
            raise Problem('Jev応答が不正です。Arenaへは送信しません。', 502)
    return {name: answer['choice'] for name, answer in answers.items() if name in qs}, data.get('usage')


def plan(selection, previous, catalog):
    # Validate all choices before emitting even one UDP packet.
    for name, question in questions(catalog).items():
        if selection.get(name) not in question['criteria']:
            raise Problem('無効な選択です。')
    if selection['scope'] != 'now':
        raise Problem('今回は即時のソース・効果操作に対応しています。予約、音楽同期、色指定、複数効果の組合せは未対応です。')
    result = dict(previous)
    packets = []
    clip = selection['clip']
    if clip != 'keep':
        source = catalog['clips'][clip]
        packets.append((f"/composition/layers/{catalog['layer']}/clips/{source['column']}/connect", 1))
        result['clip'] = clip
    effect, strength = selection['effect'], selection['strength']
    if effect != 'keep' or strength != 'keep':
        effect = previous.get('effect') if effect == 'keep' else effect
        if effect is None:
            raise Problem('調整する効果を指定してください（例：万華鏡を弱く）。')
        base = previous.get('strength', 0.6)
        amount = {'keep': base, 'down': max(0.0, base - 0.25), 'up': min(1.0, base + 0.25),
                  'soft': 0.25, 'medium': 0.6, 'strong': 1.0}[strength]
        targets = catalog['effects'][effect]['links']
        packets += [(f'/composition/dashboard/link{i}', float(targets.get(str(i), 0) * amount)) for i in range(1, 9)]
        result.update(effect=effect, strength=amount)
    return packets, result


class Bridge:
    def __init__(self, sender=None, evaluator=infer):
        self.catalog = json.loads((LEGACY_DIR / 'catalog.json').read_text())
        self.lock = threading.Lock()
        self.busy = False
        self.generation = 0
        self.last_sent = {}
        self.history = []
        self.evaluator = evaluator
        self.sender = sender or self.send
        self.token = secrets.token_urlsafe(32)

    @staticmethod
    def send(packets):
        encoded = [osc(address, value) for address, value in packets]
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            for packet in encoded:
                sock.sendto(packet, ('127.0.0.1', 7000))

    def status(self):
        with self.lock:
            return dict(token=self.token, ready=bool(read_key()), busy=self.busy,
                        catalog=self.catalog, last_sent=dict(self.last_sent), history=list(self.history))

    def cancel(self, reset=False):
        with self.lock:
            self.generation += 1
            if reset:
                self.sender([(f'/composition/dashboard/link{i}', 0.0) for i in range(1, 9)])
                self.last_sent.update(effect='clean', strength=0.6)
            return {'message': '効果をリセットしました。' if reset else '待機中の判断を取り消しました。映像は維持します。'}

    def run(self, text):
        if not isinstance(text, str) or not 1 <= len(text.strip()) <= 1000:
            raise Problem('指示は1〜1000文字で入力してください。')
        with self.lock:
            if self.busy:
                raise Problem('処理中です。少し待って再送してください。', 409)
            self.busy = True
            version = self.generation
            previous = dict(self.last_sent)
        start = time.monotonic()
        try:
            selection, usage = self.evaluator(text.strip(), previous, self.catalog, read_key())
            packets, next_state = plan(selection, previous, self.catalog)
            with self.lock:
                if version != self.generation:
                    raise Problem('取り消した指示です。Arenaへは送信しません。', 409)
                try:
                    self.sender(packets)
                except OSError:
                    self.last_sent = {}  # UDP might have partially sent; do not assert a final state.
                    raise Problem('OSC送信に失敗しました。Arenaの状態を確認してください。', 502) from None
                self.last_sent = next_state
                event = {'text': text.strip(), 'selection': selection, 'last_sent': dict(next_state),
                         'packets': packets, 'ms': round((time.monotonic() - start) * 1000), 'usage': usage,
                         'message': 'OSC送信済み（Arenaの受信確認なし）' if packets else '変更なし'}
                self.history = ([event] + self.history)[:20]
                return event
        finally:
            with self.lock:
                self.busy = False


def create_server(port=4318, bridge=None):
    bridge = bridge or Bridge()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def reply(self, body, status=200, content_type='application/json'):
            data = json.dumps(body, ensure_ascii=False).encode() if content_type == 'application/json' else body
            self.send_response(status)
            self.send_header('Content-Type', content_type + '; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(data)

        def valid_host(self):
            return self.headers.get('Host') in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')

        def do_GET(self):
            if not self.valid_host():
                return self.reply({'error': 'Invalid host'}, 403)
            if self.path == '/api/status':
                return self.reply(bridge.status())
            files = {'/': ('index.html', 'text/html'), '/app.js': ('app.js', 'text/javascript'), '/style.css': ('style.css', 'text/css')}
            if self.path not in files:
                return self.reply({'error': 'Not found'}, 404)
            name, kind = files[self.path]
            self.reply((LEGACY_DIR / name).read_bytes(), content_type=kind)

        def do_POST(self):
            try:
                origin = self.headers.get('Origin')
                allowed = [f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}']
                if not self.valid_host() or (origin is not None and origin not in allowed) or not secrets.compare_digest(self.headers.get('X-Jev-Token', ''), bridge.token):
                    raise Problem('Forbidden', 403)
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    raise Problem('JSON required', 415)
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 8192:
                    raise Problem('Invalid body size', 413)
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict):
                    raise Problem('JSON object required')
                if self.path == '/api/command':
                    result = bridge.run(body.get('text'))
                elif self.path in ('/api/cancel', '/api/reset'):
                    result = bridge.cancel(reset=self.path == '/api/reset')
                else:
                    raise Problem('Not found', 404)
                self.reply(result)
            except Problem as error:
                self.reply({'error': str(error)}, error.status)
            except (ValueError, TypeError):
                self.reply({'error': '入力または応答形式が不正です。'}, 400)
            except Exception:
                self.reply({'error': '処理に失敗しました。Arenaの状態を確認してください。'}, 500)

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = True
    return server


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4318)
    args = parser.parse_args()
    server = create_server(args.port)
    print(f'Jev × Arena: http://127.0.0.1:{server.server_port} — Ctrl+C to stop', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
