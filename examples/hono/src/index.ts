// An API with Hono: notes kept in the service's SQLite database.
import type { Database } from "@zeroko-io/core"
import { Hono } from "hono"

type Env = { Bindings: { DB: Database } }

const app = new Hono<Env>()

let ready: Promise<unknown> | undefined
app.use(async (c, next) => {
  ready ??= c.env.DB.run(
    "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)"
  )
  await ready
  await next()
})

app.get("/", (c) => c.json({ service: "notes", routes: ["GET /notes", "POST /notes"] }))

app.get("/notes", async (c) =>
  c.json(await c.env.DB.query("SELECT id, text FROM notes ORDER BY id DESC"))
)

app.post("/notes", async (c) => {
  const { text } = await c.req.json<{ text?: string }>()
  if (!text) return c.json({ error: "text is required" }, 400)
  const { lastRowId } = await c.env.DB.run("INSERT INTO notes (text) VALUES (?)", text)
  return c.json({ id: lastRowId, text }, 201)
})

export default app
