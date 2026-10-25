import type { APIRoute } from "astro"
import type { Database } from "@zeroko-io/core"

import { visit } from "../../lib/visits"

export const POST: APIRoute = async ({ locals }) => {
  const { DB } = locals.runtime.env as { DB: Database }
  return Response.json({ visits: await visit(DB) })
}
