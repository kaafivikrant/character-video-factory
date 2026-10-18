# Character Video Factory

Local YAML → speech → deterministic Three.js character frames → H.264/AAC MP4.
No generated video, script generation, web UI, upload, voice cloning, or downloaded character assets.

**Current status:** builds and unit/media tests pass. A finished character video has **not** been produced in this environment: the execution sandbox blocks macOS speech services, localhost listeners, Chromium startup, and shell DNS. See [REPORT.md](REPORT.md) for verified results and limitations. Milestone commits are implementation checkpoints, not claims that blocked acceptance tests passed.

## Setup

Use a normal macOS terminal in this project directory, with Node 20+ (Node 22 recommended), pnpm, FFmpeg/ffprobe, and Chromium:

```sh
brew install node pnpm ffmpeg
pnpm install
pnpm exec playwright install chromium
pnpm run doctor
pnpm build
pnpm test
pnpm test:media
```

Use **`pnpm run doctor`**, since pnpm 10's built-in `doctor` shadows the package script. `pnpm run doctor --strict` returns a failing status for missing capabilities. The renderer detects an installed Playwright Chromium revision, or accepts `CHROMIUM_PATH`.

Direct dependencies are exact-pinned. This environment was assembled from existing package caches because DNS is unavailable; no reliable registry-generated lockfile is provided. `tools/restore-cache.cjs` and `tools/npm-cache.cjs` document that environment-specific recovery, not the normal installation procedure.

### Credentials and voice

Copy `.env.example` to `.env`, fill it locally, then export it in your shell:

```sh
set -a
source .env
set +a
pnpm render specs/sample_hook.yaml
```

`.env` is ignored. No credential from the conversation is stored. Do not paste secrets into specs or command-line arguments.

- `FISH_API_KEY`: Fish API key.
- `FISH_VOICE_HERO`, `FISH_VOICE_FRIEND`: authorized synthetic voice reference IDs (`reference_id` in the request). For this script, set `FISH_VOICE_HERO=d8a1340984ee4b63ad1ffae27a6a4339`.
- `FISH_MODEL`: engine name sent in the `model` header, normally `s2-pro` (or `s2.1-pro`). Do not put a voice/model ID here.
- `TTS_PROVIDER`: `auto`, `fish`, or `mock`.
- `auto` uses mock when key/reference is missing or Fish requests fail; every mock line is flagged.
- `fish` fails instead of silently substituting mock.
- Mock is macOS `say` → `afconvert`; it still needs functioning macOS speech services.

Fish integration follows the [official TTS endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech): JSON request, Authorization/model headers, per-line reference ID, tagged text and prosody. WAV is requested at 44.1 kHz and converted locally to 48 kHz mono. Pitch uses inline descriptions, never a numeric pitch parameter. Three retries follow the initial attempt. No voice model is selected or cloned automatically.

For a strict real-voice render, use `TTS_PROVIDER=fish` in `.env`. With `auto`, a Fish HTTP/network failure may fall back to mock speech; inspect `out/<id>/report.json` and make sure `MOCK` is `false` and every entry in `providers` is `fish` before using the video.

### Rhubarb

Download a macOS release from [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync/releases) and place its executable at `tools/rhubarb/rhubarb`. Preserve its accompanying files and license. If unavailable or a line fails, RMS-based lip sync is used and reported. Rosetta installation was not attempted because downloads are unavailable and the energy fallback is implemented.

## Commands

```sh
pnpm render specs/sample_hook.yaml
pnpm render specs/short_8s.yaml --dry
pnpm render specs/sample_hook.yaml --resume
pnpm batch 'specs/*.yaml' --resume
pnpm qa out/sample_hook
pnpm test:tts
```

`--dry` synthesizes speech, builds timeline/lips/captions and samples the renderer, but does not encode video. It still requires speech and browser access. It never reports a finished-video QA pass.

