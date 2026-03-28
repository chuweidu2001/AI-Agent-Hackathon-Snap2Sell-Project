import { createClient } from '@insforge/sdk'

const baseUrl = process.env.INSFORGE_URL || process.env.VITE_INSFORGE_URL || ''
const anonKey = process.env.INSFORGE_ANON_KEY || process.env.VITE_INSFORGE_ANON_KEY || ''

if (!baseUrl || !anonKey) {
  console.warn('InsForge credentials not set — database operations will fail')
}

export const insforge = createClient({ baseUrl, anonKey })
