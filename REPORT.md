# Delivery report

**Incomplete: no finished character MP4 was produced.** The source implementation is present and builds. Runtime restrictions block the required speech and browser services. Acceptance milestones M2 and M4–M8 have not passed; checkpoint commits must not be read as success claims.

## Verified

- M0: scaffold builds; project doctor prints pass/fail capability table (`pnpm run doctor`).
- M1: four specs validate; readable field errors reject unknown speakers and unsafe paths.
- M3: timeline/ASS fixture generated; timing, caption chunks, tags and pitch rules pass unit tests.
- Eight unit tests pass, including viseme bounds, critically damped smoothing and short-line tag retention.
- `pnpm test:media` passes using an explicitly labeled synthetic tone: normalization to 48 kHz mono, RMS envelope motion, libx264 H.264, AAC, and measured −14.09 LUFS.
- Full `sample_hook` command attempted; fails at TTS and writes report.json.
- Batch attempts all four samples despite failures, writes summary, and correctly exits 1 when every video fails.
- QA rejects incomplete output with `artifacts: FAIL` and nonzero exit.

## Blockers and evidence

1. **P0: macOS speech unavailable in sandbox.** `say` reports `sandbox_extension_issue_file failed ... Operation not permitted`. Resulting AIFF contains no audio; WAV is 78 bytes; ffprobe duration is N/A. Pipeline rejects it instead of caching false success.
2. **P0: renderer cannot run.** Localhost bind returns `listen EPERM: operation not permitted 127.0.0.1`. Separate direct Chromium launch exits SIGABRT before a page; cleanup also reports EPERM.
3. **P0 for real voice: shell DNS unavailable and voice ID absent.** Registry/Fish docs curl attempts fail DNS. Fish docs were checked through the research tool; no live authenticated TTS request was made. Supplied key was not stored or printed.
4. **P1: no visual validation.** No character frames, contact sheets, GPU proof, or determinism comparison were obtainable. Framing, arm clipping, mouth quality, captions, and VRM compatibility remain unverified.

## Implemented but not end-to-end verified

Fish retries/cache, Rhubarb and energy tracks, captions, procedural lake/night scenes, mannequin, optional VRM 0.x/1.x adapter, camera/gestures/expressions, frame pipe, WebCodecs+MP4 alternative and transport benchmark, mux/music ducking, video QA/contact sheets, batch/resume.

## Fallbacks

- Original mannequin for missing/unavailable VRM; no unlicensed character assets.
- Energy mouth track when Rhubarb is absent/fails.
- macOS mock TTS is selected for missing credentials/reference; **blocked here**, not falsely reported as usable speech.
- libx264 when VideoToolbox runtime encode fails; exercised by media fixture.
- Canvas-burned captions because system FFmpeg lacks ASS and drawtext; ASS file still emitted.
- Node's built-in test runner instead of unavailable cached Vitest.
- Cached exact direct dependency versions instead of network installation; optional three-vrm dependency not installed here.

## Known implementation gaps, ranked

- P1: no registry-generated lockfile; cached transitive dependencies differ from a fresh install and need a clean-install verification.
- P1: automatic render-time quality reduction is not implemented; shadow/bloom/resolution policy needs real measurements.
- P1: caption visual synchronization is checked by metadata, not OCR/pixel-level speech alignment. Actual visual review is still required.
- P2: only TTS/lip-sync and complete-video resume are cached; partial render/mux recovery is not implemented.
- P2: batch concurrency is fixed at one; Ctrl-C drains current video rather than interrupting it immediately.
- P2: bloom remains disabled; water uses a subtle deterministic material variation rather than a custom wave shader. VRMA clips are not implemented.
- P2: character facing/body orientation and mannequin expression range need visual tuning. Eye tracking uses neck aim; fine eye saccades are not implemented.
- P2: three CC0 HDRIs were not downloaded; procedural fallback works in source but remains visually unverified.
- P2: exact sample durations (including “8 s”) depend on measured speech and have not been confirmed.

## Morning TODO

1. Open a normal terminal in this project and run the README setup; enable shell network and macOS speech/browser access.
2. Supply FISH_API_KEY plus an authorized synthetic voice reference ID through environment. The key from chat is not persisted.
3. Run `pnpm run doctor`, `pnpm test`, `pnpm test:media`, then `pnpm render specs/short_8s.yaml`.
4. Inspect contact.png and three full-resolution stills; fix pose/framing/caption issues before the full sample.
5. Run `pnpm render specs/sample_hook.yaml` and `pnpm qa out/sample_hook`; then batch all samples.
6. Add a permissively licensed VRM and optional Poly Haven HDRIs; record licenses. Install Rhubarb if desired.
7. Collect real benchmarks, implement automatic quality cuts and complete stage caching, then revisit known gaps.

The final attempted sample QA is attached locally at `out/sample_hook/report.json`. It reports failure, not completion.

## Follow-up delivery: Atlas + timed Khan script

