// An Astro adapter for Zeroko: pages Astro renders on request, and those it
// prerenders or are static, built into a Zeroko service and deployed, as
// zeroko.json and .env say. The service's bindings are in
// Astro.locals.runtime.env.
//   astro.config.mjs: export default defineConfig({ adapter: zeroko() })
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { build, type Options } from "@zeroko-io/core"
import type { AstroConfig, AstroIntegration } from "astro"

/** A static site's main module: its files, its 404 page for the rest. */
const STATIC = `export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404) return res;
    const page = await env.ASSETS.fetch(new URL("/404.html", request.url));
    return new Response(page.status === 404 ? "Not found" : page.body, {
      status: 404,
      headers: page.status === 404 ? {} : { "content-type": "text/html; charset=utf-8" },
    });
  },
};
`

export default function zeroko(opts: Options = {}): AstroIntegration {
  let config: AstroConfig
  let output: "static" | "server"
  return {
    name: "@zeroko-io/astro",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        // Sharp doesn't run in a worker: images go as they are.
        updateConfig({ image: { service: { entrypoint: "astro/assets/services/noop" } } })
      },
      "astro:config:done": ({ config: c, setAdapter, buildOutput }) => {
        config = c
        output = buildOutput
        setAdapter({
          name: "@zeroko-io/astro",
          entrypointResolution: "auto",
          serverEntrypoint: "@zeroko-io/astro/server",
          adapterFeatures: { buildOutput, middlewareMode: "classic" },
          supportedAstroFeatures: {
            serverOutput: "stable",
            hybridOutput: "stable",
            staticOutput: "stable",
            sharpImageService: "unsupported",
          },
        })
      },
      "astro:build:done": async () => {
        const root = fileURLToPath(config.root)
        let entry = path.join(fileURLToPath(config.build.server), config.build.serverEntry)
        if (output === "static") {
          const work = path.join(root, ".zeroko")
          await mkdir(work, { recursive: true })
          entry = path.join(work, "static.js")
          await writeFile(entry, STATIC)
        }
        const assets = fileURLToPath(output === "static" ? config.outDir : config.build.client)
        await build({ ...opts, entry, assets, root })
      },
    },
  }
}
