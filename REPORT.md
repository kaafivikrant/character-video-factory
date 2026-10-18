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
