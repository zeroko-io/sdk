// React Router's framework mode on Zeroko: once React Router has built, its
// client's files are the service's public files, and its server build is
// bundled with an entry that hands it the service's bindings in its
// context (see ./context). Deployed as zeroko.json and .env say.
//   react-router.config.ts: export default { buildEnd: zeroko() } satisfies Config
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { bundle, collect, finish, type Options } from "@zeroko-io/core"

type BuildEndArgs = {
  reactRouterConfig: { buildDirectory: string; serverBuildFile: string; basename?: string }
  viteConfig: { root: string }
}

async function files(dir: string, base = ""): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const rel = `${base}/${e.name}`
    if (e.isDirectory()) out.push(...(await files(path.join(dir, e.name), rel)))
    else out.push(rel)
  }
  return out
}

/** The service's main module: the client's files from ASSETS, the rest
 * from React Router, with the bindings in its context. */
function entry(server: string, assets: string[]): string {
  return `import { createRequestHandler, RouterContextProvider } from "react-router";
import * as build from ${JSON.stringify(server)};
import { zeroko } from "@zeroko-io/react-router/context";
const handle = createRequestHandler(build, "production");
const assets = new Set(${JSON.stringify(assets)});
export default {
  async fetch(request, env, ctx) {
    if (env.ASSETS && (request.method === "GET" || request.method === "HEAD") && assets.has(new URL(request.url).pathname)) {
      return env.ASSETS.fetch(request);
    }
    const context = new RouterContextProvider();
    context.set(zeroko, { env, ctx });
    return handle(request, context);
  },
};
`
}

export default function zerokoBuild(opts: Options = {}) {
  return async ({ reactRouterConfig, viteConfig }: BuildEndArgs) => {
    const root = viteConfig.root
    const dir = reactRouterConfig.buildDirectory
    const client = path.join(dir, "client")
    const work = path.join(root, ".zeroko")
    const outDir = path.join(work, "server")
    await rm(outDir, { recursive: true, force: true })
    await mkdir(work, { recursive: true })
    const main = path.join(work, "entry.js")
    const server = path.join(dir, "server", reactRouterConfig.serverBuildFile)
    await writeFile(main, entry(server, await files(client)))
    await bundle({ entry: main, outDir })
    const deployment = await collect({ serverDir: outDir, main: "index.js", assetsDir: client })
    await finish(deployment, opts, root)
  }
}
