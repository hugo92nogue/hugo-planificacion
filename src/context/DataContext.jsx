import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { CONFIG_DEFECTO } from '../lib/defaults'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [meses, setMeses] = useState([]) // planificación de sobres (período asc)
  const [movimientos, setMovimientos] = useState([]) // transacciones (fecha desc)
  const [instrumentos, setInstrumentos] = useState([]) // inversiones
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ---- Carga inicial ----
  const cargarTodo = useCallback(async () => {
    if (!user) return
    setCargando(true)
    setError(null)
    try {
      // CONFIG (creándola si no existe)
      let { data: cfgRow, error: cfgErr } = await supabase
        .from('config')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cfgErr) throw cfgErr

      if (!cfgRow) {
        const { error: insErr } = await supabase
          .from('config')
          .insert({ user_id: user.id, data: CONFIG_DEFECTO })
        if (insErr) throw insErr
        setConfig(CONFIG_DEFECTO)
      } else {
        setConfig({ ...CONFIG_DEFECTO, ...cfgRow.data })
      }

      // MESES (sobres)
      const { data: mesesRows } = await supabase
        .from('meses')
        .select('periodo, data')
        .eq('user_id', user.id)
        .order('periodo', { ascending: true })
      setMeses((mesesRows || []).map((r) => r.data))

      // MOVIMIENTOS
      const { data: movRows, error: movErr } = await supabase
        .from('movimientos')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (movErr) throw movErr
      setMovimientos(movRows || [])

      // INSTRUMENTOS
      const { data: instRows, error: instErr } = await supabase
        .from('instrumentos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (instErr) throw instErr
      setInstrumentos(instRows || [])
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
      setMovimientos([])
      setInstrumentos([])
      setCargando(false)
    }
  }, [user, cargarTodo])

  // ---- CONFIG ----
  const guardarConfig = async (nuevaConfig) => {
    setConfig(nuevaConfig)
    const { error: e } = await supabase
      .from('config')
      .upsert({ user_id: user.id, data: nuevaConfig }, { onConflict: 'user_id' })
    if (e) {
      setError(e.message)
      throw e
    }
  }

  // ---- MESES (sobres) ----
  const guardarMes = async (mes) => {
    const { error: e } = await supabase
      .from('meses')
      .upsert({ user_id: user.id, periodo: mes.periodo, data: mes }, { onConflict: 'user_id,periodo' })
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

  // ---- MOVIMIENTOS ----
  const agregarMovimiento = async (mov) => {
    const fila = { ...mov, user_id: user.id }
    delete fila.id
    const { data, error: e } = await supabase.from('movimientos').insert(fila).select().single()
    if (e) {
      setError(e.message)
      throw e
    }
    setMovimientos((prev) => ordenarMov([data, ...prev]))
  }

  const actualizarMovimiento = async (id, cambios) => {
    const { data, error: e } = await supabase
      .from('movimientos')
      .update(cambios)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (e) throw e
    setMovimientos((prev) => ordenarMov(prev.map((m) => (m.id === id ? data : m))))
  }

  const eliminarMovimiento = async (id) => {
    const { error: e } = await supabase
      .from('movimientos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (e) throw e
    setMovimientos((prev) => prev.filter((m) => m.id !== id))
  }

  // ---- INSTRUMENTOS ----
  const agregarInstrumento = async (inst) => {
    const fila = { ...inst, user_id: user.id }
    delete fila.id
    const { data, error: e } = await supabase.from('instrumentos').insert(fila).select().single()
    if (e) throw e
    setInstrumentos((prev) => [data, ...prev])
  }

  const actualizarInstrumento = async (id, cambios) => {
    const { data, error: e } = await supabase
      .from('instrumentos')
      .update(cambios)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (e) throw e
    setInstrumentos((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  const eliminarInstrumento = async (id) => {
    const { error: e } = await supabase
      .from('instrumentos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (e) throw e
    setInstrumentos((prev) => prev.filter((i) => i.id !== id))
  }

  // ---- Helpers meses ----
  const mesPorPeriodo = (periodo) => meses.find((m) => m.periodo === periodo) || null
  const ultimoMes = meses.length ? meses[meses.length - 1] : null
  const mesAnteriorA = (periodo) => {
    const previos = meses.filter((m) => m.periodo < periodo)
    return previos.length ? previos[previos.length - 1] : null
  }

  // ---- Export / Import (respaldo JSON) ----
  const exportarJSON = () => {
    const payload = { exportado: new Date().toISOString(), config, meses, movimientos, instrumentos }
    return JSON.stringify(payload, null, 2)
  }

  const importarJSON = async (texto) => {
    const payload = JSON.parse(texto)
    if (payload.config) await guardarConfig({ ...CONFIG_DEFECTO, ...payload.config })
    if (Array.isArray(payload.meses)) {
      for (const m of payload.meses) await guardarMes(m)
    }
    if (Array.isArray(payload.movimientos)) {
      for (const mv of payload.movimientos) {
        const fila = { ...mv }
        delete fila.id
        delete fila.created_at
        await agregarMovimiento(fila)
      }
    }
    if (Array.isArray(payload.instrumentos)) {
      for (const it of payload.instrumentos) {
        const fila = { ...it }
        delete fila.id
        delete fila.created_at
        await agregarInstrumento(fila)
      }
    }
    await cargarTodo()
  }

  const value = {
    config,
    meses,
    movimientos,
    instrumentos,
    cargando,
    error,
    guardarConfig,
    guardarMes,
    eliminarMes,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    agregarInstrumento,
    actualizarInstrumento,
    eliminarInstrumento,
    mesPorPeriodo,
    ultimoMes,
    mesAnteriorA,
    exportarJSON,
    importarJSON,
    recargar: cargarTodo,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function ordenarMov(arr) {
  return [...arr].sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha)
    return String(b.created_at || '').localeCompare(String(a.created_at || ''))
  })
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
