import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, MoneyField, TextField, SelectField, DateField, Stat } from '../components/UI'
import { hoyISO, periodoActual } from '../lib/defaults'
import { totalesPeriodo, periodoDe } from '../lib/movimientos'
import { formatGs } from '../lib/format'

const VACIO = (cuentaId) => ({
  fecha: hoyISO(),
  tipo: 'gasto',
  monto: 0,
  categoria: '',
  cuenta_id: cuentaId || '',
  descripcion: '',
})

export default function Movimientos() {
  const {
    config,
    movimientos,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    cargando,
  } = useData()

  const cuentas = config?.cuentas || []
  const [form, setForm] = useState(() => VACIO(cuentas[0]?.id))
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [filtroMes, setFiltroMes] = useState(periodoActual())
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const categorias = useMemo(() => {
    if (!config) return []
    return form.tipo === 'ingreso' ? config.categorias_ingreso : config.categorias_gasto
  }, [config, form.tipo])

  if (cargando || !config) return <div className="loader">Cargando…</div>

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const cuentaNombre = (id) => cuentas.find((c) => c.id === id)?.banco || '—'

  const editar = (m) => {
    setEditId(m.id)
    setForm({
      fecha: m.fecha,
      tipo: m.tipo,
      monto: Number(m.monto || 0),
      categoria: m.categoria || '',
      cuenta_id: m.cuenta_id || cuentas[0]?.id,
      descripcion: m.descripcion || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditId(null)
    setForm(VACIO(cuentas[0]?.id))
  }

  const onGuardar = async () => {
    if (!form.monto || Number(form.monto) <= 0) return
    setGuardando(true)
    setOk(false)
    try {
      const payload = {
        fecha: form.fecha,
        tipo: form.tipo,
        monto: Number(form.monto),
        categoria: form.categoria || categorias[0] || null,
        cuenta_id: form.cuenta_id,
        descripcion: form.descripcion || null,
      }
      if (editId) await actualizarMovimiento(editId, payload)
      else await agregarMovimiento(payload)
      setOk(true)
      setEditId(null)
      setForm(VACIO(form.cuenta_id))
      setTimeout(() => setOk(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  const lista = movimientos.filter((m) => {
    if (filtroMes && periodoDe(m.fecha) !== filtroMes) return false
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
    return true
  })

  const tot = totalesPeriodo(movimientos, filtroMes)

  return (
    <>
      <Card title={editId ? 'Editar movimiento' : 'Nuevo movimiento'}>
        <div className="btn-row mb">
          <button
            className={'btn ' + (form.tipo === 'gasto' ? 'peligro' : 'secundario')}
            onClick={() => set('tipo', 'gasto')}
            style={form.tipo === 'gasto' ? { background: 'rgba(255,92,122,0.15)' } : {}}
          >
            ➖ Gasto
          </button>
          <button
            className={'btn ' + (form.tipo === 'ingreso' ? '' : 'secundario')}
            onClick={() => set('tipo', 'ingreso')}
            style={form.tipo === 'ingreso' ? { background: 'var(--green)' } : {}}
          >
            ➕ Ingreso
          </button>
        </div>

        <DateField label="Fecha" value={form.fecha} onChange={(v) => set('fecha', v)} />
        <MoneyField label="Monto (Gs)" value={form.monto} onChange={(v) => set('monto', v)} />
        <SelectField
          label="Categoría"
          value={form.categoria || categorias[0]}
          onChange={(v) => set('categoria', v)}
          options={categorias}
        />
        <SelectField
          label="Cuenta"
          value={form.cuenta_id}
          onChange={(v) => set('cuenta_id', v)}
          options={cuentas.map((c) => ({ value: c.id, label: `${c.banco} (${c.rol})` }))}
        />
        <TextField
          label="Descripción (opcional)"
          value={form.descripcion}
          onChange={(v) => set('descripcion', v)}
          placeholder="Ej: compra del súper"
        />

        {ok && <div className="ok-box mb">Movimiento guardado ✓</div>}
        <div className="btn-row">
          <button className="btn" onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar movimiento'}
          </button>
          {editId && (
            <button className="btn secundario" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      <div className="grid3 mb">
        <Stat label="Ingresos del mes" valueGs={tot.ingresos} />
        <Stat label="Gastos del mes" valueGs={tot.gastos} />
        <Stat label="Ahorro neto" valueGs={tot.neto} />
      </div>

      <Card title="Movimientos">
        <div className="grid2 mb">
          <div className="field" style={{ margin: 0 }}>
            <label>Mes</label>
            <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="muted center">No hay movimientos en este filtro.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Detalle</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{m.fecha?.slice(5)}</td>
                  <td>
                    <div>{m.categoria}</div>
                    <div className="muted" style={{ fontSize: '0.72rem' }}>
                      {cuentaNombre(m.cuenta_id)}
                      {m.descripcion ? ` · ${m.descripcion}` : ''}
                    </div>
                  </td>
                  <td style={{ color: m.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                    {m.tipo === 'ingreso' ? '+' : '−'}
                    {formatGs(m.monto)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn secundario"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                      onClick={() => editar(m)}
                    >
                      ✏️
                    </button>{' '}
                    <button
                      className="btn peligro"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.72rem' }}
                      onClick={() => {
                        if (window.confirm('¿Borrar este movimiento?')) eliminarMovimiento(m.id)
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
    </>
  )
}
