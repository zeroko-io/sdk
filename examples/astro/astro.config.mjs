import zeroko from "@zeroko-io/astro"
import { defineConfig } from "astro/config"

// Astro on Zeroko, rendering on request; the bindings are in zeroko.json.
export default defineConfig({ output: "server", adapter: zeroko() })
