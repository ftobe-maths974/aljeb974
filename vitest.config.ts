import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    environment: "node", // moteur 100% pur, pas besoin de jsdom
    globals: true,
  },
});
