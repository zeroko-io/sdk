// The API: a visit counter in the service's database.
import type { Database } from "@zeroko-io/core"
import { Hono } from "hono"

const app = new Hono<{ Bindings: { DB: Database } }>().basePath("/api")

app.post("/visits", async (c) => {
  await c.env.DB.run(
    "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL)"
  )
  const [row] = await c.env.DB.batch([
    ["INSERT INTO visits (id, n) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET n = n + 1"],
    ["SELECT n FROM visits WHERE id = 1"],
  ]).then((r) => r[1]!.rows)
  return c.json({ visits: row?.n })
})

export default app
