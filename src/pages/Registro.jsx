import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, Stat } from '../components/UI'
import { mesVacio, periodoActual } from '../lib/defaults'
import { calcDistribucion, calcSaldosSugeridos } from '../lib/finance'
import { formatGs, formatUsd, gsToUsd } from '../lib/format'

export default function Registro() {
  const { config, meses, mesPorPeriodo, mesAnteriorA, guardarMes, cargando } = useData()
  const [periodo, setPeriodo] = useState(periodoActual())
  const [mes, setMes] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)

  // Carga el mes (existente o vacío) cuando cambia el período.
  useEffect(() => {
    if (!config) return
    const existente = mesPorPeriodo(periodo)
    setMes(existente ? JSON.parse(JSON.stringify(existente)) : mesVacio(periodo))
    setOk(false)
  }, [periodo, config, meses]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando || !config || !mes) return <div className="loader">Cargando…</div>

  const set = (campo, valor) => setMes((m) => ({ ...m, [campo]: valor }))
  const setGasto = (id, valor) =>
    setMes((m) => ({ ...m, gasto_real: { ...m.gasto_real, [id]: valor } }))
  const setSaldo = (id, valor) =>
    setMes((m) => ({ ...m, saldos_fin_mes: { ...m.saldos_fin_mes, [id]: valor } }))

  const tc = config.tipo_cambio_usd
  const { distribucion, remanente_negocio, margen_disponible } = calcDistribucion(mes, config)
  const previo = mesAnteriorA(periodo)
  const saldosSugeridos = calcSaldosSugeridos(mes, config, previo?.saldos_fin_mes || {})
  const personales = config.cuentas.filter((c) => c.rol !== 'negocio')

  const aplicarSugeridos = () => set('saldos_fin_mes', saldosSugeridos)

  const onGuardar = async () => {
    setGuardando(true)
    setOk(false)
    try {
      const mesFinal = {
        ...mes,
        margen_disponible,
        distribucion,
        remanente_negocio,
      }
      await guardarMes(mesFinal)
      setMes(mesFinal)
      setOk(true)
      setTimeout(() => setOk(false), 2500)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Card title="Período">
        <div className="field">
          <label>Mes a registrar</label>
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </div>
        <div className="hint">
          {mesPorPeriodo(periodo) ? 'Estás editando un mes ya guardado.' : 'Mes nuevo.'}
        </div>
      </Card>

      <Card title="Ingresos y costos (Gs)">
        <MoneyField
          label="Ingresos de METSIM"
          value={mes.ingresos_metsim}
          onChange={(v) => set('ingresos_metsim', v)}
        />
        <MoneyField
          label="Costos del negocio"
          value={mes.costos_negocio}
          onChange={(v) => set('costos_negocio', v)}
        />
        <MoneyField
          label="Pagos de deuda"
          value={mes.pagos_deuda}
          onChange={(v) => set('pagos_deuda', v)}
        />
        <div className="grid2 mt">
          <Stat label="Margen disponible" valueGs={margen_disponible} tipoCambio={tc} />
          {config.modo_ingreso === 'sueldo' ? (
            <Stat label="Remanente en negocio" valueGs={remanente_negocio} tipoCambio={tc} />
          ) : (
            <Stat label="Modo" value="Margen" />
          )}
        </div>
      </Card>

      <Card title={`Distribución (${config.modo_ingreso})`}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Asignado</th>
              <th>≈ USD</th>
            </tr>
          </thead>
          <tbody>
            {personales.map((c) => (
              <tr key={c.id}>
                <td>{c.banco}</td>
                <td>{formatGs(distribucion[c.id] || 0)}</td>
                <td className="muted">{formatUsd(gsToUsd(distribucion[c.id] || 0, tc))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Gasto real del mes (Gs)">
        <p className="hint" style={{ marginTop: 0 }}>
          Cuánto gastaste de verdad en cada cuenta (para comparar contra lo asignado).
        </p>
        {personales.map((c) => (
          <MoneyField
            key={c.id}
            label={c.banco}
            value={mes.gasto_real?.[c.id] ?? 0}
            onChange={(v) => setGasto(c.id, v)}
          />
        ))}
      </Card>

      <Card
        title="Saldos a fin de mes (Gs)"
        right={
          <button className="btn secundario" style={{ width: 'auto' }} onClick={aplicarSugeridos}>
            Usar sugeridos
          </button>
        }
      >
        <p className="hint" style={{ marginTop: 0 }}>
          Saldo final real de cada cuenta. El botón "Usar sugeridos" calcula:
          saldo anterior + asignado − gasto real.
        </p>
        {config.cuentas.map((c) => (
          <div key={c.id}>
            <MoneyField
              label={`${c.banco} (${c.rol})`}
              value={mes.saldos_fin_mes?.[c.id] ?? 0}
              onChange={(v) => setSaldo(c.id, v)}
              hint={`Sugerido: ${formatGs(saldosSugeridos[c.id] || 0)}`}
            />
          </div>
        ))}
      </Card>

      {ok && <div className="ok-box mb">Mes guardado ✓</div>}
      <button className="btn" onClick={onGuardar} disabled={guardando}>
        {guardando ? 'Guardando…' : `Guardar mes ${periodo}`}
      </button>
    </>
  )
}
