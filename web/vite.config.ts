import { defineConfig } from "vite";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export default defineConfig({
  plugins: [
    {
      name: "optional-vrm",
      resolveId(id) {
        if (id === "virtual:vrm") return "\0virtual:vrm";
      },
      load(id) {
        if (id !== "\0virtual:vrm") return;
        try {
          require.resolve("@pixiv/three-vrm");
          return 'export { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";';
        } catch {
          return 'export class VRMLoaderPlugin { constructor() { throw new Error("Optional @pixiv/three-vrm is not installed"); } } export const VRMUtils = { rotateVRM0() {} };';
        }
      },
    },
  ],
  build: { target: "esnext", emptyOutDir: true },
  server: { host: "127.0.0.1" },
});
