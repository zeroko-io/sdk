import { createAsync, query } from "@solidjs/router"
import { getRequestEvent } from "solid-js/web"

import { db, visit } from "~/visits"

const visits = query(async () => {
  "use server"
  return visit(db(getRequestEvent()!.request))
}, "visits")

export default function Home() {
  const n = createAsync(() => visits())
  return <h1>SolidStart on Zeroko: visit number {n()}</h1>
}
