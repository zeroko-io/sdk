// Bundling a server entry for the runner: one ES module graph with every
// dependency in it, as the runner installs nothing. Node's built-in modules
// and workerd's own (cloudflare:*) stay imports: the runtime has them.
import { builtinModules } from "node:module"

import * as esbuild from "esbuild"

export type BundleOptions = {
  /** The entry module: its default export is the service. */
  entry: string
  /** Where the modules go: the entry's as index.js, the rest in chunks/. */
  outDir: string
  /** Replaced at build time, as esbuild's define. */
  define?: Record<string, string>
  minify?: boolean
}

const builtins = builtinModules.flatMap((m) => [m, `${m}/*`])

/** Bundles a server entry into outDir/index.js and its chunks. */
export async function bundle(opts: BundleOptions): Promise<string> {
  await esbuild.build({
    entryPoints: { index: opts.entry },
    outdir: opts.outDir,
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "neutral",
    target: "es2024",
    // Packages' builds for workers first, then the browser's. esbuild adds
    // import or require by how each module is asked for: a require() of a
    // package must get its CommonJS build.
    conditions: ["workerd", "worker", "browser"],
    mainFields: ["workerd", "worker", "browser", "module", "main"],
    external: ["node:*", "cloudflare:*", ...builtins],
    define: { "process.env.NODE_ENV": '"production"', ...opts.define },
    // CommonJS packages that require() a built-in module get a require
    // that works in an ES module.
    banner: {
      js: 'import { createRequire as __zerokoRequire } from "node:module"; const require = __zerokoRequire("/");',
    },
    chunkNames: "chunks/[name]-[hash]",
    minify: opts.minify ?? true,
    legalComments: "none",
    logLevel: "warning",
  })
  return "index.js"
}
