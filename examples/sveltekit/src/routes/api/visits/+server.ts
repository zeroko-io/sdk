import { json } from "@sveltejs/kit"

import { visit } from "../../../visits"

export async function POST({ platform }) {
  return json({ visits: await visit(platform!.env.DB) })
}
