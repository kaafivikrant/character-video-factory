import { writeFileSync } from "node:fs";

class FishHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function describeFishError(body: string) {
  try {
    const parsed = JSON.parse(body);
    const detail = [parsed.message, parsed.reason, parsed.error]
      .find((value) => typeof value === "string" && value.trim())
      ?.trim();
    return detail || "no error details returned";
  } catch {
    return body.trim().slice(0, 300) || "no error details returned";
  }
}

export async function fish(
  text: string,
  voice: string,
  speed: number,
  normalize: boolean,
  path: string,
  temperature = 0.55,
  topP = 0.7,
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
          temperature,
          top_p: topP,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        const detail = describeFishError(await response.text());
        if (response.status === 400 && /reference not found/i.test(detail))
          throw new FishHttpError(
            response.status,
            `Fish could not resolve the supplied reference_id. It must be a trained TTS voice model ID accessible to this API key; FISH_MODEL (${process.env.FISH_MODEL || "s2-pro"}) selects the synthesis engine, not the voice. Run pnpm test:voices to check both configured IDs.`,
          );
        throw new FishHttpError(
          response.status,
          `Fish HTTP ${response.status}: ${detail}`,
        );
      }
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < 44) throw new Error("Fish returned empty audio");
      writeFileSync(path, data);
      return;
    } catch (e) {
      // Client errors such as 401/402/404 are configuration/account issues;
      // repeating the same request only adds delay and cost.
      if (e instanceof FishHttpError && e.status < 500 && e.status !== 429)
        throw e;
      if (attempt === 3) {
        const cause = (e as any)?.cause;
        const code = cause?.code ?? (e as any)?.code;
        const host = cause?.hostname ?? (e as any)?.hostname;
        if (
          [
            "ENOTFOUND",
            "EAI_AGAIN",
            "ECONNREFUSED",
            "EHOSTUNREACH",
            "ENETUNREACH",
            "ECONNRESET",
            "ETIMEDOUT",
          ].includes(code)
        )
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
