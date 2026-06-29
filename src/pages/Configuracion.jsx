import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, PercentField, TextField } from '../components/UI'
import { sumaPorcentajes } from '../lib/finance'
import { formatPct } from '../lib/format'

export default function Configuracion() {
  const { config, guardarConfig, cargando } = useData()
  const [cfg, setCfg] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [okMsg, setOkMsg] = useState(false)

  // Inicializa el estado local desde la config cargada (una vez).
  if (!cargando && config && cfg === null) {
    setCfg(JSON.parse(JSON.stringify(config)))
  }
  if (!cfg) return <div className="loader">Cargando…</div>

  const set = (campo, valor) => setCfg((c) => ({ ...c, [campo]: valor }))
  const setCuenta = (i, campo, valor) =>
    setCfg((c) => {
      const cuentas = c.cuentas.map((ct, idx) => (idx === i ? { ...ct, [campo]: valor } : ct))
      return { ...c, cuentas }
    })
  const setFase = (i, valor) =>
    setCfg((c) => {
      const fases = [...c.meta.fases_millones_gs]
      fases[i] = Number(valor)
      return { ...c, meta: { ...c.meta, fases_millones_gs: fases } }
    })

  const suma = sumaPorcentajes(cfg.cuentas)
  const sumaOk = Math.abs(suma - 1) < 0.001

  const onGuardar = async () => {
    if (!sumaOk) return
    setGuardando(true)
    setOkMsg(false)
    try {
      await guardarConfig(cfg)
      setOkMsg(true)
      setTimeout(() => setOkMsg(false), 2500)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Card title="Modo de ingreso">
        <div className="field">
          <label>¿Cómo se reparte el dinero?</label>
          <select value={cfg.modo_ingreso} onChange={(e) => set('modo_ingreso', e.target.value)}>
            <option value="margen">Margen (reparte todo el margen del negocio)</option>
            <option value="sueldo">Sueldo (te asignás un sueldo fijo, el resto queda en el negocio)</option>
          </select>
        </div>
        {cfg.modo_ingreso === 'sueldo' && (
          <MoneyField
            label="Sueldo fijo mensual (Gs)"
            value={cfg.sueldo_fijo}
            onChange={(v) => set('sueldo_fijo', v)}
          />
        )}
      </Card>

      <Card title="Parámetros generales">
        <MoneyField
          label="Tipo de cambio (Gs por 1 USD)"
          value={cfg.tipo_cambio_usd}
          onChange={(v) => set('tipo_cambio_usd', v)}
        />
        <PercentField
          label="Inflación anual estimada (%)"
          value={cfg.inflacion_anual}
          onChange={(v) => set('inflacion_anual', v)}
          hint="Se usa para el retorno real en el proyector."
        />
        <div className="field">
          <label>Fondo de emergencia: ¿cuántos meses de necesidades?</label>
          <input
            inputMode="numeric"
            value={cfg.objetivo_emergencia_meses}
            onChange={(e) => set('objetivo_emergencia_meses', Number(e.target.value) || 0)}
          />
        </div>
        <PercentField
          label="Umbral de alerta de gasto (% de lo asignado)"
          value={cfg.umbral_alerta}
          onChange={(v) => set('umbral_alerta', v)}
          hint="Si el gasto real supera este % de lo asignado, te avisa."
        />
      </Card>

      <Card
        title="Cuentas (sobres)"
        right={
          <span className={'pill'} style={{ borderColor: sumaOk ? 'var(--green)' : 'var(--red)' }}>
            Personales: {formatPct(suma, 0)}
          </span>
        }
      >
        {!sumaOk && (
          <div className="alerta">
            Los porcentajes de las cuentas personales deben sumar 100%. Ahora suman{' '}
            {formatPct(suma, 1)}.
          </div>
        )}
        {cfg.cuentas.map((c, i) => (
          <div key={c.id} className="card" style={{ background: 'var(--bg-2)', marginBottom: 10 }}>
            <div className="row-between mb">
              <span className="pill">{c.rol}</span>
              <span className="muted" style={{ fontSize: '0.72rem' }}>{c.id}</span>
            </div>
            <TextField label="Banco" value={c.banco} onChange={(v) => setCuenta(i, 'banco', v)} />
            {c.rol === 'negocio' ? (
              <div className="hint">La cuenta del negocio no lleva porcentaje (recibe el remanente).</div>
            ) : (
              <PercentField
                label="Porcentaje del reparto (%)"
                value={c.porcentaje}
                onChange={(v) => setCuenta(i, 'porcentaje', v)}
              />
            )}
            <MoneyField
              label="Saldo inicial (Gs)"
              value={c.saldo_inicial || 0}
              onChange={(v) => setCuenta(i, 'saldo_inicial', v)}
              hint="Lo que ya tenías en esta cuenta antes de empezar a registrar."
            />
          </div>
        ))}
      </Card>

      <Card title="Categorías de movimientos">
        <ListaCategorias
          titulo="Ingresos"
          items={cfg.categorias_ingreso || []}
          onChange={(arr) => set('categorias_ingreso', arr)}
        />
        <div className="mt">
          <ListaCategorias
            titulo="Gastos"
            items={cfg.categorias_gasto || []}
            onChange={(arr) => set('categorias_gasto', arr)}
          />
        </div>
      </Card>

      <Card title="Meta y 10 fases (en millones de Gs)">
        <MoneyField
          label="Objetivo final (USD)"
          value={cfg.meta.objetivo_usd}
          onChange={(v) => set('meta', { ...cfg.meta, objetivo_usd: v })}
        />
        <div className="grid2">
          {cfg.meta.fases_millones_gs.map((f, i) => (
            <div className="field" key={i}>
              <label>Fase {i + 1}</label>
              <input
                inputMode="numeric"
                value={f}
                onChange={(e) => setFase(i, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="hint">Ej.: 50 = 50.000.000 Gs. La última fase suele quedar cerca de la meta en USD.</div>
      </Card>

      {okMsg && <div className="ok-box mb">Configuración guardada ✓</div>}
      <button className="btn" onClick={onGuardar} disabled={guardando || !sumaOk}>
        {guardando ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </>
  )
}

// Editor simple de una lista de categorías (agregar / quitar).
function ListaCategorias({ titulo, items, onChange }) {
  const [nueva, setNueva] = useState('')
  const agregar = () => {
    const v = nueva.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setNueva('')
  }
  const quitar = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div>
      <h3>{titulo}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {items.map((c, i) => (
          <span key={c} className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {c}
            <button
              onClick={() => quitar(i)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--red)',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.9rem',
                width: 'auto',
              }}
            >
              ✕
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="muted">Sin categorías.</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva categoría"
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
        />
        <button className="btn secundario" style={{ width: 'auto' }} onClick={agregar}>
          Agregar
        </button>
      </div>
    </div>
  )
}
