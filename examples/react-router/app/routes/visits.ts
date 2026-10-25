import type { Database } from "@zeroko-io/core"
import { zeroko } from "@zeroko-io/react-router/context"
import type { ActionFunctionArgs } from "react-router"

import { visit } from "../visits"

export async function action({ context }: ActionFunctionArgs) {
  const { env } = context.get(zeroko)
  return Response.json({ visits: await visit((env as { DB: Database }).DB) })
}
