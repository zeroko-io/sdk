// The server's entry Astro builds: its static files and prerendered pages
// from the ASSETS binding, the rest rendered, with the service's bindings
// as Astro.locals.runtime.env.
// @ts-ignore: Astro's own module, resolved when Astro builds this entry.
import { createApp } from "astro/app/entrypoint"

type Env = { ASSETS?: { fetch(r: Request | URL): Promise<Response> } } & Record<string, unknown>
type Ctx = { waitUntil(p: Promise<unknown>): void }

const app = createApp()

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (env.ASSETS && app.manifest.assets.has(pathname)) return env.ASSETS.fetch(request)
    const routeData = app.match(request)
    if (!routeData && env.ASSETS) {
      const asset = await env.ASSETS.fetch(request)
      if (asset.status !== 404) return asset
    }
    return app.render(request, {
      routeData,
      locals: { runtime: { env, ctx } },
      waitUntil: ctx.waitUntil.bind(ctx),
      clientAddress: (request.headers.get("x-forwarded-for") ?? "").split(",")[0]!.trim(),
    })
  },
}
