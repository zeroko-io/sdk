import type { Database } from "@zeroko-io/core"

/** The service's database: Nitro hands the bindings to each request. */
export function db(request: Request): Database {
  return (request as Request & { runtime: { cloudflare: { env: { DB: Database } } } }).runtime
    .cloudflare.env.DB
}

/** One more visit, and how many there have been. */
export async function visit(DB: Database): Promise<number> {
  await DB.run(
    "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL)"
  )
  const results = await DB.batch([
    ["INSERT INTO visits (id, n) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET n = n + 1"],
    ["SELECT n FROM visits WHERE id = 1"],
  ])
  return Number(results[1]!.rows[0]?.n)
}
