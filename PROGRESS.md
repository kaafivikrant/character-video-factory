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
