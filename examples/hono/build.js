// Bundles the API, as zeroko.json says, and deploys it when ZEROKO_URL and
// ZEROKO_TOKEN are set (in .env or the environment).
import { build } from "@zeroko-io/core"

await build({ entry: "src/index.ts" })
