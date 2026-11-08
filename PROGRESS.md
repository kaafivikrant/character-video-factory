# Progress

## Current status — 2026-10-18

Source implementation and documentation checkpoint complete; **end-to-end mission blocked, not complete**.

| Milestone | Acceptance state |
|---|---|
| M0 | Build and doctor table pass; unavailable runtime capabilities explicitly listed |
| M1 | Four fixtures and schema/error tests pass |
| M2 | BLOCKED: macOS say produces no speech; Fish network/reference unavailable |
| M3 | Unit tests and fixture timeline/ASS pass; real-audio acceptance blocked by M2 |
| M4 | Builds; BLOCKED localhost listener/Chromium; no MP4 or determinism proof |
| M5 | Viseme/smoothing tests pass; visual/lip-sync QA blocked |
| M6 | Full sample attempted; fails at TTS and writes failure report |
| M7 | QA correctly fails missing artifacts; contact inspection blocked |
| M8 | Batch continues through all four failures; docs written; visual polish/benchmarks blocked |

### Final verified outputs

- `pnpm build`: 88 modules transformed, successful Vite build; Three bundle 609.43 kB, muxer split 168.77 kB.
- `pnpm test`: 8 tests, 8 pass, 0 fail.
- `pnpm test:media`: generated test tone only; libx264; 2.000021 s; 101 RMS windows; H.264/AAC; −14.09 LUFS.
- `node --import tsx tools/browser-smoke.ts`: `listen EPERM: operation not permitted 127.0.0.1`.
- Final `pnpm render specs/sample_hook.yaml`: exit 1, `TTS produced no usable speech`.
- Final `pnpm qa out/sample_hook`: exit 1, `artifacts: FAIL`.
- `pnpm batch 'specs/*.yaml'`: attempts all four, all fail speech; exit 1; summary written.
- No character video, contact sheet, GPU proof, or visual determinism result exists. No visual inspection claimed.

### Next / Morning TODO

Run the README commands from a terminal with speech, localhost, browser and network access; supply an authorized Fish voice ID and environment key; inspect the short sample before the full sample. See REPORT.md for ranked implementation gaps and BENCHMARKS.md for measured versus unavailable results.

## Historical work log

## Done
- Detected macOS arm64, Node 22.22.3, pnpm 10.8.1, FFmpeg VideoToolbox/libx264.
- Confirmed Fish documentation request shape.

## Initial in-progress state (superseded above)
- M0 scaffold and doctor; restoring offline dependencies.

## Blocked
- Shell DNS/network; live Fish and external asset downloads.

## Next
- Schema, TTS, timeline, deterministic renderer, QA, batch.

## Morning TODO
- Enable network and supply FISH_API_KEY and licensed synthetic voice reference IDs through environment.
- Install Rhubarb and FFmpeg with libass when network is available.
- Add your own licensed VRM; download licensed Poly Haven HDRIs.

### M0 evidence
- `pnpm build`: Vite 6.4.1 built successfully (4 modules).
- `pnpm run doctor`: clear 11-row table; Node, pnpm, FFmpeg, VideoToolbox, ffprobe, say pass. libass, Rhubarb, expected Chromium revision, Fish environment/network fail with fallbacks listed.
- pnpm 10 has its own `doctor` command; use `pnpm run doctor` to select this project's script.
- tsx CLI IPC is forbidden by sandbox; `node --import tsx` runs successfully.

### M1 evidence
- Four YAML fixtures created; all validate.
- `pnpm test`: 2 tests pass, including readable path-specific errors for unknown speaker and path traversal.
- Fixed environment interpolation to happen after YAML parsing, preventing empty voices becoming YAML null.

### M2 implementation / BLOCKED acceptance
- Fish JSON client, retries, provider policy, content hash cache, macOS say/afconvert, 48k mono trim/loudnorm implemented.
- `TTS_PROVIDER=mock node --import tsx tools/tts-smoke.ts`: FAIL, `TTS produced no usable speech`.
- Evidence: macOS say emitted `sandbox_extension_issue_file failed ... Operation not permitted`; AIFF contains no audio, normalized WAV is 78 bytes, ffprobe duration N/A. Invalid cache results are rejected.
- Fish unavailable due network and missing voice reference. No fake speech substituted.

