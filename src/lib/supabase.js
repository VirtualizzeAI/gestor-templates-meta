import { createClient } from '@supabase/supabase-js'

// Runtime env (injected via /env.js when running in Docker) overrides build-time env
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {}

const SUPABASE_URL =
  runtimeEnv.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  ''

const SUPABASE_ANON_KEY =
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Luna] Supabase URL/anon key não definidos. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ou em /env.js (Docker).'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
