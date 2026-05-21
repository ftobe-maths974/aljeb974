import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],

  // GitHub Pages : déployé sur https://ftobe-maths974.github.io/aljeb974/
  // En dev local, on veut "/" pour que `vite preview` et `vite` fonctionnent normalement.
  base: process.env.NODE_ENV === "production" ? "/aljeb974/" : "/",

  server: {
    host: true, // accessible depuis le réseau local (utile pour tester sur smartphone)
    port: 5173,
  },

  build: {
    target: "es2022",
    outDir: "dist",
    assetsInlineLimit: 4096,
  },
});
