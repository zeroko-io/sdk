// workerd's own module, there at runtime only.
declare module "cloudflare:node" {
  export function httpServerHandler(options: { port: number }): unknown
}
