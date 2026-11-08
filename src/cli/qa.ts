import { qa } from "../qa/checks";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { local } from "../util";
let dir = process.argv[2] ? local(process.argv[2]) : "";
if (!dir) {
  console.error("Usage: pnpm qa out/id");
  process.exitCode = 1;
} else {
  // Accept either an explicit run folder or an ID's output root. In the latter
  // case QA always follows the newest timestamped render.
  const runs = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("run-"))
        .map((entry) => join(dir, entry.name))
        .sort()
    : [];
  if (runs.length) dir = runs[runs.length - 1];
  console.log(`QA output: ${dir}`);
  qa(local(dir))
    .then((r) => {
      console.table(r.checks);
      process.exitCode = r.passed ? 0 : 1;
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
