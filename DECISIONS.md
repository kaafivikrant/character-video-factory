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
