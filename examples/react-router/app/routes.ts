import { index, route, type RouteConfig } from "@react-router/dev/routes"

export default [index("routes/home.tsx"), route("api/visits", "routes/visits.ts")] satisfies RouteConfig
