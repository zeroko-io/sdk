// Next.js on Zeroko, through OpenNext's build for Cloudflare's workers (the
// runtime Zeroko runs on): after `next build`, build() has OpenNext make
// its worker, with its settings of its own in .zeroko (no wrangler.jsonc or
// open-next.config.ts in the project), bundles it, and deploys it with its
// assets, as zeroko.json and .env say. The service's bindings are in
// getCloudflareContext().env, from @opennextjs/cloudflare.
//   next.config.mjs:  export default withZeroko({})
//   package.json:     "build": "next build && node zeroko.build.js"
//   zeroko.build.js:  import { build } from "@zeroko-io/next"; await build()
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { bundle, collect, finish, type Options } from "@zeroko-io/core";

/** Next's settings for OpenNext: its standalone output. */
export function withZeroko<T extends object>(
  config: T,
): T & { output: "standalone" } {
  return { ...config, output: "standalone" };
}

// What OpenNext reads: Cloudflare's runtime as Zeroko's (its date, Node's
// compatibility, the ASSETS binding), and its defaults.
const WRANGLER = {
  name: "zeroko",
  main: "../.open-next/worker.js",
  compatibility_date: "2026-10-01",
  compatibility_flags: ["nodejs_compat"],
  assets: { directory: "../.open-next/assets", binding: "ASSETS" },
};
const OPEN_NEXT = `import { defineCloudflareConfig } from "@opennextjs/cloudflare"
export default defineCloudflareConfig()
`;

/** OpenNext's command line, from the project's own @opennextjs/cloudflare:
 * the package's directory, from its main module, up. */
async function openNextCli(root: string): Promise<string> {
  let dir = path.dirname(
    createRequire(path.join(root, "package.json")).resolve(
      "@opennextjs/cloudflare",
    ),
  );
  while (!existsSync(path.join(dir, "package.json"))) dir = path.dirname(dir);
  return path.join(dir, "dist", "cli", "index.js");
}

export async function build(opts: Options & { root?: string } = {}) {
  const root = path.resolve(opts.root ?? process.cwd());
  const work = path.join(root, ".zeroko");
  await mkdir(work, { recursive: true });
  const wrangler = path.join(work, "wrangler.json");
  const config = path.join(work, "open-next.config.ts");
  await writeFile(wrangler, JSON.stringify(WRANGLER, null, 2));
  await writeFile(config, OPEN_NEXT);
  // OpenNext, after Next's build: never Next's build again from here (it'd
  // run the project's build script, this one).
  const bin = await openNextCli(root);
  const run = spawnSync(
    process.execPath,
    [
      bin,
      "build",
      "--skipNextBuild",
      "--config",
      wrangler,
      "--openNextConfigPath",
      config,
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (run.status !== 0) throw new Error("zeroko: OpenNext's build failed");
  const outDir = path.join(work, "server");
  await rm(outDir, { recursive: true, force: true });
  await bundle({ entry: path.join(root, ".open-next", "worker.js"), outDir });
  const deployment = await collect({
    serverDir: outDir,
    main: "index.js",
    assetsDir: path.join(root, ".open-next", "assets"),
  });
  return finish(deployment, opts, root);
}
