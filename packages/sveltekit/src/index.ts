// A SvelteKit adapter for Zeroko: the client's files and the prerendered
// pages are the service's public files; the rest is SvelteKit's server,
// bundled with an entry that hands it the service's bindings as
// event.platform.env (and `env` from "cloudflare:workers" works too).
//   vite.config.js: sveltekit({ adapter: zeroko() })
import { rmSync, writeFileSync } from "node:fs"
import path from "node:path"

import type { Adapter } from "@sveltejs/kit"
import { bundle, collect, finish, type Options } from "@zeroko-io/core"

/** The service's main module: SvelteKit's static files and prerendered
 * pages from ASSETS, the rest from its server. */
function entry(opts: {
  server: string
  base: string
  appPath: string
  assets: string[]
  prerendered: string[]
}): string {
  return `import { server } from ${JSON.stringify(opts.server)};
const base = ${JSON.stringify(opts.base)};
const assets = new Set(${JSON.stringify(opts.assets)});
const prerendered = new Set(${JSON.stringify(opts.prerendered)});
const immutable = "/${opts.appPath}/immutable/";
const version = "/${opts.appPath}/version.json";
let origin;
let initialized;
export default {
  async fetch(request, env, ctx) {
    origin ??= new URL(request.url).origin;
    initialized ??= server.init({
      env,
      read: async (file) => {
        const res = await env.ASSETS.fetch(new URL("/" + file, origin));
        if (!res.ok) throw new Error("read(" + file + "): " + res.status);
        return res.body;
      },
    });
    await initialized;
    let { pathname, search } = new URL(request.url);
    try {
      pathname = decodeURIComponent(pathname);
    } catch {}
    const stripped = pathname.replace(/\\/$/, "");
    const file = stripped.slice(base.length + 1);
    const isAsset = file && (assets.has(file) || assets.has(file + "/index.html"));
    if (isAsset || prerendered.has(pathname) || pathname === version || pathname.startsWith(immutable)) {
      return env.ASSETS.fetch(request);
    }
    const location = pathname.at(-1) === "/" ? stripped : pathname + "/";
    if (location && prerendered.has(location)) {
      return new Response("", { status: 308, headers: { location: location + search } });
    }
    return server.respond(request, {
      platform: { env, ctx },
      getClientAddress: () => (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
    });
  },
};
`
}

export default function zeroko(opts: Options = {}): Adapter {
  return {
    name: "@zeroko-io/sveltekit",
    async adapt(builder) {
      const work = builder.getBuildDirectory("zeroko")
      builder.rimraf(work)
      const assets = path.join(work, "public")
      builder.writeClient(path.join(assets, builder.config.paths.base))
      builder.writePrerendered(path.join(assets, builder.config.paths.base))
      builder.generateServerInstance(path.join(work, "server.js"))
      const main = path.join(work, "entry.js")
      writeFileSync(
        main,
        entry({
          server: "./server.js",
          base: builder.config.paths.base,
          appPath: builder.getAppPath(),
          assets: builder.manifest.assets.map((a: { path: string }) => a.path),
          prerendered: builder.prerendered.paths,
        })
      )
      const outDir = path.join(work, "out")
      rmSync(outDir, { recursive: true, force: true })
      await bundle({ entry: main, outDir })
      const deployment = await collect({ serverDir: outDir, main: "index.js", assetsDir: assets })
      await finish(deployment, opts, process.cwd())
    },
  }
}
