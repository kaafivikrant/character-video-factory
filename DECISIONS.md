# Decisions

- Project is isolated in `/Users/vik/character-video-factory`; no external agent has execution permission.
- Shell DNS is unavailable. Restore dependencies from local caches; no global installs. Alternative: fresh registry install when network returns.
- System FFmpeg has neither libass nor drawtext. Render captions onto a browser composition canvas, while still emitting ASS. Alternative: install FFmpeg with libass later.
- Fish endpoint documentation checked on 2026-10-18: JSON POST /v1/tts, model header, reference_id, prosody speed/volume; WAV supports 44.1 kHz, converted locally to 48 kHz. Keep requested default s2-pro, configurable. https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
- Never persist the supplied credential. Runtime environment credentials only; mock fallback when unavailable or network blocked.
- No licensed VRM supplied: use original procedural mannequin. No downloaded asset is assumed licensed.
- Use `node --import tsx` to avoid tsx CLI IPC listener restricted in this sandbox.
- Use `pnpm run doctor`: pnpm's built-in doctor takes precedence over package scripts.
- Cached Three 0.182.0, Vite 6.4.1, YAML 2.7.1, TS 5.9.3, tsx 4.23.15. No cached Vitest or three-vrm: Node's test runner temporarily replaces Vitest; VRM support will use an optional adapter with explicit dependency instructions.
- Empty macOS speech output is fatal. Synthetic tones are allowed only in explicitly labeled test fixtures, never as a replacement for requested spoken dialogue.
- Tested VideoToolbox execution, not just encoder listing: use libx264 when device encoding is unavailable.
- Restored Mediabunny 1.50.3 from local cache for actual in-page WebCodecs MP4 muxing. Both complete transports are benchmarked when the browser can run; no speed claim without execution.
- Optional three-vrm 3.5.5 is exact-pinned and handled by a Vite virtual module so offline mannequin builds work. Package source/license: https://github.com/pixiv/three-vrm (MIT).
- Minimum 1.4 s shot duration takes precedence over a new-speaker cut on very short lines; hold both camera subject and preset until an allowed boundary.
- No bypass of sandbox restrictions was attempted. Inaccessible speech, listeners, browser and network are recorded as blockers; docs give normal terminal commands.

## Timed script / Atlas update
- User's exact 0–28 s caption schedule overrides inferred speech timing for the new spec; pitch-preserving FFmpeg atempo chains fit each line without dropping its words. 28–30 s is the requested website outro.
- Original detailed procedural character selected with `model: builtin:atlas`; no unverified asset license or real-person likeness. Export GLB for reuse in 3D tools.
- `.env` is loaded automatically by render/batch/doctor. Checked only whether key and voice variables exist; did not print credentials. Key exists; voice ID does not.
