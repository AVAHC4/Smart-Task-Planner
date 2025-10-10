import { neon } from "@neondatabase/serverless"

let client: ReturnType<typeof neon> | null = null

export function getSql() {
  if (client) return client
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required for Neon persistence")
  }
  client = neon(url)
  return client
}