### M3 evidence
- `pnpm test`: 5/5 pass (schema, tag stacking/pitch variation, caption chunks, measured timeline math).
- `node --import tsx tools/timeline-smoke.ts`: TEST ONLY timeline and ASS generated using fixture durations; live audio acceptance remains dependent on M2.

### M4 / M5 implementation
- Two procedural scenes, original low-poly mannequin, optional VRM adapter, deterministic frame API, hard-cut camera presets, canvas caption fallback, frame pipe encoder implemented.
- Energy/Rhubarb tracks, bounded spring smoothing, gesture poses, expression blending, seeded blinking implemented.
- `pnpm test`: 7/7 pass, including viseme bounds and attack/release.
- Chromium launch FAIL: sandbox SIGABRT before page, process cleanup reports EPERM. No rendered frames exist; visual acceptance and GPU proof remain BLOCKED.

### M6 execution evidence
- `pnpm render specs/sample_hook.yaml`: exits 1 at TTS with `TTS produced no usable speech`. report.json records failedStage=tts. No MP4 falsely claimed.
- Implemented audio delay/mix, optional sidechain ducking, -14 LUFS normalization, H.264/AAC faststart mux and renderer orchestration.

### M7 execution evidence
- `pnpm qa out/sample_hook`: FAIL artifacts (video.mp4/timeline.json missing); nonzero exit as intended.
- Implemented ffprobe checks, loudness, silence, caption alignment, lip motion, blank frames, character difference, determinism and contact extraction. Real-video QA cannot execute before speech/browser blockers are removed.

## Follow-up: detailed character and exact 30-second script
- Added Atlas detailed character adapter and reusable 511,196-byte GLB; loader round-trip verified 97 exported visible meshes.
- Added `specs/khan_30s.yaml`: all 15 supplied lines, exact time intervals, website outro at 28–30 s.
- Added validated timed slots and cached, pitch-preserving speech duration fitting.
- Build passes; 13 tests pass, including 900-frame timing, overlap rejection, real FFmpeg duration fitting and character mouth/blink controls.
- `.env` now loads automatically. Key presence confirmed without displaying it; FISH_VOICE_HERO missing.
- `TTS_PROVIDER=fish pnpm render specs/khan_30s.yaml`: FAIL `Fish reference_id missing`.
- `pnpm qa out/khan_30s`: FAIL missing video/timeline. Browser smoke: localhost EPERM still present.
- No finished new video or visual inspection claimed. Next: set authorized synthetic voice reference ID, run from normal Terminal, inspect contact sheet.

## Follow-up: Fish ID diagnosis and character framing
- Confirmed `.env` has a Fish API key and `FISH_VOICE_HERO` set to the supplied ID; its `FISH_MODEL` is `s2-pro`. Key contents were not printed.
- Fish request mapping: `FISH_MODEL` is the engine header (`s2-pro`); the supplied long ID is `reference_id` and belongs in `FISH_VOICE_HERO`.
- The prior MP4's report/log showed mock provider output. `auto` can fall back to mock after Fish errors, which made an output appear to work without proving the Fish model configuration was valid.
- Added provider/fallback details to the running report before later render stages, expanded sanitized network error diagnostics, and clarified setup in README.
- Improved the built-in character face and corrected close-camera distance/FOV. `pnpm build` passes after these renderer edits, but this environment cannot bind localhost (`listen EPERM`) so the updated character could not be rendered or visually inspected here.
- Current fresh attempt failed at capture with `listen EPERM: operation not permitted 127.0.0.1`; do not treat existing `out/khan_30s/video.mp4` as an updated or verified render.
- Morning TODO: run the strict Fish render and renderer from a normal macOS terminal with network and localhost access, then inspect contact.png and confirm `MOCK:false`.

## Follow-up: Fish HTTP 402
- User's local render now reaches Fish and returns HTTP 402; this establishes that network/DNS and bearer auth reached the endpoint, but does not by itself tell whether the key is invalid for API use, the account lacks API credits, or the selected hosted model requires plan access.
- Official Fish docs list `s2.1-pro-free` for the free developer tier; paid model names include `s2-pro` and `s2.1-pro`. The voice model ID remains a separate `reference_id`.
- Fish client now prints a bounded server error detail and immediately stops retrying non-retryable client responses such as 402. README documents billing/credit checks and the optional free-tier model.
- Next: rerun with `FISH_MODEL=s2.1-pro-free` only if the Fish account is eligible; if 402 persists, check the Fish API dashboard for API credit/billing and verify the key is an API key. No project-side change can grant account credits or plan access.

