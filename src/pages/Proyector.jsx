import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useData } from '../context/DataContext'
import { Card, MoneyField } from '../components/UI'
import { saldoTotal, calcDistribucion, valorFuturo, retornoReal } from '../lib/finance'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'

// Escenarios comparables (tasas anuales nominales).
const ESCENARIOS = [
  { id: 'pf', nombre: 'Plazo fijo Gs', tasa: 0.055, color: '#4f8cff' },
  { id: 'neg', nombre: 'Reinversión negocio', tasa: 0.25, color: '#2ecc8f' },
  { id: 'usd', nombre: 'USD / global', tasa: 0.08, color: '#ffc24b' },
]

export default function Proyector() {
  const { config, ultimoMes, cargando } = useData()

  const aporteDefecto = (() => {
    if (!ultimoMes || !config) return 0
    const dist = calcDistribucion(ultimoMes, config).distribucion
    const ahorro = config.cuentas.find((c) => c.rol === 'ahorro')
    return ahorro ? Math.round(dist[ahorro.id] || 0) : 0
  })()

  const saldoDefecto = saldoTotal(ultimoMes?.saldos_fin_mes || {})

  const [saldoInicial, setSaldoInicial] = useState(null)
  const [aporte, setAporte] = useState(null)
  const [tasa, setTasa] = useState(0.08)
  const [anios, setAnios] = useState(20)

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const tc = config.tipo_cambio_usd
  const saldo = saldoInicial == null ? saldoDefecto : saldoInicial
  const aporteUsado = aporte == null ? aporteDefecto : aporte
  const inflacion = config.inflacion_anual

  // Datos para el gráfico: una serie por escenario + la tasa elegida.
  const series = [
    ...ESCENARIOS,
    { id: 'elegida', nombre: `Tu tasa (${formatPct(tasa, 1)})`, tasa, color: '#ff5c7a' },
  ]
  const data = []
  for (let a = 0; a <= anios; a++) {
    const fila = { anio: a }
    series.forEach((s) => {
      fila[s.id] = Math.round(valorFuturo(saldo, aporteUsado, s.tasa, a))
    })
    data.push(fila)
  }

  return (
    <>
      <Card title="Punto de partida">
        <MoneyField
          label="Saldo inicial (Gs)"
          value={saldo}
          onChange={setSaldoInicial}
          hint={`Tu patrimonio actual: ${formatGs(saldoDefecto)}`}
        />
        <MoneyField
          label="Aporte mensual (Gs)"
          value={aporteUsado}
          onChange={setAporte}
          hint={`Sugerido por tu último mes: ${formatGs(aporteDefecto)}`}
        />
        <div className="field">
          <label>Tasa de retorno anual: {formatPct(tasa, 1)}</label>
          <input
            type="range"
            min="0"
            max="0.35"
            step="0.005"
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Horizonte: {anios} años</label>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={anios}
            onChange={(e) => setAnios(Number(e.target.value))}
          />
        </div>
      </Card>

      <Card title="Resultado con tu tasa">
        <div className="grid2">
          <div className="stat">
            <div className="label">Valor a {anios} años</div>
            <div className="value">{formatGs(valorFuturo(saldo, aporteUsado, tasa, anios))}</div>
            <div className="usd">
              ≈ {formatUsd(gsToUsd(valorFuturo(saldo, aporteUsado, tasa, anios), tc))}
            </div>
          </div>
          <div className="stat">
            <div className="label">Retorno real (descontando inflación {formatPct(inflacion, 1)})</div>
            <div className="value small">{formatPct(retornoReal(tasa, inflacion), 2)}</div>
            <div className="usd">poder de compra real</div>
          </div>
        </div>
      </Card>

      <Card title="Comparación de escenarios">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
              <XAxis
                dataKey="anio"
                tick={{ fill: '#9fb0d0', fontSize: 11 }}
                tickFormatter={(v) => `${v}a`}
              />
              <YAxis
                tick={{ fill: '#9fb0d0', fontSize: 11 }}
                tickFormatter={(v) => (v / 1_000_000_000).toFixed(1) + 'MM'}
              />
              <Tooltip formatter={(v) => formatGs(v)} labelFormatter={(l) => `Año ${l}`} />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.nombre}
                  stroke={s.color}
                  dot={false}
                  strokeWidth={s.id === 'elegida' ? 3 : 2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="hint">MM = mil millones de Gs. Las tasas de los escenarios son editables en el código (lib).</div>
      </Card>
    </>
  )
}
