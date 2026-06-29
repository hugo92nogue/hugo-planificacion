import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useData } from '../context/DataContext'
import { Card } from '../components/UI'
import { periodoActual } from '../lib/defaults'
import {
  porCategoria,
  serieMensual,
  serieSaldoAcumulado,
  netoPorCuenta,
  totalesPeriodo,
} from '../lib/movimientos'
import { formatGs, formatPct } from '../lib/format'

const COLORES = ['#4f8cff', '#2ecc8f', '#ffc24b', '#ff5c7a', '#a78bfa', '#22d3ee', '#f97316', '#e879f9']
const ejeMillones = (v) => (v / 1_000_000).toFixed(0) + 'M'

function Torta({ titulo, data }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  if (!data.length) return null
  return (
    <Card title={titulo}>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatGs(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <table className="tabla">
        <tbody>
          {data.map((d, i) => (
            <tr key={d.name}>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: COLORES[i % COLORES.length],
                    marginRight: 6,
                  }}
                />
                {d.name}
              </td>
              <td>{formatGs(d.value)}</td>
              <td className="muted">{formatPct(total ? d.value / total : 0, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export default function Reportes() {
  const { config, movimientos, cargando } = useData()
  const [mes, setMes] = useState(periodoActual())

  if (cargando || !config) return <div className="loader">Cargando…</div>

  if (movimientos.length === 0) {
    return (
      <Card title="Reportes">
        <p className="muted">Cargá movimientos para ver tus gráficos y tablas.</p>
      </Card>
    )
  }

  const gastosCat = porCategoria(movimientos, 'gasto', mes)
  const ingresosCat = porCategoria(movimientos, 'ingreso', mes)
  const serie = serieMensual(movimientos, 12)
  const serieSaldo = serieSaldoAcumulado(config, movimientos, 12)
  const porCuenta = netoPorCuenta(config, movimientos, mes)
  const tot = totalesPeriodo(movimientos, mes)

  return (
    <>
      <Card title="Período de análisis">
        <div className="field" style={{ margin: 0 }}>
          <label>Mes (para las tortas y el detalle por cuenta)</label>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
        <div className="grid3 mt">
          <div className="stat">
            <div className="label">Ingresos</div>
            <div className="value small" style={{ color: 'var(--green)' }}>{formatGs(tot.ingresos)}</div>
          </div>
          <div className="stat">
            <div className="label">Gastos</div>
            <div className="value small" style={{ color: 'var(--red)' }}>{formatGs(tot.gastos)}</div>
          </div>
          <div className="stat">
            <div className="label">Neto</div>
            <div className="value small">{formatGs(tot.neto)}</div>
          </div>
        </div>
      </Card>

      <Torta titulo="Gastos por categoría" data={gastosCat} />
      <Torta titulo="Ingresos por categoría" data={ingresosCat} />

      <Card title="Ingresos vs. gastos por mes">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={serie} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
              <XAxis dataKey="periodo" tick={{ fill: '#9fb0d0', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9fb0d0', fontSize: 10 }} tickFormatter={ejeMillones} />
              <Tooltip formatter={(v) => formatGs(v)} />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#2ecc8f" radius={[5, 5, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#ff5c7a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Evolución del saldo (cuentas)">
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={serieSaldo} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
              <XAxis dataKey="periodo" tick={{ fill: '#9fb0d0', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9fb0d0', fontSize: 10 }} tickFormatter={ejeMillones} />
              <Tooltip formatter={(v) => formatGs(v)} />
              <Line type="monotone" dataKey="saldo" stroke="#4f8cff" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={`Movimiento por cuenta · ${mes}`}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Neto</th>
            </tr>
          </thead>
          <tbody>
            {porCuenta.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td style={{ color: 'var(--green)' }}>{formatGs(c.ingresos)}</td>
                <td style={{ color: 'var(--red)' }}>{formatGs(c.gastos)}</td>
                <td>{formatGs(c.ingresos - c.gastos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
