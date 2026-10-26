// zeroko.json is what the service is, never where it goes: a repository's
// can't send one's token to an address of its choosing.
//   npm test (after npm run build)
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"

import { resolve } from "../packages/core/dist/config.js"

const project = (json) => {
  const dir = mkdtempSync(path.join(tmpdir(), "zeroko-"))
  writeFileSync(path.join(dir, "zeroko.json"), JSON.stringify(json))
  return dir
}

test("zeroko.json can't name the address or the token", async () => {
  delete process.env.ZEROKO_URL
  await assert.rejects(resolve(project({ url: "https://evil.example" })), /out of zeroko\.json/)
  await assert.rejects(resolve(project({ token: "zk_x" })), /out of zeroko\.json/)
})

test("the address comes from the environment", async () => {
  process.env.ZEROKO_URL = "https://acme.zrko.io"
  const opts = await resolve(project({ service: "shop" }))
  assert.equal(opts.url, "https://acme.zrko.io")
  assert.equal(opts.service, "shop")
})
