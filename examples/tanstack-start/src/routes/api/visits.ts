import { createFileRoute } from "@tanstack/react-router"

import { db, visit } from "../../visits"

export const Route = createFileRoute("/api/visits")({
  server: {
    handlers: {
      POST: async ({ request }) => Response.json({ visits: await visit(db(request)) }),
    },
  },
})
