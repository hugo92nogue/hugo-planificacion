import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, Progress } from '../components/UI'
import {
  saldoTotal,
  fasesEnGs,
  indiceFaseActual,
  calcDistribucion,
  mesesHastaMeta,
  formatMeses,
} from '../lib/finance'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'

export default function Ruta() {
  const { config, ultimoMes, cargando } = useData()

  // Valores por defecto sacados del último mes (editables con los inputs).
  const aporteDefecto = (() => {
    if (!ultimoMes || !config) return 0
    const dist = calcDistribucion(ultimoMes, config).distribucion
    const ahorro = config.cuentas.find((c) => c.rol === 'ahorro')
    return ahorro ? Math.round(dist[ahorro.id] || 0) : 0
  })()

  const [aporte, setAporte] = useState(null)
  const [tasa, setTasa] = useState(0.055) // 5,5% anual (plazo fijo Gs por defecto)

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const aporteUsado = aporte == null ? aporteDefecto : aporte
  const tc = config.tipo_cambio_usd
  const saldos = ultimoMes?.saldos_fin_mes || {}
  const total = saldoTotal(saldos)
  const fases = fasesEnGs(config)
  const idxActual = indiceFaseActual(total, config)
  const metaUsdGs = Number(config.meta.objetivo_usd) * Number(tc)

  // Lista de hitos: las 10 fases + la meta final en USD.
  const hitos = [
    ...fases.map((g, i) => ({ etiqueta: `Fase ${i + 1}`, gs: g })),
    { etiqueta: `Meta ${formatUsd(config.meta.objetivo_usd)}`, gs: metaUsdGs, esMeta: true },
  ]

  return (
    <>
      <Card title="Tu patrimonio hoy">
        <div className="row-between">
          <span className="value" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {formatGs(total)}
          </span>
          <span className="muted">≈ {formatUsd(gsToUsd(total, tc))}</span>
        </div>
        <div className="mt">
          <Progress fraccion={metaUsdGs ? total / metaUsdGs : 0} />
        </div>
        <div className="hint">
          {idxActual >= 0 ? `Estás en la Fase ${idxActual + 1} de ${fases.length}.` : 'Aún no llegaste a la Fase 1.'}
        </div>
      </Card>

      <Card title="Supuestos para la estimación">
        <MoneyField
          label="Aporte mensual a ahorro (Gs)"
          value={aporteUsado}
          onChange={setAporte}
          hint={`Sugerido por tu último mes: ${formatGs(aporteDefecto)}`}
        />
        <div className="field">
          <label>Tasa de retorno anual: {formatPct(tasa)}</label>
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.005"
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
          />
          <div className="hint">Plazo fijo Gs ~5,5% · reinversión negocio 20–30%</div>
        </div>
      </Card>

      <Card title="Ruta de hitos">
        {hitos.map((h, i) => {
          const alcanzado = total >= h.gs
          const meses = mesesHastaMeta(total, h.gs, aporteUsado, tasa)
          const frac = h.gs ? Math.min(1, total / h.gs) : 0
          return (
            <div
              key={i}
              className="card"
              style={{
                background: alcanzado ? 'rgba(46,204,143,0.10)' : 'var(--bg-2)',
                borderColor: alcanzado ? 'var(--green)' : h.esMeta ? 'var(--primary)' : 'var(--line)',
                marginBottom: 10,
              }}
            >
              <div className="row-between mb">
                <strong>
                  {alcanzado ? '✓ ' : ''}
                  {h.etiqueta}
                </strong>
                <span className="muted">{formatGs(h.gs)}</span>
              </div>
              <Progress fraccion={frac} />
              <div className="row-between mt">
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  ≈ {formatUsd(gsToUsd(h.gs, tc))}
                </span>
                <span className="pill">
                  {alcanzado ? 'Alcanzado' : `~ ${formatMeses(meses)}`}
                </span>
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}
