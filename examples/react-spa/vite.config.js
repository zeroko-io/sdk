import react from "@vitejs/plugin-react"
import zeroko from "@zeroko-io/vite"
import { defineConfig } from "vite"

// A single-page app: its routes, /about and the rest, get index.html.
export default defineConfig({ plugins: [react(), zeroko()] })
