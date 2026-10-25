import type { APIEvent } from "@solidjs/start/server"

import { db, visit } from "~/visits"

export async function POST(event: APIEvent) {
  return Response.json({ visits: await visit(db(event.request)) })
}
