import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aviso claro si faltan las variables de entorno (primer uso / deploy sin .env).
export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  // No tiramos error para que la pantalla pueda mostrar instrucciones amables.
  console.warn(
    '[Supabase] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example como .env y completá tus claves.'
  )
}

export const supabase = supabaseConfigurado
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,      // mantiene la sesión entre visitas
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