## Follow-up: first real Fish render / QA
- User's local M1 render completed all 15 TTS calls with Fish (`MOCK:false`), rendered 900 frames on ANGLE Metal, and muxed a 30-second H.264/AAC video.
- User's QA report passed codec, dimensions/fps, duration, clipping, speech gaps, caption alignment, lip motion, renderer/GPU, blank-frame, character-presence, and determinism checks. Only loudness failed: −15.15 LUFS against the −15 to −13 range.
- Contact sheet and first full-resolution still inspected. Visible issues: top of head cropped in several shots; exaggerated cheeks and square oversized mouth. Updated camera FOV/framing and Atlas face geometry/mouth animation.
- Audio experiment on the captured WAV: pre-limiter +1.5 dB, peak limiting at 0.84 amplitude, then loudnorm measured −14.0 LUFS in the candidate output. Added this chain to final mux.
- `pnpm build` passes after source changes. Re-render from this execution sandbox fails at capture (`listen EPERM`); QA of the prior video reproduces loudness failure and also cannot launch its fresh-browser determinism check. M7 acceptance remains pending a local rerun and visual inspection.

## Follow-up: supplied Cactus Boy VRM and per-run output

- Copied the user-provided `~/Downloads/Cactus Boy.vrm` to `assets/characters/cactus_boy.vrm`; embedded model metadata declares CC0 and Polygonal Mind. Khan spec now selects it. The camera frames the loaded model using measured bounds, and VRM load failures are explicit.
- Made `@pixiv/three-vrm` 3.5.5 a pinned required dependency. The current offline sandbox does not have the package installed; `pnpm install` must run on the connected Mac before using this VRM.
- Each ordinary render creates `out/<id>/run-<timestamp>/` and records stages/errors in `log.txt`. `pnpm qa out/<id>` resolves to the latest run; `--resume` reuses a completed matching run.
- Fixed the mux loudness filter. A direct mux of existing captured frames/timeline produced a candidate measuring −14.2 LUFS and −1.5 dBTP. This is a filter experiment, not a fresh end-to-end pass.
- Remaining verification: `pnpm build` after final edits and a full local Khan rerender with visual/contact-sheet QA. Local browser automation here fails at localhost bind with EPERM, so no fresh Cactus Boy video or contact sheet is claimed.

### Morning TODO

- Run `pnpm install` from the normal connected terminal, then `pnpm render specs/khan_30s.yaml`.
- Inspect the printed timestamped run folder's `log.txt`, `contact.png`, `report.json`, and `video.mp4`; confirm Fish providers, framing, and all QA checks.

## Follow-up: Cool Banana and voice pace correction

- Added `assets/characters/cool_banana.vrm` from the user-provided download; embedded metadata identifies Cool Banana, Polygonal Mind, CC0, allowed user Everyone. Added license record and `specs/khan_30s_banana.yaml` variant while preserving the Cactus Boy spec.
- Diagnosed pace jumps in the last successful Fish run: fixed one-second caption windows caused per-line atempo factors from 0.34× to 2.63× (mean 1.27×). The worst example was “she asked why one of them was called” squeezed from 2.63 s into 1 s.
- Added `target_duration` and group fitting: Khan specs reserve intro, 14 consistent 50 ms pauses, and the 2 s outro, then apply a common audio tempo ratio to all lines. Caption timing now follows the fitted speech timeline. Target remains 30 s / 900 frames.
- Added unit coverage for common group tempo and 30-second timeline math. `pnpm test`: 14/14 pass; `pnpm build`: pass. The rerender used all 15 cached Fish lines (no API calls), built the new timeline, then capture stopped with sandbox `listen EPERM: operation not permitted 127.0.0.1`.
- The new timeline applies the same 1.2139× ratio to every utterance (spread below 1e-12; previous output varied 0.34×–2.63×). Generated `out/khan_30s/run-2026-10-18T04-08-08-937Z/voice-preview.wav`: 30.000 s, −14.4 LUFS, −1.5 dBTP. No fresh video was made because capture was blocked.
- Audio could be measured from the actual Fish render, but the installed Whisper CLI is broken because its Python 3.9 interpreter path no longer exists. No subjective listening or transcript claim is made.
- Replaced generic stacked mood/pitch tags in both Khan specs with one shared voice brief and one short per-line acting cue; Khan prosody speed is fixed at 1.0. Lowered Fish sampling temperature from 0.7 to 0.55 for steadier delivery and included sampling parameters in the cache key. These new prompts have not been sent to Fish yet; doing so would incur TTS API usage.

