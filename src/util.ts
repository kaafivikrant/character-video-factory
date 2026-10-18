import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  realpathSync,
} from "node:fs";
import { resolve, relative, dirname, isAbsolute } from "node:path";
const exec = promisify(execFile);
export async function run(file: string, args: string[], options: any = {}) {
  try {
    const r = await exec(file, args, {
      maxBuffer: 32 * 1024 * 1024,
      timeout: 120000,
      encoding: "utf8",
      ...options,
    });
    return { stdout: r.stdout.toString(), stderr: r.stderr.toString() };
  } catch (e) {
    throw new Error(
      `${file} failed: ${(e.stderr || e.message).toString().slice(-2000)}`,
    );
  }
}
export const hash = (v: any) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : JSON.stringify(v))
    .digest("hex");
export function json(path: string, v: any) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(v, null, 2));
}
export const readJSON = (p: string) => JSON.parse(readFileSync(p, "utf8"));
export function local(p: string) {
  const root = realpathSync(process.cwd()),
    abs = resolve(p);
  let ancestor = abs;
  while (!existsSync(ancestor) && ancestor !== dirname(ancestor))
    ancestor = dirname(ancestor);
  const actual = resolve(realpathSync(ancestor), relative(ancestor, abs));
  const r = relative(root, actual);
  if (r.startsWith("..") || isAbsolute(r))
    throw new Error(`Path must remain inside project: ${p}`);
  return abs;
}
export const random = (seed: number, i: number) => {
  const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export async function duration(p: string) {
  return Number(
    (
      await run("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=nw=1:nk=1",
        p,
      ])
    ).stdout,
  );
}
