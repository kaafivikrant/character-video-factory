import { chromium } from "playwright";
import { resolve } from "node:path";
import { readdirSync, existsSync } from "node:fs";
const html = resolve("out/dating_chat_v2/motion-review/preview.html");
const dest = resolve("out/dating_chat_v2/motion-review/silent-review.mp4");
const cache = resolve(process.env.HOME || ".", "Library/Caches/ms-playwright");
const browserVersion = readdirSync(cache).filter((entry) => /^chromium-\d+$/.test(entry)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
if (!browserVersion) throw new Error("No installed Playwright Chromium browser found");
const appExecutable = resolve(cache, browserVersion, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
const executablePath = existsSync(appExecutable) ? appExecutable : chromium.executablePath();
const browser = await chromium.launch({ executablePath, headless: true, args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") console.error(`[browser] ${message.text()}`); });
  await page.goto(`file://${html}`);
  await page.locator("#status").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#status")?.textContent?.startsWith("Ready:"), null, { timeout: 30000 });
  const renderer = await page.locator("#status").textContent();
  console.log(renderer);
  const downloadPromise = page.waitForEvent("download", { timeout: 300000 });
  await page.locator("#render").click();
  const download = await downloadPromise;
  await download.saveAs(dest);
  const status = await page.locator("#status").textContent();
  if (!status?.startsWith("Complete:")) throw new Error(status || "MP4 export failed");
  console.log(status);
  console.log(`Saved ${dest}`);
} finally {
  await browser.close();
}
