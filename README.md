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
- `FISH_MODEL`: engine name sent in the `model` header, normally `s2-pro` (or `s2.1-pro`). Fish also documents `s2.1-pro-free` for the free developer tier. Do not put a voice/model ID here.
- `TTS_PROVIDER`: `auto`, `fish`, or `mock`.
- `auto` uses mock when key/reference is missing or Fish requests fail; every mock line is flagged.
- `fish` fails instead of silently substituting mock.
- Mock is macOS `say` → `afconvert`; it still needs functioning macOS speech services.

Fish integration follows the [official TTS endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech): JSON request, Authorization/model headers, per-line reference ID, tagged text and prosody. WAV is requested at 44.1 kHz and converted locally to 48 kHz mono. Pitch uses inline descriptions, never a numeric pitch parameter. Three retries follow the initial attempt. No voice model is selected or cloned automatically.

Fish requests use `temperature: 0.55` and `top_p: 0.7` for this renderer. Fish documents lower temperature as more consistent; sampling settings are part of the TTS cache key so old generations are not reused after this tuning.

For a strict real-voice render, use `TTS_PROVIDER=fish` in `.env`. With `auto`, a Fish HTTP/network failure may fall back to mock speech; inspect the newest `out/<id>/run-*/report.json` and make sure `MOCK` is `false` and every entry in `providers` is `fish` before using the video.

Fish HTTP 402 means the account/key/model combination is not currently authorized for paid synthesis or lacks API credits. Check the response detail printed by the CLI and the Fish account's API billing/credit balance. If the account is eligible for the free developer tier, try `FISH_MODEL=s2.1-pro-free`; it is a distinct model name, not a voice ID.

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

Every render gets a new timestamped directory at `out/<id>/run-<timestamp>/`, preserving prior runs and their logs. The CLI prints the full output path. `pnpm qa out/<id>` checks the newest run; passing a run folder checks that exact run. Each run contains:

- `video.mp4`, `silent.mp4`, `audio.wav`
- `timeline.json`, `lipsync.json`, `captions.ass`
- `render.json` (GPU string, frame hashes, transport benchmark), `report.json`, `log.txt`
- `contact.png` (2-second frames with timestamps), `contact-timestamps.json`, and `stills/1.png`–`3.png`

`report.json` records explicit failure stages when rendering cannot complete. A missing artifact is a QA failure, not a skipped success.

## Spec reference

See the files in `specs/`. `sample_hook.yaml` contains the requested 14-line fixture unchanged; its website is a placeholder. Output duration derives from measured audio unless `target_duration` is set. The Khan variants target 30 seconds and use one shared audio tempo ratio across all spoken lines, preserving their relative pacing instead of forcing each caption's approximate timestamp onto its line.

| Field                  | Values / behavior                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| `id`                   | Letters, numbers, `_`, `-`; output directory name                                                             |
| `format`               | `vertical` 1080×1920, `landscape` 1280×720, `classic` 964×720                                                 |
| `fps`, `seed`          | Default 30 and 7; all procedural variation is seeded                                                          |
| `target_duration`      | Optional total video duration; speech is uniformly fitted as a group after pauses and outro time are reserved |
| `voice_prompt`         | Editorial note; not sent as TTS text                                                                          |
| `scene`                | `misty_lake_bridge`, `street_night`, `hdri:<name>`                                                            |
| `music`                | Project-relative music path or null; ducked under voice                                                       |
| `characters`           | 1–8 unique IDs, model, voice, position, facing, optional hoodie/pants hex colors                              |
| `lines[].speaker`      | Must name a character                                                                                         |
| `text`                 | Spoken text; bracket directions are excluded from captions                                                    |
| `emotion`, `intensity` | Table below; intensity 0–1                                                                                    |
| `pitch`                | `flat`, `up`, `down`, `rise_end`, `fall_end`, `lively`; inferred when omitted                                 |
| `speed`                | 0.5–2; emotion-based, seeded variation only when omitted, unless `voice_prompt` sets a steady baseline        |
| `tts_direction`        | Editorial note; not sent as TTS text                                                                          |
| `shot`                 | `full`, `mid`, `close`, `auto`                                                                                |
| `gesture`              | See gesture list below                                                                                        |
| `pause_after`          | 0–0.6 s; otherwise seeded 0.10–0.20 s                                                                         |
| `tags`                 | Up to two extra free-form Fish descriptions, without brackets                                                 |
| `outro`                | `type: card                                                                                                   | none`, text, duration, hex background |
| `captions`             | `style: bold_white                                                                                            | yellow_pop                            | boxed`, `max_words_per_chunk: 2..5` |

