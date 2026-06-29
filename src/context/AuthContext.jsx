import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'

const AuthContext = createContext(null)

// Credenciales "ocultas" para el acceso libre (sin pantalla de login).
// Viven en .env (no se suben al repo). El usuario nunca las escribe.
const APP_EMAIL = import.meta.env.VITE_APP_EMAIL
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD
export const accesoLibre = Boolean(APP_EMAIL && APP_PASSWORD)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [autoError, setAutoError] = useState(null)

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCargando(false)
      return
    }
    let activo = true

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (activo) setSession(sess)
    })

    const iniciar = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        if (activo) {
          setSession(data.session)
          setCargando(false)
        }
        return
      }
      if (accesoLibre) {
        await autoLogin()
      }
      if (activo) setCargando(false)
    }

    iniciar()
    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Entra solo: intenta iniciar sesión; si la cuenta no existe, la crea y entra.
  async function autoLogin() {
    try {
      let res = await supabase.auth.signInWithPassword({ email: APP_EMAIL, password: APP_PASSWORD })
      if (res.error) {
        const up = await supabase.auth.signUp({ email: APP_EMAIL, password: APP_PASSWORD })
        if (up.error && !/already registered/i.test(up.error.message)) {
          setAutoError(traducirError(up.error.message))
          return
        }
        res = await supabase.auth.signInWithPassword({ email: APP_EMAIL, password: APP_PASSWORD })
      }
      if (res.error) {
        setAutoError(traducirError(res.error.message))
        return
      }
      setSession(res.data.session)
    } catch (e) {
      setAutoError(traducirError(e.message))
    }
  }

  // Se mantienen por compatibilidad (login manual opcional).
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    cargando,
    autoError,
    accesoLibre,
    signIn,
    signUp,
    signOut,
    supabaseConfigurado,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function traducirError(m = '') {
  if (/Email not confirmed/i.test(m))
    return 'CONFIRM_EMAIL' // marcador para mostrar instrucciones claras
  if (/Invalid login credentials/i.test(m)) return 'Credenciales inválidas en el .env.'
  return m
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
