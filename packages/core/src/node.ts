// Node's HTTP servers on Zeroko: Express, Fastify, Koa or any
// node:http request handler, served through workerd's Node compatibility.
// Runtime code: a service's main module imports it.
import { httpServerHandler } from "cloudflare:node"
import { createServer, type RequestListener, type Server } from "node:http"

const PORT = 8080

type App = RequestListener | Server

type Handler = {
  fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>
}

/** A service from a Node request handler (an Express app, Koa's
 * app.callback()) or a node:http server; or a function that makes one,
 * maybe a promise of it, for an app that gets ready on its own (Fastify's
 * app.ready()): called on the first request, as a module can't wait for
 * anything at its top level. */
export function node(app: App | (() => App | Promise<App>)): Handler {
  const handler = httpServerHandler({ port: PORT }) as Handler
  const listen = (a: App) => {
    const server = typeof a === "function" ? createServer(a) : a
    server.listen(PORT)
  }
  // A request handler takes (req, res): a function of nothing makes one.
  if (typeof app !== "function" || app.length > 0) {
    listen(app as App)
    return handler
  }
  const make = app as () => App | Promise<App>
  let ready: Promise<void> | undefined
  return {
    async fetch(request, env, ctx) {
      ready ??= Promise.resolve(make()).then(listen)
      await ready
      return handler.fetch(request, env, ctx)
    },
  }
}
