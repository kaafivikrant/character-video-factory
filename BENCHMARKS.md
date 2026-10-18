# Benchmarks

Environment detected: macOS arm64, Node 22.22.3, pnpm 10.8.1, FFmpeg 8.1.1. Exact SoC and RAM were not independently queried; no assumption that this machine matches the prompt's M1/16 GB target.

| Measurement | Observed |
|---|---|
| Production build | Passed; initial Three bundle ~608 kB, ~160 kB gzip before optional WebCodecs muxer split |
| Unit tests | 8 passed, ~0.2 s test-runner duration |
| Media-only fixture | 2.000021 s normalized tone, 101 RMS windows |
| Encoded media fixture | H.264 + AAC; −14.09 LUFS |
| Hardware encoding | Encoder is listed, but runtime encode fails; libx264 fallback works |
| Full sample duration / render fps | Not measurable: speech services and browser blocked |
| JPEG vs WebCodecs MP4 | Implemented, not executed: localhost listener returns EPERM |
| 30 s vertical ≤6 min | Unverified; no performance claim |

Successful render runs write per-stage timings to report.json and 30-frame transport measurements to render.json, including JPEG encode/transport and in-page WebCodecs+MP4 generation/transfer. Startup overhead affects the short benchmark. No automatic quality cuts have been applied without measurements; the ordered shadow/bloom/resolution reduction policy remains a TODO.

Synthetic-tone fixture is a test of audio/encoding plumbing only. It is not a delivered character video or speech benchmark.
