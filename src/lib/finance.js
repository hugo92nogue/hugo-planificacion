// ============================================================
//  Toda la lógica financiera de la app (sin UI, fácil de testear).
// ============================================================

// Cuentas "personales" = las que tienen porcentaje (no el negocio).
export function cuentasPersonales(cuentas = []) {
  return cuentas.filter((c) => c.rol !== 'negocio' && c.porcentaje != null)
}

// Suma de porcentajes de las cuentas personales (debería dar 1.0 = 100%).
export function sumaPorcentajes(cuentas = []) {
  return cuentasPersonales(cuentas).reduce((acc, c) => acc + Number(c.porcentaje || 0), 0)
}

// margen_disponible = ingresos_metsim - costos_negocio - pagos_deuda
export function calcMargen(mes) {
  return (
    Number(mes.ingresos_metsim || 0) -
    Number(mes.costos_negocio || 0) -
    Number(mes.pagos_deuda || 0)
  )
}

// Calcula la distribución del mes según el modo de ingreso.
// Devuelve { distribucion, remanente_negocio, margen_disponible }.
export function calcDistribucion(mes, config) {
  const margen = calcMargen(mes)
  const personales = cuentasPersonales(config.cuentas)
  const distribucion = {}

  if (config.modo_ingreso === 'sueldo') {
    // Se reparte el sueldo fijo entre las cuentas personales (según %),
    // y el resto del margen queda como remanente en el negocio (Banco-1).
    const sueldo = Math.max(0, Number(config.sueldo_fijo || 0))
    personales.forEach((c) => {
      distribucion[c.id] = sueldo * Number(c.porcentaje || 0)
    })
    const remanente = margen - sueldo
    return { distribucion, remanente_negocio: remanente, margen_disponible: margen }
  }

  // Modo "margen": se distribuye TODO el margen según porcentajes.
  personales.forEach((c) => {
    distribucion[c.id] = Math.max(0, margen) * Number(c.porcentaje || 0)
  })
  return { distribucion, remanente_negocio: 0, margen_disponible: margen }
}

// Sugerencia de saldos de fin de mes:
//   saldo_anterior + lo asignado/depositado - gasto_real
// El negocio recibe el remanente (modo sueldo) o lo que reste.
export function calcSaldosSugeridos(mes, config, saldosPrevios = {}) {
  const { distribucion, remanente_negocio } = calcDistribucion(mes, config)
  const saldos = {}
  config.cuentas.forEach((c) => {
    const previo = Number(saldosPrevios[c.id] || 0)
    if (c.rol === 'negocio') {
      saldos[c.id] = previo + Number(remanente_negocio || 0)
    } else {
      const asignado = Number(distribucion[c.id] || 0)
      const gasto = Number((mes.gasto_real && mes.gasto_real[c.id]) || 0)
      saldos[c.id] = previo + asignado - gasto
    }
  })
  return saldos
}

// Saldo total (patrimonio) = suma de saldos de fin de mes de todas las cuentas.
export function saldoTotal(saldos = {}) {
  return Object.values(saldos).reduce((acc, v) => acc + Number(v || 0), 0)
}

// Las fases vienen en MILLONES de Gs -> a Gs.
export function fasesEnGs(config) {
  const arr = (config?.meta?.fases_millones_gs || []).map((m) => Number(m) * 1_000_000)
  return arr
}

// Índice de la fase actual (0-based). -1 si todavía no alcanzó la primera.
export function indiceFaseActual(saldo, config) {
  const fases = fasesEnGs(config)
  let idx = -1
  for (let i = 0; i < fases.length; i++) {
    if (saldo >= fases[i]) idx = i
    else break
  }
  return idx
}

// Tasa de ahorro del mes = distribucion.cuenta_ahorro / margen_disponible.
export function tasaAhorro(mes, config) {
  const { distribucion, margen_disponible } = calcDistribucion(mes, config)
  if (!margen_disponible) return 0
  const ahorroCuenta = config.cuentas.find((c) => c.rol === 'ahorro')
  const ahorro = ahorroCuenta ? Number(distribucion[ahorroCuenta.id] || 0) : 0
  return ahorro / margen_disponible
}

// Objetivo del fondo de emergencia (Gs) = gasto mensual de necesidades * meses objetivo.
export function objetivoEmergenciaGs(config, gastoNecesidadesMensual) {
  return Number(gastoNecesidadesMensual || 0) * Number(config.objetivo_emergencia_meses || 0)
}

// Meses hasta alcanzar una meta, iterando mes a mes con aporte y retorno.
//   saldo = saldo * (1 + r/12) + aporte ; meses++
export function mesesHastaMeta(saldoActual, metaGs, aporteMensual, rAnual) {
  let saldo = Number(saldoActual || 0)
  const meta = Number(metaGs || 0)
  const aporte = Number(aporteMensual || 0)
  const r = Number(rAnual || 0)
  let meses = 0
  if (saldo >= meta) return 0
  // Si no hay ni aporte ni rendimiento y no llegó, es inalcanzable.
  if (aporte <= 0 && r <= 0) return Infinity
  while (saldo < meta) {
    saldo = saldo * (1 + r / 12) + aporte
    meses += 1
    if (meses > 1200) return Infinity
  }
  return meses
}

// Texto amigable de "X años Y meses".
export function formatMeses(meses) {
  if (!isFinite(meses)) return 'inalcanzable con estos valores'
  if (meses <= 0) return 'ya alcanzado'
  const a = Math.floor(meses / 12)
  const m = meses % 12
  if (a === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`
  if (m === 0) return `${a} ${a === 1 ? 'año' : 'años'}`
  return `${a} ${a === 1 ? 'año' : 'años'} y ${m} ${m === 1 ? 'mes' : 'meses'}`
}

// Valor futuro (proyector de patrimonio).
//   r = tasa_anual/12 ; n = años*12
//   FV = saldo*(1+r)^n + aporte*(((1+r)^n - 1)/r)   (si r=0: saldo + aporte*n)
export function valorFuturo(saldoInicial, aporteMensual, tasaAnual, anios) {
  const saldo = Number(saldoInicial || 0)
  const aporte = Number(aporteMensual || 0)
  const r = Number(tasaAnual || 0) / 12
  const n = Math.round(Number(anios || 0) * 12)
  if (r === 0) return saldo + aporte * n
  const factor = Math.pow(1 + r, n)
  return saldo * factor + aporte * ((factor - 1) / r)
}

// Serie año a año para el gráfico del proyector.
export function serieValorFuturo(saldoInicial, aporteMensual, tasaAnual, anios) {
  const serie = []
  for (let a = 0; a <= anios; a++) {
    serie.push({ anio: a, valor: Math.round(valorFuturo(saldoInicial, aporteMensual, tasaAnual, a)) })
  }
  return serie
}

// Retorno real descontando inflación: (1+nominal)/(1+inflacion) - 1
export function retornoReal(nominal, inflacion) {
  return (1 + Number(nominal || 0)) / (1 + Number(inflacion || 0)) - 1
}
