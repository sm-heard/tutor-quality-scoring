declare module "better-sqlite3" {
  type DatabaseOptions = {
    readonly?: boolean
    fileMustExist?: boolean
    timeout?: number
    verbose?: (...args: unknown[]) => void
  }

  class Database {
    constructor(filename?: string, options?: DatabaseOptions)
    prepare(sql: string): unknown
    transaction<T extends (...args: unknown[]) => unknown>(fn: T): T
    exec(sql: string): Database
    close(): void
  }

  export = Database
}
