import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ["eslint", "@booga/vDsl"],
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: false,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
    external: ["eslint", "@booga/vDsl"],
  },
]);
