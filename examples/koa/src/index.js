// A Koa app.
import { node } from "@zeroko-io/core/node"
import Koa from "koa"

const app = new Koa()
app.use(async (ctx) => {
  ctx.body = { framework: "koa", path: ctx.path }
})

export default node(app.callback())
