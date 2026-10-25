import react from "@vitejs/plugin-react"
import zeroko from "@zeroko-io/vite"
import { defineConfig } from "vite"

// React in the browser, Hono on the server (/api), one service; its
// bindings are in zeroko.json.
export default defineConfig({
  plugins: [react(), zeroko({ server: "src/server.ts" })],
})
