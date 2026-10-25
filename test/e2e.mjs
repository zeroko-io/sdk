// End to end: each example built with its adapter, deployed to a runner on
// its own (Docker, the runner's published image), and asked what it
// answers.
//   npm run test:e2e              # every example
//   npm run test:e2e -- hono astro  # some
//   KEEP=1 npm run test:e2e -- hono  # the runner stays up after
// RUNNER_IMAGE picks the runner (ghcr.io/zeroko-io/runner:latest).
import { execFileSync, spawnSync } from "node:child_process"
import { rmSync, writeFileSync } from "node:fs"
import http from "node:http"

import { examples } from "./examples.mjs"

const image = process.env.RUNNER_IMAGE ?? "ghcr.io/zeroko-io/runner:latest"
const name = "zeroko-sdk-e2e"
const token = "sdk-e2e-root-token-0123456789abcdef0123456789"
const api = "http://127.0.0.1:8283"
const domain = "e2e.localhost"

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts })
}

async function until(fn, ms = 60_000) {
  const end = Date.now() + ms
  for (;;) {
    try {
      if (await fn()) return
    } catch {}
    if (Date.now() > end) throw new Error("timed out")
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function startRunner() {
  spawnSync("docker", ["rm", "-f", name])
  sh("docker", ["run", "-d", "--name", name, "-p", "8282:8080", "-p", "8283:8081", "-e", `ZEROKO_TOKEN=${token}`, image])
  await until(async () => (await fetch(`${api}/healthz`)).ok)
  await fetch(`${api}/api/settings`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ domain, public_scheme: "http" }),
  })
  await new Promise((r) => setTimeout(r, 1000))
  await until(async () => (await fetch(`${api}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })).ok)
}

/** A request to a service, at its host, through the runner's gateway. */
function request(service, { method = "GET", path = "/", body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: 8282, method, path, headers: { host: `${service}.${domain}`, ...headers } },
      (res) => {
        let text = ""
        res.setEncoding("utf8")
        res.on("data", (c) => (text += c))
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text }))
      }
    )
    req.setTimeout(20_000, () => req.destroy(new Error("no answer in 20 seconds")))
    req.on("error", reject)
    if (body !== undefined) req.write(typeof body === "string" ? body : JSON.stringify(body))
    req.end()
  })
}

const only = process.argv.slice(2)
const chosen = examples.filter((e) => !only.length || only.includes(e.name))
let failed = 0
await startRunner()
try {
  for (const ex of chosen) {
    const service = `ex-${ex.name}`
    process.stdout.write(`${ex.name}: building and deploying… `)
    // Where to deploy, in the example's .env, as a project would have it.
    const envFile = new URL(`../examples/${ex.name}/.env`, import.meta.url)
    writeFileSync(envFile, `ZEROKO_URL=${api}\nZEROKO_TOKEN="${token}"\nZEROKO_SERVICE=${service}\n`)
    const built = spawnSync("npm", ["run", "build", "-w", `example-${ex.name}`], { encoding: "utf8" })
    rmSync(envFile, { force: true })
    if (built.status !== 0) {
      failed++
      console.log("FAIL\n" + (built.stdout + built.stderr).split("\n").slice(-30).join("\n"))
      continue
    }
    const problems = []
    for (const check of ex.checks) {
      const res = await request(service, check).catch((err) => ({ status: 0, text: err.message }))
      const label = `${check.method ?? "GET"} ${check.path ?? "/"}`
      if (res.status !== (check.status ?? 200)) problems.push(`${label}: ${res.status}, want ${check.status ?? 200}: ${res.text.slice(0, 200)}`)
      else if (check.has && !res.text.includes(check.has)) problems.push(`${label}: no "${check.has}" in ${res.text.slice(0, 200)}`)
    }
    if (problems.length) {
      failed++
      console.log("FAIL\n  " + problems.join("\n  "))
    } else console.log(`ok (${ex.checks.length} checks)`)
  }
} finally {
  if (failed) console.log(sh("docker", ["logs", "--tail", "40", name]).trim() || "")
  // KEEP=1 leaves the runner up, to look at its services' logs.
  if (!process.env.KEEP) spawnSync("docker", ["rm", "-f", name])
}
console.log(failed ? `${failed} of ${chosen.length} failed` : `all ${chosen.length} passed`)
process.exit(failed ? 1 : 0)
