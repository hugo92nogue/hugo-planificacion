import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, Stat, Progress } from '../components/UI'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'
import { fasesEnGs, indiceFaseActual, objetivoEmergenciaGs } from '../lib/finance'
import { periodoActual } from '../lib/defaults'
import {
  saldosPorCuenta,
  patrimonioCuentasGs,
  totalInvertidoGs,
  interesAnualGs,
  patrimonioTotalGs,
  totalesPeriodo,
  porCategoria,
  saldoRol,
  gastoMensualPromedio,
  netoCuentaEnPeriodo,
} from '../lib/movimientos'

const COLORES = ['#4f8cff', '#2ecc8f', '#ffc24b', '#ff5c7a', '#a78bfa', '#22d3ee', '#f97316', '#e879f9']

export default function Dashboard() {
  const { config, movimientos, instrumentos, cargando, error } = useData()
  if (cargando || !config) return <div className="loader">Cargando…</div>

  const tc = config.tipo_cambio_usd
  const periodo = periodoActual()

  const saldosCuentas = saldosPorCuenta(config, movimientos)
  const enCuentas = patrimonioCuentasGs(config, movimientos)
  const enInversiones = totalInvertidoGs(instrumentos, tc)
  const total = patrimonioTotalGs(config, movimientos, instrumentos, tc)
  const interesAnual = interesAnualGs(instrumentos, tc)

  const fases = fasesEnGs(config)
  const idxFase = indiceFaseActual(total, config)
  const metaUsdGs = Number(config.meta.objetivo_usd) * Number(tc)
  const proximaFase = fases[idxFase + 1] ?? metaUsdGs
  const fraccionMeta = metaUsdGs ? Math.min(1, total / metaUsdGs) : 0

  const tot = totalesPeriodo(movimientos, periodo)
  const gastosCat = porCategoria(movimientos, 'gasto', periodo).slice(0, 6)

  // Fondo de emergencia: saldo cuenta ahorro vs gasto promedio * meses objetivo.
  const cuentaAhorro = config.cuentas.find((c) => c.rol === 'ahorro')
  const saldoAhorro = saldoRol(config, movimientos, 'ahorro')
  const objEmergencia = objetivoEmergenciaGs(config, gastoMensualPromedio(movimientos))
  const fracEmergencia = objEmergencia ? Math.min(1, saldoAhorro / objEmergencia) : 0
  const apartadoMes = cuentaAhorro ? netoCuentaEnPeriodo(movimientos, cuentaAhorro.id, periodo) : 0

  const sinDatos = movimientos.length === 0 && instrumentos.length === 0

  return (
    <>
      {error && <div className="alerta">{error}</div>}

      {sinDatos && (
        <Card title="¡Bienvenido! 👋">
          <p className="muted">Empezá registrando tus ingresos y gastos, o cargá una inversión.</p>
          <div className="btn-row">
            <Link className="btn" to="/movimientos">Registrar movimiento</Link>
            <Link className="btn secundario" to="/inversiones">Cargar inversión</Link>
          </div>
        </Card>
      )}

      <Card title="Patrimonio total">
        <div className="row-between">
          <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{formatGs(total)}</span>
          <span className="muted">≈ {formatUsd(gsToUsd(total, tc))}</span>
        </div>
        <div className="hint">
          En cuentas: {formatGs(enCuentas)} · En inversiones: {formatGs(enInversiones)}
        </div>
        <div className="mt">
          <Progress fraccion={fraccionMeta} />
        </div>
        <div className="row-between mt">
          <span className="pill">
            {idxFase >= 0 ? `Fase ${idxFase + 1}/${fases.length}` : 'Pre-fase 1'} · {formatPct(fraccionMeta)} de 1M
          </span>
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            Próxima: {formatGs(proximaFase)}
          </span>
        </div>
      </Card>

      <div className="grid3 mb">
        <Stat label="Ingresos del mes" valueGs={tot.ingresos} small />
        <Stat label="Gastos del mes" valueGs={tot.gastos} small />
        <Stat label="Ahorro neto" valueGs={tot.neto} small />
      </div>

      <div className="grid2">
        <Card title="Inversiones">
          <div className="stat" style={{ background: 'transparent', padding: 0 }}>
            <div className="value small">{formatGs(enInversiones)}</div>
            <div className="usd">≈ {formatUsd(gsToUsd(enInversiones, tc))}</div>
          </div>
          <div className="hint mt">Interés anual estimado: {formatGs(interesAnual)}</div>
          <Link className="btn secundario mt" to="/inversiones">Ver inversiones</Link>
        </Card>

        <Card title="Fondo de emergencia">
          <div className="stat" style={{ background: 'transparent', padding: 0 }}>
            <div className="value small">{formatPct(fracEmergencia, 0)}</div>
            <div className="usd">{formatGs(saldoAhorro)} / {formatGs(objEmergencia)}</div>
          </div>
          <div className="mt">
            <Progress fraccion={fracEmergencia} />
          </div>
          <div className="hint">Objetivo: {config.objetivo_emergencia_meses} meses de gastos</div>
          <div className="hint">Apartado este mes: {formatGs(apartadoMes)}</div>
        </Card>
      </div>

      <Card title="Saldos por cuenta">
        <table className="tabla">
          <tbody>
            {config.cuentas.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.banco} <span className="muted" style={{ fontSize: '0.72rem' }}>· {c.rol}</span>
                </td>
                <td>{formatGs(saldosCuentas[c.id] || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {gastosCat.length > 0 && (
        <Card title={`Gastos del mes por categoría`}>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={gastosCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                  label={(e) => formatPct(e.percent, 0)}>
                  {gastosCat.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatGs(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Link className="btn secundario" to="/reportes">Ver todos los reportes</Link>
        </Card>
      )}
    </>
  )
}
