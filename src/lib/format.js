// Formateo de moneda y números para Paraguay (Gs) y equivalente en USD.

const fmtGs = new Intl.NumberFormat('es-PY', {
  style: 'currency',
  currency: 'PYG',
  maximumFractionDigits: 0,
})

const fmtUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const fmtNum = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 })

export function formatGs(valor) {
  const n = Number(valor)
  if (!isFinite(n)) return '₲ 0'
  return fmtGs.format(n)
}

export function formatUsd(valor) {
  const n = Number(valor)
  if (!isFinite(n)) return '$0'
  return fmtUsd.format(n)
}

export function formatNum(valor) {
  const n = Number(valor)
  if (!isFinite(n)) return '0'
  return fmtNum.format(n)
}

// Gs -> USD usando el tipo de cambio de la config.
export function gsToUsd(valorGs, tipoCambio) {
  const tc = Number(tipoCambio)
  if (!tc) return 0
  return Number(valorGs) / tc
}

export function formatPct(fraccion, decimales = 1) {
  const n = Number(fraccion)
  if (!isFinite(n)) return '0%'
  return (n * 100).toFixed(decimales).replace('.', ',') + '%'
}

// Convierte texto del usuario (con puntos de miles) a número.
export function parseNumero(texto) {
  if (typeof texto === 'number') return texto
  if (!texto) return 0
  const limpio = String(texto).replace(/[^\d,-]/g, '').replace(',', '.')
  const n = Number(limpio)
  return isFinite(n) ? n : 0
}
