import zeroko from "@zeroko-io/vite"
import { defineConfig } from "vite"

// A plain site: its pages and files, and a 404 for anything else.
export default defineConfig({
  plugins: [zeroko({ spa: false })],
  build: { rollupOptions: { input: ["index.html", "about.html"] } },
})
