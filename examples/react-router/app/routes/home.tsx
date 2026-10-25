import type { Database } from "@zeroko-io/core"
import { zeroko } from "@zeroko-io/react-router/context"
import { useLoaderData, type LoaderFunctionArgs } from "react-router"

import { visit } from "../visits"

export async function loader({ context }: LoaderFunctionArgs) {
  const { env } = context.get(zeroko)
  return { visits: await visit((env as { DB: Database }).DB) }
}

export default function Home() {
  const { visits } = useLoaderData<typeof loader>()
  return <h1>React Router on Zeroko: visit number {visits}</h1>
}
