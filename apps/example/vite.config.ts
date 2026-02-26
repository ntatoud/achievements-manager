import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// Point directly at source so the example works without a pre-build step.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      achievements: resolve(__dirname, "../../packages/core/src/index.ts"),
      "achievements-react": resolve(__dirname, "../../packages/react/src/index.ts"),
    },
  },
});
