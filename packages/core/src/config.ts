// A project's Zeroko settings: zeroko.json, what the service is (kept in
// the repository), and .env, where it goes (kept out of it). An adapter's
// own options go over both.
//
//   zeroko.json  {"service": "shop", "bindings": {"DB": "db"}, "crons": [...], "vars": {...}}
//   .env         ZEROKO_URL=https://acme.zeroko.space
//                ZEROKO_TOKEN=zk_...
import { readFile } from "node:fs/promises"
import path from "node:path"

import type { Options } from "./deploy.js"

/** What zeroko.json holds: what the service is, never where it goes (the
 * address and the token, in .env): a repository's zeroko.json mustn't send
 * one's token elsewhere. */
export type ZerokoJson = Pick<Options, "service" | "bindings" | "crons" | "vars">

/** The KEY=value lines of a .env file, without quotes. */
function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    let v = m[2]!
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1)
    else v = v.replace(/\s+#.*$/, "")
    out[m[1]!] = v
  }
  return out
}

async function read(file: string): Promise<string | undefined> {
  return readFile(file, "utf8").catch(() => undefined)
}

/** The ZEROKO_* settings of a project's .env and .env.local (the latter
 * first), under the process's own environment, which wins. */
async function envOf(root: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const name of [".env", ".env.local"]) {
    const text = await read(path.join(root, name))
    if (text) Object.assign(out, parseEnv(text))
  }
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) out[k] = v
  return out
}

/** A project's options: zeroko.json, then .env, then the adapter's. */
export async function resolve(root: string, opts: Options = {}): Promise<Options> {
  let file: ZerokoJson = {}
  const text = await read(path.join(root, "zeroko.json"))
  if (text) {
    try {
      file = JSON.parse(text)
    } catch (err) {
      throw new Error(`zeroko: zeroko.json isn't JSON: ${(err as Error).message}`)
    }
    if ("token" in file || "url" in file) {
      throw new Error(
        "zeroko: keep the address and the token out of zeroko.json: put ZEROKO_URL and ZEROKO_TOKEN in .env"
      )
    }
  }
  const env = await envOf(root)
  return {
    ...file,
    ...opts,
    service: opts.service ?? env.ZEROKO_SERVICE ?? file.service,
    url: opts.url ?? env.ZEROKO_URL,
    token: opts.token ?? env.ZEROKO_TOKEN,
    bindings: { ...file.bindings, ...opts.bindings },
    crons: opts.crons ?? file.crons,
    vars: { ...file.vars, ...opts.vars },
  }
}
