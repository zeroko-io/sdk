// A Vite plugin that turns a build into a Zeroko service: the client's
// build is its public files, served by the ASSETS binding, and a server
// entry, if there is one, takes every request they don't answer. With no
// server, a single-page app's routes get its index.html.
//   import zeroko from "@zeroko-io/vite"
//   export default defineConfig({ plugins: [zeroko({ server: "src/server.ts" })] })
import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { bundle, collect, finish, type Options } from "@zeroko-io/core"
import type { Plugin, ResolvedConfig } from "vite"

export type ZerokoViteOptions = Options & {
  /** A module whose default export handles what the public files don't:
   * a Hono app, or any { fetch(request, env, ctx) } (with job and message
   * too). */
  server?: string
  /** Paths that are no file get index.html: on by default with no
   * server, and for page requests the server answers 404 with one. */
  spa?: boolean
}

/** The service's main module: the public files first, then the server,
 * then index.html for a single-page app's routes. */
function entry(server: string | undefined, spa: boolean): string {
  return `${server ? `import app from ${JSON.stringify(server)};` : "const app = undefined;"}
const spa = ${spa};
const page = (request) =>
  (request.method === "GET" || request.method === "HEAD") &&
  (request.headers.get("accept") ?? "").includes("text/html");
async function index(request, env) {
  return env.ASSETS.fetch(new URL("/", request.url));
}
export default {
  async fetch(request, env, ctx) {
    if (env.ASSETS && (request.method === "GET" || request.method === "HEAD")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }
    if (app) {
      const res = await app.fetch(request, env, ctx);
      if (res.status === 404 && env.ASSETS && spa && page(request)) return index(request, env);
      return res;
    }
    if (env.ASSETS && spa && page(request)) return index(request, env);
    return new Response("Not found", { status: 404 });
  },
  ...(app?.job ? { job: (job, env, ctx) => app.job(job, env, ctx) } : {}),
  ...(app?.message ? { message: (event, env, ctx) => app.message(event, env, ctx) } : {}),
};
`
}

export default function zeroko(opts: ZerokoViteOptions = {}): Plugin {
  let config: ResolvedConfig
  return {
    name: "zeroko",
    apply: "build",
    configResolved(c) {
      config = c
    },
    closeBundle: {
      sequential: true,
      async handler() {
        // Once, after the client's build: not after a server build.
        if (config.build.ssr) return
        const env = (this as { environment?: { name: string } }).environment
        if (env && env.name !== "client") return
        const root = config.root
        const work = path.join(root, ".zeroko")
        const outDir = path.join(work, "server")
        await rm(outDir, { recursive: true, force: true })
        await mkdir(work, { recursive: true })
        const main = path.join(work, "entry.js")
        const server = opts.server ? path.resolve(root, opts.server) : undefined
        await writeFile(main, entry(server, opts.spa ?? true))
        await bundle({ entry: main, outDir })
        const deployment = await collect({
          serverDir: outDir,
          main: "index.js",
          assetsDir: path.resolve(root, config.build.outDir),
        })
        await finish(deployment, opts, root)
      },
    },
  }
}
