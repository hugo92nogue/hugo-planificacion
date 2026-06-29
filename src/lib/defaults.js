// Configuración POR DEFECTO solo para el primer uso (se guarda en Supabase y
// luego es 100% editable desde la UI). Nada de esto queda "fijo" en el código:
// la app siempre lee la config real desde la base de datos.

export const CONFIG_DEFECTO = {
  modo_ingreso: 'margen', // "margen" | "sueldo"
  sueldo_fijo: 0,
  tipo_cambio_usd: 6500,
  inflacion_anual: 0.04,
  objetivo_emergencia_meses: 6,
  regla_excedente: { ahorro: 0.6, negocio: 0.4 },
  meta: {
    objetivo_usd: 1000000,
    fases_millones_gs: [50, 150, 300, 550, 900, 1400, 2100, 3100, 4400, 6100],
  },
  cuentas: [
    { id: 'cuenta_negocio', banco: 'BNF (METSIM)', rol: 'negocio', porcentaje: null },
    { id: 'cuenta_necesidades', banco: 'Banco Familiar', rol: 'necesidades', porcentaje: 0.5 },
    { id: 'cuenta_ahorro', banco: 'Banco Continental', rol: 'ahorro', porcentaje: 0.25 },
    { id: 'cuenta_ocio', banco: 'Banco-4', rol: 'ocio', porcentaje: 0.25 },
  ],
  // umbral de alerta de gasto real (fracción de lo asignado). 1 = avisar si se pasa del 100%.
  umbral_alerta: 1.0,
}

// Estructura de un mes vacío para un período dado.
export function mesVacio(periodo) {
  return {
    periodo,
    ingresos_metsim: 0,
    costos_negocio: 0,
    pagos_deuda: 0,
    margen_disponible: 0,
    distribucion: { cuenta_necesidades: 0, cuenta_ahorro: 0, cuenta_ocio: 0 },
    remanente_negocio: 0,
    gasto_real: { cuenta_necesidades: 0, cuenta_ocio: 0 },
    saldos_fin_mes: {
      cuenta_negocio: 0,
      cuenta_necesidades: 0,
      cuenta_ahorro: 0,
      cuenta_ocio: 0,
    },
  }
}

// Período actual "YYYY-MM"
export function periodoActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
