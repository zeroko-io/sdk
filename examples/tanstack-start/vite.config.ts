import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { zeroko } from "@zeroko-io/nitro"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

// TanStack Start on Zeroko, through Nitro; the bindings are in zeroko.json.
export default defineConfig({ plugins: [tanstackStart(), nitro(zeroko()), react()] })
