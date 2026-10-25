// The service's bindings in React Router's context: in a loader or an
// action, context.get(zeroko) is { env, ctx }. Runtime code.
//   import { zeroko } from "@zeroko-io/react-router/context"
//   export async function loader({ context }) { const { env } = context.get(zeroko) }
import { createContext } from "react-router"

export type ZerokoContext<Env = Record<string, unknown>> = {
  env: Env
  ctx: { waitUntil(promise: Promise<unknown>): void }
}

// One for the whole process, however many copies of this module end up in
// the bundle (Vite inlines linked packages into the server build).
const key = Symbol.for("zeroko.react-router.context")
const store = globalThis as { [key]?: ReturnType<typeof createContext<ZerokoContext<any>>> }

export const zeroko = (store[key] ??= createContext<ZerokoContext<any>>())
