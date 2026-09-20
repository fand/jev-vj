const $ = id => document.getElementById(id);
let token, catalog, ready = false;
const notice = (message, error = false) => { $('notice').textContent = message; $('notice').classList.toggle('error', error); };
function render(state) {
  token = state.token; catalog = state.catalog; ready = state.ready;
  $('connection').textContent = ready ? '● Jevキー設定済み / OSC → localhost:7000' : 'APIキー未設定';
  $('submit').disabled = !ready || state.busy;
  const last = state.last_sent;
  $('clip').textContent = catalog.clips[last.clip]?.name || '—';
  $('effect').textContent = catalog.effects[last.effect]?.name + (last.effect && last.effect !== 'clean' ? ` · ${Math.round(last.strength * 100)}%` : '') || '—';
  if (!last.effect) $('effect').textContent = '—';
  $('latency').textContent = state.history[0] ? `${state.history[0].ms} ms` : '—';
  $('clips').replaceChildren(...Object.entries(catalog.clips).map(([id, clip]) => {
    const el = document.createElement('div'); el.className = `clip${id === last.clip ? ' active' : ''}`;
    el.textContent = `${clip.column} / ${clip.name}`; return el;
  }));
  $('history').replaceChildren(...state.history.map(event => {
    const item = document.createElement('div'); item.className = 'history-item';
    const text = document.createElement('div'); text.textContent = event.text;
    const small = document.createElement('small');
    small.textContent = `${event.message} · ${event.ms} ms · ${event.packets.length} messages`;
    item.append(text, small); return item;
  }));
}
async function refresh() {
  const res = await fetch('/api/status');
  if (!res.ok) throw Error('常駐スクリプトに接続できません。');
  render(await res.json());
}
async function post(path, data = {}) {
  const res = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json','X-Jev-Token':token}, body:JSON.stringify(data) });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || '操作に失敗しました。');
  return result;
}
$('form').addEventListener('submit', async event => {
  event.preventDefault(); $('submit').disabled = true; notice('Jevが素材と効果を選んでいます…');
  try { const result = await post('/api/command', {text:$('prompt').value}); notice(result.message); }
  catch (error) { notice(error.message, true); }
  finally { try { await refresh(); } catch (error) { notice(error.message, true); } }
});
for (const action of ['cancel', 'reset']) $(action).addEventListener('click', async () => {
  try { notice((await post(`/api/${action}`)).message); await refresh(); }
  catch (error) { notice(error.message, true); }
});
for (const button of $('examples').querySelectorAll('button')) button.addEventListener('click', () => {
  $('prompt').value = button.textContent; $('prompt').focus();
});
refresh().catch(error => notice(error.message, true));
