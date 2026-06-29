import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useData } from '../context/DataContext'
import { Card, MoneyField, TextField, SelectField, DateField, PercentField, Stat } from '../components/UI'
import { hoyISO, TIPOS_INSTRUMENTO } from '../lib/defaults'
import {
  instrumentoValorGs,
  totalInvertidoGs,
  interesAnualGs,
  tasaPromedioPonderada,
  valorFuturoInstrumentoGs,
  instrumentosActivos,
} from '../lib/movimientos'
import { formatGs, formatUsd, gsToUsd, formatPct } from '../lib/format'

const COLORES = ['#4f8cff', '#2ecc8f', '#ffc24b', '#ff5c7a', '#a78bfa', '#22d3ee', '#f97316']

const VACIO = {
  nombre: '',
  tipo: 'Plazo fijo',
  moneda: 'GS',
  monto: 0,
  tasa_anual: 0.055,
  fecha_inicio: hoyISO(),
  fecha_venc: '',
  notas: '',
  activo: true,
}

export default function Inversiones() {
  const {
    config,
    instrumentos,
    agregarInstrumento,
    actualizarInstrumento,
    eliminarInstrumento,
    cargando,
  } = useData()
  const [form, setForm] = useState(VACIO)
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const tc = config.tipo_cambio_usd
  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const total = totalInvertidoGs(instrumentos, tc)
  const interes = interesAnualGs(instrumentos, tc)
  const tasaProm = tasaPromedioPonderada(instrumentos, tc)
  const activos = instrumentosActivos(instrumentos)

  const datosTorta = activos
    .map((i) => ({ name: i.nombre, value: Math.round(instrumentoValorGs(i, tc)) }))
    .filter((d) => d.value > 0)

  // Proyección agregada de la cartera a 10 años.
  const serie = []
  for (let a = 0; a <= 10; a++) {
    const valor = activos.reduce((acc, i) => acc + valorFuturoInstrumentoGs(i, tc, a), 0)
    serie.push({ anio: a, valor: Math.round(valor) })
  }

  const editar = (i) => {
    setEditId(i.id)
    setForm({
      nombre: i.nombre || '',
      tipo: i.tipo || 'Plazo fijo',
      moneda: i.moneda || 'GS',
      monto: Number(i.monto || 0),
      tasa_anual: Number(i.tasa_anual || 0),
      fecha_inicio: i.fecha_inicio || hoyISO(),
      fecha_venc: i.fecha_venc || '',
      notas: i.notas || '',
      activo: i.activo !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditId(null)
    setForm(VACIO)
  }

  const onGuardar = async () => {
    if (!form.nombre.trim() || !form.monto) return
    setGuardando(true)
    setOk(false)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        moneda: form.moneda,
        monto: Number(form.monto),
        tasa_anual: Number(form.tasa_anual),
        fecha_inicio: form.fecha_inicio || null,
        fecha_venc: form.fecha_venc || null,
        notas: form.notas || null,
        activo: form.activo,
      }
      if (editId) await actualizarInstrumento(editId, payload)
      else await agregarInstrumento(payload)
      setOk(true)
      setEditId(null)
      setForm(VACIO)
      setTimeout(() => setOk(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="grid3 mb">
        <Stat label="Total invertido" valueGs={total} tipoCambio={tc} />
        <Stat label="Interés anual estimado" valueGs={interes} tipoCambio={tc} small />
        <Stat label="Tasa promedio" value={formatPct(tasaProm)} />
      </div>

      <Card title={editId ? 'Editar instrumento' : 'Nuevo instrumento financiero'}>
        <TextField
          label="Nombre"
          value={form.nombre}
          onChange={(v) => set('nombre', v)}
          placeholder="Ej: Plazo fijo Continental"
        />
        <div className="grid2">
          <SelectField
            label="Tipo"
            value={form.tipo}
            onChange={(v) => set('tipo', v)}
            options={TIPOS_INSTRUMENTO}
          />
          <SelectField
            label="Moneda"
            value={form.moneda}
            onChange={(v) => set('moneda', v)}
            options={[
              { value: 'GS', label: 'Guaraníes (Gs)' },
              { value: 'USD', label: 'Dólares (USD)' },
            ]}
          />
        </div>
        <MoneyField
          label={`Capital invertido (${form.moneda === 'USD' ? 'USD' : 'Gs'})`}
          value={form.monto}
          onChange={(v) => set('monto', v)}
          hint={
            form.moneda === 'USD'
              ? `≈ ${formatGs(Number(form.monto) * tc)}`
              : `≈ ${formatUsd(gsToUsd(form.monto, tc))}`
          }
        />
        <PercentField
          label="Tasa de interés anual (%)"
          value={form.tasa_anual}
          onChange={(v) => set('tasa_anual', v)}
        />
        <div className="grid2">
          <DateField label="Fecha de inicio" value={form.fecha_inicio} onChange={(v) => set('fecha_inicio', v)} />
          <DateField label="Vencimiento (opcional)" value={form.fecha_venc} onChange={(v) => set('fecha_venc', v)} />
        </div>
        <TextField label="Notas (opcional)" value={form.notas} onChange={(v) => set('notas', v)} />

        {ok && <div className="ok-box mb">Instrumento guardado ✓</div>}
        <div className="btn-row">
          <button className="btn" onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar instrumento'}
          </button>
          {editId && (
            <button className="btn secundario" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      <Card title="Mis instrumentos">
        {activos.length === 0 ? (
          <p className="muted center">Todavía no cargaste ningún instrumento.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Capital</th>
                <th>Tasa</th>
                <th>Interés/año</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activos.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div>{i.nombre}</div>
                    <div className="muted" style={{ fontSize: '0.72rem' }}>
                      {i.tipo} · {i.moneda}
                    </div>
                  </td>
                  <td>{formatGs(instrumentoValorGs(i, tc))}</td>
                  <td>{formatPct(i.tasa_anual)}</td>
                  <td>{formatGs(instrumentoValorGs(i, tc) * Number(i.tasa_anual || 0))}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn secundario"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                      onClick={() => editar(i)}
                    >
                      ✏️
                    </button>{' '}
                    <button
                      className="btn peligro"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                      onClick={() => {
                        if (window.confirm(`¿Borrar "${i.nombre}"?`)) eliminarInstrumento(i.id)
                      }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {datosTorta.length > 0 && (
        <Card title="Composición de la cartera">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={datosTorta} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {datosTorta.map((_, idx) => (
                    <Cell key={idx} fill={COLORES[idx % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatGs(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {total > 0 && (
        <Card title="Proyección de la cartera (10 años)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#28395f" />
                <XAxis dataKey="anio" tick={{ fill: '#9fb0d0', fontSize: 11 }} tickFormatter={(v) => `${v}a`} />
                <YAxis
                  tick={{ fill: '#9fb0d0', fontSize: 11 }}
                  tickFormatter={(v) => (v / 1_000_000).toFixed(0) + 'M'}
                />
                <Tooltip formatter={(v) => formatGs(v)} labelFormatter={(l) => `Año ${l}`} />
                <Line type="monotone" dataKey="valor" stroke="#2ecc8f" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="hint">Asume que cada instrumento mantiene su tasa y se reinvierte el interés.</div>
        </Card>
      )}
    </>
  )
}