Batch processes one video at a time, continues after failures, writes `out/batch-summary.json`, and returns nonzero if all videos fail or no files match. Ctrl-C stops after the current video, closing its browser/encoder normally. Immediate mid-video cancellation and configurable concurrency are not implemented.

TTS and lip-sync stages use content-hash caches. `--resume` skips a completed matching spec with a passing report. Render/mux partial-stage recovery is not implemented; interrupted video encoding restarts. Delete `.cache/tts/` to force a voice re-synthesis. Cache files never include authentication tokens.

## Outputs

On a successful render, `out/<id>/` contains:

- `video.mp4`, `silent.mp4`, `audio.wav`
- `timeline.json`, `lipsync.json`, `captions.ass`
- `render.json` (GPU string, frame hashes, transport benchmark), `report.json`, `log.txt`
- `contact.png` (2-second frames with timestamps), `contact-timestamps.json`, and `stills/1.png`–`3.png`

`report.json` records explicit failure stages when rendering cannot complete. A missing artifact is a QA failure, not a skipped success.

## Spec reference

See the four files in `specs/`. `sample_hook.yaml` contains the requested 14-line fixture unchanged; its website is a placeholder. Output duration derives from measured audio, so sample names do not guarantee exactly 8 or 30 seconds.

| Field | Values / behavior |
|---|---|
| `id` | Letters, numbers, `_`, `-`; output directory name |
| `format` | `vertical` 1080×1920, `landscape` 1280×720, `classic` 964×720 |
| `fps`, `seed` | Default 30 and 7; all procedural variation is seeded |
| `scene` | `misty_lake_bridge`, `street_night`, `hdri:<name>` |
| `music` | Project-relative music path or null; ducked under voice |
| `characters` | 1–8 unique IDs, model, voice, position, facing, optional hoodie/pants hex colors |
| `lines[].speaker` | Must name a character |
| `text` | Spoken text; bracket directions are excluded from captions |
| `emotion`, `intensity` | Table below; intensity 0–1 |
| `pitch` | `flat`, `up`, `down`, `rise_end`, `fall_end`, `lively`; inferred when omitted |
| `speed` | 0.5–2; deterministic variation only when omitted |
| `shot` | `full`, `mid`, `close`, `auto` |
| `gesture` | See gesture list below |
| `pause_after` | 0–0.6 s; otherwise seeded 0.10–0.20 s |
| `tags` | Up to two extra free-form Fish descriptions, without brackets |
| `outro` | `type: card|none`, text, duration, hex background |
| `captions` | `style: bold_white|yellow_pop|boxed`, `max_words_per_chunk: 2..5` |

Unknown fields, invalid types, unknown speakers, path traversal and out-of-range values produce field-specific errors. `${ENV_NAME}` substitution applies only to voice fields, after YAML parsing.

### Emotion table

The tuning source is `src/timeline/emotion.ts`. Intensity scales expression and gesture weights, and the base speed delta from 1.0.

| Emotion | Voice descriptions | Base speed | Face | Gesture | Camera bias |
|---|---|---:|---|---|---|
| neutral | none | 1.00 | relaxed .1 | idle_sway | mid |
| deadpan | flat voice | .97 | relaxed .2 | hold_phone | mid |
| sad | sad, low voice | .92 | sad .8 | head_down | close |
| wistful | wistful, soft voice | .90 | sad .4, relaxed .4 | look_away | close |
| happy | cheerful | 1.05 | happy .8 | open_arms | mid |
| excited | excited, pitch up | 1.12 | happy 1, surprised .3 | big_gesture | full |
| angry | angry, emphasis | 1.08 | angry .9 | point | close |
| surprised | surprised | 1.05 | surprised .9 | step_back | close |
| embarrassed | embarrassed, pitch up | 1.00 | happy .3, sad .2 | hand_to_neck | close |
| defensive | defensive, emphasis | 1.08 | angry .4, surprised .3 | palm_out | mid |
| determined | firm | .95 | angry .3, relaxed .2 | hand_to_chest | mid |
| whisper | whispers | .90 | relaxed .3 | lean_in | close |

