// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsconfig paths and nitro. Do not add those plugins again.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const base = process.env.GUIX_BASE || "/";

export default defineConfig({
  vite: { base },
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      crawlLinks: true,
      autoStaticPathsDiscovery: true,
      failOnError: true,
    },
  },
});
