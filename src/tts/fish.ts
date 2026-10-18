import { writeFileSync } from "node:fs";
export async function fish(
  text: string,
  voice: string,
  speed: number,
  normalize: boolean,
  path: string,
) {
  if (!process.env.FISH_API_KEY)
    throw new Error("Fish key not in runtime environment");
  if (!voice) throw new Error("Fish reference_id missing");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FISH_API_KEY}`,
          "Content-Type": "application/json",
          model: process.env.FISH_MODEL || "s2-pro",
        },
        body: JSON.stringify({
          text,
          reference_id: voice,
          format: "wav",
          sample_rate: 44100,
          prosody: { speed, volume: 0 },
          latency: "normal",
          normalize,
          temperature: 0.7,
          top_p: 0.7,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`Fish HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < 44) throw new Error("Fish returned empty audio");
      writeFileSync(path, data);
      return;
    } catch (e) {
      if (attempt === 3) {
        const cause = (e as any)?.cause;
        const code = cause?.code ?? (e as any)?.code;
        const host = cause?.hostname ?? (e as any)?.hostname;
        if ([
          "ENOTFOUND",
          "EAI_AGAIN",
          "ECONNREFUSED",
          "EHOSTUNREACH",
          "ENETUNREACH",
          "ECONNRESET",
          "ETIMEDOUT",
        ].includes(code))
          throw new Error(
            `Fish Audio network request failed (${code}${host ? `: ${host}` : ""})`,
          );
        if ((e as Error)?.name === "TimeoutError")
          throw new Error("Fish Audio request timed out after 60 seconds");
        throw new Error(`Fish Audio request failed: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}
