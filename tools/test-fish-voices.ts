import { mkdirSync } from "node:fs";
import { duration } from "../src/util";
import { fish } from "../src/tts/fish";

if (!process.env.FISH_API_KEY) throw new Error("FISH_API_KEY is missing from .env");
mkdirSync(".cache/tts-test", { recursive: true });
const voices = [
  ["arjun", process.env.FISH_VOICE_HERO],
  ["kabir", process.env.FISH_VOICE_FRIEND],
] as const;
let failed = false;
console.log(`Fish engine: ${process.env.FISH_MODEL || "s2.1-pro"}`);
for (const [character, voice] of voices) {
  if (!voice) {
    console.log(`${character}: SKIP (voice ID is missing)`);
    continue;
  }
  let modelResponse: Response;
  try {
    modelResponse = await fetch(`https://api.fish.audio/model/${encodeURIComponent(voice)}`, {
      headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}` },
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    const e = error as Error & { cause?: { code?: string } };
    const code = e.cause?.code;
    console.log(`${character}: FAIL (model lookup network error${code ? `: ${code}` : `: ${e.message}`})`);
    failed = true;
    continue;
  }
  if (!modelResponse.ok) {
    console.log(`${character}: MODEL LOOKUP FAIL (HTTP ${modelResponse.status}; Fish does not return this model ID to this account)`);
    if (modelResponse.status === 404) {
      try {
        const listResponse = await fetch("https://api.fish.audio/model?self=true&page_size=100", {
          headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}` },
          signal: AbortSignal.timeout(20000),
        });
        if (listResponse.ok) {
          const list = await listResponse.json() as { items?: Array<{ _id?: string; type?: string; title?: string; state?: string; visibility?: string }> };
          const candidates = (list.items || []).filter((model) => model.type === "tts" && model.state === "trained");
          if (candidates.length) {
            console.log(`${character}: trained voice IDs available to this account:`);
            for (const model of candidates)
              console.log(`  ${model.title || "Untitled"} | ${model._id} | ${model.visibility || "visibility unknown"}`);
          } else {
            console.log(`${character}: no trained TTS models found in this account; checking public English voices`);
            const publicResponse = await fetch("https://api.fish.audio/model?language=en&page_size=25&page_number=1&sort_by=score", {
              headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}` },
              signal: AbortSignal.timeout(20000),
            });
            if (!publicResponse.ok) console.log(`${character}: public voice lookup failed (HTTP ${publicResponse.status})`);
            else {
              const publicList = await publicResponse.json() as { items?: Array<{ _id?: string; type?: string; title?: string; state?: string; visibility?: string }> };
              const publicCandidates = (publicList.items || []).filter((model) => model.type === "tts" && model.state === "trained");
              if (publicCandidates.length) {
                console.log(`${character}: public trained voice IDs you can use:`);
                for (const model of publicCandidates)
                  console.log(`  ${model.title || "Untitled"} | ${model._id} | ${model.visibility || "public"}`);
              } else console.log(`${character}: no public trained English voices returned`);
            }
          }
        } else console.log(`${character}: could not list account models (HTTP ${listResponse.status})`);
      } catch (error) {
        const e = error as Error & { cause?: { code?: string } };
        console.log(`${character}: model list network error (${e.cause?.code || e.message})`);
      }
    }
    failed = true;
    continue;
  }
  const model = await modelResponse.json() as { type?: string; state?: string; visibility?: string };
  console.log(`${character}: model found (type=${model.type || "unknown"}, state=${model.state || "unknown"}, visibility=${model.visibility || "unknown"})`);
  const path = `.cache/tts-test/${character}.wav`;
  try {
    await fish("Quick voice test.", voice, 1, true, path);
    console.log(`${character}: OK (${(await duration(path)).toFixed(2)} seconds)`);
  } catch (error) {
    console.log(`${character}: FAIL (${(error as Error).message})`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
