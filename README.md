# Jev VJ

A local VJ player controlled with natural language. Jev selects clips using their metadata and playback history; VFX-JS applies effects in the browser. Resolume is optional.

Try “calm ambient”, “more minimal”, “build up gradually”, or “add subtle trails”. Lock the current clip to change only its effects, or adjust effects manually.

## Setup

Requires Node.js, Python 3.9+, ffmpeg, ffprobe, and a TypeSafe API key.

```sh
git clone https://github.com/fand/jev-vj.git
cd jev-vj
npm ci
npm run build
cp .env.example .env
# Set TYPESAFE_API_KEY in .env, then start the player:
python3 player_server.py --media-root /path/to/vj
```

Open [localhost:4319](http://127.0.0.1:4319/).

**Footage is not included.** Supply the clips referenced in `clip-metadata/`, or update that catalog for your own collection. The player matches catalog entries to local files; it does not analyze new videos automatically.

Jev receives prompts, metadata, and history—not video files. API keys stay on the server. Playback history and effect state reset when the server restarts. Voice input and music analysis are not implemented.

Videos that need conversion are cached as H.264 previews in `.player-cache/`. Originals are unchanged; previews do not preserve alpha or master quality. The cache has no automatic cleanup.

See [PLAYER.md](PLAYER.md) for detailed behavior and controls (Japanese).

## Effects

RGB Shift, Twitch, Hue, Flip, Mirror, Trails, Edge, Colorize, Halftone, Colorama, Hatched, Invert, LoRez, and Shift Glitch.

The same prompt drives clip and effect selection. Relative instructions compare against the current clip and effects; recent playback history helps avoid repetition.

Rebuild with `npm run build` after changing effect code. This generates the browser bundle and shared control definitions.

## Checks

```sh
npm run check
npm run test:twitch
npm run test:shift-glitch
python3 -m unittest discover -s . -p 'test_*.py' -v
```

With the player running, open [the GPU checks](http://127.0.0.1:4319/effects-smoke.html).

## Optional Resolume Arena bridge

The original OSC bridge runs separately:

```sh
python3 server.py
```

Open [localhost:4318](http://127.0.0.1:4318/). Enable Arena's OSC input on port 7000. The bundled `catalog.json` targets Arena 7.3.2's Example / Generators deck: five sources on Layer 1 and eight Composition Dashboard knobs. Update the catalog to match your deck and knob links; higher layers are left untouched.

Selecting an effect overwrites all eight mapped knobs. Relative changes use the bridge's last sent state; manual changes in Arena are not detected. Successful OSC transmission does not confirm rendering, and a UDP failure can leave a partially applied change. Canceling a pending decision does not undo commands already sent.

Both servers bind to localhost and keep credentials server-side. Press Ctrl+C to stop them.

## Repository contents

Code, tests, documentation, and selection metadata only. Keep API keys, `.env`, footage, extracted frames, thumbnails, and caches out of Git. `.env.example` is an empty template.

This repository started from a filtered snapshot. Publish updates here without importing the original workspace's history, which contains media.
