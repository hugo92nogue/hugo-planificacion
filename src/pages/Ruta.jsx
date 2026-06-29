import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, Progress } from '../components/UI'
import { fasesEnGs, indiceFaseActual, mesesHastaMeta, formatMeses } from '../lib/finance'
import { patrimonioTotalGs, ahorroMensualPromedio } from '../lib/movimientos'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'

export default function Ruta() {
  const { config, movimientos, instrumentos, cargando } = useData()
  const [aporte, setAporte] = useState(null)
  const [tasa, setTasa] = useState(0.055)

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const tc = config.tipo_cambio_usd
  const total = patrimonioTotalGs(config, movimientos, instrumentos, tc)
  const aporteDefecto = Math.max(0, Math.round(ahorroMensualPromedio(movimientos)))
  const aporteUsado = aporte == null ? aporteDefecto : aporte

  const fases = fasesEnGs(config)
  const idxActual = indiceFaseActual(total, config)
  const metaUsdGs = Number(config.meta.objetivo_usd) * Number(tc)

  const hitos = [
    ...fases.map((g, i) => ({ etiqueta: `Fase ${i + 1}`, gs: g })),
    { etiqueta: `Meta ${formatUsd(config.meta.objetivo_usd)}`, gs: metaUsdGs, esMeta: true },
  ]

  return (
    <>
      <Card title="Tu patrimonio hoy">
        <div className="row-between">
          <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{formatGs(total)}</span>
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
          hint={`Sugerido por tu ahorro neto promedio: ${formatGs(aporteDefecto)}`}
        />
        <div className="field">
          <label>Tasa de retorno anual: {formatPct(tasa)}</label>
          <input type="range" min="0" max="0.3" step="0.005" value={tasa} onChange={(e) => setTasa(Number(e.target.value))} />
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
                <span className="muted" style={{ fontSize: '0.78rem' }}>≈ {formatUsd(gsToUsd(h.gs, tc))}</span>
                <span className="pill">{alcanzado ? 'Alcanzado' : `~ ${formatMeses(meses)}`}</span>
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}
