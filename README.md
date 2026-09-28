# Jev VJ

<img width="2378" height="1884" alt="image" src="https://github.com/user-attachments/assets/5547e1d2-9dd8-467b-92bc-4f6de4a24012" />

A VJ app with Jev's **Choice** feature.

blog: https://in.amagi.dev/posts/jev-vj/

## Setup

Requires Git, Node.js 22.12+ with npm, a [TypeSafe API key](https://console.typesafe.ai/), and a WebGL2 browser. Run the app on the computer holding your footage.

```sh
git clone https://github.com/fand/jev-vj.git
cd jev-vj
cp .env.example .env
```

Set your key in `.env`:

```dotenv
TYPESAFE_API_KEY=your_api_key_here
```

Then install and start:

```sh
npm i
npm run dev
```

Open [Library](http://127.0.0.1:4319/library). Builds are automatic; npm installs ffmpeg and ffprobe too. Python and Resolume are optional. To use another port: `npm run dev -- --port 4320`.

## Add footage

Footage is not included or analyzed automatically.

1. In **Media folders**, enter folder paths, one per line, and click **Set folders**. Absolute paths and `~/` work.
2. Drop videos into Library, or paste file/folder paths under **Add file or folder paths** and click **Add paths**.
3. Double-click each `desc` cell and describe the video. Blank descriptions exclude footage from suggestions. Add a source `bpm` for rhythmic loops; leave it blank otherwise.
4. Click **Save changes**, then **Deck ↗**. Enter a prompt and click a ready candidate.

Select a Library row to preview it. You can add custom attribute columns and export CSV. Edits stay unsaved until you click **Save changes**; deleting a row never deletes the video.

The browser cannot provide a dropped file's absolute path. The server matches its name and size within your registered folders. If it cannot find a match, add the containing folder or paste the path directly.

Your catalog is saved in `.library/footage.csv`. Existing catalogs load automatically. Keep media drives connected; reconnect and click **Rescan** if footage goes missing.

## Live controls

| Key | Action |
| --- | --- |
| 1–4 / click | Cut to a ready candidate |
| Shift+1–4 / Shift-click | Crossfade to a candidate |
| Hold 0 | Black out output while clips keep playing |
| Hold 8 / 9 | White / black strobe |
| Space / Escape | Focus and select prompt text / leave an input |
| + / − | Adjust transition duration by 0.05s |

Shortcuts are disabled while editing inputs. The Transition slider sets a 0–1 second crossfade.

BPM defaults to 120. Tap four times within five seconds, or double-click the number to enter it. Footage with a source BPM plays at `deck BPM / source BPM`; other footage stays at its original speed. **Resync** restarts current footage and previews from the first frame.

Click **↗** in NOW PLAYING for a separate output window, then use **Fullscreen** on your second display. Keep the deck open. Its main preview pauses drawing while the output window is active; playback and effects continue.

## Effects

RGB Shift, Twitch, Hue, Flip, Mirror, Trails, Edge, Colorize, Halftone, Colorama, Hatched, Invert, LoRez, Shift Glitch, and Strobe.

Jev selects effects for each candidate from the same prompt. Adjust them manually in the right column. “Colorful” may use the source palette or Colorama; it does not force a particular effect. Strobe timing is independent of BPM.

## Local data

Jev receives prompts, descriptions, attributes, and history. Video files stay local, and the API key stays on the server. `.env`, `.library/`, and `.player-cache/` are Git-ignored; keep them private.

Videos needing conversion are cached as H.264 previews in `.player-cache/`. Originals stay unchanged. Converted previews do not preserve alpha or master quality, and the cache has no automatic cleanup. First-time preparation can take a while.

Playback history and effect state reset when the server restarts.

## Development

```sh
npm test        # Node tests
npm run build   # Type check and build
```

`npm run dev` rebuilds browser bundles when their source changes; reload the page afterward. Restart it after backend or `.env` changes. GPU checks are at [effects-smoke.html](http://127.0.0.1:4319/effects-smoke.html).

```text
src/client/     Deck, Library and output UI
src/server/     Local API and Jev selection
src/effects/    VFX-JS effects
scripts/        Development server and build
tests/         Node and browser GPU tests
data/          Bundled clip metadata
docs/          Guides and design notes
legacy/python/ Previous player and optional Resolume bridge
```

See the [player guide](docs/PLAYER.md) for implementation notes in Japanese, or the [legacy bridge guide](legacy/python/README.md) for Resolume setup.
