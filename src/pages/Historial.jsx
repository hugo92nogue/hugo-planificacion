import { useRef, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useData } from '../context/DataContext'
import { Card } from '../components/UI'
import { saldoTotal, tasaAhorro } from '../lib/finance'
import { formatGs, formatPct } from '../lib/format'

export default function Historial() {
  const { config, meses, exportarJSON, importarJSON, eliminarMes, cargando } = useData()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [importando, setImportando] = useState(false)

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const serie = meses.map((m) => ({
    periodo: m.periodo,
    saldo: Math.round(saldoTotal(m.saldos_fin_mes || {})),
    tasa: Math.round(tasaAhorro(m, config) * 1000) / 10, // %
  }))

  const descargar = () => {
    const blob = new Blob([exportarJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respaldo-presupuesto-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onArchivo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    setMsg(null)
    try {
      const texto = await file.text()
      await importarJSON(texto)
      setMsg({ tipo: 'ok', texto: 'Datos importados correctamente ✓' })
    } catch (err) {
      setMsg({ tipo: 'err', texto: 'No se pudo importar: ' + err.message })
    } finally {
      setImportando(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const borrar = async (periodo) => {
    if (!window.confirm(`¿Eliminar el mes ${periodo}? No se puede deshacer.`)) return
    await eliminarMes(periodo)
  }

  return (
    <>
      {serie.length > 0 ? (
        <>
          <Card title="Evolución del patrimonio">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={serie} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
                  <XAxis dataKey="periodo" tick={{ fill: '#9fb0d0', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#9fb0d0', fontSize: 11 }}
                    tickFormatter={(v) => (v / 1_000_000).toFixed(0) + 'M'}
                  />
                  <Tooltip formatter={(v) => formatGs(v)} />
                  <Line type="monotone" dataKey="saldo" stroke="#4f8cff" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Tasa de ahorro mensual (%)">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={serie} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
                  <XAxis dataKey="periodo" tick={{ fill: '#9fb0d0', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9fb0d0', fontSize: 11 }} tickFormatter={(v) => v + '%'} />
                  <Tooltip formatter={(v) => v + '%'} />
                  <Line type="monotone" dataKey="tasa" stroke="#2ecc8f" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Meses registrados">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Patrimonio</th>
                  <th>T. ahorro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {serie.map((s) => (
                  <tr key={s.periodo}>
                    <td>{s.periodo}</td>
                    <td>{formatGs(s.saldo)}</td>
                    <td>{formatPct(s.tasa / 100)}</td>
                    <td>
                      <button
                        className="btn peligro"
                        style={{ width: 'auto', padding: '4px 10px' }}
                        onClick={() => borrar(s.periodo)}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card title="Historial">
          <p className="muted">Todavía no hay meses para graficar.</p>
        </Card>
      )}

      <Card title="Respaldo (export / import JSON)">
        {msg && (
          <div className={msg.tipo === 'ok' ? 'ok-box mb' : 'alerta'}>{msg.texto}</div>
        )}
        <div className="btn-row">
          <button className="btn secundario" onClick={descargar}>
            ⬇️ Exportar datos
          </button>
          <button
            className="btn secundario"
            onClick={() => fileRef.current?.click()}
            disabled={importando}
          >
            {importando ? 'Importando…' : '⬆️ Importar datos'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={onArchivo}
          style={{ display: 'none' }}
        />
        <div className="hint mt">
          Exporta toda tu configuración y meses como archivo JSON. Importar fusiona/actualiza por período.
        </div>
      </Card>
    </>
  )
}
