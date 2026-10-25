import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

export default async function Home() {
  const { env } = await getCloudflareContext({ async: true })
  const DB = (env as unknown as { DB: { run: Function; query: Function } }).DB
  await DB.run("CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL)")
  await DB.run("INSERT INTO visits (id, n) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET n = n + 1")
  const [row] = await DB.query("SELECT n FROM visits WHERE id = 1")
  return <h1>Next.js on Zeroko: visit number {row.n}</h1>
}
