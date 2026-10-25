import { sveltekit } from "@sveltejs/kit/vite"
import zeroko from "@zeroko-io/sveltekit"
import { defineConfig } from "vite"

// SvelteKit on Zeroko; the bindings are in zeroko.json.
export default defineConfig({ plugins: [sveltekit({ adapter: zeroko() })] })
