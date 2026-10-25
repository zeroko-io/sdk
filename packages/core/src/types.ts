// What a service's code gets from Zeroko: its bindings, as the runner gives
// them in `env`, and the handlers it exports. Types only.

/** A value a query takes as a parameter. Booleans are stored as 0 or 1,
 * dates as ISO strings; blobs come back as Uint8Array. */
export type SqlValue =
  | string
  | number
  | boolean
  | null
  | Uint8Array
  | ArrayBuffer
  | Date

export type Row = Record<string, unknown>

export type RunResult = { changes: number; lastRowId: number }

/** A `db` binding: the service's SQLite database. */
export interface Database {
  query<T extends Row = Row>(sql: string, ...params: SqlValue[]): Promise<T[]>
  run(sql: string, ...params: SqlValue[]): Promise<RunResult>
  /** One transaction: all or none. */
  batch(
    statements: [sql: string, ...params: SqlValue[]][]
  ): Promise<(RunResult & { rows: Row[] })[]>
  /** Runs fn alone among those that lock the same key, in order. */
  lock<T>(key: string, fn: () => Promise<T>): Promise<T>
}

export type FileInfo = {
  key: string
  size: number
  type: string
  etag: string
  uploaded: number
}

/** A `files` binding: the service's file storage. */
export interface Files {
  put(
    key: string,
    body: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream,
    options?: { type?: string }
  ): Promise<FileInfo>
  /** A streamed Response, or null; with a request (or its headers, or
   * {range}), its Range and conditions apply. */
  get(
    key: string,
    request?: Request | Headers | Record<string, string>
  ): Promise<Response | null>
  head(key: string): Promise<FileInfo | null>
  delete(key: string): Promise<boolean>
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{ files: FileInfo[]; cursor?: string }>
}

/** A `jobs` binding: background work. */
export interface Jobs {
  send(
    payload: unknown,
    options?: { delay?: number; attempts?: number; key?: string }
  ): Promise<{ id: string; duplicate?: boolean }>
  cancel(idOrKey: string): Promise<boolean>
}

/** A `realtime` binding: live connections, Server-Sent Events or
 * WebSockets, held by Zeroko. */
export interface Realtime {
  subscribe(
    channels: string[],
    options?: { meta?: unknown }
  ): Promise<Response> | Response
  publish(channel: string, data: unknown): Promise<{ delivered: number }>
  send(connection: string, data: unknown): Promise<boolean>
  connections(channel: string): Promise<{ connection: string; meta: unknown }[]>
}

/** An `assets` binding: the deployment's public/ files. */
export interface Assets {
  fetch(request: Request | URL | string): Promise<Response>
}

/** A `service:<name>` binding: another service of the workspace. */
export interface ServiceBinding {
  fetch(input: Request | URL | string, init?: RequestInit): Promise<Response>
}

/** What `ctx` gives a handler. */
export interface Context {
  waitUntil(promise: Promise<unknown>): void
}

export type Job = {
  id: string
  payload: unknown
  attempt: number
  /** The cron's schedule, for a job a cron queued. */
  cron?: string
}

export type MessageEvent = {
  type: "message" | "close"
  connection: string
  channels: string[]
  meta: unknown
  data?: string
}

/** A service's main module's default export. */
export interface Service<Env = Record<string, unknown>> {
  fetch(request: Request, env: Env, ctx: Context): Response | Promise<Response>
  job?(job: Job, env: Env, ctx: Context): void | Promise<void>
  message?(event: MessageEvent, env: Env, ctx: Context): void | Promise<void>
}

/** What a binding is, in a deployment's `bindings`. */
export type BindingType =
  | "db"
  | "files"
  | "jobs"
  | "realtime"
  | "assets"
  | `service:${string}`

export type Cron = { schedule: string; payload?: unknown }
