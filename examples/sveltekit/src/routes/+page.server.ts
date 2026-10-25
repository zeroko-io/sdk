import { visit } from "../visits"

export async function load({ platform }) {
  return { visits: await visit(platform!.env.DB) }
}