New source builds and 13 tests pass. The exact timing spec is `specs/khan_30s.yaml`; original detailed character export is `assets/characters/atlas.glb`. Render was attempted and failed with `Fish reference_id missing`. Key is present in .env, but FISH_VOICE_HERO is missing. Browser sandbox restrictions remain. No 30-second MP4 exists yet; the failed QA report is `out/khan_30s/report.json`. No new character visual inspection could be performed.

## Follow-up: Khan render debug

- `.env` currently contains a key, `FISH_MODEL=s2-pro`, and `FISH_VOICE_HERO` equal to the supplied ID. The key was never printed. Fish uses the engine name in the `model` request header and the ID as `reference_id`; putting the ID in `FISH_MODEL` is the configuration error.
- The existing Khan MP4 was produced using mock TTS (`MOCK:true` in its previous report). With `TTS_PROVIDER=auto`, Fish errors can trigger mock fallback, so a file appearing after a render does not prove the requested voice worked. README now documents strict mode and provider validation; render reports now persist provider/fallback data before rendering.
- Visual adjustments made to Atlas/mannequin geometry and close-shot framing. `pnpm build` passed. A fresh mock render advanced through TTS, timeline, lip sync, and build, then failed at capture because this environment forbids binding `127.0.0.1` (`EPERM`). The previous MP4 is therefore stale; new character visuals/contact sheet remain unverified here.
- Next run in a normal macOS terminal: set `TTS_PROVIDER=fish` in `.env`, keep `FISH_MODEL=s2-pro` and the voice ID under `FISH_VOICE_HERO`, then run `pnpm render specs/khan_30s.yaml`. Inspect `out/khan_30s/report.json` for `MOCK:false` and all `providers` equal `fish`, then review `contact.png`.

## Follow-up: Fish HTTP 402

The user's local machine reached the Fish endpoint but received HTTP 402 with `FISH_MODEL=s2-pro`. The endpoint's current documentation identifies `s2.1-pro-free` as the free developer tier; `s2-pro` and `s2.1-pro` are other hosted models. A 402 indicates an account/key/model entitlement or API-credit issue, which the local project cannot resolve. The client now reports Fish's response message and avoids repeating non-retryable 4xx requests. See README for the account checks and optional free-tier trial.

## Follow-up: first real render QA

The user's local M1 run later completed TTS with Fish for all 15 lines, rendered on ANGLE Metal, produced an exactly 30.0-second H.264/AAC file, and passed every QA check except integrated loudness (−15.15 LUFS; target −15 to −13). No mock audio was used. Contact sheet review found clipped head framing and crude cheek/mouth proportions. Changes now add gain/headroom management to the mux, widen/reframe the camera, smooth/hide overlapping base facial geometry, reduce cheek/nose size, and animate a rounded mouth aperture. `pnpm build` passes. The current runtime cannot capture because localhost binding returns EPERM, so updated video/QA and the visual changes still need a local rerun.

## Follow-up: supplied Cactus Boy and fresh render folders

The Khan spec now uses the supplied `assets/characters/cactus_boy.vrm` (VRM metadata says Polygonal Mind, CC0), with `@pixiv/three-vrm` 3.5.5 pinned as a required dependency. Each run writes to a new `out/khan_30s/run-<timestamp>/` folder with `log.txt`; QA on the parent selects the newest run. A direct mux experiment reached −14.2 LUFS / −1.5 dBTP. The current sandbox cannot install the VRM loader from the registry or run Chromium capture due network/local-listener restrictions. No fresh MP4 or visual inspection is claimed. On the user's connected Mac, run `pnpm install`, then `pnpm render specs/khan_30s.yaml`, and inspect the new run's contact sheet and QA report.

## Follow-up: Cool Banana and speech pacing

Added the user-supplied Cool Banana VRM (embedded metadata: Polygonal Mind, CC0) and a parallel 30-second Khan spec, retaining Cactus Boy as the original. The prior successful Fish output shows the actual bug: its per-line atempo factors ranged 0.34×–2.63× because approximate caption timestamps were treated as exact speech durations. The fix sets a 30-second target and applies one shared tempo ratio to all lines, with short uniform pauses; subtitles are timed from the resulting audio. `pnpm test` passes 14/14 and `pnpm build` passes. All 15 Fish lines were already cached, so verification required no new API calls. The corrected line tempo is uniformly 1.2139×; `voice-preview.wav` measures 30.000 s, −14.4 LUFS, and −1.5 dBTP. A full rerender stopped at capture because this sandbox denies localhost binding (`listen EPERM`). The local Whisper command cannot start because its configured Python 3.9 interpreter is missing, and I do not have an audio playback input to make a subjective listening claim.

Khan now sends one stable, conversational style brief plus one performance cue per line in a single Fish inline tag; numeric speed is fixed at 1.0. Fish sampling temperature is 0.55 (the API docs say lower values are more consistent), and sampling values are included in cache keys. No new TTS call was made, so listen to the next generated version before further prompt tuning.