Unknown fields, invalid types, unknown speakers, path traversal and out-of-range values produce field-specific errors. `${ENV_NAME}` substitution applies only to voice fields, after YAML parsing.

### Emotion table

The tuning source is `src/timeline/emotion.ts`. Intensity scales expression and gesture weights, and the base speed delta from 1.0.

| Emotion     | Voice descriptions    | Base speed | Face                   | Gesture       | Camera bias |
| ----------- | --------------------- | ---------: | ---------------------- | ------------- | ----------- |
| neutral     | none                  |       1.00 | relaxed .1             | idle_sway     | mid         |
| deadpan     | flat voice            |        .97 | relaxed .2             | hold_phone    | mid         |
| sad         | sad, low voice        |        .92 | sad .8                 | head_down     | close       |
| wistful     | wistful, soft voice   |        .90 | sad .4, relaxed .4     | look_away     | close       |
| happy       | cheerful              |       1.05 | happy .8               | open_arms     | mid         |
| excited     | excited, pitch up     |       1.12 | happy 1, surprised .3  | big_gesture   | full        |
| angry       | angry, emphasis       |       1.08 | angry .9               | point         | close       |
| surprised   | surprised             |       1.05 | surprised .9           | step_back     | close       |
| embarrassed | embarrassed, pitch up |       1.00 | happy .3, sad .2       | hand_to_neck  | close       |
| defensive   | defensive, emphasis   |       1.08 | angry .4, surprised .3 | palm_out      | mid         |
| determined  | firm                  |        .95 | angry .3, relaxed .2   | hand_to_chest | mid         |
| whisper     | whispers              |        .90 | relaxed .3             | lean_in       | close       |

Other gestures: `slow_breath`, `shrug`. The TTS builder sends the script with up to two short emotion/pitch tags. Shared `voice_prompt` and line-specific `tts_direction` are retained as editorial notes and are never sent as spoken text. Fish's S2 tags belong inline in the text, so keep them short and place them before the words they should affect; see its [S2 prompting guide](https://fish.audio/blog/fish-audio-s2-fine-grained-ai-voice-control-at-the-word-level/). Camera cuts occur at line boundaries, at least 1.4 s apart; that minimum takes precedence over switching to a new speaker on very short lines.

## Character staging and movement

For dialogue, set `staging: conversation`, give each character a `position`, and set `facing` to the other character's ID. `posture: seated` starts a character on a generated bench; `prop: phone` attaches a phone to the character's right hand. `actions` are optional, seeded, deterministic cues anchored to a 1-based `at_line` plus an `offset` in seconds:

```yaml
actions:
  - { character: arjun, type: walk, at_line: 1, offset: 0.5, duration: 1.2, to: [-0.8, 0, 0.1] }
  - { character: kabir, type: stand, at_line: 8, offset: 0, duration: 0.8 }
```

Movement types are `walk`, `run`, `sit`, and `stand`. Walk/run require a level-floor destination and a standing character; conflicting actions and moves beyond the timeline are rejected. The VRM adapter applies arm poses, hand gestures, foot lifts and two-bone leg IK. The `dating_chat_v2` fixture demonstrates two-person staging, walking, sitting, gestures, and standing.

## Adding your own VRM

