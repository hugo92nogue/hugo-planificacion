import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, Stat, Progress } from '../components/UI'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'
import {
  saldoTotal,
  fasesEnGs,
  indiceFaseActual,
  tasaAhorro,
  calcDistribucion,
  objetivoEmergenciaGs,
} from '../lib/finance'

const COLORES = ['#4f8cff', '#2ecc8f', '#ffc24b', '#ff5c7a', '#a78bfa', '#22d3ee']

export default function Dashboard() {
  const { config, meses, ultimoMes, cargando, error } = useData()

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const tc = config.tipo_cambio_usd
  const saldos = ultimoMes?.saldos_fin_mes || {}
  const total = saldoTotal(saldos)
  const fases = fasesEnGs(config)
  const idxFase = indiceFaseActual(total, config)
  const metaUsdGs = Number(config.meta.objetivo_usd) * Number(tc)
  const proximaFase = fases[idxFase + 1] ?? metaUsdGs
  const fraccionMeta = metaUsdGs ? Math.min(1, total / metaUsdGs) : 0

  const dist = ultimoMes ? calcDistribucion(ultimoMes, config).distribucion : {}
  const ta = ultimoMes ? tasaAhorro(ultimoMes, config) : 0

  // Fondo de emergencia: saldo de la cuenta "ahorro" vs objetivo (gasto necesidades * meses).
  const cuentaAhorro = config.cuentas.find((c) => c.rol === 'ahorro')
  const cuentaNec = config.cuentas.find((c) => c.rol === 'necesidades')
  const gastoNec =
    (ultimoMes?.gasto_real && cuentaNec && ultimoMes.gasto_real[cuentaNec.id]) ||
    (ultimoMes && cuentaNec && dist[cuentaNec.id]) ||
    0
  const objEmergencia = objetivoEmergenciaGs(config, gastoNec)
  const saldoEmergencia = cuentaAhorro ? Number(saldos[cuentaAhorro.id] || 0) : 0
  const fraccionEmergencia = objEmergencia ? Math.min(1, saldoEmergencia / objEmergencia) : 0

  const datosTorta = config.cuentas
    .filter((c) => c.rol !== 'negocio')
    .map((c) => ({ name: c.banco, value: Number(dist[c.id] || 0) }))
    .filter((d) => d.value > 0)

  return (
    <>
      {error && <div className="alerta">{error}</div>}

      {meses.length === 0 && (
        <Card title="¡Bienvenido! 👋">
          <p className="muted">
            Todavía no cargaste ningún mes. Empezá registrando tu primer período.
          </p>
          <Link className="btn" to="/registro">
            Registrar mi primer mes
          </Link>
        </Card>
      )}

      <div className="grid2 mb">
        <Stat label="Patrimonio total" valueGs={total} tipoCambio={tc} />
        <Stat
          label="Fase actual"
          value={idxFase >= 0 ? `Fase ${idxFase + 1} / ${fases.length}` : 'Pre-fase 1'}
        />
      </div>

      <Card title="Camino a USD 1.000.000">
        <div className="row-between mb">
          <span className="muted">{formatGs(total)}</span>
          <span className="muted">{formatUsd(config.meta.objetivo_usd)}</span>
        </div>
        <Progress fraccion={fraccionMeta} />
        <div className="row-between mt">
          <span className="pill">{formatPct(fraccionMeta)} de la meta</span>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Próxima fase: {formatGs(proximaFase)}
          </span>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Tasa de ahorro (último mes)">
          <div className="stat" style={{ background: 'transparent', padding: 0 }}>
            <div className="value">{formatPct(ta)}</div>
            <div className="usd">ahorro / margen del mes</div>
          </div>
          <div className="mt">
            <Progress fraccion={ta} />
          </div>
        </Card>

        <Card title="Fondo de emergencia">
          <div className="stat" style={{ background: 'transparent', padding: 0 }}>
            <div className="value small">{formatPct(fraccionEmergencia, 0)}</div>
            <div className="usd">
              {formatGs(saldoEmergencia)} / {formatGs(objEmergencia)}
            </div>
          </div>
          <div className="mt">
            <Progress fraccion={fraccionEmergencia} />
          </div>
          <div className="hint">Objetivo: {config.objetivo_emergencia_meses} meses de necesidades</div>
        </Card>
      </div>

      {datosTorta.length > 0 && (
        <Card title="Distribución del último mes">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={datosTorta}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e) => formatPct(e.percent, 0)}
                >
                  {datosTorta.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatGs(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="hint center">
            Período {ultimoMes?.periodo} · ≈ {formatUsd(gsToUsd(total, tc))} de patrimonio
          </div>
        </Card>
      )}
    </>
  )
}
