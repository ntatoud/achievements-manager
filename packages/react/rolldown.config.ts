import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  external: ["achievements", "react", /^react\//],
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
});
