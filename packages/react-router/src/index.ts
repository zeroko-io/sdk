// React Router's framework mode on Zeroko: once React Router has built, its
// client's files are the service's public files, and its server build is
// bundled with an entry that hands it the service's bindings in its
// context (see ./context). Deployed as zeroko.json and .env say.
//   react-router.config.ts: export default { buildEnd: zeroko() } satisfies Config
import { mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { build, type Options } from "@zeroko-io/core"

type BuildEndArgs = {
  reactRouterConfig: { buildDirectory: string; serverBuildFile: string }
  viteConfig: { root: string; base: string }
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
 * from React Router, with the bindings in its context. The files are at
 * Vite's base (/app/assets/… for base "/app/"), and in ASSETS without it. */
function entry(server: string, assets: string[], base: string): string {
  return `import { createRequestHandler, RouterContextProvider } from "react-router";
import * as build from ${JSON.stringify(server)};
import { zeroko } from "@zeroko-io/react-router/context";
const handle = createRequestHandler(build, "production");
const assets = new Set(${JSON.stringify(assets)});
const base = ${JSON.stringify(base)};
export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const file = pathname.startsWith(base) ? pathname.slice(base.length - 1) : "";
    if (env.ASSETS && (request.method === "GET" || request.method === "HEAD") && assets.has(file)) {
      return env.ASSETS.fetch(base === "/" ? request : new Request(new URL(file, request.url), request));
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
    await mkdir(work, { recursive: true })
    const main = path.join(work, "entry.js")
    const server = path.join(dir, "server", reactRouterConfig.serverBuildFile)
    // A base that's a URL or relative ("./") serves no files at a path here.
    const base = viteConfig.base.startsWith("/") ? viteConfig.base : "/"
    await writeFile(main, entry(server, await files(client), base))
    await build({ ...opts, entry: main, assets: client, root })
  }
}
