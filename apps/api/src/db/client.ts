/**
 * D1 raw SQL client for trading-specific tables
 * (trades, algorithm_settings, optimize_snapshots)
 */
export function createD1Client(db: D1Database) {
  return {
    /** Return all rows matching the query */
    query: async <T = Record<string, unknown>>(
      sql: string,
      params?: unknown[]
    ): Promise<T[]> => {
      const stmt = db.prepare(sql)
      const result = params
        ? await stmt.bind(...params).all<T>()
        : await stmt.all<T>()
      return result.results
    },

    /** Return the first matching row, or null */
    first: async <T = Record<string, unknown>>(
      sql: string,
      params?: unknown[]
    ): Promise<T | null> => {
      const stmt = db.prepare(sql)
      return params
        ? stmt.bind(...params).first<T>()
        : stmt.first<T>()
    },

    /** Execute a write statement (INSERT / UPDATE / DELETE) */
    run: async (sql: string, params?: unknown[]): Promise<void> => {
      const stmt = db.prepare(sql)
      if (params) {
        await stmt.bind(...params).run()
      } else {
        await stmt.run()
      }
    },
  }
}

export type D1Client = ReturnType<typeof createD1Client>
