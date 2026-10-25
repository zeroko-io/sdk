declare namespace App {
  interface Locals {
    runtime: { env: Record<string, unknown>; ctx: { waitUntil(p: Promise<unknown>): void } }
  }
}
