import { solidStart } from "@solidjs/start/config"
import { zeroko } from "@zeroko-io/nitro"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

// SolidStart on Zeroko, through Nitro; the bindings are in zeroko.json.
export default defineConfig({ plugins: [solidStart(), nitro(zeroko())] })
