import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
