// A deployment: what the runner's API takes to deploy a service, its
// modules and public/ files, its main module and its manifest.
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

import type { BindingType, Cron } from "./types.js"

/** The body of POST /api/services/<name>/deployments. */
export type Deployment = {
  main: string
  files: Record<string, string | { base64: string }>
  bindings?: Record<string, BindingType>
  crons?: Cron[]
  vars?: Record<string, string>
}

// The runner's limits on a deployment.
export const MAX_FILES = 2000
export const MAX_BYTES = 50 << 20

/** Files the runner loads as strings (or as code): the rest go as base64. */
const TEXT = new Set([
  ".js",
  ".mjs",
  ".json",
  ".txt",
  ".html",
  ".htm",
  ".css",
  ".md",
  ".svg",
  ".xml",
  ".csv",
])

/** Never deployed: source maps and type declarations. */
const SKIP = [".map", ".d.ts", ".d.mts"]

const NAME = /^[A-Za-z0-9_\-.@+/]+$/

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else if (e.isFile()) out.push(full)
  }
  return out
}

async function exists(dir: string): Promise<boolean> {
  return stat(dir).then(
    (s) => s.isDirectory(),
    () => false
  )
}

/** Collects a build into a deployment: the server's modules from
 * `serverDir` (its main module `main`, relative to it), and the public
 * files from `assetsDir`, served by the `assets` binding. */
export async function collect(opts: {
  serverDir: string
  main: string
  assetsDir?: string
}): Promise<Deployment> {
  const files: Deployment["files"] = {}
  let bytes = 0
  const add = async (name: string, file: string) => {
    if (!NAME.test(name)) {
      throw new Error(
        `zeroko: ${name} can't be deployed: file names are letters, digits and _ - . @ + /`
      )
    }
    const content = await readFile(file)
    bytes += content.length
    files[name] = TEXT.has(path.extname(file).toLowerCase())
      ? content.toString("utf8")
      : { base64: content.toString("base64") }
  }
  for (const file of await walk(opts.serverDir)) {
    if (SKIP.some((ext) => file.endsWith(ext))) continue
    const name = path.relative(opts.serverDir, file).split(path.sep).join("/")
    await add(name, file)
  }
  if (opts.assetsDir && (await exists(opts.assetsDir))) {
    for (const file of await walk(opts.assetsDir)) {
      if (file.endsWith(".map")) continue
      const name = path.relative(opts.assetsDir, file).split(path.sep).join("/")
      await add(`public/${name}`, file)
    }
  }
  const main = opts.main.split(path.sep).join("/")
  if (!(main in files)) {
    throw new Error(`zeroko: the main module ${main} isn't in the build`)
  }
  const count = Object.keys(files).length
  if (count > MAX_FILES) {
    throw new Error(
      `zeroko: the build has ${count} files; a deployment takes up to ${MAX_FILES}`
    )
  }
  if (bytes > MAX_BYTES) {
    throw new Error(
      `zeroko: the build is ${(bytes / 2 ** 20).toFixed(1)} MB; a deployment takes up to ${MAX_BYTES / 2 ** 20} MB`
    )
  }
  const hasAssets = Object.keys(files).some((f) => f.startsWith("public/"))
  return { main, files, ...(hasAssets ? { bindings: { ASSETS: "assets" } } : {}) }
}
