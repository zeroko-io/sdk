import type { Database } from "@zeroko-io/core"

declare global {
  namespace App {
    interface Platform {
      env: { DB: Database }
    }
  }
}

export {}
