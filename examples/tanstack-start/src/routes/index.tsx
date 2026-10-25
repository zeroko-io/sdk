import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

import { db, visit } from "../visits"

const visits = createServerFn().handler(() => visit(db(getRequest())))

export const Route = createFileRoute("/")({
  loader: () => visits(),
  component: Home,
})

function Home() {
  const n = Route.useLoaderData()
  return <h1>TanStack Start on Zeroko: visit number {n}</h1>
}
