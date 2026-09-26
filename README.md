# Jev VJ

A local VJ player controlled with natural language. Jev selects clips using their metadata and playback history; VFX-JS applies effects in the browser. Resolume is optional.

A deck stacks the current clip, four candidate previews, and a prompt. Here, a **clip** is footage plus effects. Typing requests candidates at most once per second, with one request in flight; stale responses are discarded. Jev ranks footage, then selects effects for each of the top four candidates. Click a preview to play that exact combination. Typing never switches the current output. Fewer candidates appear when fewer options are available. Deck ranking offers only playable footage choices and shows the closest alternatives, even for imperfect matches; it does not include a “no match” choice. Suggestions are not guarantees that every requested attribute is satisfied.

Try “calm ambient”, “more minimal”, “build up gradually”, or “add subtle trails”. Relative prompts compare against the currently playing footage and effects. The deck sits on the left; effect controls and playback history scroll independently on the right.

## Setup

Run the app on the computer that holds your videos. You need Git, Node.js 22.12+ with npm, a [TypeSafe API key](https://console.typesafe.ai/), and a browser with WebGL2 support.

**1. Clone**

```sh
git clone https://github.com/fand/jev-vj.git
cd jev-vj
```

**2. Configure your API key**

```sh
cp .env.example .env
```

Open `.env` and set your key:

```dotenv
TYPESAFE_API_KEY=your_api_key_here
```

`.env` is Git-ignored. Environment variables take precedence over values in this file.

**3. Install**

```sh
npm i
```

This installs the app and platform-specific ffmpeg/ffprobe binaries. Python and a separate ffmpeg installation are not required for the deck or Library.

**4. Run**

```sh
npm run dev
```

Open [localhost:4319/library](http://127.0.0.1:4319/library). The dev command builds browser assets automatically, starts the local Node server, and rebuilds bundled browser code when it changes. Reload the page after a rebuild. Restart the command after changing backend code or `.env`. Stop with Ctrl+C.

For another port, use `npm run dev -- --port 4320`. An optional `MEDIA_ROOT` in `.env` (or `--media-root "/path/to/videos"`) seeds matching bundled metadata on first use; it is not needed to start. Existing `.library/footage.csv` and media-folder settings are reused automatically.

### Add footage and play

1. Under **Media folders**, enter the absolute paths of folders containing your footage, one per line, and click **Set folders**. Paths starting with `~/` work too.
2. Drop videos onto **Drop videos here**, or paste file/folder paths into **Add file or folder paths** and click **Add paths**. Folder imports include videos in subfolders.
3. Fill in each video's `desc` cell. Jev only suggests footage with a nonblank description. Add an optional source `bpm` for beat-driven loops; leave it blank otherwise.
4. Click **Save changes**. The catalog stays in `.library/footage.csv`; videos stay at their original paths.
5. Click **Deck ↗**, type a direction such as “calm ambient”, and wait for previews. Click a candidate to play it, or press Escape and use **1–4**. Typing updates suggestions without switching the output.

A fresh library starts empty. Keep external media drives connected while playing. Initial video conversion can take a while. Set the performance BPM with **Tap**, or double-click the number to enter it. Use **↗** in NOW PLAYING to open the output window for a second display.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Library or effects fail to load | Check the dev terminal for a build error, run `npm i`, and restart `npm run dev`. |
| TypeSafe API key is not configured | Fill in `.env`, check for an overriding environment variable, and restart. |
| Port 4319 is already in use | Stop the previous server, or use `npm run dev -- --port 4320`. |
| Video conversion fails | Check the source file. Run `npm i` to restore bundled video tools; custom binaries can be set with `FFMPEG_PATH` and `FFPROBE_PATH`. |
| Dropped files cannot be located | Register their containing folder under **Media folders**, or paste their paths under **Add file or folder paths**. |
| Footage is missing from suggestions | Add a description and save. Reconnect offline drives, then click **Rescan** on the deck. |

Jev receives prompts, metadata, and history—not video files. API keys stay on the server. Playback history and effect state reset when the server restarts. Voice input and music analysis are not implemented.

Videos that need conversion are cached as H.264 previews in `.player-cache/`. Originals are unchanged; previews do not preserve alpha or master quality. The cache has no automatic cleanup.

See [PLAYER.md](PLAYER.md) for detailed behavior and controls (Japanese).

Tap four times within five seconds to set BPM. The latest four taps provide three intervals to average; fewer than four retains the previous tempo. Double-click the BPM value to enter a positive number, including decimals. Enter or blur applies it; Escape cancels. Resync restarts current footage and candidate previews from the first frame without changing BPM.

Edit source tempos in Library’s BPM column. Before Library is initialized, tempos come from [clip-bpm.md](clip-bpm.md). Annotated footage plays at `Tap BPM / source BPM`, including candidate previews; blank or omitted footage stays at 1×. BPM defaults to 120 on page load. Decimal source BPMs are preserved. Save Library changes, or click Rescan after editing its CSV externally. Tap updates speed without seeking or restarting the clip.

## Library

Open [Library](http://127.0.0.1:4319/library) from the deck header. Set **Media folders**, then drop video files or use **Add file or folder paths**. Originals remain in place. The browser cannot reveal a dropped file’s absolute path, so the local server matches its filename and size within the registered folders. Multiple matches require a choice; unmatched files need another folder or an explicit path. No video bytes are uploaded.

Select a row to preview its video; double-click a cell to edit. The table uses [Tabulator](https://tabulator.info/). Name, path, BPM and description are core columns; add or remove custom attribute columns with the toolbar. BPM is optional. A blank description excludes the footage from Jev suggestions, but it remains available for preview and editing.

**Save changes** writes `.library/footage.csv` and notifies open deck tabs to use the catalog for subsequent suggestions. Existing candidate tickets expire; current playback continues. Editing is local until saved. Export CSV saves first, then downloads a copy. Imported paths are deduplicated; reimporting footage preserves its descriptions and BPMs. IDs stay stable when names are edited. The CSV preserves quoted text, commas, multiline descriptions, Unicode and custom columns. Concurrent edits from another window are rejected rather than overwritten.

On first use with `MEDIA_ROOT` configured, existing located footage, notes and BPMs migrate to CSV; the old files are retained. Thereafter the CSV is the catalog source of truth. Existing derived attributes are reused only while the original description is unchanged. Edited descriptions and custom attribute columns become Jev context directly, without carrying over stale derived claims. Paths stay local. New descriptions do not trigger a separate AI extraction step.

`.library/` also contains media-folder settings and is Git-ignored. Do not publish it: it contains your local paths and notes. Removing rows never deletes original footage. Offline media stays listed; reconnect the drive and rescan. Previews use the same H.264 conversion cache as the deck.

## Live controls

Candidates share one warmed video/FX renderer between their thumbnail and the live output. Preparation also caches the first rendered frame. A cue restarts the existing decoder and switches output immediately; ticket confirmation and history updates follow. Idle candidates render at up to 20 fps, and the playing clip renders every animation frame. This uses more GPU memory than small preview-only renderers; replacing candidates releases unused renderers while preserving the playing clip.

The Transition slider beside Tap sets a 0–1 second crossfade (default 0.30s). Both clips and their effects keep playing during the fade.

| Key | Action |
| --- | --- |
| 1–4 / click | Cut to a ready candidate |
| Shift+1–4 / Shift-click | Crossfade to a candidate |
| Hold 0 | Black out the master output; release to reveal the playing clip |
| Hold 8 / 9 | White / black strobe at 12 Hz |
| Space / Escape | Focus and select all prompt text / leave an input |
| + / − | Increase / decrease transition duration by 0.05s |

Performance shortcuts are disabled while editing text, numbers, sliders, or menus. Clips keep playing and switching while 0 is held. Releasing 0 restores output without restarting playback. Leaving the window releases blackout and strobes.

Click ↗ in the stage to open the live output window. Move it to your second display, then click Fullscreen or double-click its video. The window shares the final 1280×720 output, including effects, crossfades, blackout, and strobes. While the popup is connected, NOW PLAYING shows a placeholder and its canvas is not drawn. The final composite is rendered only to the popup stream; source video and FX keep running. Closing or pausing the popup restores the deck preview. Keep the deck window open. Popup and fullscreen support depend on the browser; use Chrome if an embedded browser does not open a window.

On desktop, the deck fits the viewport while the right column scrolls independently. Short windows use compact candidate cards and prompt controls.

## Effects

RGB Shift, Twitch, Hue, Flip, Mirror, Trails, Edge, Colorize, Halftone, Colorama, Hatched, Invert, LoRez, Shift Glitch, and Strobe.

Strobe controls: frequency (0–30 Hz; 0 disables flashing), flash duty, amount, and black/white mode. It runs after Trails and color effects; timing is independent of music.

“Colorful” does not force Colorama: source colors or removing a tint may be enough. When Jev selects a new Rainbow preset, it uses 0.4 mix and 0.4 speed (0.6 for faster cycling). Manual settings remain adjustable.

The same prompt drives clip and effect selection. Relative instructions compare against the current clip and effects; recent playback history helps avoid repetition.

`npm run dev` rebuilds effect code automatically. Reload the page to use the new bundle. `npm run build` is available for a one-off build and type check.

## Checks

```sh
npm run check
npm run test:twitch
npm run test:shift-glitch
npm run test:deck
npm run test:tempo
npm run test:performance
npm run test:cue
npm run test:strobe
npm run test:backend
```

With the player running, open [the GPU checks](http://127.0.0.1:4319/effects-smoke.html).

## Optional Resolume Arena bridge

The original OSC bridge is legacy and runs separately. Only this optional bridge requires Python 3.9+:

```sh
python3 server.py
```

Open [localhost:4318](http://127.0.0.1:4318/). Enable Arena's OSC input on port 7000. The bundled `catalog.json` targets Arena 7.3.2's Example / Generators deck: five sources on Layer 1 and eight Composition Dashboard knobs. Update the catalog to match your deck and knob links; higher layers are left untouched.

Selecting an effect overwrites all eight mapped knobs. Relative changes use the bridge's last sent state; manual changes in Arena are not detected. Successful OSC transmission does not confirm rendering, and a UDP failure can leave a partially applied change. Canceling a pending decision does not undo commands already sent.

Both servers bind to localhost and keep credentials server-side. Press Ctrl+C to stop them.

## Repository contents

Code, tests, documentation, and selection metadata only. Keep API keys, `.env`, footage, extracted frames, thumbnails, and caches out of Git. `.env.example` is an empty template.

This repository started from a filtered snapshot. Publish updates here without importing the original workspace's history, which contains media.

Jev first classifies each prompt as a new theme or an adjustment. New themes choose effects from scratch; adjustments receive current effects and recent presentations. This judgment is shared by all four candidates. Existing playback changes only when you choose a candidate.
