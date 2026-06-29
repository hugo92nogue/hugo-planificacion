import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { CONFIG_DEFECTO } from '../lib/defaults'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [meses, setMeses] = useState([]) // ordenados por período ascendente
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ---- Carga inicial: config (creándola si no existe) + meses ----
  const cargarTodo = useCallback(async () => {
    if (!user) return
    setCargando(true)
    setError(null)
    try {
      // CONFIG
      let { data: cfgRow, error: cfgErr } = await supabase
        .from('config')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cfgErr) throw cfgErr

      if (!cfgRow) {
        // Primer uso: sembramos la config por defecto (luego editable).
        const { error: insErr } = await supabase
          .from('config')
          .insert({ user_id: user.id, data: CONFIG_DEFECTO })
        if (insErr) throw insErr
        setConfig(CONFIG_DEFECTO)
      } else {
        // Merge defensivo por si faltan claves nuevas.
        setConfig({ ...CONFIG_DEFECTO, ...cfgRow.data })
      }

      // MESES
      const { data: mesesRows, error: mesErr } = await supabase
        .from('meses')
        .select('periodo, data')
        .eq('user_id', user.id)
        .order('periodo', { ascending: true })
      if (mesErr) throw mesErr
      setMeses((mesesRows || []).map((r) => r.data))
    } catch (e) {
      console.error(e)
      setError(e.message || 'Error cargando datos')
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    if (user) cargarTodo()
    else {
      setConfig(null)
      setMeses([])
      setCargando(false)
    }
  }, [user, cargarTodo])

  // ---- Guardar config ----
  const guardarConfig = async (nuevaConfig) => {
    setConfig(nuevaConfig) // optimista
    const { error: e } = await supabase
      .from('config')
      .upsert({ user_id: user.id, data: nuevaConfig }, { onConflict: 'user_id' })
    if (e) {
      setError(e.message)
      throw e
    }
  }

  // ---- Guardar un mes (insert o update por período) ----
  const guardarMes = async (mes) => {
    const { error: e } = await supabase.from('meses').upsert(
      { user_id: user.id, periodo: mes.periodo, data: mes },
      { onConflict: 'user_id,periodo' }
    )
    if (e) {
      setError(e.message)
      throw e
    }
    setMeses((prev) => {
      const otros = prev.filter((m) => m.periodo !== mes.periodo)
      return [...otros, mes].sort((a, b) => a.periodo.localeCompare(b.periodo))
    })
  }

  const eliminarMes = async (periodo) => {
    const { error: e } = await supabase
      .from('meses')
      .delete()
      .eq('user_id', user.id)
      .eq('periodo', periodo)
    if (e) throw e
    setMeses((prev) => prev.filter((m) => m.periodo !== periodo))
  }

  // ---- Helpers ----
  const mesPorPeriodo = (periodo) => meses.find((m) => m.periodo === periodo) || null
  const ultimoMes = meses.length ? meses[meses.length - 1] : null
  const mesAnteriorA = (periodo) => {
    const previos = meses.filter((m) => m.periodo < periodo)
    return previos.length ? previos[previos.length - 1] : null
  }

  // ---- Export / Import (respaldo JSON) ----
  const exportarJSON = () => {
    const payload = { exportado: new Date().toISOString(), config, meses }
    return JSON.stringify(payload, null, 2)
  }

  const importarJSON = async (texto) => {
    const payload = JSON.parse(texto)
    if (payload.config) await guardarConfig({ ...CONFIG_DEFECTO, ...payload.config })
    if (Array.isArray(payload.meses)) {
      for (const m of payload.meses) {
        await guardarMes(m)
      }
    }
    await cargarTodo()
  }

  const value = {
    config,
    meses,
    cargando,
    error,
    guardarConfig,
    guardarMes,
    eliminarMes,
    mesPorPeriodo,
    ultimoMes,
    mesAnteriorA,
    exportarJSON,
    importarJSON,
    recargar: cargarTodo,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
