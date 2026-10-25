// A whole build in one call, for a service with no front end (Hono,
// Express, an API): its entry bundled, collected and finished.
//   import { build } from "@zeroko-io/core"
//   await build({ entry: "src/index.ts" })
import { rm } from "node:fs/promises"
import path from "node:path"

import { bundle } from "./bundle.js"
import { collect } from "./deployment.js"
import { finish, type Options } from "./deploy.js"

export type BuildOptions = Options & {
  /** The service's entry: its default export has fetch (and maybe job
   * and message). */
  entry: string
  /** Files served as they are, by the ASSETS binding: a directory. */
  assets?: string
  /** The project's root: the current directory by default. */
  root?: string
}

export async function build(opts: BuildOptions) {
  const root = path.resolve(opts.root ?? process.cwd())
  const outDir = path.join(root, ".zeroko", "server")
  await rm(outDir, { recursive: true, force: true })
  const main = await bundle({ entry: path.resolve(root, opts.entry), outDir })
  const deployment = await collect({
    serverDir: outDir,
    main,
    assetsDir: opts.assets ? path.resolve(root, opts.assets) : undefined,
  })
  return finish(deployment, opts, root)
}
