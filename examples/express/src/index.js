// An Express app, as it would run on Node; the bindings come from
// cloudflare:workers, where workerd keeps them.
import { node } from "@zeroko-io/core/node"
import { env } from "cloudflare:workers"
import express from "express"

const app = express()
app.use(express.json())

app.get("/:page", (req, res) => res.json({ framework: "express", path: req.path }))
app.post("/echo", (req, res) => res.status(201).json({ got: req.body }))
app.post("/notes", async (req, res) => {
  await env.DB.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)")
  await env.DB.run("INSERT INTO notes (text) VALUES (?)", req.body.text)
  res.status(201).json(await env.DB.query("SELECT text FROM notes"))
})

export default node(app)
