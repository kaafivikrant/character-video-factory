# Progress

## Done
- Detected macOS arm64, Node 22.22.3, pnpm 10.8.1, FFmpeg VideoToolbox/libx264.
- Confirmed Fish documentation request shape.

## In progress
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
