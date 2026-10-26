// Nitro on Zeroko: Nitro's preset for Cloudflare's module workers (the
// runtime Zeroko runs on, whose ASSETS binding serves the public files as
// Zeroko's does), and once built, the server and its public files
// collected into a deployment and deployed, as zeroko.json and .env say.
// The service's bindings are in event.context.cloudflare.env.
//
// As Nitro's options, for Nitro 2 (Nuxt) and Nitro 3 (its Vite plugin,
// as SolidStart and TanStack Start use):
//   nuxt.config.ts:  defineNuxtConfig({ nitro: zeroko() })
//   vite.config.ts:  plugins: [solidStart(), nitro(zeroko())]
// Or as Nitro 2's preset: nitro: { preset: "@zeroko-io/nitro" }.
import path from "node:path"

import { build, type Options } from "@zeroko-io/core"
import { defineNitroPreset } from "nitropack/kit"

type Built = {
  options: { rootDir: string; output: { serverDir: string; publicDir: string } }
}

async function deploy(nitro: Built, opts: Options) {
  // Bundled again: Nitro's chunks can have names the runner doesn't take
  // ([...] and such), and this way they're one graph like every adapter's.
  await build({
    ...opts,
    entry: path.join(nitro.options.output.serverDir, "index.mjs"),
    assets: nitro.options.output.publicDir,
    root: nitro.options.rootDir,
  })
}

/** Nitro's options for Zeroko: the preset it builds on, and the hook that
 * deploys the build. */
export function zeroko(opts: Options = {}) {
  return {
    preset: "cloudflare-module" as const,
    hooks: { compiled: (nitro: Built) => deploy(nitro, opts) },
  }
}

export default defineNitroPreset(
  {
    extends: "cloudflare-module",
    hooks: { compiled: (nitro) => deploy(nitro, {}) },
  },
  { name: "zeroko", url: import.meta.url }
)
