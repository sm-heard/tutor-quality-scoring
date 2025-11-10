import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "./schema"

const SQLITE_URL = process.env.SQLITE_URL || "file:.data/app.db"

const resolved = SQLITE_URL.startsWith("file:")
  ? SQLITE_URL.replace("file:", "")
  : SQLITE_URL

const absolutePath = join(process.cwd(), resolved)
mkdirSync(dirname(absolutePath), { recursive: true })

const sqlite = new Database(absolutePath)

export const db = drizzle(sqlite, { schema })

export type DB = typeof db
export { schema }