Other gestures: `slow_breath`, `shrug`. Tags are distributed in groups of at most two; short utterances combine remaining free-form descriptions so no directions are lost. Pitch is varied after two repeats. Camera cuts occur at line boundaries, at least 1.4 s apart; that minimum takes precedence over switching to a new speaker on very short lines.

## Adding your own VRM

Place a permissively licensed VRM at `assets/characters/hero.vrm`, log source/license in `assets/LICENSES.md`, and set the character's `model`. The optional `@pixiv/three-vrm` 3.5.5 dependency is bundled when installed. If the package/model cannot load, the original mannequin is used and reported. Both VRM 0.x and 1.x use three-vrm's loader, expressions and normalized bones; actual VRM visual compatibility has not been tested here. VRMA playback is not implemented.

The mannequin uses original primitive geometry, a hoodie, pants, articulated limbs, eyes/brows and an audio-driven mouth. It guarantees a model fallback, not a fallback for a blocked browser.

## Adding an HDRI or music

Put a licensed `.hdr` file in `assets/hdri/<name>.hdr` and select `scene: hdri:<name>`. Record its source and license. Missing HDRIs fall back to the lake. No Poly Haven HDRIs were downloaded because shell network access is blocked. Procedural scenes require no external assets.

Put licensed audio in `assets/music/`, select its project-relative path, and add a license line. Music is normalized near −22 LUFS and sidechain-ducked; the final mix targets −14 LUFS, −1.5 dBTP. QA measures the encoded AAC result.

## Rendering and QA details

The stage exposes `load(timeline)` and `renderFrame(i)`. It uses no animation loop or wall clock. JPEG frames go through an exposed Playwright binding to FFmpeg with backpressure. A second path uses browser WebCodecs and Mediabunny's MP4 muxer. A 30-frame full-transport benchmark checks the resulting H.264 pixel format and selects the faster available path. These browser paths compile but cannot be measured in this sandbox.

VideoToolbox is tested by an actual tiny encode; failure selects libx264 CRF 18. Captions are drawn on the composition canvas because the installed FFmpeg lacks both ASS and drawtext filters; ASS is still exported. The current implementation always uses that canvas-caption path.

QA checks codecs, dimensions/fps/duration, loudness/peak/silence, caption metadata, nonblank decoded frames, foreground/background character difference, lip-track motion, sampled silent-mouth state, and five frame hashes in the same and a fresh browser. Caption appearance and expression/gesture quality still need contact-sheet inspection; metadata checks alone cannot prove visual synchronization. Frame determinism is expected within one machine/runtime, not guaranteed across GPU drivers.

## Timed 30-second Children of Khan script

`specs/khan_30s.yaml` preserves the supplied caption wording and all 15 speech intervals. It selects the original `builtin:atlas` character: sage bomber, layered face/eyes, sculpted hair, cargo pockets, detailed hands, watch and sneakers. A static reusable export is available at `assets/characters/atlas.glb`; the procedural adapter supplies live expressions and gestures.

Every timed line supplies `start` and `end` in seconds. All lines must be timed, in order and non-overlapping. Normalized speech is pitch-preserving time-stretched to the exact slot; large changes are flagged in each timeline audio record for listening review. The final speech ends at 28 seconds and `www.childrenofkhan.com` occupies 28–30 seconds. Fixed timing overrides the earlier audio-derived-duration rule only for explicitly timed scripts.

The render/batch/doctor commands now load `.env` automatically (Node 22 recommended). Both `FISH_API_KEY` and `FISH_VOICE_HERO` are needed for Fish output:

```sh
TTS_PROVIDER=fish pnpm render specs/khan_30s.yaml
pnpm qa out/khan_30s
```

This render was attempted but blocked by the missing voice reference ID. The browser sandbox blocker also remains. The new character has passed geometry/rig/export checks but has not been visually inspected.
