// A visit counter in the service's database: its bindings come with each
// request, in event.context.cloudflare.env.
import type { Database } from "@zeroko-io/core"

export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env as { DB: Database }
  await DB.run(
    "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL)"
  )
  const results = await DB.batch([
    ["INSERT INTO visits (id, n) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET n = n + 1"],
    ["SELECT n FROM visits WHERE id = 1"],
  ])
  return { visits: results[1]!.rows[0]?.n }
})