## Conversation motion implementation and review cut (2026-10-23)

- Added deterministic action compilation and sampling for walking, running, sitting, and standing, with seeded gait, limb poses, VRM0 normalized-bone handling, hand gestures, two-bone leg IK, speaker/listener framing, and generated bench seating. Documented the action schema in README and added the `dating_chat_v2` dialogue/action fixture.
- Added motion unit coverage. `pnpm build` passes; `pnpm test` passes 17/17; `git diff --check` passes.
- Fish API could not resolve `api.fish.audio` from this environment (`ENOTFOUND`). The macOS `say` fallback was also blocked (`sandbox_extension_issue_file failed ... Operation not permitted`) and emitted no usable audio. Both render attempts stopped at TTS; no dialogue audio is claimed.
- Exported a silent 19.4-second visual review MP4 using Arc/WebCodecs on ANGLE Metal / Apple M1. `ffprobe`: H.264, 1080×1920, 30 fps, yuv420p, 19.4 s; no audio stream. Inspected the contact sheet and stills at 1, 5, 10, and 17 seconds. Walk, changing shots, seated listener, gestures, and stand-up are visible; full audiovisual QA remains pending.
- Review artifact: `out/dating_chat_v2/motion-review/motion-review.mp4`; contact sheet and selected stills are alongside it. Report explicitly marks this as visual-review-only, not a passed final render.
- Next: rerun `pnpm render specs/dating_chat_v2.yaml` from the connected macOS terminal with Fish network access, then inspect fresh audio, sync, and QA before judging the finished skit.

## Fish voice ID check

- User's connected terminal reached Fish and got HTTP 400 `Reference not found` on the first TTS line, so this is a voice-reference lookup issue rather than a missing API key.
- Confirmed against current Fish docs: the `model` HTTP header selects the engine (`s2.1-pro-free` is valid); `reference_id` must separately be a trained TTS voice model ID.
- Added `pnpm test:voices` to inspect both configured voice IDs via Fish's model endpoint and synthesize a short phrase from each, without printing the API key. Improved the render error to explain the `reference_id`/engine distinction.
- This agent's network cannot resolve `api.fish.audio`, so the live check could not complete here (`ENOTFOUND`). Build passes. Run `pnpm test:voices` in the connected Terminal to identify which ID Fish rejects.
- User's connected `pnpm test:voices` confirms Kabir's voice synthesizes successfully (1.25 s); Arjun's current ID returns 404. Extended the check to list trained TTS models for this account when a configured ID returns 404, so the right replacement can be copied without exposing the API key. Build passes after this update.
- User reran the check: Kabir again succeeded (1.16 s); Arjun is absent from owned trained TTS models. Extended `pnpm test:voices` to list public trained English voice IDs as replacement candidates when no owned model is available. Build passes. Full video render remains blocked until Arjun is assigned a valid, distinct voice ID.

## Prompt leakage fix (2026-10-23)

- User reported the rendered dialogue sounded like the system prompt. Inspected run `out/dating_chat_v2/run-2026-10-23T10-23-12-852Z`: `voice_prompt` and each full prose `tts_direction` had been embedded inside one bracketed TTS text tag. Measured output was 109.15 seconds for an intended 20-second skit; seven of eight lines exceeded speech-duration bounds.
- Re-ran QA on that artifact. It now correctly FAILS `speech duration matches script`; the original QA only checked media format/sync and had passed despite this obvious content-duration failure.
- Fixed the Fish payload: only the user's script plus up to two short emotion/pitch tags are sent. Shared `voice_prompt` and prose `tts_direction` are not sent as speech. Added a per-line TTS duration guard, QA duration check, explicit 20-second target and fixed 1.0 speed for the eight-line dating skit.
- `pnpm build` and `pnpm test` pass (17/17). Local timeline inspection confirms all eight payloads contain only script and short tags. Live Fish synthesis/rerender remains to be verified from the connected terminal because this agent's network cannot resolve Fish.
