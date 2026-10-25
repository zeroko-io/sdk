import type { Config } from "@react-router/dev/config"
import zeroko from "@zeroko-io/react-router"

// React Router on Zeroko, rendering on the server; the bindings are in
// zeroko.json.
export default { ssr: true, buildEnd: zeroko() } satisfies Config