Place a permissively licensed VRM at `assets/characters/hero.vrm`, log source/license in `assets/LICENSES.md`, and set the character's `model`. Install dependencies with `pnpm install` so the pinned `@pixiv/three-vrm` 3.5.5 loader is available. Explicit `.vrm` models fail clearly if the loader/model cannot load; they will not silently render the fallback mannequin. The Khan spec uses `assets/characters/cactus_boy.vrm`, supplied by the project owner; its embedded VRM metadata identifies the Polygonal Mind model as CC0. VRM 0.x/1.x loading, expressions and normalized bones are handled by three-vrm. VRMA playback is not implemented.

The mannequin uses original primitive geometry, a hoodie, pants, articulated limbs, eyes/brows and an audio-driven mouth. It guarantees a model fallback, not a fallback for a blocked browser.

## Adding an HDRI or music

Put a licensed `.hdr` file in `assets/hdri/<name>.hdr` and select `scene: hdri:<name>`. Record its source and license. Missing HDRIs fall back to the lake. No Poly Haven HDRIs were downloaded because shell network access is blocked. Procedural scenes require no external assets.

Put licensed audio in `assets/music/`, select its project-relative path, and add a license line. Music is normalized near −22 LUFS and sidechain-ducked; the final mix targets −14 LUFS, −1.5 dBTP. QA measures the encoded AAC result.

## Rendering and QA details

The stage exposes `load(timeline)` and `renderFrame(i)`. It uses no animation loop or wall clock. JPEG frames go through an exposed Playwright binding to FFmpeg with backpressure. A second path uses browser WebCodecs and Mediabunny's MP4 muxer. A 30-frame full-transport benchmark checks the resulting H.264 pixel format and selects the faster available path. These browser paths compile but cannot be measured in this sandbox.

VideoToolbox is tested by an actual tiny encode; failure selects libx264 CRF 18. Captions are drawn on the composition canvas because the installed FFmpeg lacks both ASS and drawtext filters; ASS is still exported. The current implementation always uses that canvas-caption path.

QA checks codecs, dimensions/fps/duration, loudness/peak/silence, caption metadata, nonblank decoded frames, foreground/background character difference, lip-track motion, sampled silent-mouth state, and five frame hashes in the same and a fresh browser. Caption appearance and expression/gesture quality still need contact-sheet inspection; metadata checks alone cannot prove visual synchronization. Frame determinism is expected within one machine/runtime, not guaranteed across GPU drivers.

## Timed 30-second Children of Khan script

`specs/khan_30s.yaml` keeps the supplied dialogue and targets a 30-second total. `specs/khan_30s_banana.yaml` is the same script with the alternate Cool Banana model. Both specify a stable conversational voice brief and a per-line acting cue; the character voice still comes from `FISH_VOICE_HERO`.

For a fixed total duration, set `target_duration` and leave per-line `start`/`end` unset. The renderer reserves the intro, inter-line pauses and outro, then applies one common pitch-preserving tempo ratio to all speech lines. This avoids unnatural speed jumps caused by forcing long phrases into short caption timestamps. Captions follow the fitted audio timeline, and the 2-second website card ends the Khan video at 30 seconds.

The render/batch/doctor commands now load `.env` automatically (Node 22 recommended). Both `FISH_API_KEY` and `FISH_VOICE_HERO` are needed for Fish output:

```sh
TTS_PROVIDER=fish pnpm render specs/khan_30s.yaml
pnpm qa out/khan_30s
```

For voice setup, `pnpm test:voices` checks each configured voice ID against Fish's model endpoint and then synthesizes a short test phrase. Fish calls the voice model ID `reference_id`; `FISH_MODEL` is a separate TTS engine selection. A `Reference not found` response means Fish did not resolve that ID for this account/request.

This render was attempted but blocked by the missing voice reference ID. The browser sandbox blocker also remains. The new character has passed geometry/rig/export checks but has not been visually inspected.
