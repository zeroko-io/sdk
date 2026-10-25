# Zeroko SDK

Deploy existing JavaScript projects to [Zeroko](https://zeroko.space) as
services: the project's own build makes the deployment and, with a
workspace's address and token, deploys it. No CLI. The docs are at
[zeroko.space/docs/sdk](https://zeroko.space/docs/sdk).

| Package | For |
| --- | --- |
| `@zeroko-io/core` | The bindings' types; `build()` for a backend with no front end (Hono, Express, Koa); `node()` for Node HTTP apps |
| `@zeroko-io/vite` | Vite sites, single-page apps, and full-stack apps (a server entry beside the front end) |
| `@zeroko-io/nitro` | Nuxt, SolidStart, TanStack Start and the rest of Nitro's frameworks |
| `@zeroko-io/sveltekit` | SvelteKit |
| `@zeroko-io/astro` | Astro |
| `@zeroko-io/react-router` | React Router's framework mode |
| `@zeroko-io/next` | Next.js, through OpenNext |

A project says what its service is in `zeroko.json`, and where it goes in
`.env`:

```json
{ "service": "shop", "bindings": { "DB": "db", "UPLOADS": "files" } }
```

```sh
ZEROKO_URL=https://acme.zeroko.space
ZEROKO_TOKEN=zk_...
```

`npm run build` writes `.zeroko/deployment.json` and, with both set,
deploys it. `examples/` has an app for each framework; `npm run test:e2e`
builds and deploys each one to a runner in Docker and checks what it
answers.

```sh
npm install
npm run build
npm run test:e2e              # every example
npm run test:e2e -- astro     # some
```

The packages are on GitHub Packages (`@zeroko-io/*`): npm needs
`@zeroko-io:registry=https://npm.pkg.github.com` and a GitHub token in
`.npmrc`. MIT licensed.
