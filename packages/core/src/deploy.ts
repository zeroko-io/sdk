// Deploying: the options every adapter takes, where the build is written,
// and the upload to a workspace's API.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { resolve } from "./config.js"
import type { Deployment } from "./deployment.js"
import type { BindingType, Cron } from "./types.js"

export type Options = {
  /** The service's name: its address. ZEROKO_SERVICE, or the package's
   * name. */
  service?: string
  /** Its bindings: env name to type ("db", "files", "jobs", "realtime",
   * "service:<name>"). ASSETS is added when the build has public files. */
  bindings?: Record<string, BindingType>
  crons?: Cron[]
  /** Plain strings in env. Use secrets, set through the API, for
   * credentials. */
  vars?: Record<string, string>
  /** Whether the build deploys when it's done: by default, when the
   * workspace's address and a token are set. */
  deploy?: boolean
  /** The workspace's address, where its API is: ZEROKO_URL, such as
   * https://acme.zeroko.space. */
  url?: string
  /** A token of the workspace: ZEROKO_TOKEN. */
  token?: string
}

/** A name the runner takes, from a package's name: @acme/web-app is
 * web-app. */
function slug(name: string): string {
  return (
    name
      .replace(/^@[^/]+\//, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "service"
  )
}

async function serviceOf(root: string, opts: Options): Promise<string> {
  if (opts.service) return opts.service
  try {
    const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"))
    if (pkg.name) return slug(pkg.name)
  } catch {}
  return slug(path.basename(root))
}

/** Uploads a deployment to a workspace: the service's new version, live
 * once this returns. */
export async function upload(
  deployment: Deployment,
  to: { url: string; token: string; service: string }
): Promise<{ url: string; version: number }> {
  const base = to.url.replace(/\/+$/, "").replace(/\/api$/, "")
  const res = await fetch(
    `${base}/api/services/${encodeURIComponent(to.service)}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${to.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deployment),
    }
  )
  const body = (await res.json().catch(() => null)) as {
    url?: string
    deployment?: { number?: number; error?: string }
    error?: { message?: string }
  } | null
  if (res.status === 201 && body?.url) {
    return { url: body.url, version: body.deployment?.number ?? 0 }
  }
  if (res.status === 422) {
    throw new Error(
      `zeroko: the deployment failed: ${body?.deployment?.error ?? "no reason given"}`
    )
  }
  throw new Error(
    `zeroko: the workspace answered ${res.status}: ${body?.error?.message ?? res.statusText}`
  )
}

/** The end of every adapter's build: the deployment, with the project's
 * manifest (zeroko.json, then the adapter's options), written to
 * .zeroko/deployment.json, and deployed when it should: with ZEROKO_URL
 * and ZEROKO_TOKEN, in the environment or the project's .env. */
export async function finish(
  deployment: Deployment,
  options: Options = {},
  root = process.cwd()
): Promise<{ file: string; url?: string }> {
  const opts = await resolve(root, options)
  const full: Deployment = {
    ...deployment,
    bindings: { ...deployment.bindings, ...opts.bindings },
    ...(opts.crons?.length ? { crons: opts.crons } : {}),
    ...(opts.vars && Object.keys(opts.vars).length ? { vars: opts.vars } : {}),
  }
  const dir = path.join(root, ".zeroko")
  await mkdir(dir, { recursive: true })
  const file = path.join(dir, "deployment.json")
  await writeFile(file, JSON.stringify(full))
  const count = Object.keys(full.files).length
  console.log(`zeroko: ${count} files in ${path.relative(root, file)}`)

  const { url, token } = opts
  const wanted = opts.deploy ?? Boolean(url && token)
  if (!wanted) return { file }
  if (!url || !token) {
    throw new Error(
      "zeroko: to deploy, set ZEROKO_URL (the workspace's address) and ZEROKO_TOKEN, in .env or the environment"
    )
  }
  const service = await serviceOf(root, opts)
  const done = await upload(full, { url, token, service })
  console.log(`zeroko: ${service} v${done.version} is live at ${done.url}`)
  return { file, url: done.url }
}
