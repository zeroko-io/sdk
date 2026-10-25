import { zeroko } from "@zeroko-io/nitro"

// Nuxt on Zeroko, through Nitro; the bindings are in zeroko.json.
export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  nitro: zeroko(),
})
