// What each example should answer once deployed.
const page = { accept: "text/html" }

export const examples = [
  {
    name: "static",
    checks: [
      { path: "/", has: "Hello from a static site" },
      { path: "/about.html", has: "About this site" },
      { path: "/style.css", has: "system-ui" },
      { path: "/nowhere", headers: page, status: 404 },
    ],
  },
  {
    name: "react-spa",
    checks: [
      { path: "/", has: '<div id="root">' },
      { path: "/about", headers: page, has: '<div id="root">' },
    ],
  },
  {
    name: "hono",
    checks: [
      { path: "/", has: "notes" },
      { method: "POST", path: "/notes", body: { text: "first" }, status: 201, has: "first" },
      { path: "/notes", has: "first" },
      { method: "POST", path: "/notes", body: {}, status: 400 },
    ],
  },
  {
    name: "fullstack",
    checks: [
      { path: "/", has: '<div id="root">' },
      { method: "POST", path: "/api/visits", has: '"visits":1' },
      { method: "POST", path: "/api/visits", has: '"visits":2' },
      { path: "/somewhere", headers: page, has: '<div id="root">' },
    ],
  },
  {
    name: "express",
    checks: [
      { path: "/hi", has: '"path":"/hi"' },
      { method: "POST", path: "/echo", body: '{"a":1}', headers: { "content-type": "application/json" }, status: 201, has: '"a":1' },
      { method: "POST", path: "/notes", body: '{"text":"from express"}', headers: { "content-type": "application/json" }, status: 201, has: "from express" },
    ],
  },
  {
    name: "koa",
    checks: [{ path: "/x", has: '"path":"/x"' }],
  },
  {
    name: "nuxt",
    checks: [
      { path: "/", has: "Nuxt on Zeroko: visit number 1" },
      { path: "/", has: "visit number 2" },
      { method: "POST", path: "/api/visits", has: '"visits":3' },
      { path: "/_nuxt/", status: 404 },
    ],
  },
  {
    name: "sveltekit",
    checks: [
      { path: "/", has: "SvelteKit on Zeroko: visit number 1" },
      { method: "POST", path: "/api/visits", headers: { origin: "http://ex-sveltekit.e2e.localhost" }, has: '"visits":2' },
      { path: "/about", has: "A prerendered page" },
      { path: "/robots.txt", has: "User-agent" },
      { path: "/nowhere", status: 404 },
    ],
  },
  {
    name: "astro",
    checks: [
      { path: "/", has: "Astro on Zeroko: visit number 1" },
      { method: "POST", path: "/api/visits", headers: { origin: "http://ex-astro.e2e.localhost" }, has: '"visits":2' },
      { path: "/about", has: "A prerendered page" },
      { path: "/robots.txt", has: "User-agent" },
      { path: "/nowhere", status: 404 },
    ],
  },
  {
    name: "react-router",
    checks: [
      { path: "/", has: "React Router on Zeroko: visit number <!-- -->1" },
      { method: "POST", path: "/api/visits", has: '"visits":2' },
      { path: "/robots.txt", has: "User-agent" },
      { path: "/nowhere", status: 404 },
    ],
  },
  {
    name: "solid-start",
    checks: [
      { path: "/", has: "visit number" },
      { method: "POST", path: "/api/visits", has: '"visits":2' },
      { path: "/robots.txt", has: "User-agent" },
    ],
  },
  {
    name: "tanstack-start",
    checks: [
      { path: "/", has: "TanStack Start on Zeroko: visit number <!-- -->1" },
      { method: "POST", path: "/api/visits", has: '"visits":2' },
      { path: "/robots.txt", has: "User-agent" },
    ],
  },
]
