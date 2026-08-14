import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["frontend/src/**/*.test.ts", "backend/src/**/*.test.ts"],
    clearMocks: true,
  },
  resolve: {
    conditions: ["react-server"],
    alias: {
      "server-only": fileURLToPath(
        new URL(
          "./node_modules/server-only/empty.js",
          import.meta.url,
        ),
      ),
      "@frontend": fileURLToPath(new URL("./frontend/src", import.meta.url)),
      "@backend": fileURLToPath(new URL("./backend/src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./backend/src/shared", import.meta.url)),
    },
  },
});
