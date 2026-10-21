import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: false,
  entry: ["src/index.ts", "src/register-commands.ts"],
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  target: "node24",
  unbundle: true,
});
