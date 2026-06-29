import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useData } from '../context/DataContext'
import { Card } from '../components/UI'
import { calcDistribucion } from '../lib/finance'
import { formatGs, formatPct } from '../lib/format'

export default function Seguimiento() {
  const { config, meses, cargando } = useData()
  const [periodo, setPeriodo] = useState(null)

  if (cargando || !config) return <div className="loader">Cargando…</div>
  if (meses.length === 0) {
    return (
      <Card title="Real vs. plan">
        <p className="muted">Registrá al menos un mes para ver la comparación.</p>
      </Card>
    )
  }

  const periodoSel = periodo || meses[meses.length - 1].periodo
  const mes = meses.find((m) => m.periodo === periodoSel)
  const dist = calcDistribucion(mes, config).distribucion
  const personales = config.cuentas.filter((c) => c.rol !== 'negocio')
  const umbral = Number(config.umbral_alerta || 1)

  const datos = personales.map((c) => {
    const plan = Math.round(dist[c.id] || 0)
    const real = Math.round((mes.gasto_real && mes.gasto_real[c.id]) || 0)
    return { name: c.banco, id: c.id, rol: c.rol, plan, real }
  })

  const alertas = datos.filter((d) => d.plan > 0 && d.real > d.plan * umbral)

  return (
    <>
      <Card title="Período">
        <div className="field">
          <label>Mes a analizar</label>
          <select value={periodoSel} onChange={(e) => setPeriodo(e.target.value)}>
            {meses.map((m) => (
              <option key={m.periodo} value={m.periodo}>
                {m.periodo}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {alertas.length > 0 && (
        <div className="alerta">
          ⚠️ Te pasaste del umbral ({formatPct(umbral, 0)}) en:{' '}
          {alertas.map((a) => a.name).join(', ')}.
        </div>
      )}

      <Card title="Plan vs. gasto real">
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
              <XAxis dataKey="name" tick={{ fill: '#9fb0d0', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9fb0d0', fontSize: 11 }}
                tickFormatter={(v) => (v / 1_000_000).toFixed(0) + 'M'}
              />
              <Tooltip formatter={(v) => formatGs(v)} />
              <Legend />
              <Bar dataKey="plan" name="Asignado" fill="#4f8cff" radius={[6, 6, 0, 0]} />
              <Bar dataKey="real" name="Gasto real" fill="#ff5c7a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Detalle">
        <table className="tabla">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Asignado</th>
              <th>Real</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => {
              const dif = d.plan - d.real
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{formatGs(d.plan)}</td>
                  <td>{formatGs(d.real)}</td>
                  <td style={{ color: dif < 0 ? 'var(--red)' : 'var(--green)' }}>
                    {dif >= 0 ? '+' : ''}
                    {formatGs(dif)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="hint mt">
          Diferencia positiva = te sobró respecto a lo asignado · negativa = te pasaste.
        </div>
      </Card>
    </>
  )
}
