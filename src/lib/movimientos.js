// ============================================================
//  Cálculos sobre transacciones (movimientos) e instrumentos.
// ============================================================

// "YYYY-MM-DD" -> "YYYY-MM"
export function periodoDe(fecha) {
  return String(fecha || '').slice(0, 7)
}

// ---------- CUENTAS (saldos a partir de transacciones) ----------

// Saldo de cada cuenta = saldo_inicial + ingresos − gastos asignados a esa cuenta.
export function saldosPorCuenta(config, movimientos) {
  const saldos = {}
  ;(config.cuentas || []).forEach((c) => {
    saldos[c.id] = Number(c.saldo_inicial || 0)
  })
  ;(movimientos || []).forEach((m) => {
    if (!(m.cuenta_id in saldos)) return
    const monto = Number(m.monto || 0)
    saldos[m.cuenta_id] += m.tipo === 'ingreso' ? monto : -monto
  })
  return saldos
}

export function patrimonioCuentasGs(config, movimientos) {
  const s = saldosPorCuenta(config, movimientos)
  return Object.values(s).reduce((a, b) => a + Number(b || 0), 0)
}

// Saldo de la cuenta con un rol dado (ej. "ahorro").
export function saldoRol(config, movimientos, rol) {
  const c = (config.cuentas || []).find((x) => x.rol === rol)
  if (!c) return 0
  return saldosPorCuenta(config, movimientos)[c.id] || 0
}

// ---------- INSTRUMENTOS (inversiones) ----------

export function instrumentoValorGs(inst, tipoCambio) {
  const monto = Number(inst.monto || 0)
  return inst.moneda === 'USD' ? monto * Number(tipoCambio || 0) : monto
}

export function instrumentosActivos(instrumentos) {
  return (instrumentos || []).filter((i) => i.activo !== false)
}

export function totalInvertidoGs(instrumentos, tipoCambio) {
  return instrumentosActivos(instrumentos).reduce(
    (a, i) => a + instrumentoValorGs(i, tipoCambio),
    0
  )
}

// Interés anual estimado en Gs (suma de capital * tasa de cada instrumento).
export function interesAnualGs(instrumentos, tipoCambio) {
  return instrumentosActivos(instrumentos).reduce(
    (a, i) => a + instrumentoValorGs(i, tipoCambio) * Number(i.tasa_anual || 0),
    0
  )
}

// Tasa promedio ponderada por capital.
export function tasaPromedioPonderada(instrumentos, tipoCambio) {
  const total = totalInvertidoGs(instrumentos, tipoCambio)
  if (!total) return 0
  return interesAnualGs(instrumentos, tipoCambio) / total
}

// Valor futuro de un instrumento (capitalización anual simple compuesta).
export function valorFuturoInstrumentoGs(inst, tipoCambio, anios) {
  const base = instrumentoValorGs(inst, tipoCambio)
  return base * Math.pow(1 + Number(inst.tasa_anual || 0), Number(anios || 0))
}

// ---------- PATRIMONIO TOTAL ----------
export function patrimonioTotalGs(config, movimientos, instrumentos, tipoCambio) {
  return (
    patrimonioCuentasGs(config, movimientos) + totalInvertidoGs(instrumentos, tipoCambio)
  )
}

// ---------- AGREGADOS / REPORTES ----------

// Totales de un período (o de todo si periodo = null).
export function totalesPeriodo(movimientos, periodo) {
  let ingresos = 0
  let gastos = 0
  ;(movimientos || []).forEach((m) => {
    if (periodo && periodoDe(m.fecha) !== periodo) return
    const monto = Number(m.monto || 0)
    if (m.tipo === 'ingreso') ingresos += monto
    else gastos += monto
  })
  return { ingresos, gastos, neto: ingresos - gastos }
}

// Agrupa por categoría (para tortas). tipo = 'ingreso' | 'gasto'.
export function porCategoria(movimientos, tipo, periodo) {
  const map = {}
  ;(movimientos || []).forEach((m) => {
    if (m.tipo !== tipo) return
    if (periodo && periodoDe(m.fecha) !== periodo) return
    const k = m.categoria || 'Sin categoría'
    map[k] = (map[k] || 0) + Number(m.monto || 0)
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

// Agrupa por cuenta (saldo neto del período).
export function netoPorCuenta(config, movimientos, periodo) {
  const map = {}
  ;(config.cuentas || []).forEach((c) => (map[c.id] = { name: c.banco, ingresos: 0, gastos: 0 }))
  ;(movimientos || []).forEach((m) => {
    if (!map[m.cuenta_id]) return
    if (periodo && periodoDe(m.fecha) !== periodo) return
    if (m.tipo === 'ingreso') map[m.cuenta_id].ingresos += Number(m.monto || 0)
    else map[m.cuenta_id].gastos += Number(m.monto || 0)
  })
  return Object.values(map)
}

// Serie mensual de ingresos vs gastos (últimos N meses con datos).
export function serieMensual(movimientos, nMeses = 12) {
  const map = {}
  ;(movimientos || []).forEach((m) => {
    const p = periodoDe(m.fecha)
    if (!p) return
    if (!map[p]) map[p] = { periodo: p, ingresos: 0, gastos: 0 }
    if (m.tipo === 'ingreso') map[p].ingresos += Number(m.monto || 0)
    else map[p].gastos += Number(m.monto || 0)
  })
  const arr = Object.values(map).sort((a, b) => a.periodo.localeCompare(b.periodo))
  arr.forEach((x) => (x.neto = x.ingresos - x.gastos))
  return arr.slice(-nMeses)
}

// Saldo acumulado de patrimonio (cuentas) mes a mes.
export function serieSaldoAcumulado(config, movimientos, nMeses = 12) {
  const base = (config.cuentas || []).reduce((a, c) => a + Number(c.saldo_inicial || 0), 0)
  const serie = serieMensual(movimientos, 1000)
  let acum = base
  const out = serie.map((s) => {
    acum += s.neto
    return { periodo: s.periodo, saldo: Math.round(acum) }
  })
  return out.slice(-nMeses)
}

// Promedio de gasto mensual (para fondo de emergencia y proyecciones).
export function gastoMensualPromedio(movimientos) {
  const serie = serieMensual(movimientos, 1000)
  if (!serie.length) return 0
  const totalGastos = serie.reduce((a, s) => a + s.gastos, 0)
  return totalGastos / serie.length
}

// Promedio de ahorro neto mensual (ingresos − gastos).
export function ahorroMensualPromedio(movimientos) {
  const serie = serieMensual(movimientos, 1000)
  if (!serie.length) return 0
  const totalNeto = serie.reduce((a, s) => a + s.neto, 0)
  return totalNeto / serie.length
}
